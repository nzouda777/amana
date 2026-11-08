import { getLocale, getTranslations } from 'next-intl/server'

import { getPathname } from '@/lib/i18n/navigation'
import { isLocale } from '@/lib/i18n/config'

import { RecoveryPanel } from './_components/RecoveryPanel'

/** 404 utile : recherche et pôles, avec la Trame (DESIGN §8, états vides). */
export default async function NotFound() {
  const requested = await getLocale()
  const locale = isLocale(requested) ? requested : 'fr'
  const t = await getTranslations({ locale, namespace: 'recovery' })
  return (
    <RecoveryPanel
      searchAction={getPathname({ locale, href: '/recherche' })}
      labels={{
        title: t('notFoundTitle'),
        text: t('notFoundText'),
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
