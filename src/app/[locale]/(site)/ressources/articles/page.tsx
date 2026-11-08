import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { EmptyState } from '@/components/ui/EmptyState'
import { Container, Section } from '@/components/ui/Layout'
import { Link, type Href } from '@/components/ui/Link'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/components/ui/cn'

import { Disclaimer } from '../../_components/Disclaimer'
import { PageHeader } from '../../_components/PageHeader'
import { ResourceList } from '../../_components/ResourceList'
import { getCategories, getPosts } from '../../_data/queries'
import { pageMetadata, resolveLocale } from '../../_lib/page'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ categorie?: string | string[]; page?: string | string[] }>
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.articles' })
  const query = await searchParams
  // Les pages filtrées ou paginées ne sont pas indexées (contenu dupliqué).
  const filtered = Boolean(single(query.categorie)) || Number(single(query.page) ?? 1) > 1
  return pageMetadata({
    locale,
    route: '/ressources/articles',
    title: t('title'),
    description: t('lead'),
    noIndex: filtered,
  })
}

/** Index des articles : filtre par catégorie et pagination côté serveur (URL partageable). */
export default async function ArticlesPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const query = await searchParams
  const [t, tr, categories] = await Promise.all([
    getTranslations('site.articles'),
    getTranslations('site.resources'),
    getCategories(locale),
  ])
  const categorySlug = single(query.categorie)
  const category = categories.find((item) => item.slug === categorySlug)
  const requestedPage = Math.max(1, Math.floor(Number(single(query.page) ?? 1)) || 1)
  const posts = await getPosts(locale, { page: requestedPage, categoryId: category?.id })

  const hrefFor = (page: number, slug = category?.slug): Href => {
    const params: Record<string, string> = {}
    if (slug) params.categorie = slug
    if (page > 1) params.page = String(page)
    return { pathname: '/ressources/articles', query: params }
  }

  const items = posts.docs.map((post) => ({
    key: `post-${post.id}`,
    kind: 'articles' as const,
    title: post.title,
    summary: post.excerpt ?? undefined,
    href: { pathname: '/ressources/articles/[slug]' as const, params: { slug: post.slug } },
    date: post.publishedAt ?? undefined,
    meta: post.readingTimeMinutes
      ? tr('readingTime', { minutes: post.readingTimeMinutes })
      : undefined,
  }))

  const filterClass = (active: boolean) =>
    cn(
      'inline-flex min-h-11 items-center rounded-pill border px-4 text-small',
      active
        ? 'border-green-700 bg-green-700 font-semibold text-paper'
        : 'border-line-strong text-ink is-hover:border-green-700 is-hover:text-green-700',
    )

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tr('home'), href: '/' },
          { label: tr('title'), href: '/ressources' },
          { label: t('title') },
        ]}
        title={category ? t('titleCategory', { category: category.title }) : t('title')}
        lead={category?.description ?? t('lead')}
      />
      <Section>
        <Container className="flex flex-col gap-12">
          <nav aria-label={t('categories')}>
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={hrefFor(1, undefined)}
                  variant="bare"
                  tone="inherit"
                  aria-current={category ? undefined : 'page'}
                  className={filterClass(!category)}
                >
                  {t('allCategories')}
                </Link>
              </li>
              {categories.map((item) => (
                <li key={item.id}>
                  <Link
                    href={hrefFor(1, item.slug)}
                    variant="bare"
                    tone="inherit"
                    aria-current={item.id === category?.id ? 'page' : undefined}
                    className={filterClass(item.id === category?.id)}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {items.length === 0 ? (
            <EmptyState
              title={t('empty')}
              action={
                <Link href="/ressources/articles" variant="standalone">
                  {t('allCategories')}
                </Link>
              }
            />
          ) : (
            <ResourceList items={items} locale={locale} headingLevel={2} />
          )}

          <Pagination
            page={posts.page ?? 1}
            pageCount={posts.totalPages}
            hrefFor={(page) => hrefFor(page)}
          />
        </Container>
      </Section>
      <div className="pb-section">
        <Disclaimer locale={locale} />
      </div>
    </>
  )
}
