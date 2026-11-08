import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/components/ui/Link'
import { safeNextPath } from '@/features/auth/schemas'
import { getSessionUser } from '@/features/lms/server/services'

import { pageMetadata, resolveLocale } from '../../(site)/_lib/page'
import { AuthShell } from '../_components/auth/AuthShell'
import { SignInForm } from '../_components/auth/SignInForm'
import { VerifyEmailPanel } from '../_components/auth/VerifyEmailPanel'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string | string[]; verification?: string | string[] }>
}

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'learn.auth.signIn' })
  return pageMetadata({ locale, route: '/connexion', title: t('title'), noIndex: true })
}

/** Connexion, et confirmation de l'adresse (`?verification=…`, lien reçu à l'inscription). */
export default async function SignInPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const query = await searchParams
  const [t, user] = await Promise.all([getTranslations('learn.auth'), getSessionUser()])
  // Chemin de retour revalidé côté serveur à la soumission ; ici seulement transmis.
  const next = safeNextPath(single(query.next), '') || undefined
  const verification = single(query.verification)?.slice(0, 512)
  const form = <SignInForm next={next} />

  return (
    <AuthShell
      locale={locale}
      title={verification ? t('verify.title') : t('signIn.title')}
      lead={verification ? undefined : t('signIn.lead')}
      user={user}
      footer={
        <>
          <Link href="/mot-de-passe" variant="standalone">
            {t('signIn.forgot')}
          </Link>
          <p className="text-body text-ink-muted">
            {t('signIn.noAccount')}{' '}
            <Link href={next ? { pathname: '/inscription', query: { next } } : '/inscription'}>
              {t('signIn.createAccount')}
            </Link>
          </p>
        </>
      }
    >
      {verification ? <VerifyEmailPanel token={verification} signIn={form} /> : form}
    </AuthShell>
  )
}
