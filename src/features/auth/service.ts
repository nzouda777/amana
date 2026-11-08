import type { RateLimiter } from '@/features/leads/rate-limit'
import type { TurnstileVerifier } from '@/features/leads/turnstile'
import type { Locale } from '@/lib/i18n/config'

import {
  type AuthFieldErrors,
  emailRequestSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  toAuthFieldErrors,
  verifyEmailSchema,
} from './schemas'

/**
 * Parcours d'authentification (SPEC §6 : limitation de débit, verrouillage progressif,
 * aucune énumération des comptes). Logique pure : le stockage (Payload auth), le cookie
 * de session et les e-mails sont injectés.
 *
 * Énumération : l'inscription et la demande de réinitialisation répondent toujours
 * « consultez votre messagerie », que l'adresse existe ou non ; la connexion confond
 * adresse inconnue, mot de passe faux et compte verrouillé. Seul un compte non confirmé
 * est signalé, et seulement après un mot de passe correct (connaissance du secret).
 */

export type AuthContext = { locale: Locale; ip?: string }

export type AccountSummary = {
  id: number | string
  email: string
  firstName: string | null
  verified: boolean
  verificationToken: string | null
  preferredLocale: Locale | null
}

export type LoginOutcome = 'ok' | 'invalid' | 'locked' | 'unverified'

export interface AccountGateway {
  findByEmail(email: string): Promise<AccountSummary | null>
  /** Compte apprenant non confirmé ; renvoie son jeton de confirmation. */
  create(input: {
    email: string
    password: string
    firstName: string
    lastName: string
    locale: Locale
  }): Promise<AccountSummary>
  /** Vérifie le mot de passe et ouvre la session (cookie HttpOnly) si `ok`. */
  login(email: string, password: string): Promise<LoginOutcome>
  verifyEmail(token: string): Promise<boolean>
  /** Jeton de réinitialisation (courte durée), `null` si aucun compte. */
  createResetToken(email: string): Promise<string | null>
  /** Change le mot de passe, confirme l'adresse et ouvre la session ; `false` si jeton invalide. */
  resetPassword(token: string, password: string): Promise<boolean>
}

export interface AuthMailer {
  sendVerification(account: AccountSummary, token: string, locale: Locale): Promise<void>
  /** Inscription demandée pour une adresse déjà confirmée : lien de connexion et d'oubli. */
  sendAlreadyRegistered(account: AccountSummary, locale: Locale): Promise<void>
  sendPasswordReset(account: AccountSummary, token: string, locale: Locale): Promise<void>
}

export type AuthDeps = {
  accounts: AccountGateway
  mailer: AuthMailer
  /** Par adresse IP et par action. */
  rateLimiter: RateLimiter
  /** Par adresse e-mail visée (connexion, envois d'e-mails) : freine le bourrage ciblé. */
  emailRateLimiter: RateLimiter
  verifyTurnstile: TurnstileVerifier
  /**
   * Faux tant qu'aucun service d'envoi n'est configuré en production (Resend) : l'inscription
   * et les liens par e-mail sont refusés avant toute écriture ; la connexion reste ouverte.
   */
  canSendEmail: boolean
  reportError: (error: unknown, context: string) => void
}

export type AuthError =
  | 'validation'
  | 'rate-limited'
  | 'captcha'
  | 'invalid-credentials'
  | 'unverified'
  | 'invalid-token'
  /** Envoi d'e-mails non configuré : inscription et liens par e-mail indisponibles. */
  | 'email-unavailable'
  | 'server'

export type AuthResult =
  | { ok: true }
  | {
      ok: false
      error: AuthError
      fieldErrors?: AuthFieldErrors
      retryAfterSeconds?: number
    }

type Guard = { ok: true } | Extract<AuthResult, { ok: false }>

async function guard(
  deps: AuthDeps,
  action: string,
  ctx: AuthContext,
  turnstileToken: string | null,
  email?: string,
): Promise<Guard> {
  const byIp = await deps.rateLimiter.consume(`auth:${action}:${ctx.ip ?? 'unknown'}`)
  if (!byIp.allowed)
    return { ok: false, error: 'rate-limited', retryAfterSeconds: byIp.retryAfterSeconds }
  if (email) {
    const byEmail = await deps.emailRateLimiter.consume(`auth:${action}:email:${email}`)
    if (!byEmail.allowed)
      return { ok: false, error: 'rate-limited', retryAfterSeconds: byEmail.retryAfterSeconds }
  }
  if (turnstileToken !== null && !(await deps.verifyTurnstile(turnstileToken, ctx.ip)))
    return { ok: false, error: 'captcha' }
  return { ok: true }
}

const emailUnavailable: AuthResult = { ok: false, error: 'email-unavailable' }

const validation = (fieldErrors: AuthFieldErrors): AuthResult => ({
  ok: false,
  error: 'validation',
  fieldErrors,
})

