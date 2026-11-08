import { useTranslations } from 'next-intl'
import type { ComponentProps, ReactNode } from 'react'

import { cn, type VariantProps } from './cn'
import { Link, type LinkProps } from './Link'
import { Spinner } from './Spinner'
import { cva } from 'class-variance-authority'

/**
 * Boutons (DESIGN §8) : primaire (vert, texte blanc), secondaire (contour vert),
 * or (fond or, texte noir — uniquement sur fond vert), clair (contour blanc, sur vert),
 * fantôme (actions tertiaires). Hauteurs 40 et 48 px ; zone tactile toujours ≥ 44 px.
 * Jamais de flèche ajoutée au libellé.
 */
export const buttonVariants = cva(
  [
    'hit-area inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-control border font-semibold select-none',
    'transition-colors duration-(--duration-hover) ease-standard',
    'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
    '[&_svg.lucide]:size-5',
  ],
  {
    variants: {
      variant: {
        primary: [
          'border-green-700 bg-green-700 text-paper',
          'is-hover:border-green-800 is-hover:bg-green-800',
          'is-active:border-green-900 is-active:bg-green-900',
          'disabled:border-line disabled:bg-line disabled:text-ink-subtle',
          'aria-disabled:border-line aria-disabled:bg-line aria-disabled:text-ink-subtle',
        ],
        secondary: [
          'border-green-700 bg-paper text-green-700',
          'is-hover:bg-green-50 is-hover:text-green-800',
          'is-active:bg-green-50 is-active:text-green-900 is-active:border-green-900',
          'disabled:border-line disabled:text-ink-subtle disabled:bg-paper',
          'aria-disabled:border-line aria-disabled:text-ink-subtle',
        ],
        gold: [
          'border-gold-500 bg-gold-500 text-ink',
          'is-hover:border-gold-200 is-hover:bg-gold-200',
          'is-active:border-sand-300 is-active:bg-sand-300',
          'disabled:opacity-60',
        ],
        'outline-light': [
          'border-paper/70 bg-transparent text-paper',
          'is-hover:border-paper is-hover:bg-paper/10',
          'is-active:bg-paper/20',
          'disabled:opacity-60',
        ],
        ghost: [
          'border-transparent bg-transparent text-green-700',
          'is-hover:bg-green-50 is-hover:text-green-800',
          'is-active:bg-green-50 is-active:text-green-900',
          'disabled:text-ink-subtle',
        ],
      },
      size: {
        md: 'h-10 px-4 text-small',
        lg: 'h-12 px-6 text-body',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'lg', fullWidth: false },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

export type ButtonProps = Omit<ComponentProps<'button'>, 'className'> &
  ButtonVariantProps & {
    className?: string
    /** Désactive le bouton et annonce « chargement » ; le libellé reste visible. */
    loading?: boolean
    /** Icône Lucide placée avant le libellé (côté début, donc à droite en arabe). */
    icon?: ReactNode
  }

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const t = useTranslations('ui.button')
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      <span>{children}</span>
      {loading ? <span className="sr-only">{t('loading')}</span> : null}
    </button>
  )
}

export type ButtonLinkProps = Omit<LinkProps, 'variant' | 'tone'> &
  ButtonVariantProps & {
    icon?: ReactNode
  }

/** Lien stylé en bouton : navigation (ex. « Prendre rendez-vous »). */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  icon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      variant="bare"
      tone="inherit"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
