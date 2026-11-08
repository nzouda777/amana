import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { routing } from '@/lib/i18n/routing'
import { getSiteUrl } from '@/lib/seo/config'
import { buildPageMetadata, type PageMetadataInput } from '@/lib/seo/metadata'

import type { Locale } from '../_data/cache'

/** Paramètre de locale validé + locale de requête (rendu statique next-intl). */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return locale
}

export function localeParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * Métadonnées complètes d'une page du site (`src/lib/seo/metadata.ts`) : titre ≤ 60 et
 * description ≤ 155 caractères, canonical, hreflang des locales ouvertes (ADR 014), robots,
 * Open Graph et Twitter. Un titre SEO saisi dans le CMS est utilisé tel quel.
 */
export async function pageMetadata(input: PageMetadataInput): Promise<Metadata> {
  const t = await getTranslations({ locale: input.locale, namespace: 'metadata' })
  return buildPageMetadata(input, { siteUrl: getSiteUrl(), siteName: t('siteName') })
}
