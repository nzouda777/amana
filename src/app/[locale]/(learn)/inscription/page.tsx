import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/components/ui/Link'
import { safeNextPath } from '@/features/auth/schemas'
import { getSessionUser } from '@/features/lms/server/services'

import { pageMetadata, resolveLocale } from '../../(site)/_lib/page'
import { AuthShell } from '../_components/auth/AuthShell'
import { SignUpForm } from '../_components/auth/SignUpForm'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'learn.auth.signUp' })
  return pageMetadata({ locale, route: '/inscription', title: t('title'), noIndex: true })
}

/** Création d'un compte apprenant (adresse confirmée par e-mail avant la première connexion). */
export default async function SignUpPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const query = await searchParams
  const [t, user] = await Promise.all([getTranslations('learn.auth'), getSessionUser()])
  const raw = Array.isArray(query.next) ? query.next[0] : query.next
  const next = safeNextPath(raw, '') || undefined

  return (
    <AuthShell
      locale={locale}
      title={t('signUp.title')}
      lead={t('signUp.lead')}
      user={user}
      footer={
        <p className="text-body text-ink-muted">
          {t('signUp.hasAccount')}{' '}
          <Link href={next ? { pathname: '/connexion', query: { next } } : '/connexion'}>
            {t('signUp.signIn')}
          </Link>
        </p>
      }
    >
      <SignUpForm next={next} />
    </AuthShell>
  )
}
