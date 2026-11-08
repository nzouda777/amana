import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { Container, Section } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { linkGlossaryTerms } from '@/features/content/glossary-link'
import { routing } from '@/lib/i18n/routing'
import { typographyFr } from '@/lib/typography'
import type { GlossaryTerm } from '@/payload-types'

import { populated } from '../../../_components/blocks/types'
import { PageHeader } from '../../../_components/PageHeader'
import { RichText } from '../../../_components/RichText'
import { getGlossaryTerm, getGlossaryTerms } from '../../../_data/queries'
import { pageMetadata, resolveLocale } from '../../../_lib/page'

type Props = { params: Promise<{ locale: string; term: string }> }

export async function generateStaticParams() {
  const terms = await getGlossaryTerms(routing.defaultLocale)
  return terms.map((term) => ({ locale: routing.defaultLocale, term: term.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { term: slug } = await params
  const term = await getGlossaryTerm(slug, locale)
  return term
    ? pageMetadata({
        locale,
        route: { pathname: '/ressources/glossaire/[term]', params: { term: slug } },
        title: term.term,
        description: term.shortDefinition,
        seo: term.seo,
      })
    : {}
}

/** Fiche d'un terme : translittération, graphie arabe, définition, termes liés. */
export default async function GlossaryTermPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const { term: slug } = await params
  const term = await getGlossaryTerm(slug, locale)
  if (!term) notFound()
  const [t, tr, terms] = await Promise.all([
    getTranslations('site.glossary'),
    getTranslations('site.resources'),
    getGlossaryTerms(locale),
  ])
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)
  const related = (term.relatedTerms ?? []).filter(populated<GlossaryTerm>)

  // Les autres termes cités dans la définition renvoient à leur fiche (pas le terme lui-même).
  const definition = linkGlossaryTerms(
    term.definition,
    terms.map((item) => ({
      id: item.id,
      slug: item.slug,
      term: item.term,
      variants: (item.synonyms ?? []).map((synonym) => synonym.value),
    })),
    { href: (item) => `/ressources/glossaire/${item.slug}`, exclude: [term.id] },
  )
  const definitions = new Map(terms.map((item) => [item.slug, item.shortDefinition]))

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tr('home'), href: '/' },
          { label: tr('title'), href: '/ressources' },
          { label: t('title'), href: '/ressources/glossaire' },
          { label: term.term },
        ]}
        title={term.term}
        lead={fr(term.shortDefinition)}
      >
        {term.arabic || term.transliteration ? (
          <dl className="flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-6">
            {term.arabic ? (
              <div className="flex flex-col gap-1">
                <dt className="text-small text-ink-muted">{t('arabic')}</dt>
                <dd lang="ar" dir="rtl" className="text-h3">
                  {term.arabic}
                </dd>
              </div>
            ) : null}
            {term.transliteration ? (
              <div className="flex flex-col gap-1">
                <dt className="text-small text-ink-muted">{t('transliteration')}</dt>
                <dd className="text-h4">{term.transliteration}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </PageHeader>
      <Section>
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-gutter">
          <div className="lg:col-span-7">
            <RichText data={definition} locale={locale} glossary={definitions} />
          </div>
          <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
            {related.length ? (
              <nav aria-labelledby="termes-lies" className="flex flex-col gap-2">
                <h2 id="termes-lies" className="font-sans text-h4">
                  {t('related')}
                </h2>
                <ul className="flex flex-col">
                  {related.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={{
                          pathname: '/ressources/glossaire/[term]',
                          params: { term: item.slug },
                        }}
                        variant="standalone"
                      >
                        {item.term}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
            <Link href="/ressources/glossaire" variant="standalone" className="self-start">
              {t('back')}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
