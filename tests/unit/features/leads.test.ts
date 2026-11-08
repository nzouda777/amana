import { describe, expect, it, vi } from 'vitest'

import {
  leadTypeForEvent,
  parseCalcomWebhook,
  verifyCalcomSignature,
} from '@/features/leads/calcom'
import { requestGuideDownload, type GuideDeps } from '@/features/leads/guide-download'
import {
  confirmSubscription,
  type NewsletterDeps,
  requestSubscription,
  type Subscriber,
} from '@/features/leads/newsletter'
import { MemoryRateLimiter } from '@/features/leads/rate-limit'
import { responseDelayDays, teamRecipient } from '@/features/leads/routing'
import {
  contactStepSchema,
  contextSchemas,
  parseQuote,
  toFieldErrors,
} from '@/features/leads/schemas'
import {
  type LeadDeps,
  type LeadRecord,
  quoteDetails,
  submitContact,
  submitQuote,
} from '@/features/leads/service'
import {
  createSignedToken,
  hmacHex,
  safeEqualHex,
  verifySignedToken,
} from '@/features/leads/signed-token'
import { createTurnstileVerifier } from '@/features/leads/turnstile'

const ctx = { locale: 'fr' as const, ip: '203.0.113.7', ipHash: 'hash', userAgent: 'vitest' }

const validQuote = {
  type: 'audit',
  context: {
    organizationKind: 'banque',
    auditScope: 'produit',
    message: 'Nous lançons un produit de mourabaha immobilière et souhaitons une revue.',
  },
  contact: {
    name: 'Awa Mbarga',
    email: 'Awa.Mbarga@Example.cm',
    phone: '+237 6 99 00 00 00',
    organization: 'Banque démo',
    processingConsent: true,
    newsletter: false,
  },
  turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
  sourcePage: '/devis',
}

function fakeDeps(overrides: Partial<LeadDeps> = {}) {
  const leads: Array<LeadRecord & { id: number }> = []
  const consents: unknown[] = []
  const notified: number[] = []
  const deps: LeadDeps = {
    store: {
      createConsent: vi.fn(async (record) => {
        consents.push(record)
        return consents.length
      }),
      createLead: vi.fn(async (record) => {
        const id = leads.length + 100
        leads.push({ ...record, id })
        return id
      }),
    },
    notifier: {
      notify: vi.fn(async (lead) => {
        notified.push(lead.id)
      }),
    },
    rateLimiter: new MemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
    verifyTurnstile: vi.fn(async () => true),
    ...overrides,
  }
  return { deps, leads, consents, notified }
}

describe('schémas des formulaires', () => {
  it('accepte un devis complet et normalise l’e-mail', () => {
    const result = parseQuote(validQuote)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.contact.email).toBe('awa.mbarga@example.cm')
      expect(result.data.contact.newsletter).toBe(false)
    }
  })

  it('exige les champs conditionnels du type (périmètre d’audit, nombre d’apprenants)', () => {
    expect(
      contextSchemas.audit.safeParse({ organizationKind: 'banque', message: 'x'.repeat(30) })
        .success,
    ).toBe(false)
    const training = contextSchemas['formation-entreprise'].safeParse({
      organizationKind: 'entreprise',
      trainingFormat: 'mixte',
      learners: '25',
      message: 'Former nos conseillers clientèle aux contrats de base.',
    })
    expect(training.success).toBe(true)
    if (training.success) expect(training.data.learners).toBe(25)
  })

  it('rend l’organisation obligatoire selon le type', () => {
    const contact = { name: 'Awa', email: 'awa@example.cm', processingConsent: true }
    expect(contactStepSchema('audit').safeParse(contact).success).toBe(false)
    expect(contactStepSchema('takaful').safeParse(contact).success).toBe(true)
  })

  it('renvoie des codes d’erreur par champ, préfixés par étape', () => {
    const result = parseQuote({
      ...validQuote,
      context: { ...validQuote.context, message: 'court' },
      contact: {
        ...validQuote.contact,
        email: 'pas-un-email',
        processingConsent: false,
        phone: 'abc',
      },
    })
    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.fieldErrors).toEqual({
        'context.message': 'tooShort',
        'contact.email': 'email',
        'contact.phone': 'phone',
        'contact.processingConsent': 'consent',
      })
  })

  it('refuse un type inconnu', () => {
    const result = parseQuote({ ...validQuote, type: 'fatwa' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.fieldErrors.type).toBe('choice')
  })

  it('toFieldErrors garde la première erreur de chaque champ', () => {
    const parsed = contactStepSchema('takaful').safeParse({ name: '', email: '' })
    expect(parsed.success).toBe(false)
    if (!parsed.success) expect(toFieldErrors(parsed.error).name).toBe('tooShort')
  })
})

