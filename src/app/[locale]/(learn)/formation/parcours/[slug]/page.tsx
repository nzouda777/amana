import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { StickyPurchase } from '@/components/patterns/StickyPurchase'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { formatPrice, Price } from '@/components/ui/Price'
import { routing } from '@/lib/i18n/routing'
import { toXaf } from '@/lib/money'

import { Disclaimer } from '../../../../(site)/_components/Disclaimer'
import { BreadcrumbJsonLd } from '../../../../(site)/_components/JsonLd'
import { RichText } from '../../../../(site)/_components/RichText'
import { pageMetadata, resolveLocale } from '../../../../(site)/_lib/page'
import { courseHref, joinNames } from '../../../_components/CourseList'
import { getDurationFormatter } from '../../../_components/format'
import { getPathDetail, getPathSlugs } from '../../../_data/formation'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateStaticParams() {
  const slugs = await getPathSlugs()
  return slugs.map((slug) => ({ locale: routing.defaultLocale, slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const path = await getPathDetail(slug, locale)
  if (!path) return {}
  return pageMetadata({
    locale,
    route: { pathname: '/formation/parcours/[slug]', params: { slug: path.slug } },
    title: path.title,
    description: path.summary,
    seo: path.seo,
  })
}

/**
 * Parcours (SPEC §2) : suite ordonnée de cours vendue à prix groupé, certificat de
 * parcours quand tous les cours sont terminés. Le prix des cours à l'unité est rappelé
 * pour comparaison (montants réels, aucun prix barré inventé).
 */
export default async function PathPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const path = await getPathDetail(slug, locale)
  if (!path) notFound()

  const [t, tl, duration] = await Promise.all([
    getTranslations('learn.path'),
    getTranslations('learn'),
    getDurationFormatter(locale),
  ])
  const totalMinutes = path.courses.reduce((sum, course) => sum + course.durationMinutes, 0)
  const breadcrumb = [
    { label: tl('breadcrumb.home'), href: '/' as const },
    { label: tl('breadcrumb.formation'), href: '/formation' as const },
    { label: tl('breadcrumb.catalog'), href: '/formation/cours' as const },
    { label: path.title },
  ]
  const includes = [
    tl('paths.courseCount', { count: path.courseCount }),
    t('includes.duration', { duration: duration(totalMinutes) }),
    ...(path.certificateEnabled ? [t('includes.certificate')] : []),
  ]

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumb} />
      <Container className="pt-6">
        <Breadcrumb items={breadcrumb} />
      </Container>
      <Container className="grid gap-12 pt-8 pb-section lg:grid-cols-12 lg:gap-gutter">
        <div className="flex min-w-0 flex-col gap-16 lg:col-span-7">
          <header className="flex flex-col gap-6 border-b border-line pb-12">
            <p className="text-small text-ink-muted">{t('kind')}</p>
            <h1 className="text-h1">{path.title}</h1>
            {path.summary ? (
              <p className="max-w-measure text-body-lg text-ink-muted">{path.summary}</p>
            ) : null}
          </header>

          <section aria-labelledby="cours-du-parcours" className="flex flex-col gap-6">
            <h2 id="cours-du-parcours" className="text-h2">
              {t('coursesTitle')}
            </h2>
            {/* Vraie séquence : la numérotation est légitime (DESIGN §9). */}
            <ol className="flex flex-col border-b border-line">
              {path.courses.map((course, index) => (
                <li
                  key={course.id}
                  className="grid gap-x-6 gap-y-2 border-t border-line py-6 sm:grid-cols-[3rem_1fr_auto]"
                >
                  <span aria-hidden="true" className="font-display text-h2 text-gold-700 tabular">
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-2">
                    <h3 className="text-h3">
                      <span className="sr-only">{t('step', { number: index + 1 })} </span>
                      <Link href={courseHref(course.slug)} variant="quiet" tone="ink">
                        {course.title}
                      </Link>
                    </h3>
                    {course.summary ? (
                      <p className="max-w-measure text-body text-ink-muted">{course.summary}</p>
                    ) : null}
                    <p className="text-small text-ink-muted">
                      {[
                        duration(course.durationMinutes),
                        course.level ? tl(`levels.${course.level}`) : null,
                        joinNames(course.instructors, locale),
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                  {course.price !== null ? (
                    <div className="sm:text-end">
                      <span className="sr-only">{t('unitPrice')} </span>
                      <Price amount={toXaf(course.price)} size="sm" />
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          {path.description ? (
            <section aria-labelledby="description" className="flex flex-col gap-6">
              <h2 id="description" className="text-h2">
                {t('descriptionTitle')}
              </h2>
              <RichText data={path.description} locale={locale} />
            </section>
          ) : null}
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <StickyPurchase
            title={path.title}
            price={path.price === null ? undefined : toXaf(path.price)}
            priceNote={t('priceOnRequest')}
            includes={includes}
            primaryAction={
              <ButtonLink href={{ pathname: '/contact', query: { sujet: 'contact' } }} fullWidth>
                {t('cta')}
              </ButtonLink>
            }
            note={
              path.price !== null && path.separatePrice !== null && path.separatePrice > path.price
                ? `${t('separatePrice', { amount: formatPrice(toXaf(path.separatePrice), locale) })} ${t('note')}`
                : t('note')
            }
          />
        </div>
      </Container>
      <div className="pb-32 lg:pb-section">
        <Disclaimer locale={locale} />
      </div>
    </>
  )
}
