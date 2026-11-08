import { beforeEach, describe, expect, it } from 'vitest'

import { MemoryRateLimiter } from '@/features/leads/rate-limit'
import { safeNextPath, signUpSchema, toAuthFieldErrors } from '@/features/auth/schemas'
import {
  type AccountGateway,
  type AccountSummary,
  type AuthDeps,
  type AuthMailer,
  type LoginOutcome,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signIn,
  signUp,
  verifyEmail,
} from '@/features/auth/service'

const ctx = { locale: 'fr' as const, ip: '203.0.113.7' }
const token = 'XXXX.DUMMY.TOKEN.XXXX'
const goodPassword = 'une phrase de passe longue'

class MemoryAccounts implements AccountGateway {
  accounts: (AccountSummary & { password: string; lastName: string })[] = []
  logins: string[] = []
  outcome: LoginOutcome | null = null
  async findByEmail(email: string) {
    return this.accounts.find((account) => account.email === email) ?? null
  }
  async create(input: { email: string; password: string; firstName: string; lastName: string }) {
    const account = {
      id: this.accounts.length + 1,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      password: input.password,
      verified: false,
      verificationToken: `verif-${input.email}`,
      preferredLocale: null,
    }
    this.accounts.push(account)
    return account
  }
  async login(email: string, password: string): Promise<LoginOutcome> {
    this.logins.push(email)
    if (this.outcome) return this.outcome
    const account = await this.findByEmail(email)
    if (!account || account.password !== password) return 'invalid'
    return account.verified ? 'ok' : 'unverified'
  }
  async verifyEmail(value: string) {
    const account = this.accounts.find((candidate) => candidate.verificationToken === value)
    if (!account) return false
    account.verified = true
    account.verificationToken = null
    return true
  }
  async createResetToken(email: string) {
    const account = await this.findByEmail(email)
    return account ? `reset-${account.id}-0123456789abcdef` : null
  }
  async resetPassword(value: string, password: string) {
    const account = this.accounts.find(
      (candidate) => value === `reset-${candidate.id}-0123456789abcdef`,
    )
    if (!account) return false
    account.password = password
    account.verified = true
    return true
  }
}

class MemoryMailer implements AuthMailer {
  sent: { kind: string; email: string; token?: string }[] = []
  async sendVerification(account: AccountSummary, value: string) {
    this.sent.push({ kind: 'verify', email: account.email, token: value })
  }
  async sendAlreadyRegistered(account: AccountSummary) {
    this.sent.push({ kind: 'exists', email: account.email })
  }
  async sendPasswordReset(account: AccountSummary, value: string) {
    this.sent.push({ kind: 'reset', email: account.email, token: value })
  }
}

let accounts: MemoryAccounts
let mailer: MemoryMailer
let deps: AuthDeps
let errors: string[]

beforeEach(() => {
  accounts = new MemoryAccounts()
  mailer = new MemoryMailer()
  errors = []
  deps = {
    accounts,
    mailer,
    rateLimiter: new MemoryRateLimiter({ limit: 10, windowMs: 60_000 }),
    emailRateLimiter: new MemoryRateLimiter({ limit: 5, windowMs: 60_000 }),
    verifyTurnstile: async (value) => value === token,
    canSendEmail: true,
    reportError: (_error, context) => errors.push(context),
  }
})

const signUpInput = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'Awa',
  lastName: 'Mbarga',
  email: 'Awa@Example.cm',
  password: goodPassword,
  terms: true,
  turnstileToken: token,
  ...overrides,
})

describe('auth : inscription', () => {
  it('crée un apprenant non confirmé et envoie le lien de confirmation', async () => {
    expect(await signUp(signUpInput(), ctx, deps)).toEqual({ ok: true })
    expect(accounts.accounts[0]).toMatchObject({ email: 'awa@example.cm', verified: false })
    expect(mailer.sent).toEqual([
      { kind: 'verify', email: 'awa@example.cm', token: 'verif-awa@example.cm' },
    ])
  })

  it('même réponse pour une adresse déjà inscrite (aucune énumération)', async () => {
    await signUp(signUpInput(), ctx, deps)
    accounts.accounts[0]!.verified = true
    const again = await signUp(signUpInput({ password: 'autre phrase de passe' }), ctx, deps)
    expect(again).toEqual({ ok: true })
    expect(accounts.accounts).toHaveLength(1)
    expect(mailer.sent.at(-1)).toEqual({ kind: 'exists', email: 'awa@example.cm' })
  })

  it('compte non confirmé : renvoie le lien de confirmation au lieu d’en créer un', async () => {
    await signUp(signUpInput(), ctx, deps)
    await signUp(signUpInput(), ctx, deps)
    expect(mailer.sent.map((mail) => mail.kind)).toEqual(['verify', 'verify'])
  })

  it('valide les champs : mot de passe, conditions, e-mail', async () => {
    const result = await signUp(
      signUpInput({ password: 'court', terms: false, email: 'pas-un-email' }),
      ctx,
      deps,
    )
    expect(result).toMatchObject({
      ok: false,
      error: 'validation',
      fieldErrors: { password: 'passwordLength', terms: 'terms', email: 'email' },
    })
    expect(accounts.accounts).toHaveLength(0)
  })

  it('refuse un rôle ou un champ inattendu sans le transmettre', () => {
    const parsed = signUpSchema.parse(signUpInput({ roles: ['super-admin'] }))
    expect(parsed).not.toHaveProperty('roles')
  })

  it('Turnstile obligatoire', async () => {
    expect(await signUp(signUpInput({ turnstileToken: 'faux' }), ctx, deps)).toEqual({
      ok: false,
      error: 'captcha',
    })
  })
})

