import { describe, expect, it, vi } from 'vitest'

import { parseCalcomWebhook } from '@/features/leads/calcom'
import {
  type NewsletterDeps,
  requestSubscription,
  type Subscriber,
} from '@/features/leads/newsletter'
import { createCmsPathMatcher, isExternalCmsHref } from '@/features/site/cms-href'
import { searchTerms, toPrefixTsQuery } from '@/features/site/search'
import { pathnames } from '@/lib/i18n/routing'
import { serializeJsonLd } from '@/lib/seo/jsonld'

/**
 * Revue qa M2 (2e passage) : liens saisis dans le CMS (XSS), requête plein texte
 * (injection d'opérateurs), sérialisation JSON-LD, webhook Cal.com, newsletter.
 */

describe('liens du CMS : aucun schéma dangereux', () => {
  const match = createCmsPathMatcher(Object.keys(pathnames))

  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    ' javascript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ])('« %s » n’est ni externe ni interne', (href) => {
    expect(isExternalCmsHref(href)).toBe(false)
    expect(match(href)).toBeNull()
  })

  it.each(['//evil.example', '//evil.example/contact', '/\\evil.example', '/%2F%2Fevil.example'])(
    '« %s » (URL relative au protocole) n’est pas une route interne',
    (href) => {
      expect(match(href)).toBeNull()
    },
  )

  it('un paramètre ne peut pas contenir de barre oblique', () => {
    expect(match('/audit-conformite/a/b')).toBeNull()
  })
})

describe('recherche : aucun opérateur tsquery transmis', () => {
  it.each([
    ["riba' | !xx & (yy) <-> zz:*", 'riba:* & xx:* & yy:* & zz:*'],
    ['audit:* | true', 'audit:* & true:*'],
    ["'); DROP TABLE posts; --", 'drop:* & table:* & posts:*'],
  ])('« %s » → « %s »', (input, expected) => {
    expect(toPrefixTsQuery(input)).toBe(expected)
  })

  it('ne garde que lettres et chiffres (arabe compris)', () => {
    expect(searchTerms('الربا & takaful!')).toEqual(['الربا', 'takaful'])
    expect(toPrefixTsQuery('& | ! ( ) : *')).toBeNull()
  })

  it('chaque terme produit ne contient que des lettres, des chiffres et le suffixe `:*`', () => {
    const query = toPrefixTsQuery('aa&bb|cc!dd(ee)ff<gg>hh:ii*jj\\kk\'ll"mm') ?? ''
    expect(query).not.toBe('')
    for (const term of query.split(' & ')) expect(term).toMatch(/^[\p{L}\p{N}]+:\*$/u)
  })
})

describe('JSON-LD : pas de sortie du bloc <script>', () => {
  it('échappe `<` (fermeture de balise, commentaire HTML)', () => {
    const out = serializeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '</script><script>alert(1)</script><!--',
    })
    expect(out).not.toMatch(/<\/script/i)
    expect(out).not.toContain('<!--')
    expect(JSON.parse(out)).toMatchObject({ headline: '</script><script>alert(1)</script><!--' })
  })
})

describe('webhook Cal.com : interprétation', () => {
  const booking = (payload: Record<string, unknown>, triggerEvent = 'BOOKING_CREATED') => ({
    triggerEvent,
    payload: { uid: 'bk_1', type: 'audit-60', ...payload },
  })

  it('normalise l’e-mail et ignore une réservation sans identifiant', () => {
    const parsed = parseCalcomWebhook(
      booking({ attendees: [{ name: ' Awa ', email: ' Awa@Example.CM ' }] }),
    )
    expect(parsed).toMatchObject({ email: 'awa@example.cm', name: 'Awa', leadType: 'audit' })
    expect(
      parseCalcomWebhook({ triggerEvent: 'BOOKING_CREATED', payload: { attendees: [] } }),
    ).toBeNull()
  })

  it('ignore les déclencheurs non gérés et les corps non conformes', () => {
    expect(parseCalcomWebhook(booking({}, 'MEETING_ENDED'))).toBeNull()
    expect(parseCalcomWebhook(null)).toBeNull()
    expect(parseCalcomWebhook('BOOKING_CREATED')).toBeNull()
    expect(parseCalcomWebhook({ triggerEvent: 1 })).toBeNull()
  })
})

describe('newsletter : relance d’une inscription', () => {
  function store(existing: Subscriber | null) {
    return {
      findByEmail: vi.fn(async () => existing),
      findByToken: vi.fn(async () => null),
      create: vi.fn(),
      update: vi.fn(async (id: number, patch: Partial<Subscriber>) => ({
        ...(existing as Subscriber),
        ...patch,
        id,
      })),
      createConsent: vi.fn(async () => 7),
    }
  }

  const base: Subscriber = {
    id: 3,
    email: 'lecteur@example.cm',
    status: 'unsubscribed',
    confirmToken: 'a'.repeat(32),
    confirmTokenExpiresAt: null,
    firstName: null,
    interests: ['audit'],
    locale: 'fr',
  }

  it('un ancien désinscrit repasse en attente (nouveau consentement, nouvel e-mail), jamais confirmé d’office', async () => {
    const s = store(base)
    const sendConfirmation = vi.fn(async () => undefined)
    await requestSubscription(
      { email: base.email, interests: ['takaful'], locale: 'fr', source: 'footer' },
      {
        store: s as unknown as NewsletterDeps['store'],
        sendConfirmation,
        gateway: { upsertContact: vi.fn(), unsubscribe: vi.fn() },
        now: () => Date.parse('2026-11-06T10:00:00.000Z'),
      },
    )
    expect(s.createConsent).toHaveBeenCalledTimes(1)
    expect(s.update).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ status: 'pending', interests: ['audit', 'takaful'], consent: 7 }),
    )
    expect(sendConfirmation).toHaveBeenCalledTimes(1)
  })

  it('un abonné confirmé ne reçoit rien et aucun consentement n’est journalisé', async () => {
    const s = store({ ...base, status: 'confirmed' })
    const sendConfirmation = vi.fn()
    await requestSubscription(
      { email: base.email, interests: ['audit'], locale: 'fr', source: 'footer' },
      {
        store: s as unknown as NewsletterDeps['store'],
        sendConfirmation,
        gateway: { upsertContact: vi.fn(), unsubscribe: vi.fn() },
      },
    )
    expect(s.createConsent).not.toHaveBeenCalled()
    expect(s.update).not.toHaveBeenCalled()
    expect(sendConfirmation).not.toHaveBeenCalled()
  })
})
