import { describe, expect, it, vi } from 'vitest'

import { verifyCalcomSignature } from '@/features/leads/calcom'
import {
  confirmSubscription,
  type NewsletterDeps,
  submitNewsletterForm,
} from '@/features/leads/newsletter'
import { MemoryRateLimiter } from '@/features/leads/rate-limit'
import { contactFormSchema, parseQuote } from '@/features/leads/schemas'
import { type LeadDeps, type LeadRecord, submitQuote } from '@/features/leads/service'
import { createSignedToken, hmacHex, verifySignedToken } from '@/features/leads/signed-token'

/**
 * Revue qa M2 : cas d'attaque sur les chemins publics (affectation de masse, jetons,
 * ordre des gardes). Complète `leads.test.ts`.
 */

const ctx = { locale: 'fr' as const, ip: '203.0.113.9', ipHash: 'hash', userAgent: 'vitest' }

const quote = {
  type: 'audit',
  context: {
    organizationKind: 'banque',
    auditScope: 'produit',
    message: 'Nous lançons un produit de mourabaha immobilière et souhaitons une revue.',
  },
  contact: {
    name: 'Awa Mbarga',
    email: 'awa@example.cm',
    organization: 'Banque démo',
    processingConsent: true,
  },
  turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
}

function deps(overrides: Partial<LeadDeps> = {}) {
  const leads: LeadRecord[] = []
  const value: LeadDeps = {
    store: {
      createConsent: vi.fn(async () => 1),
      createLead: vi.fn(async (record) => {
        leads.push(record)
        return 1
      }),
    },
    notifier: { notify: vi.fn(async () => undefined) },
    rateLimiter: new MemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
    verifyTurnstile: vi.fn(async () => true),
    ...overrides,
  }
  return { deps: value, leads }
}

describe('affectation de masse', () => {
  it('le devis ignore les champs internes injectés (statut, responsable, notes, source)', async () => {
    const { deps: d, leads } = deps()
    const result = await submitQuote(
      {
        ...quote,
        status: 'won',
        assignee: 1,
        context: { ...quote.context, status: 'won', notes: [{ text: 'x' }] },
        contact: { ...quote.contact, source: 'calcom', status: 'won', roles: ['super-admin'] },
      },
      ctx,
      d,
    )
    expect(result.ok).toBe(true)
    const [lead] = leads
    expect(lead).toBeDefined()
    expect(lead?.source).toBe('form')
    expect(Object.keys(lead?.details ?? {})).toEqual(['organizationKind', 'auditScope'])
    expect(lead).not.toHaveProperty('status')
    expect(lead).not.toHaveProperty('assignee')
    expect(lead).not.toHaveProperty('notes')
  })

  it('le formulaire court retire les clés inconnues', () => {
    const parsed = contactFormSchema.safeParse({
      subject: 'contact',
      name: 'Awa Mbarga',
      email: 'awa@example.cm',
      message: 'Une question sur vos formations.',
      processingConsent: true,
      turnstileToken: 't',
      status: 'won',
    })
    expect(parsed.success).toBe(true)
    expect(parsed.success && 'status' in parsed.data).toBe(false)
  })

  it('le consentement au traitement doit valoir exactement `true`', () => {
    for (const processingConsent of ['true', 'on', 1, false]) {
      const result = parseQuote({ ...quote, contact: { ...quote.contact, processingConsent } })
      expect(result.ok).toBe(false)
    }
  })
})

