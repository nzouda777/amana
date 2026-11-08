import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from './cn'
import { Link, type Href } from './Link'

export type TableProps = {
  /** Nom accessible de la zone défilante (et légende si `caption` est visible). */
  label: string
  /** Légende visible au-dessus du tableau. */
  caption?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Tableau de données. Sur mobile, le tableau défile horizontalement dans une zone
 * focalisable ; la première colonne (`<Th sticky>` / `<Td sticky>`) reste collée côté
 * début de ligne (à droite en arabe).
 */
export function Table({ label, caption, children, className }: TableProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {caption ? <p className="text-small text-ink-muted">{caption}</p> : null}
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        // `relative` : sans lui, les libellés sr-only (position absolue) des en-têtes
        // ont un bloc conteneur hors de la zone défilante et font déborder la page.
        className="relative overflow-x-auto rounded-panel border border-line"
      >
        <table className="w-full border-collapse text-start text-small">
          <caption className="sr-only">{label}</caption>
          {children}
        </table>
      </div>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-sand-100">{children}</thead>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="[&>tr]:border-t [&>tr]:border-line">{children}</tbody>
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>
}

export type SortDirection = 'ascending' | 'descending'

type ThSort =
  | { direction?: SortDirection; href: Href; onSort?: never }
  | { direction?: SortDirection; onSort: () => void; href?: never }

export type ThProps = Omit<ComponentProps<'th'>, 'className' | 'scope'> & {
  /** Colonne collée au début de la ligne pendant le défilement horizontal. */
  sticky?: boolean
  /** Aligne à la fin (montants, scores). */
  numeric?: boolean
  /** Tri : par lien (côté serveur, URL partageable) ou par rappel (côté client). */
  sort?: ThSort
  scope?: 'col' | 'row'
  className?: string
}

const stickyClasses =
  'sticky start-0 z-10 after:absolute after:inset-y-0 after:end-0 after:w-px after:bg-line'

export function Th({
  sticky,
  numeric,
  sort,
  scope = 'col',
  className,
  children,
  ...props
}: ThProps) {
  const t = useTranslations('ui.table')
  const ariaSort = sort ? (sort.direction ?? 'none') : undefined
  const Icon =
    sort?.direction === 'ascending'
      ? ArrowUp
      : sort?.direction === 'descending'
        ? ArrowDown
        : ArrowUpDown
  const nextLabel = sort?.direction === 'ascending' ? t('sortDescending') : t('sortAscending')

  const sortContent = (
    <>
      <span>{children}</span>
      <Icon
        aria-hidden="true"
        className={cn('size-4', sort?.direction ? 'text-green-700' : 'text-ink-subtle')}
      />
      <span className="sr-only">, {nextLabel}</span>
    </>
  )
  const sortClasses = cn(
    'inline-flex min-h-11 items-center gap-1.5 rounded-control font-semibold text-ink',
    'is-hover:text-green-700',
    numeric && 'flex-row-reverse',
  )

  return (
    <th
      scope={scope}
      aria-sort={ariaSort}
      className={cn(
        'px-4 py-1 align-middle font-semibold whitespace-nowrap text-ink',
        numeric ? 'text-end' : 'text-start',
        scope === 'col' && 'bg-sand-100',
        scope === 'row' && 'bg-paper',
        sticky && stickyClasses,
        className,
      )}
      {...props}
    >
      {sort?.href !== undefined ? (
        <Link href={sort.href} variant="quiet" tone="inherit" className={sortClasses}>
          {sortContent}
        </Link>
      ) : sort?.onSort ? (
        <button type="button" onClick={sort.onSort} className={cn(sortClasses, 'cursor-pointer')}>
          {sortContent}
        </button>
      ) : (
        <span className="inline-flex min-h-11 items-center">{children}</span>
      )}
    </th>
  )
}

export type TdProps = Omit<ComponentProps<'td'>, 'className'> & {
  sticky?: boolean
  numeric?: boolean
  className?: string
}

export function Td({ sticky, numeric, className, children, ...props }: TdProps) {
  return (
    <td
      className={cn(
        'bg-paper px-4 py-3 align-middle text-ink',
        numeric && 'text-end tabular',
        sticky && stickyClasses,
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}
