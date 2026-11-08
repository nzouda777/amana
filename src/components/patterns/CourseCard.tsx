import { Clock, Gauge, PlayCircle } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Trame } from '@/components/brand/Trame'
import { Badge, Tag } from '@/components/ui/Badge'
import { cn } from '@/components/ui/cn'
import { Link, type Href } from '@/components/ui/Link'
import { Price } from '@/components/ui/Price'
import type { Xaf } from '@/lib/money'

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export type CourseCardProps = {
  href: Href
  title: string
  /** Thème du catalogue (« Finance islamique »). */
  theme: string
  /** Formateurs, déjà joints (« Ibrahim A. et Clarisse F. ») ; absent : ligne masquée. */
  instructor?: string
  durationMinutes: number
  level: CourseLevel
  /** Absent : pas de vente à l'unité (inclus dans un parcours, un pack ou le pass). */
  price?: Xaf
  compareAt?: Xaf
  /** Mention affichée à la place du prix quand `price` est absent. */
  priceNote?: string
  /** Visuel 16:9 ; à défaut, aplat sable avec la Trame en filigrane. */
  image?: { src: string; alt: string }
  /** Badge « Extrait gratuit ». */
  hasFreePreview?: boolean
  headingLevel?: 2 | 3
  className?: string
}

/** Durée lisible : « 45 min », « 3 h », « 3 h 20 ». */
export function useDurationLabel() {
  const t = useTranslations('ui.duration')
  return (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return t('minutes', { minutes: m })
    if (m === 0) return t('hours', { hours: h })
    return t('hoursMinutes', { hours: h, minutes: String(m).padStart(2, '0') })
  }
}

/**
 * Carte de cours (DESIGN §8) : visuel 16:9, thème, titre Baskerville, formateur,
 * durée, niveau, prix. Pas d'ombre ni d'effet de survol sur la carte : seul le titre
 * se souligne. Toute la carte est cliquable via le lien du titre.
 */
export function CourseCard({
  href,
  title,
  theme,
  instructor,
  durationMinutes,
  level,
  price,
  compareAt,
  priceNote,
  image,
  hasFreePreview = false,
  headingLevel = 3,
  className,
}: CourseCardProps) {
  const t = useTranslations('ui.course')
  const duration = useDurationLabel()
  const Heading = `h${headingLevel}` as const

  return (
    <article className={cn('group relative flex flex-col gap-4', className)}>
      <div className="relative aspect-video overflow-hidden rounded-media bg-sand-100">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <Trame density={4} rows={3} opacity={0.12} className="absolute inset-0 size-full" />
        )}
        {hasFreePreview ? (
          <Badge
            tone="light"
            icon={<PlayCircle aria-hidden="true" />}
            className="absolute start-3 top-3"
          >
            {t('freePreview')}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <p className="text-small text-ink-muted">{theme}</p>
        <Heading className="text-h3">
          <Link
            href={href}
            variant="quiet"
            tone="ink"
            className="after:absolute after:inset-0 after:content-[''] group-is-hover:underline"
          >
            {title}
          </Link>
        </Heading>
        {instructor ? (
          <p className="text-small text-ink-muted">{t('instructor', { name: instructor })}</p>
        ) : null}
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-small text-ink-muted">
          <li className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" />
            <span className="sr-only">{t('durationLabel')}</span>
            <span className="tabular">{duration(durationMinutes)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Gauge aria-hidden="true" className="size-4" />
            <span className="sr-only">{t('levelLabel')}</span>
            {t(`level.${level}`)}
          </li>
        </ul>
        <div className="mt-auto border-t border-line pt-3">
          {price === undefined ? (
            <p className="text-small text-ink-muted">{priceNote}</p>
          ) : (
            <Price amount={price} compareAt={compareAt} size="sm" />
          )}
        </div>
      </div>
    </article>
  )
}

/* ----------------------------------------------------------------- Capsules */

export type CapsuleRowProps = {
  href: Href
  title: string
  /** Une ligne : ce que la capsule permet de faire. */
  summary?: string
  durationMinutes: number
  /** Métiers ciblés (conformité, front office…). */
  roles: readonly string[]
  /** Lien vers l'aperçu de 30 secondes. */
  previewHref?: Href
}

/**
 * Ligne de capsule entreprise : liste compacte, pas de carte, pour marquer la
 * différence d'usage avec les cours (DESIGN §8). À placer dans `CapsuleList`.
 */
export function CapsuleRow({
  href,
  title,
  summary,
  durationMinutes,
  roles,
  previewHref,
}: CapsuleRowProps) {
  const t = useTranslations('ui.capsule')
  return (
    <li className="grid gap-x-gutter gap-y-2 border-t border-line py-5 md:grid-cols-12 md:items-center">
      <div className="flex flex-col gap-1 md:col-span-6">
        <h3 className="font-sans text-h4">
          <Link
            href={href}
            variant="quiet"
            tone="ink"
            className="inline-flex min-h-11 items-center is-hover:text-green-700 is-hover:underline"
          >
            {title}
          </Link>
        </h3>
        {summary ? <p className="text-small text-ink-muted">{summary}</p> : null}
      </div>
      <ul aria-label={t('roles')} className="flex flex-wrap gap-2 md:col-span-3">
        {roles.map((role) => (
          <li key={role}>
            <Tag>{role}</Tag>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-1.5 text-small text-ink-muted md:col-span-1">
        <Clock aria-hidden="true" className="size-4" />
        <span className="sr-only">{t('durationLabel')}</span>
        <span className="tabular">{t('duration', { minutes: durationMinutes })}</span>
      </p>
      <div className="md:col-span-2 md:text-end">
        {previewHref ? (
          <Link
            href={previewHref}
            variant="standalone"
            className="inline-flex min-h-11 items-center gap-1.5 text-small"
          >
            <PlayCircle aria-hidden="true" className="size-4" />
            {t('preview')}
          </Link>
        ) : null}
      </div>
    </li>
  )
}

export function CapsuleList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="border-b border-line">
      {children}
    </ul>
  )
}
