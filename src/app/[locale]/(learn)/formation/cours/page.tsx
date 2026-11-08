import { X } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select } from '@/components/ui/Input'
import { Container, Section } from '@/components/ui/Layout'
import { Link, type Href } from '@/components/ui/Link'
import { Pagination } from '@/components/ui/Pagination'
import {
  activeFilterKeys,
  applyCatalog,
  catalogFormats,
  catalogLanguages,
  catalogLevels,
  catalogParamNames,
  catalogSorts,
  type CatalogFilterKey,
  type CatalogFilters,
  durationBuckets,
  hasActiveFilters,
  parseCatalogFilters,
  priceBuckets,
  type SearchParams,
  toCatalogQuery,
} from '@/features/lms/catalog'
import { getPathname } from '@/lib/i18n/navigation'

import { Disclaimer } from '../../../(site)/_components/Disclaimer'
import { PageHeader } from '../../../(site)/_components/PageHeader'
import { pageMetadata, resolveLocale } from '../../../(site)/_lib/page'
import { CapsuleRows, CourseCardGrid } from '../../_components/CourseList'
import { getCatalog, getPaths, searchCourses, type ThemeRef } from '../../_data/formation'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}

function themesOf(cards: readonly { themes: ThemeRef[] }[]): ThemeRef[] {
  const bySlug = new Map<string, ThemeRef>()
  for (const card of cards) for (const theme of card.themes) bySlug.set(theme.slug, theme)
  return [...bySlug.values()].sort((a, b) => a.title.localeCompare(b.title))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'learn.catalog' })
  const query = await searchParams
  const filters = parseCatalogFilters(
    query,
    themesOf(await getCatalog(locale)).map((x) => x.slug),
  )
  // Pages filtrées, triées ou paginées : non indexées (contenu dupliqué), canonical sur le catalogue.
  const varied = hasActiveFilters(filters) || filters.page > 1 || Object.keys(query).length > 0
  return pageMetadata({
    locale,
    route: '/formation/cours',
    title: t('title'),
    description: t('lead'),
    noIndex: varied,
  })
}

/**
 * Catalogue de formation (SPEC §4.1) : filtres dans l'URL, rendu serveur, aucun JavaScript
 * pour filtrer (formulaire GET). Cours en cartes, capsules en liste compacte.
 */
