import Image from 'next/image'

import { cn } from '@/components/ui/cn'

/**
 * Fichiers de marque servis depuis `public/brand/`.
 * TODO(client) : les trois fichiers actuels sont des placeholders (bouclier + khatam,
 * mot-symbole en Baskerville système). Remplacer par le logo vectoriel officiel en
 * conservant les noms de fichiers et, si besoin, les proportions ci-dessous.
 */
const sources = {
  color: { src: '/brand/logo.svg', width: 236, height: 56 },
  inverse: { src: '/brand/logo-inverse.svg', width: 236, height: 56 },
  symbol: { src: '/brand/symbol.svg', width: 48, height: 56 },
} as const

export type LogoVariant = keyof typeof sources

export type LogoProps = {
  /**
   * `color` : couleur sur fond clair ; `inverse` : blanc sur fond vert ;
   * `symbol` : symbole seul (favicon, icône d'application, espaces réduits).
   */
  variant?: LogoVariant
  /** Hauteur affichée, la largeur suit les proportions. */
  size?: 'sm' | 'md' | 'lg'
  /** Texte alternatif ; vide si le nom est déjà écrit à côté (lien « Accueil » libellé). */
  alt?: string
  /** Logo au-dessus de la ligne de flottaison (en-tête) : chargé en priorité. */
  priority?: boolean
  className?: string
}

const heights = { sm: 'h-8', md: 'h-10', lg: 'h-14' } as const

export function Logo({
  variant = 'color',
  size = 'md',
  alt = 'Amana Conseil',
  priority = false,
  className,
}: LogoProps) {
  const file = sources[variant]
  return (
    <Image
      src={file.src}
      width={file.width}
      height={file.height}
      alt={alt}
      priority={priority}
      unoptimized
      className={cn('block w-auto', heights[size], className)}
    />
  )
}
