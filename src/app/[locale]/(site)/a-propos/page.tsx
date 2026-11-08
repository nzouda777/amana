import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RenderBlocks } from '../_components/blocks/RenderBlocks'
import { getPage } from '../_data/queries'
import { pageMetadata, localeParams, resolveLocale } from '../_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const page = await getPage('a-propos', locale)
  return page ? pageMetadata({ locale, route: '/a-propos', title: page.title, seo: page.seo }) : {}
}

/** À propos : histoire, valeurs, équipe, comité de conformité charia (blocs `team`). */
export default async function AboutPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const page = await getPage('a-propos', locale)
  if (!page) notFound()
  return <RenderBlocks blocks={page.layout} locale={locale} pageSlug="a-propos" />
}
