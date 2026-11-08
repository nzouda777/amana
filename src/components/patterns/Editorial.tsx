import { useLocale } from 'next-intl'
import type { ReactNode } from 'react'

import { Trame } from '@/components/brand/Trame'
import { Avatar } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/components/ui/cn'
import { Container } from '@/components/ui/Layout'
import type { Href } from '@/components/ui/Link'

/* ---------------------------------------------------------------- CTASection */

export type CTAAction = { label: string; href: Href }

export type CTASectionProps = {
  title: string
  text?: string
  primaryAction: CTAAction
  secondaryAction?: CTAAction
  /** Formulaire en ligne (gabarit de service) : remplace la colonne d'actions. */
  form?: ReactNode
  /** Fragment de Trame en marge : rupture de section choisie, pas systématique. */
  withTrame?: boolean
  id?: string
}

/**
 * Bandeau d'appel à l'action (« Parlons de votre projet ») : aplat green-900, bouton or
 * (autorisé sur fond vert) et bouton contour clair.
 */
export function CTASection({
  title,
  text,
  primaryAction,
  secondaryAction,
  form,
  withTrame = false,
  id,
}: CTASectionProps) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="on-dark relative isolate overflow-hidden bg-green-900 py-section"
    >
      {withTrame ? (
        <Trame
          density={3}
          rows={3}
          className="absolute inset-y-0 end-0 -z-10 hidden h-full w-1/3 lg:block"
        />
      ) : null}
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-gutter">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <h2 id={headingId} className="text-h2 text-paper">
            {title}
          </h2>
          {text ? <p className="max-w-measure text-body-lg text-sand-300">{text}</p> : null}
          {form ? null : (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={primaryAction.href} variant="gold">
                {primaryAction.label}
              </ButtonLink>
              {secondaryAction ? (
                <ButtonLink href={secondaryAction.href} variant="outline-light">
                  {secondaryAction.label}
                </ButtonLink>
              ) : null}
            </div>
          )}
        </div>
        {form ? (
          <div className="rounded-panel bg-paper p-6 text-ink md:p-8 lg:col-span-5">{form}</div>
        ) : null}
      </Container>
    </section>
  )
}

/* --------------------------------------------------------------- Testimonial */

export type TestimonialProps = {
  quote: string
  author: string
  role: string
  organization?: string
  avatarSrc?: string
}

/**
 * Un seul témoignage, en grand (DESIGN §9) : Baskerville italique sur sand-300.
 * Les guillemets suivent la langue (« » en français, “ ” en anglais, ” “ en arabe).
 */
export function Testimonial({ quote, author, role, organization, avatarSrc }: TestimonialProps) {
  const locale = useLocale()
  const [open, close] = quoteMarks[locale]
  return (
    <section className="bg-sand-300 py-section">
      <Container>
        <figure className="flex max-w-xl flex-col gap-10">
          <blockquote className="font-display text-h2 text-ink italic">
            <p>
              {open}
              {quote}
              {close}
            </p>
          </blockquote>
          <figcaption className="flex items-center gap-4">
            <Avatar name={author} src={avatarSrc} size="lg" decorative />
            <span className="flex flex-col">
              <span className="text-body font-semibold text-ink">{author}</span>
              <span className="text-small text-ink-muted">
                {organization ? `${role}, ${organization}` : role}
              </span>
            </span>
          </figcaption>
        </figure>
      </Container>
    </section>
  )
}

const quoteMarks = {
  fr: ['« ', ' »'],
  en: ['“', '”'],
  ar: ['«', '»'],
} as const

/* ------------------------------------------------------------- StatsSentence */

export type StatsSegment = string | { value: number; label: string }

export type StatsSentenceProps = {
  /**
   * Phrase découpée : texte libre et chiffres clés (`{ value, label }`).
   * Ex. ['Depuis 2019, nous avons formé ', { value: 1200, label: 'professionnels' }, '…']
   */
  segments: readonly StatsSegment[]
  className?: string
}

/**
 * Chiffres clés intégrés à une phrase, pas en grille de compteurs (DESIGN §9).
 * Les nombres sont formatés selon la locale (espace fine en français), chiffres latins.
 */
export function StatsSentence({ segments, className }: StatsSentenceProps) {
  const locale = useLocale()
  const format = new Intl.NumberFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale)
  return (
    <p className={cn('max-w-xl font-display text-h2 text-ink tabular hyphens-manual', className)}>
      {segments.map((segment, index) =>
        typeof segment === 'string' ? (
          <span key={index}>{segment}</span>
        ) : (
          <strong key={index} className="font-regular text-green-700 tabular">
            {format.format(segment.value)}
            {segment.label ? ` ${segment.label}` : null}
          </strong>
        ),
      )}
    </p>
  )
}
