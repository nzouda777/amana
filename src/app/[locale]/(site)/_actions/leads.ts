'use server'

import { headers } from 'next/headers'

import { requestGuideDownload, type GuideResult } from '@/features/leads/guide-download'
import {
  confirmSubscription,
  type ConfirmOutcome,
  submitNewsletterForm,
  type NewsletterFormResult,
} from '@/features/leads/newsletter'
import { getGuideDeps, getLeadDeps, getNewsletterDeps, hashIp } from '@/features/leads/server/deps'
import {
  type RequestContext,
  submitContact,
  submitQuote,
  type SubmitResult,
} from '@/features/leads/service'
import { isLocale } from '@/lib/i18n/config'

/**
 * Server Actions des formulaires publics. Toute la validation (zod), l'anti-robot
 * (Turnstile) et la limitation de débit sont faites côté serveur dans `features/leads` :
 * rien de ce que le client envoie n'est cru sur parole.
 */

async function requestContext(locale: unknown): Promise<RequestContext> {
  const list = await headers()
  const ip =
    list.get('cf-connecting-ip') ??
    list.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    list.get('x-real-ip') ??
    undefined
  return {
    locale: isLocale(locale) ? locale : 'fr',
    ip,
    ipHash: hashIp(ip),
    userAgent: list.get('user-agent')?.slice(0, 300) ?? undefined,
  }
}

export async function submitQuoteAction(locale: string, input: unknown): Promise<SubmitResult> {
  return submitQuote(input, await requestContext(locale), getLeadDeps())
}

export async function submitContactAction(locale: string, input: unknown): Promise<SubmitResult> {
  return submitContact(input, await requestContext(locale), getLeadDeps())
}

export async function requestGuideAction(locale: string, input: unknown): Promise<GuideResult> {
  const ctx = await requestContext(locale)
  return requestGuideDownload(input, ctx, getGuideDeps(ctx.locale))
}

export async function subscribeNewsletterAction(
  locale: string,
  input: unknown,
): Promise<NewsletterFormResult> {
  const lead = getLeadDeps()
  return submitNewsletterForm(
    input,
    await requestContext(locale),
    {
      ...getNewsletterDeps(),
      rateLimiter: lead.rateLimiter,
      verifyTurnstile: lead.verifyTurnstile,
    },
    'newsletter',
  )
}

export type ConfirmState = { outcome: ConfirmOutcome | null }

/** Confirmation explicite (bouton) : un simple clic d'antivirus sur le lien ne confirme rien. */
export async function confirmNewsletterAction(
  _previous: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const token = formData.get('token')
  if (typeof token !== 'string') return { outcome: 'invalid' }
  return { outcome: await confirmSubscription(token, getNewsletterDeps()) }
}
