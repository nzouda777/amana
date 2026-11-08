import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { Container, Section } from '@/components/ui/Layout'
import { EmptyState } from '@/components/ui/EmptyState'
import { Link } from '@/components/ui/Link'
import { isLegalSlug, legalSlugs, mergeRichText } from '@/features/site/legal'
import { withHeadingAnchors } from '@/features/site/rich-text'
import { routing } from '@/lib/i18n/routing'

import { PageHeader } from '../../_components/PageHeader'
import { RichText } from '../../_components/RichText'
import { TableOfContents } from '../../_components/TableOfContents'
import { getPage, getSiteGlobals } from '../../_data/queries'
import { pageMetadata, resolveLocale } from '../../_lib/page'

type Props = { params: Promise<{ locale: string; slug: string }> }

export function generateStaticParams() {
  return legalSlugs.map((slug) => ({ locale: routing.defaultLocale, slug }))
}

async function loadDocument(slug: string, locale: Awaited<ReturnType<typeof resolveLocale>>) {
  const page = await getPage(slug, locale)
  const content = mergeRichText(
    (page?.layout ?? []).flatMap((block) =>
      block.blockType === 'richText' ? [block.content] : [],
    ),
  )
  if (page && content)
    return { title: page.title, seo: page.seo, content, updatedAt: page.updatedAt }
  // L'avertissement existe déjà comme global (pied de page, Takaful, Ressources).
  if (slug === 'avertissement') {
    const { disclaimer } = await getSiteGlobals(locale)
    if (disclaimer.full)
      return {
        title: null,
        seo: null,
        content: disclaimer.full,
        updatedAt: disclaimer.updatedAt ?? null,
      }
  }
  return { title: page?.title ?? null, seo: page?.seo ?? null, content: null, updatedAt: null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  if (!isLegalSlug(slug)) return {}
  const t = await getTranslations({ locale, namespace: 'site.legal' })
  const document = await loadDocument(slug, locale)
  return pageMetadata({
    locale,
    route: { pathname: '/legal/[slug]', params: { slug } },
    title: document.title ?? t(`titles.${slug}`),
    seo: document.seo,
    noIndex: !document.content,
  })
}

/**
 * Gabarit des pages légales : Prose, sommaire automatique, date de mise à jour.
 * Contenu : page `pages` de même slug (rédigée par l'agent contenu, à valider par un juriste).
 */
export default async function LegalPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  if (!isLegalSlug(slug)) notFound()
  const [t, document] = await Promise.all([
    getTranslations('site.legal'),
    loadDocument(slug, locale),
  ])
  const title = document.title ?? t(`titles.${slug}`)
  const { state, toc } = withHeadingAnchors(document.content)
  const updated = document.updatedAt
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale, {
        dateStyle: 'long',
        timeZone: 'Africa/Douala',
      }).format(new Date(document.updatedAt))
    : null

  return (
    <>
      <PageHeader breadcrumb={[{ label: t('home'), href: '/' }, { label: title }]} title={title}>
        {updated && document.updatedAt ? (
          <p className="text-small text-ink-muted">
            {t('updated')} <time dateTime={document.updatedAt}>{updated}</time>
          </p>
        ) : null}
      </PageHeader>
      <Section>
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-gutter">
          {state ? (
            <>
              {toc.length > 1 ? (
                <div className="lg:col-span-3">
                  <TableOfContents entries={toc} title={t('toc')} />
                </div>
              ) : null}
              <div className="min-w-0 lg:col-span-8 lg:col-start-5">
                <RichText data={state} locale={locale} />
              </div>
            </>
          ) : (
            <div className="lg:col-span-8">
              <EmptyState
                title={t('pendingTitle')}
                description={t('pendingText')}
                action={
                  <Link href="/contact" variant="standalone">
                    {t('contact')}
                  </Link>
                }
              />
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
