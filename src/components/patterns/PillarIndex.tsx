import { Trame } from '@/components/brand/Trame'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/components/ui/cn'
import { Link, type Href } from '@/components/ui/Link'

export type Pillar = {
  id: string
  /** Nom complet du pôle (« Audit et conformité »). */
  title: string
  /** Une phrase. */
  summary: string
  href: Href
  /** Trois offres, en liens. */
  offers: readonly { label: string; href: Href }[]
  /** Appel à l'action propre au pôle (devis d'audit, rendez-vous, être rappelé, s'abonner). */
  action?: { label: string; href: Href }
}

export type PillarIndexProps = {
  pillars: readonly Pillar[]
  /** Niveau des titres de pôle (2 sur l'accueil). */
  headingLevel?: 2 | 3
  className?: string
}

/**
 * Index éditorial des pôles (DESIGN §8) : pas de grille de cartes. Liste verticale,
 * nom du pôle en Baskerville, une phrase, trois offres ; au survol la ligne se teinte
 * green-50 et un fragment de Trame apparaît dans la marge de fin.
 */
export function PillarIndex({ pillars, headingLevel = 2, className }: PillarIndexProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <ul className={cn('border-b border-line', className)}>
      {pillars.map((pillar) => (
        <li
          key={pillar.id}
          className={cn(
            'group relative isolate overflow-hidden border-t border-line',
            'transition-colors duration-(--duration-hover) ease-standard',
            'is-hover:bg-green-50 has-focus-visible:bg-green-50',
          )}
        >
          <div className="grid gap-4 py-10 md:px-6 lg:grid-cols-12 lg:gap-gutter lg:py-12">
            <Heading className="text-h2 lg:col-span-5">
              <Link
                href={pillar.href}
                variant="quiet"
                tone="ink"
                className="inline-flex min-h-11 items-center group-is-hover:text-green-700"
              >
                {pillar.title}
              </Link>
            </Heading>
            <div className="flex flex-col gap-5 lg:col-span-6">
              <p className="max-w-measure text-body-lg text-ink-muted">{pillar.summary}</p>
              <ul className="flex flex-col gap-x-8 sm:flex-row sm:flex-wrap">
                {pillar.offers.map((offer) => (
                  <li key={offer.label}>
                    <Link
                      href={offer.href}
                      variant="standalone"
                      className="inline-flex min-h-11 items-center"
                    >
                      {offer.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {pillar.action ? (
                <div>
                  <ButtonLink href={pillar.action.href} variant="secondary" size="md">
                    {pillar.action.label}
                  </ButtonLink>
                </div>
              ) : null}
            </div>
          </div>
          {/* Fragment de Trame : décor, révélé au survol (or à 12 % sur fond clair). */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-y-0 end-0 -z-10 hidden w-40 opacity-0 lg:block',
              'transition-opacity duration-(--duration-menu) ease-standard',
              'group-is-hover:opacity-100 group-has-focus-visible:opacity-100',
            )}
          >
            <Trame density={2} rows={3} opacity={0.12} strokeWidth={1} className="size-full" />
          </span>
        </li>
      ))}
    </ul>
  )
}
