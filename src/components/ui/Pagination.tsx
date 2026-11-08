import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from './cn'
import { Link, type Href } from './Link'
import { paginationRange } from './pagination-range'

export { paginationRange }

export type PaginationProps = {
  page: number
  pageCount: number
  /** Construit le lien d'une page (pagination côté serveur, URL partageable). */
  hrefFor: (page: number) => Href
  className?: string
}

const navClasses = [
  'inline-flex h-11 items-center gap-1 rounded-control px-3 text-small',
  'transition-colors duration-(--duration-hover) ease-standard',
]

const itemClasses = [
  'inline-grid h-11 min-w-11 place-items-center rounded-control px-3 text-small tabular',
  'transition-colors duration-(--duration-hover) ease-standard',
]

/**
 * Pagination par liens. Les chevrons suivent le sens de lecture ; sur mobile seules
 * les commandes précédente/suivante et la position sont affichées.
 */
export function Pagination({ page, pageCount, hrefFor, className }: PaginationProps) {
  const t = useTranslations('ui.pagination')
  if (pageCount <= 1) return null
  const hasPrevious = page > 1
  const hasNext = page < pageCount

  return (
    <nav aria-label={t('label')} className={className}>
      <ul className="flex items-center gap-1">
        <li>
          {hasPrevious ? (
            <Link
              href={hrefFor(page - 1)}
              variant="quiet"
              tone="ink"
              rel="prev"
              className={cn(navClasses, 'is-hover:bg-green-50')}
            >
              <ChevronLeft aria-hidden="true" className="size-5 rtl-dir:-scale-x-100" />
              <span className="max-sm:sr-only">{t('previous')}</span>
            </Link>
          ) : null}
        </li>
        <li className="px-2 text-small text-ink-muted sm:hidden">
          <span className="tabular">{t('position', { page, pageCount })}</span>
        </li>
        {paginationRange(page, pageCount).map((p, i) =>
          p === null ? (
            <li
              key={`gap-${i}`}
              aria-hidden="true"
              className="hidden px-1 text-ink-subtle sm:block"
            >
              …
            </li>
          ) : (
            <li key={p} className="hidden sm:block">
              {p === page ? (
                <span
                  aria-current="page"
                  className={cn(itemClasses, 'bg-green-700 font-semibold text-paper')}
                >
                  <span className="sr-only">{t('page', { page: p })}</span>
                  <span aria-hidden="true">{p}</span>
                </span>
              ) : (
                <Link
                  href={hrefFor(p)}
                  variant="quiet"
                  tone="ink"
                  className={cn(itemClasses, 'is-hover:bg-green-50')}
                  aria-label={t('page', { page: p })}
                >
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {hasNext ? (
            <Link
              href={hrefFor(page + 1)}
              variant="quiet"
              tone="ink"
              rel="next"
              className={cn(navClasses, 'is-hover:bg-green-50')}
            >
              <span className="max-sm:sr-only">{t('next')}</span>
              <ChevronRight aria-hidden="true" className="size-5 rtl-dir:-scale-x-100" />
            </Link>
          ) : null}
        </li>
      </ul>
    </nav>
  )
}
