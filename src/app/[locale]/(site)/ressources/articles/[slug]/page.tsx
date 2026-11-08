import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { Container, Section, SectionHeader } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { linkGlossaryTerms } from '@/features/content/glossary-link'
import { withHeadingAnchors } from '@/features/site/rich-text'
import { getPathname } from '@/lib/i18n/navigation'
import { routing } from '@/lib/i18n/routing'
import { getSiteUrl } from '@/lib/seo/config'
import { articleJsonLd } from '@/lib/seo/jsonld'
import { defaultOgImageUrl } from '@/lib/seo/metadata'
import { typographyFr } from '@/lib/typography'
import type { Author, Category, Post } from '@/payload-types'

import { populated } from '../../../_components/blocks/types'
import { Disclaimer } from '../../../_components/Disclaimer'
import { BreadcrumbJsonLd, JsonLd } from '../../../_components/JsonLd'
import { NewsletterForm } from '../../../_components/forms/NewsletterForm'
import { ResourceList } from '../../../_components/ResourceList'
import { RichText } from '../../../_components/RichText'
import { ShareLinks } from '../../../_components/ShareLinks'
import { TableOfContents } from '../../../_components/TableOfContents'
import { getGlossaryTerms, getPost, getPosts, getPostSlugs } from '../../../_data/queries'
import { pageMetadata, resolveLocale } from '../../../_lib/page'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ locale: routing.defaultLocale, slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const post = await getPost(slug, locale)
  if (!post) return {}
  return pageMetadata({
    locale,
    route: { pathname: '/ressources/articles/[slug]', params: { slug } },
    title: post.title,
    description: post.excerpt,
    seo: post.seo,
    ownImage: true,
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: (post.authors ?? []).filter(populated<Author>).map((author) => author.name),
      section: (post.categories ?? []).find(populated<Category>)?.title,
    },
  })
}

/**
 * Article (SPEC §4.4) : sommaire automatique, temps de lecture, auteur, encadrés,
 * glossaire lié (première occurrence), partage sans SDK, articles liés, newsletter.
 */