describe('ordre des gardes', () => {
  it('une saisie invalide ne consomme ni la limite de débit ni Turnstile', async () => {
    const consume = vi.fn(async () => ({ allowed: true as const }))
    const { deps: d } = deps({ rateLimiter: { consume } })
    await submitQuote({ ...quote, contact: { ...quote.contact, email: 'pas-un-email' } }, ctx, d)
    expect(consume).not.toHaveBeenCalled()
    expect(d.verifyTurnstile).not.toHaveBeenCalled()
  })

  it('au-delà de la limite, Turnstile n’est pas appelé et rien n’est enregistré', async () => {
    const { deps: d, leads } = deps({
      rateLimiter: new MemoryRateLimiter({ limit: 1, windowMs: 60_000 }),
    })
    await submitQuote(quote, ctx, d)
    const second = await submitQuote(quote, ctx, d)
    expect(second).toMatchObject({ ok: false, error: 'rate-limited' })
    expect(d.verifyTurnstile).toHaveBeenCalledTimes(1)
    expect(leads).toHaveLength(1)
  })

  it('newsletter : jeton Turnstile refusé, aucune écriture ni e-mail', async () => {
    const store = {
      findByEmail: vi.fn(async () => null),
      findByToken: vi.fn(async () => null),
      create: vi.fn(),
      update: vi.fn(),
      createConsent: vi.fn(),
    }
    const sendConfirmation = vi.fn()
    const result = await submitNewsletterForm(
      { email: 'lecteur@example.cm', turnstileToken: 'mauvais' },
      ctx,
      {
        store: store as unknown as NewsletterDeps['store'],
        sendConfirmation,
        gateway: { upsertContact: vi.fn(), unsubscribe: vi.fn() },
        rateLimiter: new MemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
        verifyTurnstile: async () => false,
      },
      'footer',
    )
    expect(result).toMatchObject({ ok: false, error: 'captcha' })
    expect(store.createConsent).not.toHaveBeenCalled()
    expect(store.create).not.toHaveBeenCalled()
    expect(sendConfirmation).not.toHaveBeenCalled()
  })

  it('confirmation : un jeton de longueur anormale n’interroge pas la base', async () => {
    const findByToken = vi.fn(async () => null)
    const d = {
      store: { findByToken },
      gateway: {},
      sendConfirmation: vi.fn(),
    } as unknown as NewsletterDeps
    expect(await confirmSubscription('', d)).toBe('invalid')
    expect(await confirmSubscription('court', d)).toBe('invalid')
    expect(await confirmSubscription('x'.repeat(500), d)).toBe('invalid')
    expect(findByToken).not.toHaveBeenCalled()
  })
})

describe('jetons de téléchargement', () => {
  const secret = 's'.repeat(40)
  const now = Date.parse('2026-11-03T08:00:00.000Z')

  it('expire à l’échéance exacte', () => {
    const token = createSignedToken('guide:2', 60, secret, now)
    expect(verifySignedToken(token, secret, now + 59_000)).toBe('guide:2')
    expect(verifySignedToken(token, secret, now + 60_000)).toBeNull()
  })

  it('refuse un jeton signé avec un autre secret', () => {
    const token = createSignedToken('guide:2', 60, 'autre-secret-'.repeat(4), now)
    expect(verifySignedToken(token, secret, now)).toBeNull()
  })

  it('refuse un sujet modifié même avec une signature d’origine (pas de changement de guide)', () => {
    const token = createSignedToken('guide:2', 60, secret, now)
    const [, signature] = token.split('.')
    const forged = Buffer.from(
      JSON.stringify({ sub: 'guide:3', exp: Math.floor(now / 1000) + 60 }),
    ).toString('base64url')
    expect(verifySignedToken(`${forged}.${signature}`, secret, now)).toBeNull()
  })

  it('refuse les formes inattendues (vide, trois segments, JSON sans `exp`)', () => {
    expect(verifySignedToken('', secret, now)).toBeNull()
    expect(verifySignedToken('a.b.c', secret, now)).toBeNull()
    const data = Buffer.from(JSON.stringify({ sub: 'guide:2' })).toString('base64url')
    const signature = createSignedToken('x', 1, secret).split('.')[1]
    expect(verifySignedToken(`${data}.${signature}`, secret, now)).toBeNull()
  })
})

describe('signature Cal.com', () => {
  it('refuse une signature valide pour un autre corps, accepte la casse hexadécimale', () => {
    const secret = 'secret-webhook'
    const body = '{"triggerEvent":"BOOKING_CREATED"}'
    const signature = hmacHex(secret, body)
    expect(verifyCalcomSignature(body, signature.toUpperCase(), secret)).toBe(true)
    expect(verifyCalcomSignature(`${body} `, signature, secret)).toBe(false)
    expect(verifyCalcomSignature(body, '', secret)).toBe(false)
    expect(verifyCalcomSignature(body, signature, '')).toBe(false)
  })
})