export default async function CatalogPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const query = await searchParams
  const [t, tl, catalog, paths] = await Promise.all([
    getTranslations('learn.catalog'),
    getTranslations('learn'),
    getCatalog(locale),
    getPaths(locale),
  ])
  const themes = themesOf(catalog)
  const filters = parseCatalogFilters(
    query,
    themes.map((theme) => theme.slug),
  )
  const ranks = filters.q
    ? new Map((await searchCourses(filters.q, locale)).map(([id, rank]) => [String(id), rank]))
    : null
  const result = applyCatalog(catalog, filters, ranks)
  const courses = result.items.filter((item) => item.format === 'course')
  const capsules = result.items.filter((item) => item.format === 'capsule')

  const hrefWith = (overrides: Parameters<typeof toCatalogQuery>[1]): Href => ({
    pathname: '/formation/cours',
    query: toCatalogQuery(filters, overrides),
  })

  const valueLabel = (key: CatalogFilterKey, current: CatalogFilters): string => {
    switch (key) {
      case 'q':
        return t('chips.q', { q: current.q ?? '' })
      case 'theme':
        return themes.find((theme) => theme.slug === current.theme)?.title ?? ''
      case 'level':
        return tl(`levels.${current.level ?? 'beginner'}`)
      case 'format':
        return tl(`formats.${current.format ?? 'course'}`)
      case 'duration':
        return t(`durations.${current.duration ?? 'moins-1h'}`)
      case 'price':
        return t(`prices.${current.price ?? 'gratuit'}`)
      case 'language':
        return tl(`languages.${current.language ?? 'fr'}`)
    }
  }

  const active = activeFilterKeys(filters)
  const action = getPathname({ locale, href: '/formation/cours' })
  const all = t('all')

  const selects: Array<{
    key: Exclude<CatalogFilterKey, 'q'>
    label: string
    options: { value: string; label: string }[]
  }> = [
    {
      key: 'theme',
      label: t('filters.theme'),
      options: themes.map((theme) => ({ value: theme.slug, label: theme.title })),
    },
    {
      key: 'level',
      label: t('filters.level'),
      options: catalogLevels.map((value) => ({ value, label: tl(`levels.${value}`) })),
    },
    {
      key: 'format',
      label: t('filters.format'),
      options: catalogFormats.map((value) => ({ value, label: tl(`formats.${value}`) })),
    },
    {
      key: 'duration',
      label: t('filters.duration'),
      options: durationBuckets.map((value) => ({ value, label: t(`durations.${value}`) })),
    },
    {
      key: 'price',
      label: t('filters.price'),
      options: priceBuckets.map((value) => ({ value, label: t(`prices.${value}`) })),
    },
    {
      key: 'language',
      label: t('filters.language'),
      options: catalogLanguages.map((value) => ({ value, label: tl(`languages.${value}`) })),
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tl('breadcrumb.home'), href: '/' },
          { label: tl('breadcrumb.formation'), href: '/formation' },
          { label: t('title') },
        ]}
        title={t('title')}
        lead={t('lead')}
      />

      <Section spacing="compact" aria-labelledby="filtres-titre">
        <Container className="flex flex-col gap-10">
          <form
            method="get"
            action={action}
            role="search"
            aria-labelledby="filtres-titre"
            className="flex flex-col gap-6"
          >
            <h2 id="filtres-titre" className="sr-only">
              {t('filters.title')}
            </h2>
            <div className="flex flex-col gap-2">
              <label htmlFor="catalogue-q" className="text-small font-semibold text-ink">
                {t('filters.search')}
              </label>
              <Input
                id="catalogue-q"
                type="search"
                name={catalogParamNames.q}
                defaultValue={filters.q ?? ''}
                maxLength={100}
                enterKeyHint="search"
                aria-describedby="catalogue-q-aide"
              />
              <p id="catalogue-q-aide" className="text-small text-ink-muted">
                {t('filters.searchHint')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 xl:grid-cols-6">
              {selects.map((select) => (
                <div key={select.key} className="flex min-w-0 flex-col gap-2">
                  <label
                    htmlFor={`catalogue-${select.key}`}
                    className="text-small font-semibold text-ink"
                  >
                    {select.label}
                  </label>
                  <Select
                    id={`catalogue-${select.key}`}
                    name={catalogParamNames[select.key]}
                    defaultValue={filters[select.key] ?? ''}
                    options={[{ value: '', label: all }, ...select.options]}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex min-w-56 flex-col gap-2">
                <label htmlFor="catalogue-tri" className="text-small font-semibold text-ink">
                  {t('sort.label')}
                </label>
                <Select
                  id="catalogue-tri"
                  name={catalogParamNames.sort}
                  defaultValue={filters.sort}
                  options={catalogSorts
                    .filter((sort) => sort !== 'pertinence' || filters.q)
                    .map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
                />
              </div>
              <Button type="submit">{t('filters.submit')}</Button>
              {active.length > 0 ? (
                <Link href="/formation/cours" variant="standalone">
                  {t('filters.reset')}
                </Link>
              ) : null}
            </div>
          </form>

          <section aria-labelledby="resultats-titre" className="flex flex-col gap-10">
            <div className="flex flex-col gap-4 border-t border-line pt-8">
              <h2 id="resultats-titre" className="text-h3">
                {t('count', { count: result.total })}
              </h2>
              {active.length > 0 ? (
                <ul aria-label={t('chips.label')} className="flex flex-wrap gap-2">
                  {active.map((key) => (
                    <li key={key}>
                      <Link
                        href={hrefWith({ [key]: undefined })}
                        variant="bare"
                        tone="inherit"
                        className="hit-area inline-flex h-8 items-center gap-1.5 rounded-pill border border-green-700 bg-green-50 px-3 text-small text-green-900 is-hover:bg-paper"
                      >
                        <span>{valueLabel(key, filters)}</span>
                        <X aria-hidden="true" className="size-4" />
                        <span className="sr-only">{t('chips.remove')}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {result.total === 0 ? (
              <EmptyState
                title={t('empty.title')}
                description={filters.q ? t('empty.textSearch', { q: filters.q }) : t('empty.text')}
                action={
                  <ButtonLink href="/formation/cours" variant="secondary">
                    {t('empty.action')}
                  </ButtonLink>
                }
              />
            ) : (
              <>
                {courses.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {capsules.length > 0 ? (
                      <h3 className="text-h3">{t('coursesHeading')}</h3>
                    ) : null}
                    <CourseCardGrid cards={courses} locale={locale} headingLevel={3} />
                  </div>
                ) : null}
                {capsules.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex max-w-measure flex-col gap-2">
                      <h3 className="text-h3">{t('capsulesHeading')}</h3>
                      <p className="text-body text-ink-muted">{t('capsulesLead')}</p>
                    </div>
                    <CapsuleRows cards={capsules} locale={locale} label={t('capsulesHeading')} />
                  </div>
                ) : null}
              </>
            )}

            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              hrefFor={(page) => hrefWith({ page })}
            />
          </section>
        </Container>
      </Section>

      {paths.length > 0 ? (
        <Section tone="sand" aria-labelledby="parcours-titre">
          <Container className="flex flex-col gap-8">
            <div className="flex max-w-measure flex-col gap-3">
              <h2 id="parcours-titre" className="text-h2">
                {t('pathsTitle')}
              </h2>
              <p className="text-body-lg text-ink-muted">{t('pathsLead')}</p>
            </div>
            <ul className="border-b border-line">
              {paths.map((path) => (
                <li key={path.id} className="flex flex-col gap-2 border-t border-line py-6">
                  <h3 className="text-h3">
                    <Link
                      href={{ pathname: '/formation/parcours/[slug]', params: { slug: path.slug } }}
                      variant="quiet"
                      tone="ink"
                    >
                      {path.title}
                    </Link>
                  </h3>
                  {path.summary ? (
                    <p className="max-w-measure text-body text-ink-muted">{path.summary}</p>
                  ) : null}
                  <p className="text-small text-ink-muted">
                    {tl('paths.courseCount', { count: path.courseCount })}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <div className="py-section">
        <Disclaimer locale={locale} />
      </div>
    </>
  )
}
