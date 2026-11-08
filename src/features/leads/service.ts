import type { LeadType } from '@/payload/shared'

import type { RateLimiter } from './rate-limit'
import {
  contactFormSchema,
  type FieldErrors,
  type NewsletterInterestValue,
  parseQuote,
  type QuoteInput,
  toFieldErrors,
} from './schemas'
import type { TurnstileVerifier } from './turnstile'

/**
 * Orchestration des demandes entrantes (devis, contact) : validation, limitation de débit,
 * anti-robot, consentement, enregistrement, notifications. Logique pure : la persistance,
 * l'envoi d'e-mails et l'horloge sont injectés (Payload et Resend en production, doublures
 * en test).
 */

export type Locale = 'fr' | 'en' | 'ar'

/** Version du texte de consentement présenté (journal `consents`). */
export const CONSENT_WORDING_VERSION = '2026-11-v1'

export type RequestContext = {
  locale: Locale
  /** Adresse IP du client (limitation de débit, Turnstile), jamais stockée en clair. */
  ip?: string
  /** Empreinte de l'IP (HMAC), stockée dans le journal des consentements. */
  ipHash?: string
  userAgent?: string
}

export type ConsentRecord = {
  email: string
  purpose: 'newsletter' | 'guide-download' | 'contact-processing'
  granted: boolean
  wordingVersion: string
  locale: Locale
  sourcePage?: string
  ipHash?: string
  userAgent?: string
}

export type LeadRecord = {
  type: LeadType
  name: string
  email: string
  phone?: string
  organization?: string
  jobTitle?: string
  city?: string
  message?: string
  details?: Record<string, unknown>
  source: 'form' | 'calcom' | 'guide'
  sourcePage?: string
  locale: Locale
  consent?: number
}

export interface LeadStore {
  createConsent(record: ConsentRecord): Promise<number>
  createLead(record: LeadRecord): Promise<number>
}

export interface LeadNotifier {
  /** E-mail à l'équipe (adresse selon le type) et accusé de réception au demandeur. */
  notify(lead: LeadRecord & { id: number }): Promise<void>
}

export type NewsletterSubscriber = (input: {
  email: string
  firstName?: string
  interests: NewsletterInterestValue[]
  locale: Locale
  source: string
  ipHash?: string
  userAgent?: string
}) => Promise<void>

export type LeadDeps = {
  store: LeadStore
  notifier: LeadNotifier
  rateLimiter: RateLimiter
  verifyTurnstile: TurnstileVerifier
  subscribeNewsletter?: NewsletterSubscriber
  /** Journalisation d'erreur non bloquante (e-mail en échec après enregistrement). */
  reportError?: (error: unknown, context: string) => void
}

export type SubmitError = 'invalid' | 'rate-limited' | 'captcha' | 'server'

export type SubmitResult =
  | { ok: true; leadId: number }
  | { ok: false; error: SubmitError; fieldErrors?: FieldErrors; retryAfterSeconds?: number }

/** Contrôles communs : débit puis anti-robot (dans cet ordre : un robot ne coûte pas d'appel). */
export async function guardRequest(
  scope: string,
  token: string,
  ctx: RequestContext,
  deps: Pick<LeadDeps, 'rateLimiter' | 'verifyTurnstile'>,
): Promise<Extract<SubmitResult, { ok: false }> | null> {
  const limit = await deps.rateLimiter.consume(`${scope}:${ctx.ip ?? 'unknown'}`)
  if (!limit.allowed)
    return { ok: false, error: 'rate-limited', retryAfterSeconds: limit.retryAfterSeconds }
  const human = await deps.verifyTurnstile(token, ctx.ip)
  if (!human) return { ok: false, error: 'captcha' }
  return null
}

/** Champs qualifiants du devis, stockés dans `leads.details` (JSON). */
export function quoteDetails(input: QuoteInput): Record<string, unknown> {
  const { message: _message, ...context } = input.context
  return Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined))
}

async function persistAndNotify(
  lead: Omit<LeadRecord, 'consent'>,
  newsletter: { requested: boolean; firstName?: string; interests: NewsletterInterestValue[] },
  ctx: RequestContext,
  deps: LeadDeps,
): Promise<SubmitResult> {
  let leadId: number
  try {
    const consent = await deps.store.createConsent({
      email: lead.email,
      purpose: 'contact-processing',
      granted: true,
      wordingVersion: CONSENT_WORDING_VERSION,
      locale: ctx.locale,
      sourcePage: lead.sourcePage,
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
    })
    leadId = await deps.store.createLead({ ...lead, consent })
  } catch (error) {
    deps.reportError?.(error, 'lead:persist')
    return { ok: false, error: 'server' }
  }

  // Après l'enregistrement, rien ne doit faire échouer la demande : elle est en base.
  if (newsletter.requested && deps.subscribeNewsletter) {
    try {
      await deps.subscribeNewsletter({
        email: lead.email,
        firstName: newsletter.firstName,
        interests: newsletter.interests,
        locale: ctx.locale,
        source: `lead:${lead.type}`,
        ipHash: ctx.ipHash,
        userAgent: ctx.userAgent,
      })
    } catch (error) {
      deps.reportError?.(error, 'lead:newsletter')
    }
  }
  try {
    await deps.notifier.notify({ ...lead, id: leadId })
  } catch (error) {
    deps.reportError?.(error, 'lead:notify')
  }
  return { ok: true, leadId }
}

const interestByType: Partial<Record<LeadType, NewsletterInterestValue>> = {
  audit: 'audit',
  conseil: 'audit',
  accompagnement: 'audit',
  takaful: 'takaful',
  'formation-entreprise': 'formation',
}

/** Demande de devis multi-étapes. */
export async function submitQuote(
  raw: unknown,
  ctx: RequestContext,
  deps: LeadDeps,
): Promise<SubmitResult> {
  const parsed = parseQuote(raw)
  if (!parsed.ok) return { ok: false, error: 'invalid', fieldErrors: parsed.fieldErrors }
  const input = parsed.data

  const blocked = await guardRequest('quote', input.turnstileToken, ctx, deps)
  if (blocked) return blocked

  const { contact } = input
  const interest = interestByType[input.type]
  return persistAndNotify(
    {
      type: input.type,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      organization: contact.organization,
      jobTitle: contact.jobTitle,
      city: contact.city,
      message: input.context.message,
      details: quoteDetails(input),
      source: 'form',
      sourcePage: input.sourcePage,
      locale: ctx.locale,
    },
    {
      requested: contact.newsletter,
      firstName: contact.name.split(' ')[0],
      interests: interest ? [interest] : [],
    },
    ctx,
    deps,
  )
}

/** Formulaire court (page Contact, bloc CTA des pages de service). */
export async function submitContact(
  raw: unknown,
  ctx: RequestContext,
  deps: LeadDeps,
): Promise<SubmitResult> {
  const parsed = contactFormSchema.safeParse(raw)
  if (!parsed.success)
    return { ok: false, error: 'invalid', fieldErrors: toFieldErrors(parsed.error) }
  const input = parsed.data

  const blocked = await guardRequest('contact', input.turnstileToken, ctx, deps)
  if (blocked) return blocked

  return persistAndNotify(
    {
      type: input.subject,
      name: input.name,
      email: input.email,
      phone: input.phone,
      organization: input.organization,
      message: input.message,
      source: 'form',
      sourcePage: input.sourcePage,
      locale: ctx.locale,
    },
    { requested: false, interests: [] },
    ctx,
    deps,
  )
}
