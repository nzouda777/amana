import { getTranslations } from 'next-intl/server'

import { CapsuleList, CapsuleRow, CourseCard } from '@/components/patterns/CourseCard'
import { cn } from '@/components/ui/cn'
import type { Locale } from '@/lib/i18n/config'
import { toXaf } from '@/lib/money'

import type { CourseCardData } from '../_data/formation'

/** « A, B et C » dans la langue de l'interface. */
export function joinNames(names: readonly string[], locale: Locale): string | undefined {
  if (names.length === 0) return undefined
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(names)
}

export const courseHref = (slug: string) =>
  ({ pathname: '/formation/cours/[slug]', params: { slug } }) as const

/**
 * Cours en cartes (DESIGN §8). Les capsules ne passent jamais par ici : liste compacte
 * (`CapsuleRows`), pour marquer la différence d'usage.
 */
export async function CourseCardGrid({
  cards,
  locale,
  headingLevel = 3,
  className,
}: {
  cards: readonly CourseCardData[]
  locale: Locale
  headingLevel?: 2 | 3
  className?: string
}) {
  const t = await getTranslations({ locale, namespace: 'learn.card' })
  return (
    <ul
      className={cn('grid gap-x-gutter gap-y-12 sm:grid-cols-2 lg:grid-cols-3', className)}
      role="list"
    >
      {cards.map((card) => (
        <li key={card.id} className="flex">
          <CourseCard
            className="w-full"
            href={courseHref(card.slug)}
            title={card.title}
            theme={card.themes[0]?.title ?? t('defaultTheme')}
            instructor={joinNames(card.instructors, locale)}
            durationMinutes={card.durationMinutes}
            level={card.level ?? 'beginner'}
            price={card.price === null ? undefined : toXaf(card.price)}
            compareAt={card.compareAt === null ? undefined : toXaf(card.compareAt)}
            priceNote={t('noUnitPrice')}
            image={card.cover ? { src: card.cover.src, alt: card.cover.alt } : undefined}
            hasFreePreview={card.hasFreePreview}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </ul>
  )
}

export async function CapsuleRows({
  cards,
  locale,
  label,
}: {
  cards: readonly CourseCardData[]
  locale: Locale
  label: string
}) {
  const t = await getTranslations({ locale, namespace: 'learn' })
  return (
    <CapsuleList label={label}>
      {cards.map((card) => (
        <CapsuleRow
          key={card.id}
          href={courseHref(card.slug)}
          title={card.title}
          summary={card.summary ?? undefined}
          durationMinutes={card.durationMinutes}
          roles={card.jobRoles.map((role) => t(`jobRoles.${role}`))}
        />
      ))}
    </CapsuleList>
  )
}
