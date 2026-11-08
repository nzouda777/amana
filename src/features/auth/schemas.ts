import { z } from 'zod'

import { emailField, type ErrorCode } from '@/features/leads/schemas'

/**
 * Schémas des formulaires d'authentification (connexion, inscription, mot de passe),
 * partagés entre le client (messages immédiats) et le serveur (seule validation qui fait
 * foi). Les erreurs sont des **codes** traduits à l'affichage (`learn.auth.errors.<code>`).
 */

export type AuthErrorCode = ErrorCode | 'passwordLength' | 'terms'

export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 128

const required = { error: 'required' satisfies AuthErrorCode }

const name = z
  .string(required)
  .trim()
  .min(1, { error: 'required' satisfies AuthErrorCode })
  .max(80, { error: 'tooLong' satisfies AuthErrorCode })

/**
 * Nouveau mot de passe : longueur seule (recommandation NIST SP 800-63B), sans règle de
 * composition qui pousse aux motifs prévisibles. Les espaces sont permis (phrases de passe).
 */
export const newPasswordField = z
  .string(required)
  .min(PASSWORD_MIN_LENGTH, { error: 'passwordLength' satisfies AuthErrorCode })
  .max(PASSWORD_MAX_LENGTH, { error: 'passwordLength' satisfies AuthErrorCode })

const turnstileToken = z.string().trim().min(1, required).max(4096)

/** Chemin de retour après connexion (validé par `safeNextPath`, jamais suivi tel quel). */
const next = z.string().trim().max(300).optional()

export const signInSchema = z.object({
  email: emailField,
  // Mot de passe existant : aucune règle de longueur révélée, seulement une borne.
  password: z
    .string(required)
    .min(1, required)
    .max(PASSWORD_MAX_LENGTH * 2, { error: 'tooLong' satisfies AuthErrorCode }),
  turnstileToken,
  next,
})
export type SignInInput = z.output<typeof signInSchema>

export const signUpSchema = z.object({
  firstName: name,
  lastName: name,
  email: emailField,
  password: newPasswordField,
  /** Acceptation des CGU et de la politique de confidentialité : obligatoire. */
  terms: z.literal(true, { error: 'terms' satisfies AuthErrorCode }),
  turnstileToken,
  next,
})
export type SignUpInput = z.output<typeof signUpSchema>

export const emailRequestSchema = z.object({ email: emailField, turnstileToken })
export type EmailRequestInput = z.output<typeof emailRequestSchema>

/** Jeton d'un lien reçu par e-mail : forme bornée (Payload : hexadécimal). */
export const emailTokenField = z
  .string(required)
  .trim()
  .min(16, required)
  .max(512, required)
  .regex(/^[A-Za-z0-9._-]+$/, required)

export const resetPasswordSchema = z.object({
  token: emailTokenField,
  password: newPasswordField,
  turnstileToken,
})
export type ResetPasswordInput = z.output<typeof resetPasswordSchema>

export const verifyEmailSchema = z.object({ token: emailTokenField })

export type AuthFieldErrors = Record<string, AuthErrorCode>

const codes: ReadonlySet<string> = new Set<AuthErrorCode>([
  'required',
  'email',
  'tooShort',
  'tooLong',
  'phone',
  'choice',
  'consent',
  'number',
  'passwordLength',
  'terms',
])

/** Erreurs zod → `{ champ: code }` (première erreur par champ). */
export function toAuthFieldErrors(error: z.ZodError): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.')
    if (errors[key]) continue
    errors[key] = codes.has(issue.message) ? (issue.message as AuthErrorCode) : 'required'
  }
  return errors
}

/**
 * Chemin de retour sûr : chemin interne absolu uniquement. Refusés : URL absolues,
 * protocole relatif (`//hôte`), barres obliques inverses, caractères de contrôle, API.
 * Sinon `fallback` (redirection ouverte impossible).
 */
export function safeNextPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback
  const path = value.trim()
  if (path.length === 0 || path.length > 300) return fallback
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  if (path.includes('\\') || [...path].some((char) => char.charCodeAt(0) < 32 || char === '\u007f'))
    return fallback
  if (/^\/api(\/|$)/.test(path)) return fallback
  try {
    // Un chemin qui se résout hors du site (après normalisation) est refusé.
    const resolved = new URL(path, 'https://amana.invalid')
    if (resolved.origin !== 'https://amana.invalid') return fallback
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return fallback
  }
}
