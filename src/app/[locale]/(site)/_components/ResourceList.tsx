import { getTranslations } from 'next-intl/server'

import { Badge } from '@/components/ui/Badge'
import { Link, type Href } from '@/components/ui/Link'
import { typographyFr } from '@/lib/typography'

import { getGuides, getPosts, getWebinars } from '../_data/queries'
import type { Locale } from '../_data/cache'

export type ResourceKind = 'articles' | 'guides' | 'webinars'

export type ResourceItem = {
  key: string
  kind: ResourceKind
  title: string
  summary?: string
  href: Href
  /** Date de tri et d'affichage (ISO). */
  date?: string
  /** Mention complémentaire (« 6 min de lecture », « 24 pages »). */
  meta?: string
}

/** Ressources récentes, tous types confondus, de la plus récente à la plus ancienne. */
export async function getRecentResources(
  locale: Locale,
  types: readonly ResourceKind[],
  limit: number,
): Promise<ResourceItem[]> {
  const t = await getTranslations({ locale, namespace: 'site.resources' })
  const [posts, guides, webinars] = await Promise.all([
    types.includes('articles') ? getPosts(locale, { limit }) : null,
    types.includes('guides') ? getGuides(locale) : null,
    types.includes('webinars') ? getWebinars(locale) : null,
  ])
  const items: ResourceItem[] = [
    ...(posts?.docs ?? []).map((post) => ({
      key: `post-${post.id}`,
      kind: 'articles' as const,
      title: post.title,
      summary: post.excerpt ?? undefined,
      href: { pathname: '/ressources/articles/[slug]' as const, params: { slug: post.slug } },
      date: post.publishedAt ?? undefined,
      meta: post.readingTimeMinutes
        ? t('readingTime', { minutes: post.readingTimeMinutes })
        : undefined,
    })),
    ...(guides ?? []).map((guide) => ({
      key: `guide-${guide.id}`,
      kind: 'guides' as const,
      title: guide.title,
      summary: guide.summary ?? undefined,
      href: { pathname: '/ressources/guides/[slug]' as const, params: { slug: guide.slug } },
      date: guide.updatedAt,
      meta: guide.pageCount ? t('pages', { count: guide.pageCount }) : undefined,
    })),
    ...(webinars ?? []).map((event) => ({
      key: `event-${event.id}`,
      kind: 'webinars' as const,
      title: event.title,
      summary: event.summary ?? undefined,
      href: '/ressources/webinaires' as const,
      date: event.startsAt,
    })),
  ]
  return items.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, limit)
}

/**
 * Liste éditoriale de ressources (pas de cartes identiques) : nature, titre, résumé,
 * date. Trois colonnes séparées par des filets sur grand écran.
 */
export async function ResourceList({
  items,
  locale,
  headingLevel = 3,
}: {
  items: readonly ResourceItem[]
  locale: Locale
  headingLevel?: 2 | 3
}) {
  const t = await getTranslations({ locale, namespace: 'site.resources' })
  const dateFormat = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale, {
    dateStyle: 'long',
    timeZone: 'Africa/Douala',
  })
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)
  const Heading = `h${headingLevel}` as const
  return (
    <ul className="grid gap-x-gutter gap-y-10 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.key} className="group relative flex flex-col gap-3 border-t border-line pt-6">
          <Badge tone="neutral" className="self-start">
            {t(`kinds.${item.kind}`)}
          </Badge>
          <Heading className="text-h3">
            <Link
              href={item.href}
              variant="quiet"
              tone="ink"
              className="after:absolute after:inset-0 after:content-[''] group-is-hover:underline"
            >
              {fr(item.title)}
            </Link>
          </Heading>
          {item.summary ? (
            <p className="line-clamp-3 text-body text-ink-muted">{fr(item.summary)}</p>
          ) : null}
          {item.date || item.meta ? (
            <p className="mt-auto flex flex-wrap gap-x-4 text-small text-ink-subtle">
              {item.date ? (
                <time dateTime={item.date}>{dateFormat.format(new Date(item.date))}</time>
              ) : null}
              {item.meta ? <span>{item.meta}</span> : null}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
