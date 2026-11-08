import { Search } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Container, Section } from '@/components/ui/Layout'
import { Link, type Href } from '@/components/ui/Link'
import { groupSearchHits, MAX_QUERY_LENGTH, type SearchHit } from '@/features/site/search'
import { getPathname } from '@/lib/i18n/navigation'
import type { Pillar } from '@/payload/shared'

import { PageHeader } from '../_components/PageHeader'
import { searchSite } from '../_data/search'
import { serviceHref } from '../_lib/href'
import { pageMetadata, resolveLocale } from '../_lib/page'
import { SEARCH_INPUT_ID } from '../_lib/search-id'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.search' })
  // Les pages de résultats ne sont pas indexées.
  return pageMetadata({ locale, route: '/recherche', title: t('title'), noIndex: true })
}

const pillars: readonly string[] = ['formation', 'audit', 'conseil', 'takaful']

function hrefOf(hit: SearchHit): Href {
  switch (hit.kind) {
    case 'service':
      return pillars.includes(hit.pillar ?? '')
        ? serviceHref(hit.pillar as Pillar, hit.slug)
        : '/recherche'
    case 'course':
      return { pathname: '/formation/cours/[slug]', params: { slug: hit.slug } }
    case 'article':
      return { pathname: '/ressources/articles/[slug]', params: { slug: hit.slug } }
    case 'glossary':
      return { pathname: '/ressources/glossaire/[term]', params: { term: hit.slug } }
    case 'page':
      if (hit.slug === 'a-propos') return '/a-propos'
      if (hit.slug === 'formation') return '/formation'
      return { pathname: '/legal/[slug]', params: { slug: hit.slug } }
  }
}

/**
 * Recherche globale : formulaire GET (fonctionne sans JavaScript), résultats groupés par
 * type, chaque groupe annoncé par un titre ; raccourci « / » depuis toutes les pages.
 */
export default async function SearchPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const query = await searchParams
  const q = ((Array.isArray(query.q) ? query.q[0] : query.q) ?? '')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
  const [t, hits] = await Promise.all([
    getTranslations('site.search'),
    q ? searchSite(q, locale) : [],
  ])
  const groups = groupSearchHits(hits)
  const action = getPathname({ locale, href: '/recherche' })

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('home'), href: '/' }, { label: t('title') }]}
        title={t('title')}
      >
        <form
          action={action}
          method="get"
          role="search"
          aria-label={t('formLabel')}
          className="flex flex-col gap-3"
        >
          <label htmlFor={SEARCH_INPUT_ID} className="text-small font-semibold">
            {t('label')}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id={SEARCH_INPUT_ID}
              name="q"
              type="search"
              defaultValue={q}
              maxLength={MAX_QUERY_LENGTH}
              autoFocus={q === ''}
              autoComplete="off"
              enterKeyHint="search"
              aria-describedby="recherche-aide"
              className="sm:flex-1"
            />
            <Button type="submit" icon={<Search aria-hidden="true" />}>
              {t('submit')}
            </Button>
          </div>
          <p id="recherche-aide" className="text-small text-ink-muted">
            {t('hint')}
          </p>
        </form>
      </PageHeader>
      <Section>
        <Container>
          {q === '' ? null : (
            <p role="status" className="mb-12 text-body text-ink-muted">
              {t('summary', { count: hits.length, query: q })}
            </p>
          )}
          {q !== '' && groups.length === 0 ? (
            <EmptyState
              title={t('emptyTitle')}
              description={t('emptyText')}
              action={
                <Link href="/ressources/glossaire" variant="standalone">
                  {t('emptyAction')}
                </Link>
              }
            />
          ) : null}
          <div className="flex flex-col gap-16">
            {groups.map((group) => (
              <section
                key={group.kind}
                aria-labelledby={`resultats-${group.kind}`}
                className="grid gap-6 lg:grid-cols-12 lg:gap-gutter"
              >
                <h2 id={`resultats-${group.kind}`} className="text-h3 lg:col-span-3">
                  {t(`kinds.${group.kind}`)}{' '}
                  <span className="font-sans text-small text-ink-muted tabular">
                    ({group.hits.length})
                  </span>
                </h2>
                <ol className="flex flex-col lg:col-span-8 lg:col-start-5">
                  {group.hits.map((hit) => (
                    <li
                      key={`${hit.kind}-${hit.id}`}
                      className="flex flex-col gap-2 border-t border-line py-5"
                    >
                      <Link
                        href={hrefOf(hit)}
                        variant="quiet"
                        tone="ink"
                        className="self-start text-h4 font-semibold is-hover:text-green-700"
                      >
                        {hit.title}
                      </Link>
                      {hit.excerpt ? (
                        <p className="line-clamp-2 max-w-measure text-body text-ink-muted">
                          {hit.excerpt}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
