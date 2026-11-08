import { ExternalLink, MapPin } from 'lucide-react'

import type { ExternalHref } from '@/components/ui/Link'

/**
 * Carte légère (SPEC, contact) : une vignette SVG de quelques centaines d'octets, cliquable
 * vers Google Maps. Aucune iframe ni script tiers chargé d'office.
 * TODO(client) : remplacer par une image statique du quartier une fois l'adresse exacte connue.
 */
export function StaticMap({
  href,
  label,
  caption,
}: {
  href: ExternalHref
  label: string
  caption: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-panel focus-visible:outline-2"
    >
      <span className="relative block aspect-[16/9] overflow-hidden rounded-media border border-line bg-sand-100">
        <svg
          aria-hidden="true"
          viewBox="0 0 320 180"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full stroke-line-strong"
          fill="none"
        >
          <path
            d="M0 120 C60 110 90 140 160 128 S270 96 320 104"
            strokeWidth="10"
            className="stroke-paper"
          />
          <path d="M0 120 C60 110 90 140 160 128 S270 96 320 104" strokeWidth="1" />
          <path
            d="M120 0 L138 180 M230 0 L210 180 M0 52 L320 70"
            strokeWidth="6"
            className="stroke-paper"
          />
          <path d="M120 0 L138 180 M230 0 L210 180 M0 52 L320 70" strokeWidth="1" />
          <path d="M20 150 Q70 160 110 175" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        <span className="absolute inset-0 grid place-items-center pb-10">
          <MapPin aria-hidden="true" className="size-10 fill-green-700 text-paper" />
        </span>
      </span>
      <span className="inline-flex items-center gap-2 font-semibold text-green-700 group-hover:underline">
        {label}
        <ExternalLink aria-hidden="true" className="size-4" />
      </span>
      <span className="text-small text-ink-muted">{caption}</span>
    </a>
  )
}
