import type { MetadataRoute } from 'next'

import { defaultLocale, type Locale } from '@/lib/i18n/config'
import type { AppPathname } from '@/lib/i18n/routing'

import { indexedLocales } from './config'
import { absoluteUrl, type RouteRef } from './paths'

/** Document du CMS candidat au sitemap. */
export type SitemapDoc = {
  slug: string
  updatedAt?: string | null
  seo?: { noIndex?: boolean | null } | null
}

/** Pages institutionnelles (`pages`) servies par une route dédiée. */
export const pageRoutes: Record<string, AppPathname> = {
  accueil: '/',
  'a-propos': '/a-propos',
  formation: '/formation',
}

/**
 * Index sans document propre, toujours indexables. Exclus volontairement : `/recherche`
 * (résultats), `/newsletter/confirmation` (jeton), `/styleguide` (interne), panier, compte.
 */
export const staticRoutes: readonly AppPathname[] = [
  '/audit-conformite',
  '/conseil-accompagnement',
  '/takaful-finance',
  '/cas-clients',
  '/ressources',
  '/ressources/articles',
  '/ressources/guides',
  '/ressources/glossaire',
  '/ressources/webinaires',
  '/formation/cours',
  '/contact',
  '/devis',
  '/rendez-vous',
]

export type SitemapInput = {
  pages: readonly SitemapDoc[]
  /** Slugs légaux reconnus (`legalSlugs`). */
  legalSlugs: readonly string[]
  services: readonly (SitemapDoc & { route: AppPathname })[]
  caseStudies: readonly SitemapDoc[]
  posts: readonly SitemapDoc[]
  guides: readonly SitemapDoc[]
  glossaryTerms: readonly SitemapDoc[]
  /** Cours et capsules publiés (M3). */
  courses?: readonly SitemapDoc[]
  /** Parcours publiés (M3). */
  paths?: readonly SitemapDoc[]
}

const indexable = (doc: SitemapDoc) => !doc.seo?.noIndex

function entry(
  siteUrl: string,
  route: RouteRef,
  lastModified?: string | null,
): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    indexedLocales.map((locale: Locale) => [locale, absoluteUrl(siteUrl, locale, route)]),
  )
  return {
    url: absoluteUrl(siteUrl, defaultLocale, route),
    ...(lastModified ? { lastModified } : {}),
    // hreflang dans le sitemap : uniquement si plusieurs locales sont ouvertes (ADR 014).
    ...(indexedLocales.length > 1 ? { alternates: { languages } } : {}),
  }
}

/**
 * Entrées du sitemap : une par page indexable dans la locale par défaut, avec ses
 * alternatives de langue ouvertes. Les documents `noIndex` (dont les pages légales non
 * validées, ADR 013) sont exclus.
 */
export function buildSitemap(siteUrl: string, input: SitemapInput): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []
  for (const page of input.pages.filter(indexable)) {
    const route = pageRoutes[page.slug]
    if (route) entries.push(entry(siteUrl, route, page.updatedAt))
    else if (input.legalSlugs.includes(page.slug))
      entries.push(
        entry(siteUrl, { pathname: '/legal/[slug]', params: { slug: page.slug } }, page.updatedAt),
      )
  }
  for (const route of staticRoutes) entries.push(entry(siteUrl, route))
  for (const service of input.services.filter(indexable))
    entries.push(
      entry(
        siteUrl,
        { pathname: service.route, params: { slug: service.slug } },
        service.updatedAt,
      ),
    )
  const collections: Array<[readonly SitemapDoc[], AppPathname, string]> = [
    [input.caseStudies, '/cas-clients/[slug]', 'slug'],
    [input.posts, '/ressources/articles/[slug]', 'slug'],
    [input.guides, '/ressources/guides/[slug]', 'slug'],
    [input.glossaryTerms, '/ressources/glossaire/[term]', 'term'],
    [input.courses ?? [], '/formation/cours/[slug]', 'slug'],
    [input.paths ?? [], '/formation/parcours/[slug]', 'slug'],
  ]
  for (const [docs, pathname, param] of collections)
    for (const doc of docs.filter(indexable))
      entries.push(entry(siteUrl, { pathname, params: { [param]: doc.slug } }, doc.updatedAt))
  return entries
}

/** Chemins exclus des robots, dans toutes les locales. */
export const disallowedRoutes: readonly AppPathname[] = [
  '/recherche',
  '/newsletter/confirmation',
  '/styleguide',
  '/panier',
  '/commande',
  '/espace',
  '/organisation',
]
