import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, Section } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { groupByLetter } from '@/features/site/glossary'
import { typographyFr } from '@/lib/typography'

import { PageHeader } from '../../_components/PageHeader'
import { getGlossaryTerms } from '../../_data/queries'
import { pageMetadata, localeParams, resolveLocale } from '../../_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.glossary' })
  return pageMetadata({
    locale,
    route: '/ressources/glossaire',
    title: t('title'),
    description: t('lead'),
  })
}

/** Glossaire : index alphabétique, terme translittéré, graphie arabe, définition courte. */
export default async function GlossaryPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const [t, tr, terms] = await Promise.all([
    getTranslations('site.glossary'),
    getTranslations('site.resources'),
    getGlossaryTerms(locale),
  ])
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)
  const groups = groupByLetter(terms, (term) => term.term, locale)

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tr('home'), href: '/' },
          { label: tr('title'), href: '/ressources' },
          { label: t('title') },
        ]}
        title={t('title')}
        lead={t('lead')}
      >
        <nav aria-label={t('letters')}>
          <ul className="flex flex-wrap gap-1">
            {groups.map((group) => (
              <li key={group.letter}>
                <Link
                  href={`#lettre-${group.letter === '#' ? 'autres' : group.letter.toLowerCase()}`}
                  variant="quiet"
                  tone="ink"
                  className="inline-grid size-11 place-items-center rounded-control border border-line font-semibold is-hover:border-green-700"
                >
                  {group.letter}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
      <Section>
        <Container className="flex flex-col gap-16">
          {groups.map((group) => {
            const id = `lettre-${group.letter === '#' ? 'autres' : group.letter.toLowerCase()}`
            return (
              <section
                key={group.letter}
                aria-labelledby={id}
                className="grid scroll-mt-24 gap-6 lg:grid-cols-12 lg:gap-gutter"
              >
                <h2 id={id} className="font-display text-h2 text-gold-700 lg:col-span-2">
                  {group.letter}
                </h2>
                <dl className="flex flex-col lg:col-span-9 lg:col-start-4">
                  {group.items.map((term) => (
                    <div key={term.id} className="flex flex-col gap-2 border-t border-line py-6">
                      <dt className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <Link
                          href={{
                            pathname: '/ressources/glossaire/[term]',
                            params: { term: term.slug },
                          }}
                          variant="quiet"
                          tone="ink"
                          className="font-display text-h3 is-hover:text-green-700"
                        >
                          {term.term}
                        </Link>
                        {term.arabic ? (
                          <span lang="ar" dir="rtl" className="text-body text-ink-muted">
                            {term.arabic}
                          </span>
                        ) : null}
                      </dt>
                      <dd className="max-w-measure text-body text-ink-muted">
                        {fr(term.shortDefinition)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )
          })}
        </Container>
      </Section>
    </>
  )
}