describe('submitQuote', () => {
  it('enregistre consentement puis demande, et notifie', async () => {
    const { deps, leads, consents, notified } = fakeDeps()
    const result = await submitQuote(validQuote, ctx, deps)
    expect(result).toEqual({ ok: true, leadId: 100 })
    expect(consents).toHaveLength(1)
    expect(leads[0]).toMatchObject({
      type: 'audit',
      source: 'form',
      email: 'awa.mbarga@example.cm',
      consent: 1,
      details: { organizationKind: 'banque', auditScope: 'produit' },
    })
    expect(notified).toEqual([100])
  })

  it('ne touche à rien si Turnstile échoue', async () => {
    const { deps, leads } = fakeDeps({ verifyTurnstile: vi.fn(async () => false) })
    expect(await submitQuote(validQuote, ctx, deps)).toEqual({ ok: false, error: 'captcha' })
    expect(leads).toHaveLength(0)
  })

  it('limite le débit par adresse IP', async () => {
    const { deps } = fakeDeps({
      rateLimiter: new MemoryRateLimiter({ limit: 1, windowMs: 60_000 }),
    })
    expect((await submitQuote(validQuote, ctx, deps)).ok).toBe(true)
    const second = await submitQuote(validQuote, ctx, deps)
    expect(second).toMatchObject({ ok: false, error: 'rate-limited' })
  })

  it('reste un succès si l’e-mail échoue après l’enregistrement', async () => {
    const reportError = vi.fn()
    const { deps, leads } = fakeDeps({
      notifier: { notify: vi.fn(async () => Promise.reject(new Error('smtp'))) },
      reportError,
    })
    expect((await submitQuote(validQuote, ctx, deps)).ok).toBe(true)
    expect(leads).toHaveLength(1)
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), 'lead:notify')
  })

  it('inscrit à la newsletter seulement si la case est cochée', async () => {
    const subscribeNewsletter = vi.fn(async () => undefined)
    const { deps } = fakeDeps({ subscribeNewsletter })
    await submitQuote(validQuote, ctx, deps)
    expect(subscribeNewsletter).not.toHaveBeenCalled()
    await submitQuote(
      { ...validQuote, contact: { ...validQuote.contact, newsletter: true } },
      ctx,
      deps,
    )
    expect(subscribeNewsletter).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'awa.mbarga@example.cm', interests: ['audit'] }),
    )
  })

  it('quoteDetails retire le message et les champs vides', () => {
    const parsed = parseQuote(validQuote)
    if (!parsed.ok) throw new Error('devis invalide')
    expect(quoteDetails(parsed.data)).toEqual({ organizationKind: 'banque', auditScope: 'produit' })
  })
})

describe('submitContact', () => {
  it('valide et enregistre une question générale', async () => {
    const { deps, leads } = fakeDeps()
    const result = await submitContact(
      {
        subject: 'contact',
        name: 'Paul Essomba',
        email: 'paul@example.cm',
        message: 'Proposez-vous des formations à Yaoundé ?',
        processingConsent: true,
        turnstileToken: 'token',
      },
      ctx,
      deps,
    )
    expect(result.ok).toBe(true)
    expect(leads[0]).toMatchObject({ type: 'contact', name: 'Paul Essomba' })
  })

  it('exige le consentement au traitement', async () => {
    const { deps } = fakeDeps()
    const result = await submitContact(
      {
        subject: 'contact',
        name: 'Paul',
        email: 'paul@example.cm',
        message: 'Bonjour à vous',
        turnstileToken: 't',
      },
      ctx,
      deps,
    )
    expect(result).toMatchObject({
      ok: false,
      error: 'invalid',
      fieldErrors: { processingConsent: 'consent' },
    })
  })
})

