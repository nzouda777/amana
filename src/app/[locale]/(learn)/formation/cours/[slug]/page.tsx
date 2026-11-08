import { Award, Clock, Gauge, Languages, ListOrdered, Star } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { Trame } from '@/components/brand/Trame'
import { FAQ } from '@/components/patterns/FAQ'
import { StickyPurchase } from '@/components/patterns/StickyPurchase'
import { Avatar } from '@/components/ui/Avatar'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ButtonLink } from '@/components/ui/Button'
import { Container, Section } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { isoDuration, isPreviewable, outlineStats } from '@/features/lms/course-page'
import { richTextToParagraphs } from '@/features/site/rich-text'
import { routing } from '@/lib/i18n/routing'
import { toXaf } from '@/lib/money'
import { getSiteUrl } from '@/lib/seo/config'
import { courseJsonLd } from '@/lib/seo/jsonld'
import { defaultOgImageUrl } from '@/lib/seo/metadata'
import { absoluteUrl } from '@/lib/seo/paths'
import { typographyFr } from '@/lib/typography'

import { Disclaimer } from '../../../../(site)/_components/Disclaimer'
import { BreadcrumbJsonLd, JsonLd } from '../../../../(site)/_components/JsonLd'
import { RichText } from '../../../../(site)/_components/RichText'
import { getFaqsByTopic } from '../../../../(site)/_data/queries'
import { pageMetadata, resolveLocale } from '../../../../(site)/_lib/page'
import { CourseCardGrid, joinNames } from '../../../_components/CourseList'
import { CourseOutline } from '../../../_components/CourseOutline'
import { formatDate, getDurationFormatter } from '../../../_components/format'
import { LearnMessages } from '../../../_components/LearnMessages'
import { PreviewButton } from '../../../_components/PreviewButton'
import { getCourseDetail, getCourseSlugs } from '../../../_data/formation'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateStaticParams() {
  const slugs = await getCourseSlugs()
  return slugs.map((slug) => ({ locale: routing.defaultLocale, slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const course = await getCourseDetail(slug, locale)
  if (!course) return {}
  return pageMetadata({
    locale,
    route: { pathname: '/formation/cours/[slug]', params: { slug: course.card.slug } },
    title: course.card.title,
    description: course.card.summary,
    seo: course.seo,
  })
}

const schemaLevels = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

/**
 * Fiche cours (DESIGN §9) : thème et niveau, titre, chapeau, formateurs, durée, leçons ;
 * objectifs ; programme dépliable avec extraits jouables ; formateurs, avis, FAQ, cours
 * associés ; panneau d'achat collant. Aucun contenu payant dans le HTML : seul le plan est
 * rendu, les extraits gratuits se chargent à la demande.
 */
export default async function CoursePage({ params }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const course = await getCourseDetail(slug, locale)
  if (!course) notFound()

  const [t, tl, faqs, duration] = await Promise.all([
    getTranslations('learn.course'),
    getTranslations('learn'),
    getFaqsByTopic('formation', locale),
    getDurationFormatter(locale),
  ])
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)
  const { card } = course
  const stats = outlineStats(course.modules)
  const isCapsule = card.format === 'capsule'
  const forBusiness = isCapsule || course.audience === 'business'
  const instructors = joinNames(card.instructors, locale)
  const theme = card.themes[0]

  const siteUrl = getSiteUrl()
  const route = { pathname: '/formation/cours/[slug]' as const, params: { slug: card.slug } }
  const url = absoluteUrl(siteUrl, locale, route)
  const jsonLd = courseJsonLd({
    siteUrl,
    url,
    name: card.title,
    description: card.summary ?? course.seo?.description ?? card.title,
    inLanguage: card.language,
    imageUrl: card.cover?.src.startsWith('http')
      ? card.cover.src
      : card.cover
        ? `${siteUrl}${card.cover.src}`
        : defaultOgImageUrl(siteUrl, locale),
    instructors: card.instructors,
    educationalLevel: card.level ? schemaLevels[card.level] : null,
    timeRequired: isoDuration(card.durationMinutes),
    priceXaf: card.price,
    rating:
      course.reviews.average === null
        ? null
        : { average: course.reviews.average, count: course.reviews.count },
    about: card.themes.map((item) => item.title),
  })

  const breadcrumb = [
    { label: tl('breadcrumb.home'), href: '/' as const },
    { label: tl('breadcrumb.formation'), href: '/formation' as const },
    { label: tl('breadcrumb.catalog'), href: '/formation/cours' as const },
    { label: card.title },
  ]

  const includes = [
    t('includes.lessons', { count: stats.lessons }),
    t('includes.duration', { duration: duration(card.durationMinutes) }),
    ...(stats.quizzes > 0 ? [t('includes.quizzes', { count: stats.quizzes })] : []),
    ...(course.certificateEnabled ? [t('includes.certificate')] : []),
    t('includes.mobile'),
  ]

  const firstPreview = course.modules.flatMap((module) => module.lessons).find(isPreviewable)
  const panelPreview = course.hasTrailer ? (
    <PreviewButton
      target={{ kind: 'trailer', courseId: card.id, media: 'video' }}
      title={card.title}
      label={t('watchTrailer')}
      variant="button"
    />
  ) : firstPreview ? (
    <PreviewButton
      target={{
        kind: 'lesson',
        courseId: card.id,
        lessonId: firstPreview.id,
        media: firstPreview.type === 'video' ? 'video' : 'text',
      }}
      title={firstPreview.title}
      label={firstPreview.type === 'video' ? t('watchPreview') : t('readPreview')}
      variant="button"
    />
  ) : undefined

  // M4 (commerce) n'est pas livré : action honnête, sans panier ni fausse rareté.
  const primaryAction = forBusiness ? (
    <ButtonLink href={{ pathname: '/devis', query: { type: 'formation-entreprise' } }} fullWidth>
      {t('cta.business')}
    </ButtonLink>
  ) : (
    <ButtonLink href={{ pathname: '/contact', query: { sujet: 'contact' } }} fullWidth>
      {t('cta.request')}
    </ButtonLink>
  )

  const media = (
    <div className="relative aspect-video bg-sand-100">
      {card.cover ? (
        <Image
          src={card.cover.src}
          alt={card.cover.alt}
          fill
          priority
          sizes="(min-width: 1024px) 400px, 100vw"
          className="object-cover"
        />
      ) : (
        <Trame density={4} rows={3} opacity={0.12} className="absolute inset-0 size-full" />
      )}
    </div>
  )

  const facts = [
    { icon: Clock, label: t('facts.duration'), value: duration(card.durationMinutes) },
    {
      icon: ListOrdered,
      label: t('facts.lessons'),
      value: t('facts.lessonsValue', { count: stats.lessons }),
    },
    ...(card.level
      ? [{ icon: Gauge, label: t('facts.level'), value: tl(`levels.${card.level}`) }]
      : []),
    { icon: Languages, label: t('facts.language'), value: tl(`languages.${card.language}`) },
    ...(course.certificateEnabled
      ? [{ icon: Award, label: t('facts.certificate'), value: t('facts.certificateValue') }]
      : []),
  ]

  return (
    <LearnMessages namespaces={['preview']}>
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd items={breadcrumb} />

      <Container className="pt-6">
        <Breadcrumb items={breadcrumb} />
      </Container>

      <Container className="grid gap-12 pt-8 pb-section lg:grid-cols-12 lg:gap-gutter">
        <div className="flex min-w-0 flex-col gap-16 lg:col-span-7">
          <header className="flex flex-col gap-6 border-b border-line pb-12">
            <p className="text-small text-ink-muted">
              {[theme?.title, tl(`formats.${card.format}`)].filter(Boolean).join(', ')}
            </p>
            <h1 className="text-h1">{card.title}</h1>
            {course.subtitle || card.summary ? (
              <p className="max-w-measure text-body-lg text-ink-muted">
                {course.subtitle ?? card.summary}
              </p>
            ) : null}
            {instructors ? (
              <p className="text-body text-ink">{t('byInstructors', { names: instructors })}</p>
            ) : null}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-2">
                  <fact.icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-green-700" />
                  <div className="flex flex-col">
                    <dt className="text-small text-ink-muted">{fact.label}</dt>
                    <dd className="tabular text-body text-ink">{fact.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </header>

          {course.objectives.length > 0 ? (
            <section aria-labelledby="objectifs" className="flex flex-col gap-6">
              <h2 id="objectifs" className="text-h2">
                {t('objectivesTitle')}
              </h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {course.objectives.map((objective) => (
                  <li key={objective} className="flex gap-3 text-body text-ink">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-gold-700"
                    />
                    {objective}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="programme" className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 id="programme" className="text-h2">
                {t('outlineTitle')}
              </h2>
              <p className="text-body text-ink-muted">
                {t('outlineSummary', {
                  modules: stats.modules,
                  lessons: stats.lessons,
                  duration: duration(card.durationMinutes),
                })}
                {stats.previews > 0 ? ` ${t('outlinePreviews', { count: stats.previews })}` : ''}
              </p>
            </div>
            <CourseOutline
              courseId={card.id}
              modules={course.modules}
              locale={locale}
              formatDuration={duration}
            />
          </section>

          {course.description || course.prerequisites ? (
            <section aria-labelledby="description" className="flex flex-col gap-6">
              <h2 id="description" className="text-h2">
                {t('descriptionTitle')}
              </h2>
              {course.description ? <RichText data={course.description} locale={locale} /> : null}
              {course.prerequisites ? (
                <div className="flex flex-col gap-2 rounded-panel bg-sand-100 p-6">
                  <h3 className="font-sans text-h4">{t('prerequisitesTitle')}</h3>
                  <p className="text-body text-ink-muted">{fr(course.prerequisites)}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {card.instructors.length > 0 ? (
            <section aria-labelledby="formateurs" className="flex flex-col gap-6">
              <h2 id="formateurs" className="text-h2">
                {t('instructorsTitle', { count: card.instructors.length })}
              </h2>
              <ul className="flex flex-col gap-4">
                {card.instructors.map((name) => (
                  <li key={name} className="flex items-center gap-4">
                    <Avatar name={name} decorative />
                    <div className="flex flex-col">
                      <span className="font-semibold text-ink">{name}</span>
                      <span className="text-small text-ink-muted">{t('instructorRole')}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="avis" className="flex flex-col gap-6">
            <h2 id="avis" className="text-h2">
              {t('reviews.title')}
            </h2>
            {course.reviews.average !== null ? (
              <p className="flex items-center gap-2 text-body-lg text-ink">
                <Star aria-hidden="true" className="size-6 fill-gold-500 text-gold-700" />
                <span className="tabular">
                  {t('reviews.average', {
                    average: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
                      course.reviews.average,
                    ),
                    count: course.reviews.count,
                  })}
                </span>
              </p>
            ) : null}
            {course.reviews.items.length > 0 ? (
              <ul className="flex flex-col">
                {course.reviews.items.map((review) => (
                  <li key={review.id} className="flex flex-col gap-2 border-t border-line py-5">
                    <p className="text-small text-ink-muted">
                      <span className="font-semibold text-ink">{review.author}</span>
                      {', '}
                      <span>{t('reviews.rating', { rating: review.rating })}</span>
                      {', '}
                      <time dateTime={review.date}>{formatDate(review.date, locale)}</time>
                    </p>
                    {review.body ? (
                      <p className="max-w-measure text-body text-ink">{review.body}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-small text-ink-muted">
              {course.reviews.count === 0
                ? t('reviews.none')
                : course.reviews.average === null
                  ? t('reviews.belowThreshold')
                  : t('reviews.policy')}
            </p>
          </section>

          {faqs.length > 0 ? (
            <FAQ
              id="faq"
              headingLevel={2}
              items={faqs.map((faq) => ({
                id: String(faq.id),
                question: fr(faq.question),
                answer: fr(richTextToParagraphs(faq.answer)),
              }))}
              structuredData
            />
          ) : null}

          {course.paths.length > 0 ? (
            <section aria-labelledby="parcours" className="flex flex-col gap-4">
              <h2 id="parcours" className="text-h3">
                {t('pathsTitle')}
              </h2>
              <ul className="flex flex-col gap-1">
                {course.paths.map((path) => (
                  <li key={path.slug}>
                    <Link
                      href={{ pathname: '/formation/parcours/[slug]', params: { slug: path.slug } }}
                      variant="standalone"
                    >
                      {path.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <StickyPurchase
            title={card.title}
            price={card.price === null ? undefined : toXaf(card.price)}
            compareAt={card.compareAt === null ? undefined : toXaf(card.compareAt)}
            priceNote={forBusiness ? t('priceBusiness') : t('priceOnRequest')}
            includes={includes}
            media={media}
            primaryAction={primaryAction}
            secondaryAction={panelPreview}
            note={forBusiness ? t('noteBusiness') : t('noteIndividual')}
          />
        </div>
      </Container>

      {course.related.length > 0 ? (
        <Section tone="sand" aria-labelledby="associes">
          <Container className="flex flex-col gap-10">
            <h2 id="associes" className="text-h2">
              {t('relatedTitle')}
            </h2>
            <CourseCardGrid cards={course.related} locale={locale} />
          </Container>
        </Section>
      ) : null}

      <div className="pt-section pb-32 lg:pb-section">
        <Disclaimer locale={locale} />
      </div>
    </LearnMessages>
  )
}
