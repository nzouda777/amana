import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { routing } from '@/lib/i18n/routing'
import { renderOgImage } from '@/lib/seo/og/render'
import type { Category } from '@/payload-types'

import { populated } from '../_components/blocks/types'
import { getPost, getService } from '../_data/queries'
import type { ServicePillar } from '../_components/ServicePages'

/**
 * Images Open Graph des gabarits clés (accueil, service, article). Textes d'interface de la
 * locale ; l'arabe, pas encore traduit, reprend les libellés français.
 */
function ogLocale(value: string): { locale: Locale; textLocale: Locale } {
  if (!hasLocale(routing.locales, value)) notFound()
  return { locale: value, textLocale: value === 'ar' ? defaultLocale : value }
}

export async function homeOgImage(params: { locale: string }) {
  const { locale, textLocale } = ogLocale(params.locale)
  const t = await getTranslations({ locale: textLocale, namespace: 'metadata' })
  return renderOgImage({ title: t('ogHomeTitle'), tagline: t('ogTagline'), locale })
}

export async function serviceOgImage(
  pillar: ServicePillar,
  params: { locale: string; slug: string },
) {
  const { locale, textLocale } = ogLocale(params.locale)
  const [t, tp, service] = await Promise.all([
    getTranslations({ locale: textLocale, namespace: 'metadata' }),
    getTranslations({ locale: textLocale, namespace: `site.services.${pillar}` }),
    getService(pillar, params.slug, locale),
  ])
  return renderOgImage({
    title: service?.title ?? tp('title'),
    eyebrow: tp('title'),
    tagline: t('ogTagline'),
    locale,
  })
}

export async function articleOgImage(params: { locale: string; slug: string }) {
  const { locale, textLocale } = ogLocale(params.locale)
  const [t, ta, post] = await Promise.all([
    getTranslations({ locale: textLocale, namespace: 'metadata' }),
    getTranslations({ locale: textLocale, namespace: 'site.articles' }),
    getPost(params.slug, locale),
  ])
  const category = (post?.categories ?? []).find(populated<Category>)
  return renderOgImage({
    title: post?.title ?? ta('title'),
    eyebrow: category?.title ?? ta('title'),
    tagline: t('ogTagline'),
    locale,
  })
}