describe('MemoryRateLimiter', () => {
  it('fenêtre glissante avec délai avant nouvel essai', async () => {
    let now = 0
    const limiter = new MemoryRateLimiter({ limit: 2, windowMs: 10_000, now: () => now })
    expect(await limiter.consume('a')).toEqual({ allowed: true })
    expect(await limiter.consume('a')).toEqual({ allowed: true })
    expect(await limiter.consume('a')).toEqual({ allowed: false, retryAfterSeconds: 10 })
    expect(await limiter.consume('b')).toEqual({ allowed: true })
    now = 10_001
    expect(await limiter.consume('a')).toEqual({ allowed: true })
  })

  it('borne le nombre de clés suivies', async () => {
    const limiter = new MemoryRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2 })
    await limiter.consume('a')
    await limiter.consume('b')
    await limiter.consume('c')
    // `a` a été évincée : elle peut de nouveau envoyer.
    expect(await limiter.consume('a')).toEqual({ allowed: true })
  })
})

describe('Turnstile', () => {
  it('envoie secret, jeton et IP, et lit `success`', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) }))
    const verify = createTurnstileVerifier('secret', fetchImpl)
    expect(await verify('jeton', '203.0.113.7')).toBe(true)
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, { body: URLSearchParams }]
    expect(init.body.get('secret')).toBe('secret')
    expect(init.body.get('response')).toBe('jeton')
    expect(init.body.get('remoteip')).toBe('203.0.113.7')
  })

  it('refuse sans jeton, sur échec ou erreur réseau (fail closed)', async () => {
    const failing = createTurnstileVerifier('s', async () => ({
      ok: true,
      json: async () => ({ success: false }),
    }))
    const broken = createTurnstileVerifier('s', async () => Promise.reject(new Error('offline')))
    expect(await failing('jeton')).toBe(false)
    expect(await broken('jeton')).toBe(false)
    expect(await failing('')).toBe(false)
  })
})

describe('jetons signés', () => {
  it('vérifie sujet et expiration', () => {
    const token = createSignedToken('guide:4', 60, 'secret', 1_000_000)
    expect(verifySignedToken(token, 'secret', 1_000_000)).toBe('guide:4')
    expect(verifySignedToken(token, 'secret', 1_000_000 + 61_000)).toBeNull()
    expect(verifySignedToken(token, 'autre-secret', 1_000_000)).toBeNull()
  })

  it('rejette un jeton altéré', () => {
    const token = createSignedToken('guide:4', 60, 'secret')
    const [data, signature] = token.split('.')
    const forged = `${Buffer.from(JSON.stringify({ sub: 'guide:9', exp: 9e9 })).toString('base64url')}.${signature}`
    expect(verifySignedToken(forged, 'secret')).toBeNull()
    expect(verifySignedToken(`${data}.`, 'secret')).toBeNull()
    expect(verifySignedToken('n-importe-quoi', 'secret')).toBeNull()
  })

  it('compare des signatures hexadécimales en temps constant', () => {
    expect(safeEqualHex(hmacHex('k', 'body'), hmacHex('k', 'body').toUpperCase())).toBe(true)
    expect(safeEqualHex(hmacHex('k', 'body'), hmacHex('k', 'other'))).toBe(false)
  })
})

