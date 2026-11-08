import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, Section, SectionHeader } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'

import { Disclaimer } from '../_components/Disclaimer'
import { getRecentResources, ResourceList } from '../_components/ResourceList'
import { PageHeader } from '../_components/PageHeader'
import { getGlossaryTerms } from '../_data/queries'
import { pageMetadata, localeParams, resolveLocale } from '../_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.resources' })
  return pageMetadata({ locale, route: '/ressources', title: t('title'), description: t('lead') })
}

/** Hub Ressources : articles, guides, glossaire, webinaires, cas clients. */
export default async function ResourcesPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const [t, articles, guides, webinars, terms] = await Promise.all([
    getTranslations('site.resources'),
    getRecentResources(locale, ['articles'], 3),
    getRecentResources(locale, ['guides'], 3),
    getRecentResources(locale, ['webinars'], 3),
    getGlossaryTerms(locale),
  ])

  const sections = [
    {
      id: 'articles',
      title: t('sections.articles'),
      items: articles,
      href: '/ressources/articles' as const,
      more: t('allArticles'),
    },
    {
      id: 'guides',
      title: t('sections.guides'),
      items: guides,
      href: '/ressources/guides' as const,
      more: t('allGuides'),
    },
    {
      id: 'webinaires',
      title: t('sections.webinars'),
      items: webinars,
      href: '/ressources/webinaires' as const,
      more: t('allWebinars'),
    },
  ].filter((section) => section.items.length > 0)

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('home'), href: '/' }, { label: t('title') }]}
        title={t('title')}
        lead={t('lead')}
      >
        <nav aria-label={t('jumpTo')}>
          <ul className="flex flex-wrap gap-x-6">
            {[
              ...sections.map((section) => ({ id: section.id, label: section.title })),
              { id: 'glossaire', label: t('sections.glossary') },
            ].map((entry) => (
              <li key={entry.id}>
                <Link href={`#${entry.id}`} variant="standalone">
                  {entry.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/cas-clients" variant="standalone">
                {t('sections.cases')}
              </Link>
            </li>
          </ul>
        </nav>
      </PageHeader>

      {sections.map((section, index) => (
        <Section
          key={section.id}
          tone={index % 2 === 1 ? 'sand' : 'paper'}
          aria-labelledby={section.id}
          className="scroll-mt-24"
        >
          <Container>
            <SectionHeader
              id={section.id}
              title={section.title}
              action={
                <Link href={section.href} variant="standalone">
                  {section.more}
                </Link>
              }
            />
            <ResourceList items={section.items} locale={locale} />
          </Container>
        </Section>
      ))}

      <Section aria-labelledby="glossaire" className="scroll-mt-24">
        <Container className="grid gap-8 lg:grid-cols-12 lg:gap-gutter">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <h2 id="glossaire" className="text-h2">
              {t('sections.glossary')}
            </h2>
            <p className="text-body-lg text-ink-muted">
              {t('glossaryLead', { count: terms.length })}
            </p>
            <Link href="/ressources/glossaire" variant="standalone" className="self-start">
              {t('allTerms')}
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 lg:col-span-6 lg:col-start-7">
            {terms.slice(0, 12).map((term) => (
              <li key={term.id}>
                <Link
                  href={{ pathname: '/ressources/glossaire/[term]', params: { term: term.slug } }}
                  variant="standalone"
                >
                  {term.term}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <div className="pb-section">
        <Disclaimer locale={locale} />
      </div>
    </>
  )
}
