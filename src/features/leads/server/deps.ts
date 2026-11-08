import { createHmac } from 'node:crypto'
import path from 'node:path'

import { getTranslations } from 'next-intl/server'

import { getServerEnv } from '@/env'
import type { EmailSender, NewsletterGateway } from '@/features/email/contracts'
import { BrevoNewsletterGateway, NoopNewsletterGateway } from '@/lib/email/brevo'
import { FileEmailSender, ResendEmailSender } from '@/lib/email/senders'
import { getDirection } from '@/lib/i18n/config'
import { getPathname } from '@/lib/i18n/navigation'
import { getPayloadClient } from '@/lib/payload'
import type { NewsletterSubscriber as SubscriberDoc } from '@/payload-types'

import { AcknowledgementEmail, ActionEmail, TeamNotificationEmail } from '../emails/templates'
import { type GuideDeps, type GuideSummary, GUIDE_LINK_TTL_SECONDS } from '../guide-download'
import { type NewsletterDeps, requestSubscription, type Subscriber } from '../newsletter'
import { MemoryRateLimiter } from '../rate-limit'
import { responseDelayDays, teamRecipient } from '../routing'
import type { LeadDeps, LeadRecord, LeadStore, Locale } from '../service'
import { createSignedToken } from '../signed-token'
import {
  createTurnstileVerifier,
  TURNSTILE_TEST_SECRET_KEY,
  type TurnstileVerifier,
} from '../turnstile'

/**
 * Câblage serveur des demandes entrantes : Payload (Local API), e-mails (Resend ou fichier
 * en développement), Brevo (ou aucun), Turnstile (ou clé de test en développement),
 * limitation de débit en mémoire. Importé uniquement par les Server Actions et routes.
 */

/* ---------------------------------------------------------------- Singletons */

/** 5 envois par adresse IP et par formulaire, sur 10 minutes. */
const rateLimiter = new MemoryRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 })

let emailSender: EmailSender | undefined
let gateway: NewsletterGateway | undefined
let turnstile: TurnstileVerifier | undefined

export function getEmailSender(): EmailSender {
  if (emailSender) return emailSender
  const env = getServerEnv()
  const from = env.EMAIL_FROM ?? 'Amana Conseil <no-reply@amana-conseil.example>'
  emailSender = env.RESEND_API_KEY
    ? new ResendEmailSender(env.RESEND_API_KEY, from)
    : new FileEmailSender(
        // Dossier de développement : rien à tracer pour le déploiement.
        path.resolve(/* turbopackIgnore: true */ process.cwd(), env.DEV_EMAIL_DIR),
        from,
      )
  return emailSender
}

export function getNewsletterGateway(): NewsletterGateway {
  if (gateway) return gateway
  const env = getServerEnv()
  gateway = env.BREVO_API_KEY
    ? new BrevoNewsletterGateway(env.BREVO_API_KEY, env.BREVO_LIST_ID)
    : new NoopNewsletterGateway()
  return gateway
}

function getTurnstileVerifier(): TurnstileVerifier {
  const env = getServerEnv()
  // Désactivé (ADR 020) : aucun appel à Cloudflare ; la limitation de débit reste active.
  turnstile ??= env.NEXT_PUBLIC_TURNSTILE_ENABLED
    ? createTurnstileVerifier(env.TURNSTILE_SECRET_KEY ?? TURNSTILE_TEST_SECRET_KEY)
    : async () => true
  return turnstile
}

function reportError(error: unknown, context: string): void {
  console.error(`[leads] ${context}`, error)
}

function siteUrl(): string {
  return getServerEnv().NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
}

/** Empreinte non réversible de l'adresse IP (journal des consentements). */
export function hashIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined
  return createHmac('sha256', getServerEnv().PAYLOAD_SECRET).update(ip).digest('hex').slice(0, 32)
}

/* -------------------------------------------------------------- Persistance */

const payloadStore: LeadStore = {
  async createConsent(record) {
    const payload = await getPayloadClient()
    const doc = await payload.create({ collection: 'consents', data: record, depth: 0 })
    return doc.id
  },
  async createLead(record) {
    const payload = await getPayloadClient()
    const doc = await payload.create({
      collection: 'leads',
      data: { ...record, status: 'new' },
      depth: 0,
    })
    return doc.id
  },
}

/* ------------------------------------------------------------------- E-mails */

async function getRouting() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  return {
    routing: settings.requestRouting ?? [],
    contactEmail: settings.contact?.email ?? null,
  }
}

