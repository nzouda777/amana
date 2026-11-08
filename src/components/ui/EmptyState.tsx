import type { ReactNode } from 'react'

import { Trame } from '@/components/brand/Trame'

import { cn } from './cn'

export type EmptyStateProps = {
  /** Une phrase utile : ce qui manque et pourquoi (« Vous n'avez pas encore de cours »). */
  title: string
  description?: string
  /** Une seule action. */
  action?: ReactNode
  className?: string
}

/** État vide (DESIGN §8) : petite Trame, une phrase utile, une action. Centré. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-panel bg-sand-100 px-6 py-12 text-center',
        className,
      )}
    >
      {/* Or charte sur green-900 : pleine opacité autorisée (DESIGN §6). */}
      <span
        aria-hidden="true"
        className="relative block size-16 overflow-hidden rounded-media bg-green-900"
      >
        <Trame density={2} align="center" className="absolute inset-0 size-full" />
      </span>
      <div className="flex max-w-md flex-col gap-2">
        <p className="font-display text-h3 text-ink">{title}</p>
        {description ? <p className="text-body text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
