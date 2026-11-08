import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ServiceHub } from '../_components/ServicePages'
import { pageMetadata, localeParams, resolveLocale } from '../_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.services.audit' })
  return pageMetadata({
    locale,
    route: '/audit-conformite',
    title: t('title'),
    description: t('metaDescription'),
  })
}

/** Hub du pôle : gabarit de service, offres = services publiés du pôle. */
export default async function AuditHubPage({ params }: Props) {
  const locale = await resolveLocale(params)
  return <ServiceHub pillar="audit" locale={locale} />
}
