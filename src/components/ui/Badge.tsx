import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from './cn'

/**
 * Badge : statut court, non interactif (« Extrait gratuit », « Nouveau », « Payée »).
 * Casse normale, jamais de capitales espacées.
 */
export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-control px-2 py-0.5 text-caption font-semibold whitespace-nowrap [&_svg.lucide]:size-3.5',
  {
    variants: {
      tone: {
        gold: 'bg-gold-200 text-ink',
        green: 'bg-green-50 text-green-900',
        neutral: 'bg-sand-100 text-ink-muted',
        danger: 'bg-danger-50 text-danger',
        warning: 'bg-warning-50 text-warning',
        info: 'bg-info-50 text-info',
        /** Sur fond vert. */
        light: 'bg-paper text-green-900',
      },
    },
    defaultVariants: { tone: 'gold' },
  },
)

export type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: ReactNode
  icon?: ReactNode
  className?: string
}

export function Badge({ tone, icon, children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {icon}
      {children}
    </span>
  )
}

const tagClasses = [
  'hit-area inline-flex h-8 items-center gap-1.5 rounded-pill border px-3 text-small whitespace-nowrap',
  'transition-colors duration-(--duration-hover) ease-standard',
]

export type TagProps = {
  children: ReactNode
  className?: string
}

/** Étiquette de classement (thème, métier), non interactive. */
export function Tag({ children, className }: TagProps) {
  return (
    <span className={cn(tagClasses, 'border-line bg-paper text-ink-muted', className)}>
      {children}
    </span>
  )
}

export type ToggleTagProps = Omit<ComponentProps<'button'>, 'className' | 'aria-pressed'> & {
  pressed: boolean
  className?: string
}

/** Étiquette filtrante (catalogue) : bouton bascule avec `aria-pressed`. */
export function ToggleTag({
  pressed,
  children,
  className,
  type = 'button',
  ...props
}: ToggleTagProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(
        tagClasses,
        'cursor-pointer border-line-strong bg-paper text-ink',
        'is-hover:border-green-700 is-hover:text-green-800',
        'aria-pressed:border-green-700 aria-pressed:bg-green-50 aria-pressed:text-green-900',
        'disabled:cursor-not-allowed disabled:border-line disabled:text-ink-subtle',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export type RemovableTagProps = {
  children: ReactNode
  removeLabel: string
  onRemove?: () => void
  className?: string
}

/** Filtre actif retirable. */
export function RemovableTag({ children, removeLabel, onRemove, className }: RemovableTagProps) {
  return (
    <span className={cn(tagClasses, 'border-green-700 bg-green-50 pe-1 text-green-900', className)}>
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="hit-area inline-grid size-6 place-items-center rounded-pill is-hover:bg-paper"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </span>
  )
}