async function notifyLead(lead: LeadRecord & { id: number }): Promise<void> {
  const sender = getEmailSender()
  const { routing, contactEmail } = await getRouting()

  // Accusé de réception, dans la langue du demandeur.
  const t = await getTranslations({ locale: lead.locale, namespace: 'emails' })
  const typeLabel = t(`types.${lead.type}`)
  const delay = responseDelayDays[lead.type]
  const footer = t('footer')
  const steps = [t('ack.step1'), t('ack.step2', { days: delay }), t('ack.step3')]
  const summary = [
    { label: t('fields.type'), value: typeLabel },
    ...(lead.organization ? [{ label: t('fields.organization'), value: lead.organization }] : []),
    { label: t('fields.reference'), value: `#${lead.id}` },
  ]
  await sender.send({
    to: { email: lead.email, name: lead.name },
    ...(contactEmail ? { replyTo: contactEmail } : {}),
    subject: t('ack.subject', { type: typeLabel }),
    text: [
      t('ack.greeting', { name: lead.name }),
      '',
      t('ack.stepsTitle'),
      ...steps.map((step, index) => `${index + 1}. ${step}`),
      '',
      ...summary.map((item) => `${item.label} : ${item.value}`),
      '',
      t('signature'),
      '',
      footer,
    ].join('\n'),
    react: AcknowledgementEmail({
      lang: lead.locale,
      dir: getDirection(lead.locale),
      footer,
      preview: t('ack.preview', { days: delay }),
      heading: t('ack.heading'),
      greeting: t('ack.greeting', { name: lead.name }),
      stepsTitle: t('ack.stepsTitle'),
      steps,
      summaryTitle: t('ack.summaryTitle'),
      summary,
      signature: t('signature'),
    }),
    tags: { kind: 'lead-ack', type: lead.type },
    idempotencyKey: `lead-ack-${lead.id}`,
  })

  // Notification à l'équipe, toujours en français (langue de travail du cabinet).
  const recipient = teamRecipient(lead.type, routing, contactEmail)
  if (!recipient) return
  const tt = await getTranslations({ locale: 'fr', namespace: 'emails' })
  type EmailKey = Parameters<typeof tt>[0]
  const detailLabel = (key: string): string => {
    const messageKey = `details.${key}` as EmailKey
    return tt.has(messageKey) ? tt(messageKey) : key
  }
  const teamType = tt(`types.${lead.type}`)
  const fields = [
    { label: tt('fields.type'), value: teamType },
    { label: tt('fields.name'), value: lead.name },
    { label: tt('fields.email'), value: lead.email },
    ...(lead.phone ? [{ label: tt('fields.phone'), value: lead.phone }] : []),
    ...(lead.organization ? [{ label: tt('fields.organization'), value: lead.organization }] : []),
    ...(lead.jobTitle ? [{ label: tt('fields.jobTitle'), value: lead.jobTitle }] : []),
    ...(lead.city ? [{ label: tt('fields.city'), value: lead.city }] : []),
    ...Object.entries(lead.details ?? {}).map(([key, value]) => ({
      label: detailLabel(key),
      value: String(value),
    })),
    { label: tt('fields.locale'), value: lead.locale },
    ...(lead.sourcePage ? [{ label: tt('fields.sourcePage'), value: lead.sourcePage }] : []),
  ]
  const adminUrl = `${siteUrl()}/admin/collections/leads/${lead.id}`
  await sender.send({
    to: recipient,
    replyTo: { email: lead.email, name: lead.name },
    subject: tt('team.subject', { type: teamType, name: lead.name }),
    text: [
      ...fields.map((field) => `${field.label} : ${field.value}`),
      '',
      lead.message ?? '',
      '',
      adminUrl,
    ].join('\n'),
    react: TeamNotificationEmail({
      lang: 'fr',
      dir: 'ltr',
      footer: tt('team.footer'),
      preview: tt('team.preview', { name: lead.name }),
      heading: tt('team.heading', { type: teamType }),
      fields,
      message: lead.message,
      messageLabel: tt('fields.message'),
      adminUrl,
      adminLabel: tt('team.admin'),
    }),
    tags: { kind: 'lead-team', type: lead.type },
    idempotencyKey: `lead-team-${lead.id}`,
  })
}

/* --------------------------------------------------------------- Newsletter */

function toSubscriber(doc: SubscriberDoc): Subscriber {
  return {
    id: doc.id,
    email: doc.email,
    status: doc.status,
    confirmToken: doc.confirmToken ?? null,
    confirmTokenExpiresAt: doc.confirmTokenExpiresAt ?? null,
    firstName: doc.firstName ?? null,
    interests: doc.interests ?? [],
    locale: (doc.locale ?? 'fr') as Locale,
  }
}

