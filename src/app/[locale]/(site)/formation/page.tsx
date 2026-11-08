import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { Container, Section } from '@/components/ui/Layout'

import { RenderBlocks } from '../_components/blocks/RenderBlocks'
import { NewsletterForm } from '../_components/forms/NewsletterForm'
import { getPage } from '../_data/queries'
import { pageMetadata, localeParams, resolveLocale } from '../_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const page = await getPage('formation', locale)
  return page ? pageMetadata({ locale, route: '/formation', title: page.title, seo: page.seo }) : {}
}

/**
 * Hub Formation : page à blocs (les deux offres, cours à la une alimentés par le catalogue,
 * certificats) et inscription aux nouveautés du catalogue, cible de l'appel « S'abonner »
 * du pôle sur l'accueil.
 */
export default async function TrainingHubPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const page = await getPage('formation', locale)
  if (!page) notFound()
  const t = await getTranslations('site.formation')

  const blocks = page.layout ?? []
  const lastCta = blocks.findLastIndex((block) => block.blockType === 'ctaSection')
  const before = lastCta === -1 ? blocks : blocks.slice(0, lastCta)
  const after = lastCta === -1 ? [] : blocks.slice(lastCta)

  return (
    <>
      <RenderBlocks blocks={before} locale={locale} pageSlug="formation" />
      <Section tone="sand" aria-labelledby="newsletter-titre" id="newsletter" data-page-newsletter>
        <Container className="grid gap-8 lg:grid-cols-12 lg:gap-gutter">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <h2 id="newsletter-titre" className="text-h2">
              {t('newsletterTitle')}
            </h2>
            <p className="max-w-measure text-body-lg text-ink-muted">{t('newsletterText')}</p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <NewsletterForm interests={['formation']} sourcePage="/formation" />
          </div>
        </Container>
      </Section>
      <RenderBlocks
        blocks={after}
        locale={locale}
        pageSlug="formation"
        startIndex={before.length}
      />
    </>
  )
}
