'use server'

import config from '@payload-config'
import { logout } from '@payloadcms/next/auth'
import { redirect } from 'next/navigation'

import { safeNextPath } from '@/features/auth/schemas'
import { getAuthDeps } from '@/features/auth/server/deps'
import { getClientIp } from '@/features/auth/server/request'
import {
  type AuthContext,
  type AuthResult,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signIn,
  signUp,
  verifyEmail,
} from '@/features/auth/service'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getPathname } from '@/lib/i18n/navigation'

/**
 * Server Actions de l'authentification. Validation zod, Turnstile, limitation de débit
 * et réponses sans énumération : `src/features/auth/service.ts`. Rien de ce que le client
 * envoie n'est cru sur parole (rôle, chemin de retour).
 */

async function context(locale: unknown): Promise<AuthContext> {
  return { locale: isLocale(locale) ? locale : 'fr', ip: await getClientIp() }
}

/** Destination après connexion : chemin interne fourni, sinon le catalogue. */
function destination(locale: Locale, next: unknown): string {
  const fallback = getPathname({ locale, href: '/formation/cours' })
  return safeNextPath(typeof next === 'string' ? next : undefined, fallback)
}

const nextOf = (input: unknown): unknown =>
  typeof input === 'object' && input !== null && 'next' in input ? input.next : undefined

export async function signInAction(locale: string, input: unknown): Promise<AuthResult> {
  const ctx = await context(locale)
  const result = await signIn(input, ctx, getAuthDeps())
  if (result.ok) redirect(destination(ctx.locale, nextOf(input)))
  return result
}

export async function signUpAction(locale: string, input: unknown): Promise<AuthResult> {
  return signUp(input, await context(locale), getAuthDeps())
}

export async function resendVerificationAction(
  locale: string,
  input: unknown,
): Promise<AuthResult> {
  return resendVerification(input, await context(locale), getAuthDeps())
}

export async function requestPasswordResetAction(
  locale: string,
  input: unknown,
): Promise<AuthResult> {
  return requestPasswordReset(input, await context(locale), getAuthDeps())
}

export async function resetPasswordAction(locale: string, input: unknown): Promise<AuthResult> {
  const ctx = await context(locale)
  const result = await resetPassword(input, ctx, getAuthDeps())
  // Mot de passe changé : la session est ouverte, retour au catalogue.
  if (result.ok) redirect(destination(ctx.locale, undefined))
  return result
}

export type VerifyState = { status: 'idle' | 'verified' | 'invalid' | 'error' }

/** Confirmation explicite (bouton) : un simple clic d'antivirus sur le lien ne suffit pas. */
export async function verifyEmailAction(
  _previous: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const result = await verifyEmail(
    { token: formData.get('token') },
    await context(formData.get('locale')),
    getAuthDeps(),
  )
  if (result.ok) return { status: 'verified' }
  return { status: result.error === 'invalid-token' ? 'invalid' : 'error' }
}

/** Déconnexion : session révoquée côté serveur, cookie supprimé, retour à l'accueil. */
export async function signOutAction(formData: FormData): Promise<void> {
  const locale = formData.get('locale')
  await logout({ config })
  redirect(getPathname({ locale: isLocale(locale) ? locale : 'fr', href: '/' }))
}
