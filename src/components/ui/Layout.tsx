import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from './cn'

export type ContainerProps = {
  children: ReactNode
  className?: string
}

/** Conteneur de page : 1280 px de contenu, marges latérales 20 / 40 / 64 px. */
export function Container({ children, className }: ContainerProps) {
  return <div className={cn('container-page', className)}>{children}</div>
}

/**
 * Surfaces de section. Proportions visées sur une page (DESIGN §2) : blanc ~70 %,
 * vert ~20 %, sable ~7 %, or ~3 %. `night` = green-900 (héros, bandeau final).
 */
export const sectionVariants = cva('py-section', {
  variants: {
    tone: {
      paper: 'bg-paper text-ink',
      sand: 'bg-sand-100 text-ink',
      warm: 'bg-sand-300 text-ink',
      green: 'on-dark bg-green-700',
      night: 'on-dark bg-green-900',
    },
    spacing: {
      default: '',
      compact: 'py-16',
      none: 'py-0',
    },
  },
  defaultVariants: { tone: 'paper', spacing: 'default' },
})

export type SectionProps = Omit<ComponentProps<'section'>, 'className'> &
  VariantProps<typeof sectionVariants> & {
    className?: string
  }

/** Section de page : espacement vertical 96 / 144 px, surface tokenisée. */
export function Section({ tone, spacing, className, children, ...props }: SectionProps) {
  return (
    <section className={cn(sectionVariants({ tone, spacing }), className)} {...props}>
      {children}
    </section>
  )
}

export type SectionHeaderProps = {
  title: ReactNode
  /** Identifiant du titre, pour `aria-labelledby` sur la section. */
  id?: string
  lead?: ReactNode
  /** Lien ou action alignée en fin de ligne (« Voir tout le catalogue »). */
  action?: ReactNode
  level?: 2 | 3
  /** `light` sur les surfaces vertes. */
  tone?: 'default' | 'light'
  className?: string
}

/** En-tête de section : titre h2, chapeau facultatif. Aligné à gauche, sans sur-titre. */
export function SectionHeader({
  title,
  id,
  lead,
  action,
  level = 2,
  tone = 'default',
  className,
}: SectionHeaderProps) {
  const Heading = `h${level}` as const
  return (
    <div
      className={cn(
        'mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-12',
        className,
      )}
    >
      <div className="flex max-w-measure flex-col gap-4">
        <Heading id={id} className={level === 2 ? 'text-h2' : 'text-h3'}>
          {title}
        </Heading>
        {lead ? (
          <p className={cn('text-body-lg', tone === 'light' ? 'text-sand-300' : 'text-ink-muted')}>
            {lead}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
