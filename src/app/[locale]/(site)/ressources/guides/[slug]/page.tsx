import { FileText } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { Trame } from '@/components/brand/Trame'
import { Container, Section } from '@/components/ui/Layout'
import { routing } from '@/lib/i18n/routing'
import { typographyFr } from '@/lib/typography'

import { GuideDownloadForm } from '../../../_components/forms/GuideDownloadForm'
import { PageHeader } from '../../../_components/PageHeader'
import { RichText } from '../../../_components/RichText'
import { getGuide, getGuides } from '../../../_data/queries'
import { pageMetadata, resolveLocale } from '../../../_lib/page'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateStaticParams() {
  const guides = await getGuides(routing.defaultLocale)
  return guides.map((guide) => ({ locale: routing.defaultLocale, slug: guide.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const guide = await getGuide(slug, locale)
  return guide
    ? pageMetadata({
        locale,
        route: { pathname: '/ressources/guides/[slug]', params: { slug } },
        title: guide.title,
        description: guide.summary,
        seo: guide.seo,
      })
    : {}
}

/**
 * Guide téléchargeable contre e-mail (SPEC §4.4) : présentation, puis formulaire avec
 * consentement newsletter facultatif (non coché). Le PDF reste privé (ADR 008).
 */
export default async function GuidePage({ params }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const guide = await getGuide(slug, locale)
  if (!guide) notFound()
  const [t, tr] = await Promise.all([
    getTranslations('site.guides'),
    getTranslations('site.resources'),
  ])
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tr('home'), href: '/' },
          { label: tr('title'), href: '/ressources' },
          { label: t('title'), href: '/ressources/guides' },
          { label: fr(guide.title) },
        ]}
        title={fr(guide.title)}
        lead={guide.summary ? fr(guide.summary) : undefined}
      >
        {guide.pageCount ? (
          <p className="flex items-center gap-2 text-small text-ink-muted">
            <FileText aria-hidden="true" className="size-5 text-green-700" />
            {t('format', { count: guide.pageCount })}
          </p>
        ) : null}
      </PageHeader>
      <Section>
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-gutter">
          <div className="flex flex-col gap-8 lg:col-span-6">
            {/* Couverture en attente des visuels : aplat sable et Trame (DESIGN §5). */}
            <div
              aria-hidden="true"
              className="relative aspect-[4/3] max-w-md overflow-hidden rounded-media bg-sand-100"
            >
              <Trame density={4} rows={3} opacity={0.12} className="absolute inset-0 size-full" />
            </div>
            <RichText data={guide.description} locale={locale} />
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <div className="flex flex-col gap-6 rounded-panel border border-line p-6 md:p-8">
              <h2 className="text-h3">{t('formTitle')}</h2>
              <GuideDownloadForm
                guideId={guide.id}
                askName={guide.capture?.askName ?? true}
                askOrganization={guide.capture?.askOrganization ?? false}
                askPhone={guide.capture?.askPhone ?? false}
                sourcePage={`/ressources/guides/${guide.slug}`}
              />
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
