import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'

import { Link as IntlLink } from '@/lib/i18n/navigation'

import { cn } from './cn'

/** Destination interne typée (routes localisées de next-intl, avec paramètres). */
export type InternalHref = ComponentProps<typeof IntlLink>['href']
/** Destination externe, ancre ou protocole (téléphone, e-mail, WhatsApp). */
export type ExternalHref =
  `https://${string}` | `http://${string}` | `mailto:${string}` | `tel:${string}` | `#${string}`
export type Href = InternalHref | ExternalHref

const EXTERNAL = /^(https?:|mailto:|tel:|#)/

export function isExternalHref(href: Href): href is ExternalHref {
  return typeof href === 'string' && EXTERNAL.test(href)
}

export const linkVariants = cva(
  [
    'rounded-media underline-offset-4 decoration-1',
    'transition-colors duration-(--duration-hover) ease-standard',
  ],
  {
    variants: {
      variant: {
        /** Lien dans le texte courant : toujours souligné. */
        inline: 'underline',
        /** Lien autonome (listes, « Voir le catalogue ») : souligné au survol. */
        standalone:
          'inline-flex min-h-11 items-center font-semibold no-underline is-hover:underline',
        /** Navigation, pied de page : sans soulignement au repos. */
        quiet: 'no-underline is-hover:underline',
        /** Aucun style de lien (le composant parent, ex. ButtonLink, décide). */
        bare: 'no-underline',
      },
      tone: {
        default: 'text-green-700 is-hover:text-green-800 is-active:text-green-900',
        ink: 'text-ink is-hover:text-green-700',
        light: 'text-paper is-hover:text-sand-300',
        inherit: 'text-inherit',
      },
    },
    defaultVariants: { variant: 'inline', tone: 'default' },
  },
)

export type LinkProps = Omit<ComponentProps<'a'>, 'href' | 'className'> &
  VariantProps<typeof linkVariants> & {
    href: Href
    className?: string
    children: ReactNode
    /** Préfère la locale indiquée (sélecteur de langue). */
    locale?: ComponentProps<typeof IntlLink>['locale']
  }

/**
 * Lien unique du produit : routes internes localisées via next-intl, liens externes en
 * `<a>` simple. `aria-current="page"` est à fournir par l'appelant pour la navigation.
 */
export function Link({ href, variant, tone, className, children, locale, ...props }: LinkProps) {
  const classes = cn(linkVariants({ variant, tone }), className)
  if (isExternalHref(href)) {
    const isWeb = href.startsWith('http')
    return (
      <a href={href} className={classes} rel={isWeb ? 'noopener noreferrer' : undefined} {...props}>
        {children}
      </a>
    )
  }
  return (
    <IntlLink href={href} locale={locale} className={classes} {...props}>
      {children}
    </IntlLink>
  )
}
