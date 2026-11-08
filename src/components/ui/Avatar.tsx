import { cva, type VariantProps } from 'class-variance-authority'
import Image from 'next/image'

import { cn } from './cn'

const avatarVariants = cva(
  'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-pill bg-green-50 font-semibold text-green-900',
  {
    variants: {
      size: {
        sm: 'size-8 text-caption',
        md: 'size-12 text-small',
        lg: 'size-16 text-body',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

const pixelSize = { sm: 32, md: 48, lg: 64 } as const

export type AvatarProps = VariantProps<typeof avatarVariants> & {
  /** Nom complet : sert au texte alternatif et aux initiales de repli. */
  name: string
  src?: string
  className?: string
  /** Avatar purement décoratif (le nom est écrit juste à côté). */
  decorative?: boolean
}

export function initials(name: string): string {
  // Mots commençant par une lettre seulement : « Awa Mbarga (démo) » donne « AM ».
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => /^\p{L}/u.test(part))
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toLocaleUpperCase()
}

/** Portrait rond ; initiales sur fond green-50 en l'absence de photo. */
export function Avatar({ name, src, size, className, decorative = false }: AvatarProps) {
  const px = pixelSize[size ?? 'md']
  return (
    <span
      className={cn(avatarVariants({ size }), className)}
      role={decorative || src ? undefined : 'img'}
      aria-label={decorative || src ? undefined : name}
      aria-hidden={decorative || undefined}
    >
      {src ? (
        <Image
          src={src}
          alt={decorative ? '' : name}
          width={px}
          height={px}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  )
}
