import { describe, expect, it } from 'vitest'

import { EnvValidationError, isEmailConfigured, parseServerEnv } from '@/env'

const valid = {
  DATABASE_URL:
    'postgresql://user:pass@ep-cool-name-pooler.eu-central-1.aws.neon.tech/amana?sslmode=require',
  PAYLOAD_SECRET: 'a'.repeat(64),
}

describe('validation des variables d’environnement', () => {
  it('accepte une configuration minimale et applique les valeurs par défaut', () => {
    const env = parseServerEnv(valid)
    expect(env.DATABASE_POOL_MAX).toBe(10)
    expect(env.PAYMENT_PROVIDERS).toEqual(['manual-transfer'])
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
  })

  it('donne un message clair si DATABASE_URL manque', () => {
    expect(() => parseServerEnv({ PAYLOAD_SECRET: valid.PAYLOAD_SECRET })).toThrow(
      EnvValidationError,
    )
    try {
      parseServerEnv({ PAYLOAD_SECRET: valid.PAYLOAD_SECRET, DATABASE_URL: '' })
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError)
      expect((error as Error).message).toContain('DATABASE_URL')
      expect((error as Error).message).toContain('.env.example')
    }
  })

  it('exige sslmode pour une URL Neon', () => {
    expect(() =>
      parseServerEnv({
        ...valid,
        DATABASE_URL: 'postgresql://u:p@ep-x.eu-central-1.aws.neon.tech/db',
      }),
    ).toThrow(/sslmode/)
  })

  it('refuse un secret Payload trop court', () => {
    expect(() => parseServerEnv({ ...valid, PAYLOAD_SECRET: 'court' })).toThrow(/PAYLOAD_SECRET/)
  })

  it('découpe PAYMENT_PROVIDERS', () => {
    expect(
      parseServerEnv({ ...valid, PAYMENT_PROVIDERS: 'sandbox, manual-transfer' }).PAYMENT_PROVIDERS,
    ).toEqual(['sandbox', 'manual-transfer'])
  })

  it('SKIP_ENV_VALIDATION remplit des valeurs inertes sans jamais réutiliser de secret fixe', () => {
    const a = parseServerEnv({ SKIP_ENV_VALIDATION: '1' })
    const b = parseServerEnv({ SKIP_ENV_VALIDATION: '1' })
    expect(a.DATABASE_URL).toContain('.invalid')
    expect(a.PAYLOAD_SECRET).not.toBe(b.PAYLOAD_SECRET)
  })
})

describe('services des formulaires publics en production', () => {
  const production = { ...valid, NODE_ENV: 'production' }

  const resend = { RESEND_API_KEY: 're_test', EMAIL_FROM: 'Amana Conseil <no-reply@example.cm>' }

  it('démarre en production sans Resend ni Turnstile ; envoi d’e-mails indisponible (ADR 020, 021)', () => {
    const env = parseServerEnv(production)
    expect(env.NEXT_PUBLIC_TURNSTILE_ENABLED).toBe(false)
    expect(env.ALLOW_DEV_SERVICES).toBe(false)
    expect(isEmailConfigured(env)).toBe(false)
  })

  it('une clé Resend impose l’expéditeur et rend l’envoi disponible', () => {
    expect(() => parseServerEnv({ ...production, RESEND_API_KEY: 're_test' })).toThrow(/EMAIL_FROM/)
    expect(isEmailConfigured(parseServerEnv({ ...production, ...resend }))).toBe(true)
  })

  it('envoi disponible hors production et avec ALLOW_DEV_SERVICES=1 (fichiers locaux)', () => {
    expect(isEmailConfigured(parseServerEnv(valid))).toBe(true)
    expect(isEmailConfigured(parseServerEnv({ ...production, ALLOW_DEV_SERVICES: '1' }))).toBe(true)
  })

  it('exige les clés Turnstile en production quand il est réactivé', () => {
    const enabled = { ...production, ...resend, NEXT_PUBLIC_TURNSTILE_ENABLED: '1' }
    expect(() => parseServerEnv(enabled)).toThrow(/TURNSTILE_SECRET_KEY/)
    expect(
      parseServerEnv({
        ...enabled,
        TURNSTILE_SECRET_KEY: 'secret',
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site',
      }).NEXT_PUBLIC_TURNSTILE_ENABLED,
    ).toBe(true)
  })

  it('tolère leur absence pendant `next build` et avec ALLOW_DEV_SERVICES=1', () => {
    expect(() =>
      parseServerEnv({ ...production, NEXT_PHASE: 'phase-production-build' }),
    ).not.toThrow()
    expect(parseServerEnv({ ...production, ALLOW_DEV_SERVICES: '1' }).ALLOW_DEV_SERVICES).toBe(true)
  })

  it('n’exige rien en développement', () => {
    expect(() => parseServerEnv(valid)).not.toThrow()
  })
})
