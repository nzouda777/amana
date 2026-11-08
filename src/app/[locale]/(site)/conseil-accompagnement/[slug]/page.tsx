import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ServiceDetail } from '../../_components/ServicePages'
import { getService, getServiceSlugs } from '../../_data/queries'
import { pageMetadata, resolveLocale } from '../../_lib/page'
import { routing } from '@/lib/i18n/routing'

type Props = { params: Promise<{ locale: string; slug: string }> }

/** Pré-rendu de chaque service publié ; les nouveaux sont rendus à la demande puis mis en cache. */
export async function generateStaticParams() {
  const slugs = await getServiceSlugs('conseil')
  // Locale par défaut seulement : en et ar (pas encore ouvertes) sont rendues à la demande.
  return slugs.map((slug) => ({ locale: routing.defaultLocale, slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const service = await getService('conseil', slug, locale)
  return service
    ? pageMetadata({
        locale,
        route: { pathname: '/conseil-accompagnement/[slug]', params: { slug } },
        ownImage: true,
        title: service.title,
        description: service.summary,
        seo: service.seo,
      })
    : {}
}

/** Fiche de service : une entrée de la collection `services`, gabarit commun. */
export default async function ServicePage({ params }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const service = await getService('conseil', slug, locale)
  if (!service) notFound()
  return <ServiceDetail pillar="conseil" service={service} locale={locale} />
}