describe('auth : connexion', () => {
  beforeEach(async () => {
    await signUp(signUpInput(), ctx, deps)
  })

  it('adresse non confirmée signalée seulement après le bon mot de passe', async () => {
    expect(
      await signIn(
        { email: 'awa@example.cm', password: goodPassword, turnstileToken: token },
        ctx,
        deps,
      ),
    ).toEqual({ ok: false, error: 'unverified' })
    expect(
      await signIn(
        { email: 'awa@example.cm', password: 'mauvais', turnstileToken: token },
        ctx,
        deps,
      ),
    ).toEqual({ ok: false, error: 'invalid-credentials' })
  })

  it('compte inconnu, mot de passe faux et compte verrouillé : même réponse', async () => {
    const unknown = await signIn(
      { email: 'inconnu@example.cm', password: goodPassword, turnstileToken: token },
      ctx,
      deps,
    )
    accounts.outcome = 'locked'
    const locked = await signIn(
      { email: 'awa@example.cm', password: goodPassword, turnstileToken: token },
      ctx,
      deps,
    )
    expect(unknown).toEqual({ ok: false, error: 'invalid-credentials' })
    expect(locked).toEqual(unknown)
  })

  it('succès après confirmation', async () => {
    accounts.accounts[0]!.verified = true
    expect(
      await signIn(
        { email: 'AWA@example.cm ', password: goodPassword, turnstileToken: token },
        ctx,
        deps,
      ),
    ).toEqual({ ok: true })
  })

  it('limitation par adresse visée, même depuis des IP différentes', async () => {
    const attempt = (ip: string) =>
      signIn(
        { email: 'awa@example.cm', password: 'x', turnstileToken: token },
        { ...ctx, ip },
        deps,
      )
    for (let index = 0; index < 5; index += 1) await attempt(`198.51.100.${index}`)
    const blocked = await attempt('198.51.100.99')
    expect(blocked).toMatchObject({ ok: false, error: 'rate-limited' })
    expect(accounts.logins).toHaveLength(5)
  })

  it('limitation par IP', async () => {
    for (let index = 0; index < 10; index += 1)
      await signIn(
        { email: `u${index}@example.cm`, password: 'x', turnstileToken: token },
        ctx,
        deps,
      )
    expect(
      await signIn({ email: 'z@example.cm', password: 'x', turnstileToken: token }, ctx, deps),
    ).toMatchObject({ error: 'rate-limited' })
  })

  it('erreur technique : message générique, journalisée', async () => {
    accounts.login = async () => {
      throw new Error('base indisponible')
    }
    expect(
      await signIn(
        { email: 'awa@example.cm', password: goodPassword, turnstileToken: token },
        ctx,
        deps,
      ),
    ).toEqual({ ok: false, error: 'server' })
    expect(errors).toEqual(['sign-in'])
  })
})

describe('auth : envoi d’e-mails non configuré (ADR 021)', () => {
  const emailRequest = { email: 'awa@example.cm', turnstileToken: token }

  it('la connexion d’un compte existant fonctionne sans service d’e-mails', async () => {
    await signUp(signUpInput(), ctx, deps)
    accounts.accounts[0]!.verified = true
    deps = { ...deps, canSendEmail: false }
    expect(
      await signIn(
        { email: 'awa@example.cm', password: goodPassword, turnstileToken: token },
        ctx,
        deps,
      ),
    ).toEqual({ ok: true })
  })

  it('inscription refusée avant toute création de compte ni envoi', async () => {
    deps = { ...deps, canSendEmail: false }
    expect(await signUp(signUpInput(), ctx, deps)).toEqual({
      ok: false,
      error: 'email-unavailable',
    })
    expect(accounts.accounts).toHaveLength(0)
    expect(mailer.sent).toHaveLength(0)
  })

  it('nouvel envoi du lien et mot de passe oublié refusés, sans jeton créé', async () => {
    deps = { ...deps, canSendEmail: false }
    expect(await resendVerification(emailRequest, ctx, deps)).toEqual({
      ok: false,
      error: 'email-unavailable',
    })
    expect(await requestPasswordReset(emailRequest, ctx, deps)).toEqual({
      ok: false,
      error: 'email-unavailable',
    })
    expect(mailer.sent).toHaveLength(0)
  })

  it('les champs restent validés en premier', async () => {
    deps = { ...deps, canSendEmail: false }
    expect(await signUp(signUpInput({ email: 'pas-un-email' }), ctx, deps)).toMatchObject({
      error: 'validation',
    })
  })
})

