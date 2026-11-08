import type { ReactNode } from 'react'

import { cn } from '@/components/ui/cn'
import { Container } from '@/components/ui/Layout'

/** Section du guide : ancre, titre h2, chapeau, contenu. */
export function GuideSection({
  id,
  title,
  lead,
  children,
  tone = 'paper',
}: {
  id: string
  title: string
  lead: string
  children: ReactNode
  tone?: 'paper' | 'sand'
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        'scroll-mt-header border-t border-line py-24',
        tone === 'sand' ? 'bg-sand-100' : 'bg-paper',
      )}
    >
      <Container className="flex flex-col gap-16">
        <header className="flex max-w-measure flex-col gap-4">
          <h2 id={`${id}-title`} className="text-h2">
            {title}
          </h2>
          <p className="text-body-lg text-ink-muted">{lead}</p>
        </header>
        {children}
      </Container>
    </section>
  )
}

/** Sous-partie du guide : titre h3 et contenu. */
export function Specimen({
  title,
  note,
  children,
  className,
}: {
  title: string
  note?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-h4">{title}</h3>
        {note ? <p className="max-w-measure text-small text-ink-muted">{note}</p> : null}
      </div>
      {children}
    </div>
  )
}

/** Grille d'états : chaque cellule porte le nom de l'état sous l'exemple. */
export function StateGrid({
  items,
  surface = 'paper',
  className,
}: {
  items: readonly { label: string; node: ReactNode }[]
  surface?: 'paper' | 'night'
  className?: string
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-6 gap-y-8 rounded-panel p-6',
        surface === 'night' ? 'on-dark bg-green-900' : 'border border-line bg-paper',
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.label} className="flex flex-col items-start gap-3">
          {item.node}
          <span
            className={cn('text-caption', surface === 'night' ? 'text-sand-300' : 'text-ink-muted')}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  )
}
