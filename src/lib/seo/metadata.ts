import type { Metadata } from 'next'

import { defaultLocale, type Locale } from '@/lib/i18n/config'

import {
  DESCRIPTION_MAX,
  indexedLocales,
  isIndexedLocale,
  OG_SIZE,
  ogLocale,
  TITLE_MAX,
  TITLE_SEPARATOR,
} from './config'
import { absoluteUrl, localizedPath, type RouteRef } from './paths'
import { clampText } from './text'

/** Champ `seo` commun aux collections (`src/payload/fields/seo.ts`). */
export type SeoFields = {
  title?: string | null
  description?: string | null
  noIndex?: boolean | null
}

export type PageMetadataInput = {
  locale: Locale
  /** Route de la page : sert au canonical, au hreflang et à `og:url`. */
  route: RouteRef
  title: string
  description?: string | null
  seo?: SeoFields | null
  noIndex?: boolean
  /**
   * La route a son propre fichier `opengraph-image` : on n'impose pas l'image par défaut
   * (Next applique l'image du fichier quand `openGraph.images` est absent).
   */
  ownImage?: boolean
  article?: {
    publishedTime?: string | null
    modifiedTime?: string | null
    authors?: readonly string[]
    section?: string | null
  }
}

export type SiteContext = { siteUrl: string; siteName: string }

/**
 * Titre de la page. Un titre SEO saisi dans le CMS est utilisé tel quel (il contient déjà le
 * nom du cabinet). Sinon « Titre · Amana Conseil » (gabarit du layout) s'il tient en
 * 60 caractères, ou le titre seul, coupé à 60.
 */
export function resolveTitle(
  title: string,
  seoTitle: string | null | undefined,
  siteName: string,
): { value: Metadata['title']; full: string } {
  const custom = seoTitle?.trim()
  if (custom) {
    const full = clampText(custom, TITLE_MAX)
    return { value: { absolute: full }, full }
  }
  const clean = title.replace(/\s+/g, ' ').trim()
  const composed = `${clean}${TITLE_SEPARATOR}${siteName}`
  if (composed.length <= TITLE_MAX) return { value: clean, full: composed }
  const full = clampText(clean, TITLE_MAX)
  return { value: { absolute: full }, full }
}

export function resolveDescription(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  const found = candidates.map((value) => value?.trim()).find(Boolean)
  return found ? clampText(found, DESCRIPTION_MAX) : undefined
}

/** URL de l'image Open Graph par défaut (accueil) d'une locale. */
export function defaultOgImageUrl(siteUrl: string, locale: Locale): string {
  return `${siteUrl}${localizedPath(locale, '/')}/opengraph-image`
}

/**
 * Métadonnées complètes d'une page publique : titre (≤ 60), description (≤ 155),
 * canonical, hreflang (locales indexées + `x-default`), robots, Open Graph, Twitter.
 *
 * Une page `noindex` (demandée, ou locale pas encore ouverte : ADR 014) garde son canonical
 * mais n'annonce aucune alternative de langue.
 */
export function buildPageMetadata(input: PageMetadataInput, site: SiteContext): Metadata {
  const { locale, route } = input
  const title = resolveTitle(input.title, input.seo?.title, site.siteName)
  const description = resolveDescription(input.seo?.description, input.description)
  const canonical = absoluteUrl(site.siteUrl, locale, route)
  const noIndex = Boolean(input.noIndex || input.seo?.noIndex) || !isIndexedLocale(locale)

  const languages: Record<string, string> = {}
  if (!noIndex) {
    for (const candidate of indexedLocales)
      languages[candidate] = absoluteUrl(site.siteUrl, candidate, route)
    languages['x-default'] = absoluteUrl(site.siteUrl, defaultLocale, route)
  }

  const images = input.ownImage
    ? {}
    : {
        images: [
          {
            url: defaultOgImageUrl(site.siteUrl, locale),
            ...OG_SIZE,
            alt: site.siteName,
          },
        ],
      }

  const openGraph: Metadata['openGraph'] = input.article
    ? {
        type: 'article',
        publishedTime: input.article.publishedTime ?? undefined,
        modifiedTime: input.article.modifiedTime ?? undefined,
        authors: input.article.authors ? [...input.article.authors] : undefined,
        section: input.article.section ?? undefined,
        siteName: site.siteName,
        locale: ogLocale[locale],
        url: canonical,
        title: title.full,
        description,
        ...images,
      }
    : {
        type: 'website',
        siteName: site.siteName,
        locale: ogLocale[locale],
        url: canonical,
        title: title.full,
        description,
        ...images,
      }

  return {
    title: title.value,
    description,
    alternates: {
      canonical,
      ...(Object.keys(languages).length ? { languages } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph,
    twitter: { card: 'summary_large_image', title: title.full, description },
  }
}
