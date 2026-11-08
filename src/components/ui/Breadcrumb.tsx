import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from './cn'
import { Link, type Href } from './Link'

export type BreadcrumbItem = { label: string; href?: Href }

export type BreadcrumbProps = {
  /** Du plus général au plus précis ; le dernier élément est la page courante. */
  items: readonly BreadcrumbItem[]
  tone?: 'default' | 'light'
  /** Nom du repère ; à changer seulement si deux fils d'Ariane coexistent sur la page. */
  label?: string
  className?: string
}

/** Fil d'Ariane. Le séparateur suit le sens de lecture (chevron retourné en arabe). */
export function Breadcrumb({ items, tone = 'default', label, className }: BreadcrumbProps) {
  const t = useTranslations('ui.breadcrumb')
  return (
    <nav aria-label={label ?? t('label')} className={className}>
      <ol
        className={cn(
          'flex flex-wrap items-center gap-x-1 text-small',
          tone === 'light' ? 'text-sand-300' : 'text-ink-muted',
        )}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  variant="quiet"
                  tone={tone === 'light' ? 'light' : 'ink'}
                  className="inline-flex min-h-11 items-center"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="py-3">
                  {item.label}
                </span>
              )}
              {isLast ? null : (
                <ChevronRight aria-hidden="true" className="size-4 rtl-dir:-scale-x-100" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