describe('webhook Cal.com', () => {
  const body = {
    triggerEvent: 'BOOKING_CREATED',
    createdAt: '2026-11-03T08:00:00.000Z',
    payload: {
      uid: 'bk_123',
      type: 'audit-preparation',
      startTime: '2026-11-10T09:00:00.000Z',
      attendees: [{ name: 'Awa Mbarga', email: 'AWA@example.cm', timeZone: 'Africa/Douala' }],
      responses: { notes: { value: 'Audit de notre fenêtre islamique' } },
    },
  }

  it('vérifie la signature HMAC du corps brut', () => {
    const raw = JSON.stringify(body)
    expect(verifyCalcomSignature(raw, hmacHex('whsec', raw), 'whsec')).toBe(true)
    expect(verifyCalcomSignature(raw, hmacHex('whsec', `${raw} `), 'whsec')).toBe(false)
    expect(verifyCalcomSignature(raw, null, 'whsec')).toBe(false)
    expect(verifyCalcomSignature(raw, hmacHex('', raw), '')).toBe(false)
  })

  it('transforme une réservation en demande', () => {
    expect(parseCalcomWebhook(body)).toEqual({
      kind: 'created',
      bookingId: 'bk_123',
      eventType: 'audit-preparation',
      leadType: 'audit',
      name: 'Awa Mbarga',
      email: 'awa@example.cm',
      phone: undefined,
      startsAt: '2026-11-10T09:00:00.000Z',
      notes: 'Audit de notre fenêtre islamique',
    })
  })

  it('ignore les autres déclencheurs et les réservations sans contact', () => {
    expect(parseCalcomWebhook({ ...body, triggerEvent: 'MEETING_ENDED' })).toBeNull()
    expect(parseCalcomWebhook({ ...body, payload: { uid: 'x', attendees: [] } })).toBeNull()
    expect(parseCalcomWebhook('pas un objet')).toBeNull()
  })

  it('déduit le type de demande du type d’événement', () => {
    expect(leadTypeForEvent('decouverte')).toBe('contact')
    expect(leadTypeForEvent('conseil-30')).toBe('conseil')
    expect(leadTypeForEvent('takaful')).toBe('takaful')
  })
})

describe('routage des demandes', () => {
  const routing = [
    { leadType: 'audit', email: 'audit@example.cm' },
    { leadType: 'contact', email: 'contact@example.cm' },
  ]

  it('choisit l’adresse du type, puis celle du contact, puis le repli', () => {
    expect(teamRecipient('audit', routing, null)).toBe('audit@example.cm')
    expect(teamRecipient('takaful', routing, null)).toBe('contact@example.cm')
    expect(teamRecipient('takaful', [], 'repli@example.cm')).toBe('repli@example.cm')
    expect(teamRecipient('takaful', [], null)).toBeNull()
  })

  it('annonce un délai pour chaque type', () => {
    expect(Object.values(responseDelayDays).every((days) => days >= 1)).toBe(true)
  })
})

