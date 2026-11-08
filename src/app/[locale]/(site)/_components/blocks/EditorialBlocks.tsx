import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { CTASection, StatsSentence, Testimonial } from '@/components/patterns/Editorial'
import { FAQ } from '@/components/patterns/FAQ'
import { ServiceCases, ServiceMethod } from '@/components/patterns/ServiceTemplate'
import { Container, Section, SectionHeader } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { resolveStatsSentence } from '@/features/content/key-figures'
import { richTextToParagraphs } from '@/features/site/rich-text'
import { typographyFr } from '@/lib/typography'
import type { CaseStudy, Faq, Media, Partner, Testimonial as TestimonialDoc } from '@/payload-types'

import { CourseCardGrid } from '../../../(learn)/_components/CourseList'
import { getCourseCards, getFeaturedCourseCards } from '../../../(learn)/_data/formation'
import { getSiteGlobals } from '../../_data/queries'
import { cmsHref } from '../../_lib/href'
import { RichText } from '../RichText'
import { type BlockContext, type BlockOf, populated } from './types'

/* Un composant par bloc de `pages.layout` (src/payload/blocks/index.ts). */

const frText = (locale: string) => (text: string) => (locale === 'fr' ? typographyFr(text) : text)

export function RichTextBlock({
  block,
  context,
}: {
  block: BlockOf<'richText'>
  context: BlockContext
}) {
  return (
    <Section>
      <Container>
        <RichText data={block.content} locale={context.locale} />
      </Container>
    </Section>
  )
}

/** Chiffres clés dans une phrase (ADR 010) : jetons `{{cle}}` résolus contre les réglages. */
export async function StatsBlock({
  block,
  context,
}: {
  block: BlockOf<'stats'>
  context: BlockContext
}) {
  const { settings } = await getSiteGlobals(context.locale)
  const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'
  const segments = resolveStatsSentence(
    frText(context.locale)(block.sentence),
    settings.keyFigures ?? [],
    mode,
  )
  if (!segments) {
    console.warn(`[stats] phrase masquée : clé de chiffre inconnue (page ${context.pageSlug})`)
    return null
  }
  return (
    <Section tone="sand" spacing="compact">
      <Container>
        <StatsSentence
          segments={segments.map((segment) => {
            if (segment.kind === 'text') return segment.text
            const value = Number(segment.value.replace(/[^\d]/g, ''))
            return Number.isFinite(value) && segment.value.trim() !== ''
              ? { value, label: '' }
              : segment.value
          })}
        />
      </Container>
    </Section>
  )
}

export function MethodBlock({
  block,
  context,
}: {
  block: BlockOf<'method'>
  context: BlockContext
}) {
  const fr = frText(context.locale)
  return (
    <ServiceMethod
      title={fr(block.title)}
      intro={block.intro ? fr(block.intro) : undefined}
      steps={block.steps.map((step) => ({
        title: fr(step.title),
        description: fr(step.description),
      }))}
    />
  )
}

/** Un seul témoignage, en grand (DESIGN §9) : le premier autorisé de la sélection. */
export function TestimonialsBlock({
  block,
  context,
}: {
  block: BlockOf<'testimonials'>
  context: BlockContext
}) {
  const item = (block.items ?? []).filter(populated<TestimonialDoc>)[0]
  if (!item) return null
  const fr = frText(context.locale)
  const photo = populated<Media>(item.photo) ? item.photo : null
  return (
    <Testimonial
      quote={fr(item.quote)}
      author={item.authorName}
      role={item.authorRole ?? ''}
      organization={item.organization ?? undefined}
      avatarSrc={photo?.sizes?.thumbnail?.url ?? photo?.url ?? undefined}
    />
  )
}

