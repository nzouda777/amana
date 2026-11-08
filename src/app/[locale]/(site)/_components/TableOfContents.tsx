import { ChevronDown } from 'lucide-react'

import { cn } from '@/components/ui/cn'
import { Link } from '@/components/ui/Link'
import type { TocEntry } from '@/features/site/rich-text'

function Entries({ entries }: { entries: readonly TocEntry[] }) {
  return (
    <ol className="flex flex-col border-s border-line">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            href={`#${entry.id}`}
            variant="quiet"
            tone="ink"
            className={cn(
              'flex min-h-11 items-center py-1.5 text-small',
              entry.level === 2 ? 'ps-4' : 'ps-8 text-ink-muted',
            )}
          >
            {entry.text}
          </Link>
        </li>
      ))}
    </ol>
  )
}

/**
 * Sommaire automatique (titres h2/h3). Sans JavaScript : panneau repliable natif
 * (`details`) sur mobile, colonne collante sur grand écran.
 */
export function TableOfContents({
  entries,
  title,
}: {
  entries: readonly TocEntry[]
  title: string
}) {
  return (
    <>
      <details className="group rounded-panel border border-line lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 font-semibold [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown
            aria-hidden="true"
            className="size-5 transition-transform duration-(--duration-menu) ease-standard group-open:rotate-180"
          />
        </summary>
        <nav aria-label={title} className="px-4 pb-4">
          <Entries entries={entries} />
        </nav>
      </details>
      <nav aria-label={title} className="sticky top-24 hidden flex-col gap-3 lg:flex">
        <p className="text-small font-semibold text-ink">{title}</p>
        <Entries entries={entries} />
      </nav>
    </>
  )
}
