import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from './cn'

export const iconButtonVariants = cva(
  [
    'relative inline-flex size-11 shrink-0 items-center justify-center rounded-control border',
    'transition-colors duration-(--duration-hover) ease-standard',
    'disabled:cursor-not-allowed disabled:opacity-50',
    '[&_svg.lucide]:size-5',
  ],
  {
    variants: {
      variant: {
        ghost:
          'border-transparent text-ink is-hover:bg-green-50 is-hover:text-green-800 is-active:bg-green-50',
        outline:
          'border-line-strong bg-paper text-ink is-hover:border-green-700 is-hover:text-green-700 is-active:bg-green-50',
        light: 'border-transparent text-paper is-hover:bg-paper/10 is-active:bg-paper/20',
        solid:
          'border-green-700 bg-green-700 text-paper is-hover:bg-green-800 is-active:bg-green-900',
      },
    },
    defaultVariants: { variant: 'ghost' },
  },
)

export type IconButtonProps = Omit<
  ComponentProps<'button'>,
  'className' | 'aria-label' | 'children'
> &
  VariantProps<typeof iconButtonVariants> & {
    /** Nom accessible obligatoire : une icône n'est jamais seule sans libellé (DESIGN §5). */
    label: string
    icon: ReactNode
    className?: string
  }

/** Bouton icône 44 × 44 px. */
export function IconButton({
  label,
  icon,
  variant,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(iconButtonVariants({ variant }), className)}
      {...props}
    >
      {icon}
    </button>
  )
}