/** Logos des partenaires dont l'affichage est autorisé ; bloc masqué s'il n'y en a aucun. */
export async function PartnersBlock({
  block,
  context,
}: {
  block: BlockOf<'partners'>
  context: BlockContext
}) {
  const partners = (block.items ?? [])
    .filter(populated<Partner>)
    .filter((partner) => partner.displayAuthorized)
  if (partners.length === 0) return null
  const t = await getTranslations({ locale: context.locale, namespace: 'site.blocks' })
  const id = `bloc-${context.index}`
  return (
    <Section spacing="compact" aria-labelledby={id} className="border-b border-line">
      <Container className="flex flex-col gap-8">
        <h2 id={id} className="font-sans text-h4 text-ink-muted">
          {block.title ?? t('partners')}
        </h2>
        <ul className="flex flex-wrap items-center gap-x-12 gap-y-8">
          {partners.map((partner) => {
            const logo = populated<Media>(partner.logo) ? partner.logo : null
            return (
              <li key={partner.id}>
                {logo?.url ? (
                  <Image
                    src={logo.url}
                    alt={partner.name}
                    width={logo.width ?? 160}
                    height={logo.height ?? 48}
                    className="h-10 w-auto grayscale"
                  />
                ) : (
                  <span className="font-display text-h4 text-ink-muted">{partner.name}</span>
                )}
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}

export async function CaseStudiesBlock({
  block,
  context,
}: {
  block: BlockOf<'caseStudies'>
  context: BlockContext
}) {
  const items = (block.items ?? []).filter(populated<CaseStudy>)
  if (items.length === 0) return null
  const t = await getTranslations({ locale: context.locale, namespace: 'site.cases' })
  return (
    <ServiceCases
      title={block.title ?? undefined}
      cases={items.map((item) => ({
        title: item.title,
        client: item.clientIsAnonymous ? (item.sector ?? t('anonymous')) : (item.clientName ?? ''),
        summary: item.summary ?? '',
        href: { pathname: '/cas-clients/[slug]', params: { slug: item.slug } },
      }))}
    />
  )
}

export function FaqBlock({
  block,
  context,
  structuredData = true,
}: {
  block: BlockOf<'faq'>
  context: BlockContext
  structuredData?: boolean
}) {
  const items = (block.items ?? []).filter(populated<Faq>)
  if (items.length === 0) return null
  const fr = frText(context.locale)
  const id = `bloc-${context.index}`
  return (
    <Section aria-labelledby={id}>
      <Container>
        <FAQ
          id={id}
          title={block.title ?? undefined}
          structuredData={structuredData}
          items={items.map((item) => ({
            id: String(item.id),
            question: fr(item.question),
            answer: fr(richTextToParagraphs(item.answer)),
          }))}
        />
      </Container>
    </Section>
  )
}

/** Bandeau final ; propose le devis en action secondaire quand l'action principale est autre. */
export async function CtaBlock({
  block,
  context,
}: {
  block: BlockOf<'ctaSection'>
  context: BlockContext
}) {
  const t = await getTranslations({ locale: context.locale, namespace: 'site.blocks' })
  const fr = frText(context.locale)
  // Lien du CMS non résolu (inconnu, mal encodé, route non livrée) : action « Nous contacter »
  // avec son propre libellé, pour ne jamais annoncer une destination qui n'est pas la bonne.
  const target = cmsHref(block.cta?.href)
  const primaryAction = target
    ? { label: block.cta?.label ?? t('contactUs'), href: target }
    : { label: t('contactUs'), href: '/contact' as const }
  const isQuote = Boolean(target) && block.cta?.href?.trim().startsWith('/devis')
  return (
    <CTASection
      id={`bloc-${context.index}`}
      title={fr(block.title)}
      text={block.text ? fr(block.text) : undefined}
      primaryAction={primaryAction}
      secondaryAction={
        isQuote
          ? { label: t('appointment'), href: '/rendez-vous' }
          : { label: t('requestQuote'), href: '/devis' }
      }
    />
  )
}

export function MediaBlock({ block }: { block: BlockOf<'media'> }) {
  const media = populated<Media>(block.media) ? block.media : null
  if (!media?.url) return null
  return (
    <Section spacing="compact">
      <Container>
        <figure className="flex flex-col gap-3">
          <Image
            src={media.url}
            alt={media.alt}
            width={media.width ?? 1280}
            height={media.height ?? 720}
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="h-auto w-full rounded-media"
          />
          {block.caption ? (
            <figcaption className="text-small text-ink-muted">{block.caption}</figcaption>
          ) : null}
        </figure>
      </Container>
    </Section>
  )
}

/**
 * Cours à la une (DESIGN §9 : trois cartes et un lien vers le catalogue). Cours choisis
 * dans l'éditeur, dans l'ordre ; à défaut, les cours marqués « À la une ». Les capsules
 * n'ont pas leur place en cartes (DESIGN §8) : elles sont ignorées ici.
 */
export async function FeaturedCoursesBlock({
  block,
  context,
}: {
  block: BlockOf<'featuredCourses'>
  context: BlockContext
}) {
  const ids = (block.courses ?? []).map((course) =>
    typeof course === 'object' ? course.id : course,
  )
  const cards = (
    ids.length > 0
      ? await getCourseCards(ids, context.locale)
      : await getFeaturedCourseCards(context.locale)
  )
    .filter((card) => card.format === 'course')
    .slice(0, 3)
  if (cards.length === 0) return null
  const t = await getTranslations({ locale: context.locale, namespace: 'learn.featured' })
  const id = `bloc-${context.index}`
  return (
    <Section aria-labelledby={id}>
      <Container>
        <SectionHeader
          id={id}
          title={block.title ?? t('title')}
          action={
            <Link href="/formation/cours" variant="standalone">
              {t('catalog')}
            </Link>
          }
        />
        <CourseCardGrid cards={cards} locale={context.locale} />
      </Container>
    </Section>
  )
}