async function sendNewsletterConfirmation(subscriber: Subscriber & { confirmToken: string }) {
  const t = await getTranslations({ locale: subscriber.locale, namespace: 'emails' })
  const pathname = getPathname({
    locale: subscriber.locale,
    href: { pathname: '/newsletter/confirmation', query: { token: subscriber.confirmToken } },
  })
  const url = `${siteUrl()}${pathname}`
  const footer = t('footer')
  await getEmailSender().send({
    to: subscriber.email,
    subject: t('newsletter.subject'),
    text: [t('newsletter.intro'), '', url, '', t('newsletter.note'), '', footer].join('\n'),
    react: ActionEmail({
      lang: subscriber.locale,
      dir: getDirection(subscriber.locale),
      footer,
      preview: t('newsletter.preview'),
      heading: t('newsletter.heading'),
      paragraphs: [t('newsletter.intro')],
      actionLabel: t('newsletter.action'),
      actionUrl: url,
      note: t('newsletter.note'),
    }),
    tags: { kind: 'newsletter-confirm' },
  })
}

export function getNewsletterDeps(): NewsletterDeps {
  return {
    gateway: getNewsletterGateway(),
    reportError,
    sendConfirmation: sendNewsletterConfirmation,
    store: {
      async findByEmail(email) {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'newsletter-subscribers',
          where: { email: { equals: email } },
          depth: 0,
          limit: 1,
        })
        return result.docs[0] ? toSubscriber(result.docs[0]) : null
      },
      async findByToken(token) {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'newsletter-subscribers',
          where: { confirmToken: { equals: token } },
          depth: 0,
          limit: 1,
        })
        return result.docs[0] ? toSubscriber(result.docs[0]) : null
      },
      async create(input) {
        const payload = await getPayloadClient()
        const doc = await payload.create({
          collection: 'newsletter-subscribers',
          data: { ...input, status: 'pending' },
          depth: 0,
        })
        return toSubscriber(doc)
      },
      async update(id, patch) {
        const payload = await getPayloadClient()
        const doc = await payload.update({
          collection: 'newsletter-subscribers',
          id,
          data: patch,
          depth: 0,
        })
        return toSubscriber(doc)
      },
      createConsent: payloadStore.createConsent,
    },
  }
}

/* ------------------------------------------------------------------- Guides */

async function findGuide(id: number): Promise<GuideSummary | null> {
  const payload = await getPayloadClient()
  try {
    const guide = await payload.findByID({
      collection: 'guides',
      id,
      depth: 0,
      overrideAccess: false,
    })
    return {
      id: guide.id,
      slug: guide.slug,
      title: guide.title,
      interests: guide.interests ?? [],
    }
  } catch {
    return null
  }
}

export function createGuideToken(guideId: number): string {
  return createSignedToken(
    `guide:${guideId}`,
    GUIDE_LINK_TTL_SECONDS,
    getServerEnv().PAYLOAD_SECRET,
  )
}

export function getGuideDeps(locale: Locale): GuideDeps {
  return {
    ...getLeadDeps(),
    findGuide,
    createToken: createGuideToken,
    async sendLink({ email, name, guide, token }) {
      const t = await getTranslations({ locale, namespace: 'emails' })
      const url = `${siteUrl()}/api/downloads/guide?token=${encodeURIComponent(token)}`
      const footer = t('footer')
      await getEmailSender().send({
        to: name ? { email, name } : email,
        subject: t('guide.subject', { title: guide.title }),
        text: [
          t('guide.intro', { title: guide.title }),
          '',
          url,
          '',
          t('guide.note'),
          '',
          footer,
        ].join('\n'),
        react: ActionEmail({
          lang: locale,
          dir: getDirection(locale),
          footer,
          preview: t('guide.preview', { title: guide.title }),
          heading: t('guide.heading'),
          paragraphs: [t('guide.intro', { title: guide.title })],
          actionLabel: t('guide.action'),
          actionUrl: url,
          note: t('guide.note'),
        }),
        tags: { kind: 'guide-link', guide: guide.slug },
      })
    },
  }
}

/* -------------------------------------------------------------- Assemblage */

export function getLeadDeps(): LeadDeps {
  return {
    store: payloadStore,
    notifier: { notify: notifyLead },
    rateLimiter,
    verifyTurnstile: getTurnstileVerifier(),
    reportError,
    subscribeNewsletter: (input) => requestSubscription(input, getNewsletterDeps()),
  }
}

export { payloadStore as leadStore }
