import type { Href, InternalHref } from '@/components/ui/Link'
import { createCmsPathMatcher, isExternalCmsHref } from '@/features/site/cms-href'
import { releasedPathnames } from '@/features/site/routes'
import { type AppPathname, pathnames } from '@/lib/i18n/routing'
import type { Pillar } from '@/payload/shared'

// Seules les routes livrées sont résolues (ADR 016) : un lien vers le catalogue ou le
// panier saisi avant M3/M4 reste masqué, puis apparaît dès que la route est livrée.
const matchInternal = createCmsPathMatcher(
  releasedPathnames(Object.keys(pathnames) as AppPathname[]),
)

/**
 * Lien saisi dans le CMS (route française ou URL externe) → destination typée next-intl.
 * `null` si le lien est vide, mal encodé, ou vise une route interne inconnue ou pas encore
 * livrée : l'appelant ne rend alors pas le lien.
 */
export function cmsHref(href: string | null | undefined): Href | null {
  if (!href) return null
  const value = href.trim()
  if (isExternalCmsHref(value)) return value
  const match = matchInternal(value)
  if (!match) return null
  if (!match.params && !match.query) return match.pathname as InternalHref
  // Objet { pathname, params, query } : forme attendue par next-intl pour les routes typées.
  return match as unknown as InternalHref
}

/** Hub de chaque pôle. */
export const pillarHubPath = {
  formation: '/formation',
  audit: '/audit-conformite',
  conseil: '/conseil-accompagnement',
  takaful: '/takaful-finance',
} as const satisfies Record<Pillar, AppPathname>

/** Fiche d'un service selon son pôle (la formation n'a pas de fiche de service en M2). */
export function serviceHref(pillar: Pillar, slug: string): Href {
  switch (pillar) {
    case 'audit':
      return { pathname: '/audit-conformite/[slug]', params: { slug } }
    case 'conseil':
      return { pathname: '/conseil-accompagnement/[slug]', params: { slug } }
    case 'takaful':
      return { pathname: '/takaful-finance/[slug]', params: { slug } }
    case 'formation':
      return '/formation'
  }
}

/** Formulaire de devis pré-rempli avec un type de demande. */
export function quoteHref(type?: string | null): Href {
  return type ? { pathname: '/devis', query: { type } } : '/devis'
}
