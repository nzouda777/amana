import { type FieldErrors, guideDownloadSchema, toFieldErrors } from './schemas'
import {
  CONSENT_WORDING_VERSION,
  guardRequest,
  type LeadDeps,
  type RequestContext,
  type SubmitError,
} from './service'

/**
 * Téléchargement d'un guide contre e-mail (SPEC §4.4). Le fichier reste privé (ADR 008) :
 * après consentement, le demandeur reçoit un jeton signé à durée courte, utilisé par la
 * route `/api/downloads/guide`. Le lien est aussi envoyé par e-mail.
 */

/** Durée de validité du lien de téléchargement. */
export const GUIDE_LINK_TTL_SECONDS = 7 * 24 * 60 * 60

export type GuideSummary = {
  id: number
  slug: string
  title: string
  interests: Array<'formation' | 'audit' | 'takaful' | 'reglementaire'>
}

export type GuideDeps = Pick<
  LeadDeps,
  'store' | 'rateLimiter' | 'verifyTurnstile' | 'subscribeNewsletter' | 'reportError'
> & {
  findGuide(id: number): Promise<GuideSummary | null>
  /** Jeton de téléchargement signé pour ce guide. */
  createToken(guideId: number): string
  sendLink(input: {
    email: string
    name?: string
    guide: GuideSummary
    token: string
  }): Promise<void>
}

export type GuideResult =
  | { ok: true; token: string }
  | {
      ok: false
      error: SubmitError | 'not-found'
      fieldErrors?: FieldErrors
      retryAfterSeconds?: number
    }

export async function requestGuideDownload(
  raw: unknown,
  ctx: RequestContext,
  deps: GuideDeps,
): Promise<GuideResult> {
  const parsed = guideDownloadSchema.safeParse(raw)
  if (!parsed.success)
    return { ok: false, error: 'invalid', fieldErrors: toFieldErrors(parsed.error) }
  const input = parsed.data

  const blocked = await guardRequest('guide', input.turnstileToken, ctx, deps)
  if (blocked) return blocked

  const guide = await deps.findGuide(input.guideId)
  if (!guide) return { ok: false, error: 'not-found' }

  try {
    const consent = await deps.store.createConsent({
      email: input.email,
      purpose: 'guide-download',
      granted: true,
      wordingVersion: CONSENT_WORDING_VERSION,
      locale: ctx.locale,
      sourcePage: input.sourcePage,
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
    })
    await deps.store.createLead({
      type: 'contact',
      source: 'guide',
      name: input.name ?? input.email,
      email: input.email,
      phone: input.phone,
      organization: input.organization,
      details: { guide: guide.slug, newsletter: input.newsletter },
      sourcePage: input.sourcePage,
      locale: ctx.locale,
      consent,
    })
  } catch (error) {
    deps.reportError?.(error, 'guide:persist')
    return { ok: false, error: 'server' }
  }

  if (input.newsletter && deps.subscribeNewsletter) {
    try {
      await deps.subscribeNewsletter({
        email: input.email,
        firstName: input.name?.split(' ')[0],
        interests: guide.interests,
        locale: ctx.locale,
        source: `guide:${guide.slug}`,
        ipHash: ctx.ipHash,
        userAgent: ctx.userAgent,
      })
    } catch (error) {
      deps.reportError?.(error, 'guide:newsletter')
    }
  }

  const token = deps.createToken(guide.id)
  try {
    await deps.sendLink({ email: input.email, name: input.name, guide, token })
  } catch (error) {
    deps.reportError?.(error, 'guide:email')
  }
  return { ok: true, token }
}