describe('newsletter (double opt-in)', () => {
  function fakeNewsletter(initial: Subscriber[] = []) {
    const subscribers = [...initial]
    const sent: string[] = []
    const upserts: string[] = []
    let now = Date.parse('2026-11-03T08:00:00.000Z')
    const deps: NewsletterDeps = {
      now: () => now,
      sendConfirmation: vi.fn(async (subscriber) => {
        sent.push(subscriber.confirmToken)
      }),
      gateway: {
        upsertContact: vi.fn(async ({ email }) => {
          upserts.push(email)
          return { contactId: 'brevo-1' }
        }),
        unsubscribe: vi.fn(async () => undefined),
      },
      store: {
        findByEmail: async (email) => subscribers.find((s) => s.email === email) ?? null,
        findByToken: async (token) => subscribers.find((s) => s.confirmToken === token) ?? null,
        create: async (input) => {
          const subscriber: Subscriber = {
            id: subscribers.length + 1,
            email: input.email,
            status: 'pending',
            confirmToken: `jeton-${'x'.repeat(20)}-${subscribers.length + 1}`,
            confirmTokenExpiresAt: input.confirmTokenExpiresAt,
            firstName: input.firstName ?? null,
            interests: input.interests,
            locale: input.locale,
          }
          subscribers.push(subscriber)
          return subscriber
        },
        update: async (id, patch) => {
          const index = subscribers.findIndex((s) => s.id === id)
          const updated = { ...subscribers[index], ...patch } as Subscriber
          subscribers[index] = updated
          return updated
        },
        createConsent: async () => 1,
      },
    }
    return { deps, subscribers, sent, upserts, advance: (ms: number) => (now += ms) }
  }

  const request = {
    email: 'lecteur@example.cm',
    interests: ['takaful' as const],
    locale: 'fr' as const,
    source: 'footer',
  }

  it('crée un abonné en attente et envoie le lien, sans synchroniser Brevo', async () => {
    const { deps, subscribers, sent, upserts } = fakeNewsletter()
    await requestSubscription(request, deps)
    expect(subscribers[0]?.status).toBe('pending')
    expect(sent).toHaveLength(1)
    expect(upserts).toHaveLength(0)
  })

  it('confirme avec le jeton puis synchronise', async () => {
    const { deps, subscribers, sent, upserts } = fakeNewsletter()
    await requestSubscription(request, deps)
    expect(await confirmSubscription(sent[0] ?? '', deps)).toBe('confirmed')
    expect(subscribers[0]).toMatchObject({ status: 'confirmed' })
    expect(upserts).toEqual(['lecteur@example.cm'])
    expect(await confirmSubscription(sent[0] ?? '', deps)).toBe('already-confirmed')
  })

  it('refuse un jeton expiré ou inconnu', async () => {
    const { deps, sent, advance } = fakeNewsletter()
    await requestSubscription(request, deps)
    expect(await confirmSubscription('inconnu-mais-assez-long', deps)).toBe('invalid')
    expect(await confirmSubscription('court', deps)).toBe('invalid')
    advance(73 * 60 * 60 * 1000)
    expect(await confirmSubscription(sent[0] ?? '', deps)).toBe('expired')
  })

  it('n’envoie rien de plus à un abonné déjà confirmé (pas d’énumération)', async () => {
    const { deps, sent } = fakeNewsletter([
      {
        id: 1,
        email: 'lecteur@example.cm',
        status: 'confirmed',
        interests: ['audit'],
        locale: 'fr',
      },
    ])
    await requestSubscription(request, deps)
    expect(sent).toHaveLength(0)
  })
})

describe('téléchargement de guide', () => {
  function guideDeps(overrides: Partial<GuideDeps> = {}) {
    const { deps, leads, consents } = fakeDeps()
    const sendLink = vi.fn(async () => undefined)
    const subscribeNewsletter = vi.fn(async () => undefined)
    const guide: GuideDeps = {
      store: deps.store,
      rateLimiter: deps.rateLimiter,
      verifyTurnstile: deps.verifyTurnstile,
      subscribeNewsletter,
      findGuide: async (id) =>
        id === 7 ? { id: 7, slug: 'guide-demo', title: 'Guide démo', interests: ['audit'] } : null,
      createToken: (id) => `jeton-${id}`,
      sendLink,
      ...overrides,
    }
    return { guide, leads, consents, sendLink, subscribeNewsletter }
  }
  const input = { guideId: 7, email: 'lecteur@example.cm', turnstileToken: 't' }

  it('enregistre consentement et demande, renvoie un jeton et envoie le lien', async () => {
    const { guide, leads, consents, sendLink, subscribeNewsletter } = guideDeps()
    const result = await requestGuideDownload(input, ctx, guide)
    expect(result).toEqual({ ok: true, token: 'jeton-7' })
    expect(consents[0]).toMatchObject({ purpose: 'guide-download' })
    expect(leads[0]).toMatchObject({
      source: 'guide',
      details: { guide: 'guide-demo', newsletter: false },
    })
    expect(sendLink).toHaveBeenCalledOnce()
    expect(subscribeNewsletter).not.toHaveBeenCalled()
  })

  it('n’inscrit à la newsletter que sur consentement explicite', async () => {
    const { guide, subscribeNewsletter } = guideDeps()
    await requestGuideDownload({ ...input, newsletter: true }, ctx, guide)
    expect(subscribeNewsletter).toHaveBeenCalledWith(
      expect.objectContaining({ interests: ['audit'], source: 'guide:guide-demo' }),
    )
  })

  it('guide inconnu : rien n’est enregistré', async () => {
    const { guide, leads } = guideDeps()
    expect(await requestGuideDownload({ ...input, guideId: 99 }, ctx, guide)).toEqual({
      ok: false,
      error: 'not-found',
    })
    expect(leads).toHaveLength(0)
  })
})