export default async function ArticlePage({ params }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const post = await getPost(slug, locale)
  if (!post) notFound()

  const [t, tr, terms] = await Promise.all([
    getTranslations('site.articles'),
    getTranslations('site.resources'),
    getGlossaryTerms(locale),
  ])
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)

  // Glossaire : première occurrence de chaque terme liée à sa fiche, puis ancres des titres.
  const linked = linkGlossaryTerms(
    post.content,
    terms.map((term) => ({
      id: term.id,
      slug: term.slug,
      term: term.term,
      variants: (term.synonyms ?? []).map((synonym) => synonym.value),
    })),
    { href: (term) => `/ressources/glossaire/${term.slug}`, maxLinks: 12 },
  )
  const { state: content, toc } = withHeadingAnchors(linked)
  const definitions = new Map(terms.map((term) => [term.slug, term.shortDefinition]))

  const categories = (post.categories ?? []).filter(populated<Category>)
  const authors = (post.authors ?? []).filter(populated<Author>)
  const related = (post.relatedPosts ?? []).filter(populated<Post>)
  const fallbackRelated =
    related.length > 0
      ? null
      : await getPosts(locale, { limit: 3, excludeId: post.id, categoryId: categories[0]?.id })
  const relatedItems = (related.length > 0 ? related : (fallbackRelated?.docs ?? [])).map(
    (item) => ({
      key: `post-${item.id}`,
      kind: 'articles' as const,
      title: item.title,
      summary: item.excerpt ?? undefined,
      href: { pathname: '/ressources/articles/[slug]' as const, params: { slug: item.slug } },
      date: item.publishedAt ?? undefined,
      meta: item.readingTimeMinutes
        ? tr('readingTime', { minutes: item.readingTimeMinutes })
        : undefined,
    }),
  )

  const url = `${getSiteUrl()}${getPathname({
    locale,
    href: { pathname: '/ressources/articles/[slug]', params: { slug: post.slug } },
  })}`
  const breadcrumb: BreadcrumbItem[] = [
    { label: tr('home'), href: '/' },
    { label: tr('title'), href: '/ressources' },
    { label: t('title'), href: '/ressources/articles' },
    { label: fr(post.title) },
  ]
  const date = post.publishedAt
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale, {
        dateStyle: 'long',
        timeZone: 'Africa/Douala',
      }).format(new Date(post.publishedAt))
    : null

  return (
    <>
      <article>
        <header className="pt-6 pb-12 lg:pb-16">
          <Container className="flex flex-col gap-8">
            <Breadcrumb items={breadcrumb} />
            <BreadcrumbJsonLd items={breadcrumb} />
            <JsonLd
              data={articleJsonLd({
                siteUrl: getSiteUrl(),
                url,
                headline: post.title,
                description: post.seo?.description ?? post.excerpt,
                datePublished: post.publishedAt,
                dateModified: post.updatedAt,
                authors: authors.map((author) => ({ name: author.name })),
                // Image par défaut : l’URL de l’image propre à l’article est suffixée par Next.
                imageUrl: defaultOgImageUrl(getSiteUrl(), locale),
                inLanguage: locale,
                section: categories[0]?.title,
              })}
            />
            <div className="flex max-w-xl flex-col gap-6">
              {categories.length ? (
                <ul className="flex flex-wrap gap-x-4" aria-label={t('categories')}>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={{
                          pathname: '/ressources/articles',
                          query: { categorie: category.slug },
                        }}
                        variant="standalone"
                        className="text-small"
                      >
                        {category.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <h1 className="text-h1">{fr(post.title)}</h1>
              {post.excerpt ? (
                <p className="max-w-measure text-body-lg text-ink-muted">{fr(post.excerpt)}</p>
              ) : null}
              <p className="flex flex-wrap gap-x-6 gap-y-1 text-small text-ink-muted">
                {authors.length ? (
                  <span>
                    {t('by', { authors: authors.map((author) => author.name).join(', ') })}
                  </span>
                ) : null}
                {date && post.publishedAt ? <time dateTime={post.publishedAt}>{date}</time> : null}
                {post.readingTimeMinutes ? (
                  <span>{tr('readingTime', { minutes: post.readingTimeMinutes })}</span>
                ) : null}
              </p>
            </div>
          </Container>
        </header>

        <Container className="grid gap-12 border-t border-line pt-12 pb-section lg:grid-cols-12 lg:gap-gutter">
          {toc.length > 1 ? (
            <div className="lg:col-span-3 lg:row-span-2">
              <TableOfContents entries={toc} title={t('toc')} />
            </div>
          ) : null}
          <div className="min-w-0 lg:col-span-8 lg:col-start-5">
            <RichText data={content} locale={locale} glossary={definitions} />
          </div>
          <footer className="flex flex-col gap-10 lg:col-span-8 lg:col-start-5">
            <ShareLinks url={url} title={post.title} locale={locale} />
            {authors.map((author) => (
              <section
                key={author.id}
                aria-label={t('aboutAuthor')}
                className="flex flex-col gap-2 border-t border-line pt-6"
              >
                <p className="text-small text-ink-muted">{t('writtenBy')}</p>
                <p className="font-display text-h3">{author.name}</p>
                {author.role ? <p className="text-small text-green-700">{author.role}</p> : null}
                {author.bio ? (
                  <p className="max-w-measure text-body text-ink-muted">{fr(author.bio)}</p>
                ) : null}
              </section>
            ))}
            <Disclaimer locale={locale} inline />
          </footer>
        </Container>
      </article>

      {relatedItems.length ? (
        <Section tone="sand" aria-labelledby="articles-lies">
          <Container>
            <SectionHeader id="articles-lies" title={t('related')} />
            <ResourceList items={relatedItems} locale={locale} />
          </Container>
        </Section>
      ) : null}

      <Section aria-labelledby="newsletter-article" data-page-newsletter>
        <Container className="grid gap-8 lg:grid-cols-12 lg:gap-gutter">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <h2 id="newsletter-article" className="text-h2">
              {t('newsletterTitle')}
            </h2>
            <p className="max-w-measure text-body-lg text-ink-muted">{t('newsletterText')}</p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <NewsletterForm chooseInterests sourcePage={`/ressources/articles/${post.slug}`} />
          </div>
        </Container>
      </Section>
    </>
  )
}