export async function signIn(
  input: unknown,
  ctx: AuthContext,
  deps: AuthDeps,
): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) return validation(toAuthFieldErrors(parsed.error))
  const { email, password, turnstileToken } = parsed.data
  const checked = await guard(deps, 'sign-in', ctx, turnstileToken, email)
  if (!checked.ok) return checked
  try {
    const outcome = await deps.accounts.login(email, password)
    if (outcome === 'ok') return { ok: true }
    if (outcome === 'unverified') return { ok: false, error: 'unverified' }
    // Adresse inconnue, mot de passe faux et compte verrouillé : même réponse.
    return { ok: false, error: 'invalid-credentials' }
  } catch (error) {
    deps.reportError(error, 'sign-in')
    return { ok: false, error: 'server' }
  }
}

export async function signUp(
  input: unknown,
  ctx: AuthContext,
  deps: AuthDeps,
): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) return validation(toAuthFieldErrors(parsed.error))
  const { email, password, firstName, lastName, turnstileToken } = parsed.data
  // Avant toute écriture : un compte créé sans e-mail de confirmation resterait inutilisable.
  if (!deps.canSendEmail) return emailUnavailable
  const checked = await guard(deps, 'sign-up', ctx, turnstileToken, email)
  if (!checked.ok) return checked
  try {
    const existing = await deps.accounts.findByEmail(email)
    if (existing) {
      // Même réponse qu'une création : le titulaire de l'adresse est prévenu par e-mail.
      if (!existing.verified && existing.verificationToken)
        await deps.mailer.sendVerification(existing, existing.verificationToken, ctx.locale)
      else await deps.mailer.sendAlreadyRegistered(existing, ctx.locale)
      return { ok: true }
    }
    const account = await deps.accounts.create({
      email,
      password,
      firstName,
      lastName,
      locale: ctx.locale,
    })
    if (account.verificationToken)
      await deps.mailer.sendVerification(account, account.verificationToken, ctx.locale)
    return { ok: true }
  } catch (error) {
    deps.reportError(error, 'sign-up')
    return { ok: false, error: 'server' }
  }
}

/** Nouvel envoi du lien de confirmation ; réponse identique que l'adresse existe ou non. */
export async function resendVerification(
  input: unknown,
  ctx: AuthContext,
  deps: AuthDeps,
): Promise<AuthResult> {
  const parsed = emailRequestSchema.safeParse(input)
  if (!parsed.success) return validation(toAuthFieldErrors(parsed.error))
  const { email, turnstileToken } = parsed.data
  if (!deps.canSendEmail) return emailUnavailable
  const checked = await guard(deps, 'verify-resend', ctx, turnstileToken, email)
  if (!checked.ok) return checked
  try {
    const account = await deps.accounts.findByEmail(email)
    if (account && !account.verified && account.verificationToken)
      await deps.mailer.sendVerification(account, account.verificationToken, ctx.locale)
    return { ok: true }
  } catch (error) {
    deps.reportError(error, 'verify-resend')
    return { ok: false, error: 'server' }
  }
}

export async function verifyEmail(
  input: unknown,
  ctx: AuthContext,
  deps: AuthDeps,
): Promise<AuthResult> {
  const parsed = verifyEmailSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid-token' }
  // Pas de Turnstile : le jeton reçu par e-mail est lui-même le secret.
  const checked = await guard(deps, 'verify', ctx, null)
  if (!checked.ok) return checked
  try {
    return (await deps.accounts.verifyEmail(parsed.data.token))
      ? { ok: true }
      : { ok: false, error: 'invalid-token' }
  } catch (error) {
    deps.reportError(error, 'verify')
    return { ok: false, error: 'server' }
  }
}

export async function requestPasswordReset(
  input: unknown,
  ctx: AuthContext,
  deps: AuthDeps,
): Promise<AuthResult> {
  const parsed = emailRequestSchema.safeParse(input)
  if (!parsed.success) return validation(toAuthFieldErrors(parsed.error))
  const { email, turnstileToken } = parsed.data
  if (!deps.canSendEmail) return emailUnavailable
  const checked = await guard(deps, 'reset-request', ctx, turnstileToken, email)
  if (!checked.ok) return checked
  try {
    const account = await deps.accounts.findByEmail(email)
    if (account) {
      const token = await deps.accounts.createResetToken(email)
      if (token)
        await deps.mailer.sendPasswordReset(account, token, account.preferredLocale ?? ctx.locale)
    }
    return { ok: true }
  } catch (error) {
    deps.reportError(error, 'reset-request')
    return { ok: false, error: 'server' }
  }
}

export async function resetPassword(
  input: unknown,
  ctx: AuthContext,
  deps: AuthDeps,
): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = toAuthFieldErrors(parsed.error)
    return fieldErrors.token ? { ok: false, error: 'invalid-token' } : validation(fieldErrors)
  }
  const { token, password, turnstileToken } = parsed.data
  const checked = await guard(deps, 'reset', ctx, turnstileToken)
  if (!checked.ok) return checked
  try {
    return (await deps.accounts.resetPassword(token, password))
      ? { ok: true }
      : { ok: false, error: 'invalid-token' }
  } catch (error) {
    deps.reportError(error, 'reset')
    return { ok: false, error: 'server' }
  }
}
