import { Lightbulb, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { cn } from './cn'

export type ProseProps = {
  children: ReactNode
  className?: string
}

/** Conteneur d'article : titres, listes, citations, tableaux (styles dans prose.css). */
export function Prose({ children, className }: ProseProps) {
  return <div className={cn('prose', className)}>{children}</div>
}

/** Tableau d'article défilant horizontalement sur mobile. */
export function ProseTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="prose-table" role="region" aria-label={label} tabIndex={0}>
      <table>{children}</table>
    </div>
  )
}

export type CalloutProps = {
  /** `key` : encadré « À retenir » ; `warning` : encadré « Avertissement ». */
  variant: 'key' | 'warning'
  /** Remplace le titre par défaut. */
  title?: string
  children: ReactNode
  className?: string
}

/** Encadrés d'article (DESIGN §3, Prose). Titre en casse normale, jamais en capitales. */
export function Callout({ variant, title, children, className }: CalloutProps) {
  const t = useTranslations('ui.prose')
  const Icon = variant === 'key' ? Lightbulb : TriangleAlert
  const heading = title ?? (variant === 'key' ? t('keyPoint') : t('warning'))
  return (
    <aside
      aria-label={heading}
      className={cn(
        'callout flex flex-col gap-3 rounded-panel p-6',
        variant === 'key' ? 'bg-sand-100' : 'bg-warning-50',
        className,
      )}
    >
      <p
        className={cn(
          'flex items-center gap-2 text-h4 font-semibold',
          variant === 'key' ? 'text-green-900' : 'text-warning',
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
        {heading}
      </p>
      <div className="text-body text-ink [&>*+*]:mt-3">{children}</div>
    </aside>
  )
}
