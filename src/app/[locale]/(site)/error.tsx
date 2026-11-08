'use client'

import { RotateCcw } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { Button } from '@/components/ui/Button'
import { getPathname } from '@/lib/i18n/navigation'
import { isLocale } from '@/lib/i18n/config'

import { RecoveryPanel } from './_components/RecoveryPanel'

/**
 * Erreur inattendue (500) : on le dit simplement, on propose de réessayer, de chercher
 * ou de rejoindre un pôle. Le code de l'erreur (digest) aide le support sans rien révéler.
 */
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations('recovery')
  const requested = useLocale()
  const locale = isLocale(requested) ? requested : 'fr'
  const digest =
    error instanceof Error && 'digest' in error && typeof error.digest === 'string'
      ? error.digest
      : null

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <RecoveryPanel
      searchAction={getPathname({ locale, href: '/recherche' })}
      extra={
        <div className="flex flex-col gap-3">
          <div>
            <Button variant="gold" onClick={() => retry()} icon={<RotateCcw aria-hidden="true" />}>
              {t('retry')}
            </Button>
          </div>
          {digest ? <p className="text-small text-green-50">{t('reference', { digest })}</p> : null}
        </div>
      }
      labels={{
        title: t('errorTitle'),
        text: t('errorText'),
        searchLabel: t('searchLabel'),
        searchSubmit: t('searchSubmit'),
        pillarsTitle: t('pillarsTitle'),
        pillars: [
          { label: t('pillars.formation'), href: '/formation' },
          { label: t('pillars.audit'), href: '/audit-conformite' },
          { label: t('pillars.conseil'), href: '/conseil-accompagnement' },
          { label: t('pillars.takaful'), href: '/takaful-finance' },
          { label: t('pillars.ressources'), href: '/ressources' },
          { label: t('pillars.contact'), href: '/contact' },
        ],
      }}
    />
  )
}
