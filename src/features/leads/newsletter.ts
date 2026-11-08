import type { NewsletterGateway } from '@/features/email/contracts'

import type { RateLimiter } from './rate-limit'
import {
  type FieldErrors,
  newsletterSchema,
  type NewsletterInterestValue,
  toFieldErrors,
} from './schemas'
import {
  CONSENT_WORDING_VERSION,
  type ConsentRecord,
  guardRequest,
  type Locale,
  type RequestContext,
  type SubmitError,
} from './service'
import type { TurnstileVerifier } from './turnstile'

/**
 * Newsletter en double opt-in (SPEC §4.4) : inscription en attente + e-mail de
 * confirmation ; l'abonné n'est synchronisé avec Brevo qu'après confirmation.
 * Aucune réponse ne révèle si une adresse est déjà inscrite.
 */

/** Durée de validité du lien de confirmation. */
export const CONFIRMATION_TTL_MS = 72 * 60 * 60 * 1000

export type Subscriber = {
  id: number
  email: string
  status: 'pending' | 'confirmed' | 'unsubscribed'
  confirmToken?: string | null
  confirmTokenExpiresAt?: string | null
  firstName?: string | null
  interests: NewsletterInterestValue[]
  locale: Locale
}

export interface SubscriberStore {
  findByEmail(email: string): Promise<Subscriber | null>
  findByToken(token: string): Promise<Subscriber | null>
  create(input: {
    email: string
    firstName?: string
    interests: NewsletterInterestValue[]
    locale: Locale
    source: string
    confirmTokenExpiresAt: string
    consent: number
  }): Promise<Subscriber>
  update(
    id: number,
    patch: Partial<Omit<Subscriber, 'id' | 'email'>> & Record<string, unknown>,
  ): Promise<Subscriber>
  createConsent(record: ConsentRecord): Promise<number>
}

export type NewsletterDeps = {
  store: SubscriberStore
  /** Envoie l'e-mail contenant le lien de confirmation. */
  sendConfirmation(subscriber: Subscriber & { confirmToken: string }): Promise<void>
  gateway: NewsletterGateway
  now?: () => number
  reportError?: (error: unknown, context: string) => void
}

export type SubscriptionRequest = {
  email: string
  firstName?: string
  interests: NewsletterInterestValue[]
  locale: Locale
  source: string
  ipHash?: string
  userAgent?: string
}

function mergeInterests(
  current: readonly NewsletterInterestValue[],
  added: readonly NewsletterInterestValue[],
): NewsletterInterestValue[] {
  return [...new Set([...current, ...added])]
}

/** Enregistre (ou relance) une inscription en attente et envoie le lien de confirmation. */
export async function requestSubscription(
  input: SubscriptionRequest,
  deps: NewsletterDeps,
): Promise<void> {
  const now = deps.now?.() ?? Date.now()
  const expiresAt = new Date(now + CONFIRMATION_TTL_MS).toISOString()
  const existing = await deps.store.findByEmail(input.email)

  // Déjà confirmé : on enrichit les centres d'intérêt sans renvoyer d'e-mail.
  if (existing?.status === 'confirmed') {
    const interests = mergeInterests(existing.interests, input.interests)
    if (interests.length !== existing.interests.length)
      await deps.store.update(existing.id, { interests })
    return
  }

  const consent = await deps.store.createConsent({
    email: input.email,
    purpose: 'newsletter',
    granted: true,
    wordingVersion: CONSENT_WORDING_VERSION,
    locale: input.locale,
    sourcePage: input.source,
    ipHash: input.ipHash,
    userAgent: input.userAgent,
  })

  const subscriber = existing
    ? await deps.store.update(existing.id, {
        status: 'pending',
        interests: mergeInterests(existing.interests, input.interests),
        confirmTokenExpiresAt: expiresAt,
        firstName: input.firstName ?? existing.firstName ?? null,
        locale: input.locale,
        consent,
      })
    : await deps.store.create({
        email: input.email,
        firstName: input.firstName,
        interests: input.interests,
        locale: input.locale,
        source: input.source,
        confirmTokenExpiresAt: expiresAt,
        consent,
      })

  if (!subscriber.confirmToken) throw new Error('Abonné sans jeton de confirmation.')
  await deps.sendConfirmation({ ...subscriber, confirmToken: subscriber.confirmToken })
}

export type ConfirmOutcome = 'confirmed' | 'already-confirmed' | 'expired' | 'invalid'

/** Confirme l'inscription correspondant au jeton (action explicite de l'abonné). */
export async function confirmSubscription(
  token: string,
  deps: NewsletterDeps,
): Promise<ConfirmOutcome> {
  if (!token || token.length < 16 || token.length > 128) return 'invalid'
  const subscriber = await deps.store.findByToken(token)
  if (!subscriber) return 'invalid'
  if (subscriber.status === 'confirmed') return 'already-confirmed'
  const now = deps.now?.() ?? Date.now()
  const expires = subscriber.confirmTokenExpiresAt
    ? Date.parse(subscriber.confirmTokenExpiresAt)
    : 0
  if (!expires || expires < now) return 'expired'

  const patch: Record<string, unknown> = {
    status: 'confirmed',
    confirmedAt: new Date(now).toISOString(),
    unsubscribedAt: null,
  }
  try {
    const { contactId } = await deps.gateway.upsertContact({
      email: subscriber.email,
      firstName: subscriber.firstName ?? undefined,
      interests: subscriber.interests,
      locale: subscriber.locale,
    })
    if (contactId) patch.brevoContactId = contactId
  } catch (error) {
    // La confirmation reste valable ; la synchronisation sera rejouée par l'équipe.
    deps.reportError?.(error, 'newsletter:sync')
  }
  await deps.store.update(subscriber.id, patch)
  return 'confirmed'
}

export type NewsletterFormResult =
  | { ok: true }
  | {
      ok: false
      error: SubmitError
      fieldErrors?: FieldErrors
      retryAfterSeconds?: number
    }

/** Formulaire d'inscription (pied de page, fin d'article) : validation, garde, demande. */
export async function submitNewsletterForm(
  raw: unknown,
  ctx: RequestContext,
  deps: NewsletterDeps & { rateLimiter: RateLimiter; verifyTurnstile: TurnstileVerifier },
  source: string,
): Promise<NewsletterFormResult> {
  const parsed = newsletterSchema.safeParse(raw)
  if (!parsed.success)
    return { ok: false, error: 'invalid', fieldErrors: toFieldErrors(parsed.error) }
  const blocked = await guardRequest('newsletter', parsed.data.turnstileToken, ctx, deps)
  if (blocked) return blocked
  try {
    await requestSubscription(
      {
        email: parsed.data.email,
        firstName: parsed.data.firstName,
        interests: parsed.data.interests,
        locale: ctx.locale,
        source: parsed.data.sourcePage ?? source,
        ipHash: ctx.ipHash,
        userAgent: ctx.userAgent,
      },
      deps,
    )
  } catch (error) {
    deps.reportError?.(error, 'newsletter:request')
    return { ok: false, error: 'server' }
  }
  return { ok: true }
}