describe('auth : confirmation et mot de passe oublié', () => {
  it('confirme une adresse avec le jeton reçu, refuse un jeton inconnu ou mal formé', async () => {
    await signUp(signUpInput(), ctx, deps)
    expect(await verifyEmail({ token: 'inconnu-0123456789' }, ctx, deps)).toEqual({
      ok: false,
      error: 'invalid-token',
    })
    expect(await verifyEmail({ token: '<script>' }, ctx, deps)).toEqual({
      ok: false,
      error: 'invalid-token',
    })
    expect(await verifyEmail({ token: 'verif-awa@example.cm' }, ctx, deps)).toMatchObject({
      ok: false,
    })
    accounts.accounts[0]!.verificationToken = 'verif0123456789abcdef'
    expect(await verifyEmail({ token: 'verif0123456789abcdef' }, ctx, deps)).toEqual({ ok: true })
  })

  it('nouvel envoi du lien : même réponse que le compte existe ou non', async () => {
    await signUp(signUpInput(), ctx, deps)
    const known = await resendVerification(
      { email: 'awa@example.cm', turnstileToken: token },
      ctx,
      deps,
    )
    const unknown = await resendVerification(
      { email: 'x@example.cm', turnstileToken: token },
      ctx,
      deps,
    )
    expect(known).toEqual(unknown)
    expect(mailer.sent.filter((mail) => mail.kind === 'verify')).toHaveLength(2)
  })

  it('demande de lien : même réponse, e-mail seulement si le compte existe', async () => {
    await signUp(signUpInput(), ctx, deps)
    const known = await requestPasswordReset(
      { email: 'awa@example.cm', turnstileToken: token },
      ctx,
      deps,
    )
    const unknown = await requestPasswordReset(
      { email: 'x@example.cm', turnstileToken: token },
      ctx,
      deps,
    )
    expect(known).toEqual({ ok: true })
    expect(unknown).toEqual({ ok: true })
    expect(mailer.sent.filter((mail) => mail.kind === 'reset')).toEqual([
      { kind: 'reset', email: 'awa@example.cm', token: 'reset-1-0123456789abcdef' },
    ])
  })

  it('réinitialise avec un jeton valide, refuse un jeton invalide ou un mot de passe trop court', async () => {
    await signUp(signUpInput(), ctx, deps)
    const tokenOk = 'reset-1-0123456789abcdef'
    expect(
      await resetPassword(
        { token: 'reset-9-0123456789abcdef', password: goodPassword, turnstileToken: token },
        ctx,
        deps,
      ),
    ).toEqual({ ok: false, error: 'invalid-token' })
    expect(
      await resetPassword({ token: tokenOk, password: 'court', turnstileToken: token }, ctx, deps),
    ).toMatchObject({ error: 'validation', fieldErrors: { password: 'passwordLength' } })
    expect(
      await resetPassword(
        { token: tokenOk, password: 'nouvelle phrase longue', turnstileToken: token },
        ctx,
        deps,
      ),
    ).toEqual({ ok: true })
    expect(accounts.accounts[0]).toMatchObject({
      password: 'nouvelle phrase longue',
      verified: true,
    })
  })
})

describe('auth : chemin de retour', () => {
  it('accepte un chemin interne', () => {
    expect(safeNextPath('/fr/formation/cours?niveau=beginner#programme', '/x')).toBe(
      '/fr/formation/cours?niveau=beginner#programme',
    )
  })

  it('refuse toute redirection ouverte', () => {
    for (const value of [
      'https://evil.example',
      '//evil.example/path',
      '/\\evil.example',
      'javascript:alert(1)',
      'fr/formation',
      '/api/users/me',
      '/fr/\u0000admin',
      '',
      null,
      undefined,
      `/${'a'.repeat(400)}`,
    ])
      expect(safeNextPath(value, '/repli'), String(value)).toBe('/repli')
  })

  it('normalise les remontées de répertoire sans sortir du site', () => {
    expect(safeNextPath('/fr/../../admin', '/repli')).toBe('/admin')
  })

  it('codes d’erreur connus seulement', () => {
    const result = signUpSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success)
      for (const code of Object.values(toAuthFieldErrors(result.error)))
        expect(['required', 'terms', 'email', 'passwordLength']).toContain(code)
  })
})
