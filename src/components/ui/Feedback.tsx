import { cva, type VariantProps } from 'class-variance-authority'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { cn } from './cn'

/* ------------------------------------------------------------------ Skeleton */

export type SkeletonProps = {
  className?: string
  /** Forme : bloc rectangulaire (média, carte), ligne de texte, ou rond (avatar). */
  shape?: 'block' | 'text' | 'circle'
}

/**
 * Espace réservé pendant un chargement. Statique : pas de scintillement (« rien ne
 * clignote », DESIGN §1). La zone parente porte `aria-busy`.
 */
export function Skeleton({ className, shape = 'block' }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block bg-sand-100',
        shape === 'block' && 'rounded-media',
        shape === 'text' && 'h-[1em] rounded-media',
        shape === 'circle' && 'rounded-pill',
        className,
      )}
    />
  )
}

/* --------------------------------------------------------------- ProgressBar */

export type ProgressBarProps = {
  /** 0 à 100. */
  value: number
  label: string
  /** Affiche la valeur en pourcentage à côté du libellé. */
  showValue?: boolean
  /** Masque la ligne libellé/valeur (cellule de tableau) : le libellé reste annoncé. */
  hideLabel?: boolean
  tone?: 'default' | 'light'
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Barre de progression (cours, licences). Le remplissage s'anime quand la valeur
 * change (moment signature : fin de leçon), jamais au chargement.
 */
export function ProgressBar({
  value,
  label,
  showValue = true,
  hideLabel = false,
  tone = 'default',
  size = 'md',
  className,
}: ProgressBarProps) {
  const t = useTranslations('ui.progress')
  const clamped = Math.round(Math.min(Math.max(value, 0), 100))
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {hideLabel ? null : (
        <div className="flex items-baseline justify-between gap-4 text-small">
          <span className={tone === 'light' ? 'text-paper' : 'text-ink'}>{label}</span>
          {showValue ? (
            <span
              aria-hidden="true"
              className={cn(
                'tabular font-semibold',
                tone === 'light' ? 'text-gold-500' : 'text-green-700',
              )}
            >
              {t('value', { value: clamped })}
            </span>
          ) : null}
        </div>
      )}
      <progress
        max={100}
        value={clamped}
        aria-label={label}
        className={cn(
          'block w-full appearance-none overflow-hidden rounded-pill border-0',
          size === 'sm' ? 'h-1' : 'h-2',
          tone === 'light' ? 'progress-light' : 'progress-default',
        )}
      >
        {t('value', { value: clamped })}
      </progress>
    </div>
  )
}

/* ---------------------------------------------------------------- Callout / Alert */

export const alertVariants = cva(
  'flex gap-3 rounded-panel border p-4 text-body [&>svg.lucide]:mt-1 [&>svg.lucide]:size-5',
  {
    variants: {
      tone: {
        info: 'border-info bg-info-50 text-ink [&>svg.lucide]:text-info',
        success: 'border-green-700 bg-green-50 text-ink [&>svg.lucide]:text-green-700',
        warning: 'border-warning bg-warning-50 text-ink [&>svg.lucide]:text-warning',
        danger: 'border-danger bg-danger-50 text-ink [&>svg.lucide]:text-danger',
      },
    },
    defaultVariants: { tone: 'info' },
  },
)

const alertIcons = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
} as const

export type AlertProps = VariantProps<typeof alertVariants> & {
  title?: ReactNode
  children: ReactNode
  /** `alert` pour un message qui apparaît après une action (erreur d'envoi). */
  role?: 'status' | 'alert'
  className?: string
}

/** Message système dans la page (erreur d'envoi, confirmation). */
export function Alert({ tone, title, children, role, className }: AlertProps) {
  const Icon = alertIcons[tone ?? 'info']
  return (
    <div role={role} className={cn(alertVariants({ tone }), className)}>
      <Icon aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-ink-muted">{children}</div>
      </div>
    </div>
  )
}
