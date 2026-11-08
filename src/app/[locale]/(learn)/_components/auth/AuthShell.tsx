import { Check } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Layout'
import type { Locale } from '@/lib/i18n/config'
import type { User } from '@/payload-types'

import { signOutAction } from '../../_actions/auth'
import { LearnMessages } from '../LearnMessages'

/**
 * Gabarit des pages d'authentification : formulaire à gauche (aligné à gauche, DESIGN §4),
 * ce que permet le compte à droite. Un visiteur déjà connecté voit son état et peut se
 * déconnecter, plutôt qu'un formulaire inutile.
 */
export async function AuthShell({
  locale,
  title,
  lead,
  user,
  children,
  footer,
}: {
  locale: Locale
  title: string
  lead?: string
  /** Utilisateur déjà connecté : le formulaire est remplacé par son état. */
  user: Pick<User, 'email' | 'firstName'> | null
  children: ReactNode
  /** Liens complémentaires sous le formulaire (« Créer un compte »…). */
  footer?: ReactNode
}) {
  const t = await getTranslations({ locale, namespace: 'learn.auth' })
  const tl = await getTranslations({ locale, namespace: 'learn' })
  return (
    <LearnMessages namespaces={['auth']}>
      <Container className="pt-6">
        <Breadcrumb items={[{ label: tl('breadcrumb.home'), href: '/' }, { label: title }]} />
      </Container>
      <Container className="grid gap-12 pt-8 pb-section lg:grid-cols-12 lg:gap-gutter">
        <div className="flex max-w-lg flex-col gap-8 lg:col-span-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-h1">{title}</h1>
            {lead ? <p className="text-body-lg text-ink-muted">{lead}</p> : null}
          </div>
          {user ? (
            <div className="flex flex-col gap-6 rounded-panel border border-line p-6">
              <p className="text-body text-ink">
                {t('signedIn.text', { name: user.firstName?.trim() || user.email })}
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/formation/cours">{t('signedIn.catalog')}</ButtonLink>
                <form action={signOutAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <Button type="submit" variant="secondary">
                    {t('signedIn.signOut')}
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <>
              {children}
              {footer ? (
                <div className="flex flex-col gap-2 border-t border-line pt-6">{footer}</div>
              ) : null}
            </>
          )}
        </div>
        <aside
          aria-labelledby="compte-avantages"
          className="flex flex-col gap-5 self-start rounded-panel bg-sand-100 p-8 lg:col-span-5 lg:col-start-8"
        >
          <h2 id="compte-avantages" className="text-h3">
            {t('benefits.title')}
          </h2>
          <ul className="flex flex-col gap-3 text-body text-ink">
            {(['progress', 'certificates', 'mobile'] as const).map((key) => (
              <li key={key} className="flex items-start gap-3">
                <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-green-700" />
                {t(`benefits.${key}`)}
              </li>
            ))}
          </ul>
          <p className="text-small text-ink-muted">{t('benefits.privacy')}</p>
        </aside>
      </Container>
    </LearnMessages>
  )
}
