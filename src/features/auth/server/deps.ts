import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import { APIError, AuthenticationError, LockedAuth, type Payload, UnverifiedEmail } from 'payload'

import { ActionEmail } from '@/features/leads/emails/templates'
import { MemoryRateLimiter } from '@/features/leads/rate-limit'
import { getEmailSender, getLeadDeps } from '@/features/leads/server/deps'
import { getServerEnv } from '@/env'
import { getDirection, isLocale, type Locale } from '@/lib/i18n/config'
import { getPathname } from '@/lib/i18n/navigation'
import { getPayloadClient } from '@/lib/payload'
import type { User } from '@/payload-types'

import type { AccountGateway, AccountSummary, AuthDeps, AuthMailer, LoginOutcome } from '../service'

/**
 * Câblage serveur de l'authentification sur Payload auth (collection `users`) : session
 * en cookie `HttpOnly; SameSite=Lax` (`Secure` en production, `src/payload/collections/
 * Users.ts`), verrouillage après 5 échecs (15 min, Payload), e-mails transactionnels via
 * l'`EmailSender` du site. Importé uniquement par les Server Actions.
 */

/** 10 tentatives par adresse IP et par action, sur 10 minutes. */
const ipLimiter = new MemoryRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 })
/** 5 tentatives par adresse e-mail visée et par action, sur 15 minutes. */
const emailLimiter = new MemoryRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 })

function reportError(error: unknown, context: string): void {
  console.error(`[auth] ${context}`, error)
}

const siteUrl = () => getServerEnv().NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')

/* ------------------------------------------------------------------ Session */

/** Pose le cookie de session Payload (durée = `tokenExpiration` de la collection). */
async function setSessionCookie(payload: Payload, token: string): Promise<void> {
  const auth = payload.collections.users.config.auth
  const store = await cookies()
  store.set(`${payload.config.cookiePrefix}-token`, token, {
    httpOnly: true,
    secure: Boolean(auth.cookies.secure),
    sameSite: 'lax',
    path: '/',
    ...(auth.cookies.domain ? { domain: auth.cookies.domain } : {}),
    expires: new Date(Date.now() + auth.tokenExpiration * 1000),
  })
}

/* ----------------------------------------------------------------- Comptes */

function toAccount(doc: User): AccountSummary {
  return {
    id: doc.id,
    email: doc.email,
    firstName: doc.firstName?.trim() || null,
    verified: doc._verified === true,
    verificationToken: doc._verificationToken ?? null,
    preferredLocale: isLocale(doc.preferredLocale) ? doc.preferredLocale : null,
  }
}

const accounts: AccountGateway = {
  async findByEmail(email) {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      depth: 0,
      limit: 1,
      showHiddenFields: true,
      overrideAccess: true,
    })
    const doc = result.docs[0]
    return doc ? toAccount(doc) : null
  },

  async create({ email, password, firstName, lastName, locale }) {
    const payload = await getPayloadClient()
    const doc = await payload.create({
      collection: 'users',
      // Rôle imposé côté serveur : une inscription publique ne crée qu'un apprenant.
      data: { email, password, firstName, lastName, roles: ['learner'], preferredLocale: locale },
      depth: 0,
      disableVerificationEmail: true,
      showHiddenFields: true,
      overrideAccess: true,
    })
    return toAccount(doc)
  },

  async login(email, password): Promise<LoginOutcome> {
    const payload = await getPayloadClient()
    try {
      const result = await payload.login({ collection: 'users', data: { email, password } })
      if (!result.token) return 'invalid'
      await setSessionCookie(payload, result.token)
      return 'ok'
    } catch (error) {
      if (error instanceof UnverifiedEmail) return 'unverified'
      if (error instanceof LockedAuth) return 'locked'
      if (error instanceof AuthenticationError) return 'invalid'
      throw error
    }
  },

  async verifyEmail(token) {
    const payload = await getPayloadClient()
    try {
      return await payload.verifyEmail({ collection: 'users', token })
    } catch (error) {
      if (error instanceof APIError) return false
      throw error
    }
  },

  async createResetToken(email) {
    const payload = await getPayloadClient()
    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email },
      disableEmail: true,
    })
    return token || null
  },

  async resetPassword(token, password) {
    const payload = await getPayloadClient()
    let result: Awaited<ReturnType<typeof payload.resetPassword>>
    try {
      result = await payload.resetPassword({
        collection: 'users',
        data: { token, password },
        overrideAccess: true,
      })
    } catch (error) {
      if (error instanceof APIError) return false
      throw error
    }
    const userId = result.user.id
    if (typeof userId !== 'number' && typeof userId !== 'string') return false
    // Le lien reçu par e-mail prouve la possession de l'adresse : compte confirmé.
    await payload.update({
      collection: 'users',
      id: userId,
      data: { _verified: true },
      depth: 0,
      overrideAccess: true,
    })
    if (result.token) await setSessionCookie(payload, result.token)
    return true
  },
}

/* ------------------------------------------------------------------ E-mails */

async function sendAction(
  account: AccountSummary,
  locale: Locale,
  kind: 'verify' | 'exists' | 'reset',
  url: string,
): Promise<void> {
  const t = await getTranslations({ locale, namespace: 'emails' })
  const greeting = account.firstName
    ? t('auth.greeting', { name: account.firstName })
    : t('auth.greetingAnonymous')
  const intro = t(`auth.${kind}.intro`)
  const footer = t('footer')
  await getEmailSender().send({
    to: account.firstName ? { email: account.email, name: account.firstName } : account.email,
    subject: t(`auth.${kind}.subject`),
    text: [greeting, '', intro, '', url, '', t(`auth.${kind}.note`), '', footer].join('\n'),
    react: ActionEmail({
      lang: locale,
      dir: getDirection(locale),
      footer,
      preview: t(`auth.${kind}.preview`),
      heading: t(`auth.${kind}.heading`),
      paragraphs: [greeting, intro],
      actionLabel: t(`auth.${kind}.action`),
      actionUrl: url,
      note: t(`auth.${kind}.note`),
    }),
    tags: { kind: `auth-${kind}` },
  })
}

const mailer: AuthMailer = {
  async sendVerification(account, token, locale) {
    const path = getPathname({
      locale,
      href: { pathname: '/connexion', query: { verification: token } },
    })
    await sendAction(account, locale, 'verify', `${siteUrl()}${path}`)
  },
  async sendAlreadyRegistered(account, locale) {
    const path = getPathname({ locale, href: '/mot-de-passe' })
    await sendAction(account, locale, 'exists', `${siteUrl()}${path}`)
  },
  async sendPasswordReset(account, token, locale) {
    const path = getPathname({
      locale,
      href: { pathname: '/mot-de-passe', query: { jeton: token } },
    })
    await sendAction(account, locale, 'reset', `${siteUrl()}${path}`)
  },
}

/* -------------------------------------------------------------- Assemblage */

export function getAuthDeps(): AuthDeps {
  return {
    accounts,
    mailer,
    rateLimiter: ipLimiter,
    emailRateLimiter: emailLimiter,
    verifyTurnstile: getLeadDeps().verifyTurnstile,
    reportError,
  }
}
