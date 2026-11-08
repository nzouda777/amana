import { getServerEnv } from '@/env'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

/** Nom de marque (non traduit dans les données structurées). */
export const SITE_NAME = 'Amana Conseil'

/** Séparateur du gabarit de titre (`[locale]/layout.tsx` : « %s · Amana Conseil »). */
export const TITLE_SEPARATOR = ' · '

/** Longueurs maximales affichées par les moteurs de recherche. */
export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 155

/**
 * Locales ouvertes à l'indexation (ADR 014). Tant que les traductions ne sont pas validées
 * (TODO(client) : question 14 du PLAN), seules les pages françaises sont indexées, listées
 * dans le sitemap et annoncées en `hreflang` ; `en` et `ar` restent consultables mais
 * `noindex`. Ouvrir une langue = l'ajouter ici.
 */
export const indexedLocales: readonly Locale[] = [defaultLocale]

export function isIndexedLocale(locale: Locale): boolean {
  return indexedLocales.includes(locale)
}

/** Locale Open Graph (`og:locale`). */
export const ogLocale: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US', ar: 'ar_AR' }

/** Dimensions des images Open Graph générées (`next/og`). */
export const OG_SIZE = { width: 1200, height: 630 } as const

/** URL publique du site, sans barre oblique finale. */
export function getSiteUrl(): string {
  return getServerEnv().NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
}
