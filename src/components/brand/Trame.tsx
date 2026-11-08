import { cn } from '@/components/ui/cn'

import { buildTrame } from './trame-geometry'

export type TrameProps = {
  /** Nombre d'étoiles sur la largeur (2 = fragment, 6 = héros). */
  density?: number
  /** Nombre d'étoiles sur la hauteur ; par défaut égal à `density` (cadre carré). */
  rows?: number
  /** Épaisseur du trait à l'écran, de 0,75 à 1,25 px. */
  strokeWidth?: number
  /** Opacité : 1 sur green-900, 0,12 sur fond clair (DESIGN §6). */
  opacity?: number
  /**
   * Tracé unique au chargement (~1 400 ms, ordre radial depuis le coin supérieur de fin
   * de ligne), puis statique. Une seule Trame animée par page ; ignoré si
   * `prefers-reduced-motion`.
   */
  animate?: boolean
  /** Ancrage du motif quand le cadre n'a pas les proportions du réseau. */
  align?: 'start' | 'end' | 'center'
  className?: string
}

const alignment = {
  start: 'xMinYMin slice',
  center: 'xMidYMid slice',
  end: 'xMaxYMin slice',
} as const

/**
 * La Trame, seul élément mémorable de l'identité. SVG pur rendu côté serveur, sans JS.
 * Le composant remplit son parent (position absolue à fournir par l'appelant via
 * `className`, ou dimensions explicites). Inversée en RTL par miroir CSS.
 */
export function Trame({
  density = 6,
  rows,
  strokeWidth = 1,
  opacity = 1,
  animate = false,
  align = 'end',
  className,
}: TrameProps) {
  const { width, height, stars } = buildTrame(density, rows ?? density)
  const stroke = Math.min(1.25, Math.max(0.75, strokeWidth))

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={alignment[align]}
      opacity={opacity}
      data-animate={animate || undefined}
      className={cn('trame pointer-events-none block stroke-gold-500', className)}
    >
      <g fill="none" strokeWidth={stroke} strokeLinejoin="miter">
        {stars.map((star, index) => (
          <path
            key={index}
            d={star.d}
            pathLength={1}
            vectorEffect="non-scaling-stroke"
            className={`trame-r${star.ring}`}
          />
        ))}
      </g>
    </svg>
  )
}
