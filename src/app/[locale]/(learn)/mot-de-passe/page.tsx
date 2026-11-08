import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/components/ui/Link'
import { getSessionUser } from '@/features/lms/server/services'

import { pageMetadata, resolveLocale } from '../../(site)/_lib/page'
import { AuthShell } from '../_components/auth/AuthShell'
import { ForgotPasswordForm, ResetPasswordForm } from '../_components/auth/PasswordForms'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ jeton?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'learn.auth.forgot' })
  return pageMetadata({ locale, route: '/mot-de-passe', title: t('title'), noIndex: true })
}

/**
 * Mot de passe oublié : demande du lien (sans `jeton`), puis choix d'un nouveau mot de
 * passe (`?jeton=…`, lien valable une heure). Le jeton n'est vérifié qu'à la soumission.
 */
export default async function PasswordPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const query = await searchParams
  const token = (Array.isArray(query.jeton) ? query.jeton[0] : query.jeton)?.slice(0, 512)
  const t = await getTranslations('learn.auth')
  // Avec un lien de réinitialisation, l'état de session n'a pas d'importance.
  const user = token ? null : await getSessionUser()

  return (
    <AuthShell
      locale={locale}
      title={token ? t('reset.title') : t('forgot.title')}
      lead={token ? t('reset.lead') : t('forgot.lead')}
      user={user}
      footer={
        <Link href="/connexion" variant="standalone">
          {t('forgot.back')}
        </Link>
      }
    >
      {token ? <ResetPasswordForm token={token} /> : <ForgotPasswordForm />}
    </AuthShell>
  )
}
