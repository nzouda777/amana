import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RenderBlocks } from './_components/blocks/RenderBlocks'
import { getPage } from './_data/queries'
import { pageMetadata, localeParams, resolveLocale } from './_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const page = await getPage('accueil', locale)
  return page ? pageMetadata({ locale, route: '/', title: page.title, seo: page.seo }) : {}
}

/** Accueil (DESIGN §9) : page `accueil` composée de blocs dans l'admin. */
export default async function HomePage({ params }: Props) {
  const locale = await resolveLocale(params)
  const page = await getPage('accueil', locale)
  if (!page) notFound()
  return <RenderBlocks blocks={page.layout} locale={locale} pageSlug="accueil" />
}
