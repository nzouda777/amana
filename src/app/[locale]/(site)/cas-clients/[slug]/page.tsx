import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { CTASection, Testimonial } from '@/components/patterns/Editorial'
import { Container, Section } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { routing } from '@/lib/i18n/routing'
import { typographyFr } from '@/lib/typography'
import type { Service, Testimonial as TestimonialDoc } from '@/payload-types'

import { populated } from '../../_components/blocks/types'
import { PageHeader } from '../../_components/PageHeader'
import { RichText } from '../../_components/RichText'
import { getCaseStudy, getCaseStudySlugs } from '../../_data/queries'
import { quoteHref, serviceHref } from '../../_lib/href'
import { pageMetadata, resolveLocale } from '../../_lib/page'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateStaticParams() {
  const slugs = await getCaseStudySlugs()
  return slugs.map((slug) => ({ locale: routing.defaultLocale, slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const item = await getCaseStudy(slug, locale)
  return item
    ? pageMetadata({
        locale,
        route: { pathname: '/cas-clients/[slug]', params: { slug } },
        title: item.title,
        description: item.summary,
        seo: item.seo,
      })
    : {}
}

/** Étude de cas : enjeu, démarche, résultats, chiffres clés, témoignage. */
export default async function CaseStudyPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const item = await getCaseStudy(slug, locale)
  if (!item) notFound()
  const t = await getTranslations('site.cases')
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)
  const services = (item.services ?? []).filter(populated<Service>)
  const testimonial = populated<TestimonialDoc>(item.testimonial) ? item.testimonial : null
  const client = item.clientIsAnonymous ? t('anonymous') : (item.clientName ?? t('anonymous'))
  const number = new Intl.NumberFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale)

  const sections = [
    { id: 'enjeu', title: t('challenge'), content: item.challenge },
    { id: 'demarche', title: t('approach'), content: item.approach },
    { id: 'resultats', title: t('results'), content: item.results },
  ].filter((section) => section.content)

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: t('home'), href: '/' },
          { label: t('title'), href: '/cas-clients' },
          { label: fr(item.title) },
        ]}
        title={fr(item.title)}
        lead={item.summary ? fr(item.summary) : undefined}
      >
        <dl className="grid gap-x-gutter gap-y-4 border-t border-line pt-6 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-small text-ink-muted">{t('client')}</dt>
            <dd className="text-body font-semibold">{client}</dd>
          </div>
          {item.sector ? (
            <div className="flex flex-col gap-1">
              <dt className="text-small text-ink-muted">{t('sector')}</dt>
              <dd className="text-body font-semibold">{item.sector}</dd>
            </div>
          ) : null}
          {services.length ? (
            <div className="flex flex-col gap-1">
              <dt className="text-small text-ink-muted">{t('services')}</dt>
              <dd className="flex flex-col">
                {services.map((service) => (
                  <Link
                    key={service.id}
                    href={serviceHref(service.pillar, service.slug)}
                    variant="standalone"
                  >
                    {fr(service.title)}
                  </Link>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </PageHeader>

      {item.keyFigures?.length ? (
        <Section tone="sand" spacing="compact" aria-label={t('keyFigures')}>
          <Container>
            <dl className="grid gap-x-gutter gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {item.keyFigures.map((figure) => (
                <div key={figure.id ?? figure.label} className="flex flex-col gap-2">
                  <dt className="order-2 text-body text-ink-muted">{fr(figure.label)}</dt>
                  <dd className="order-1 font-display text-h2 text-green-700 tabular">
                    {/^\d+$/.test(figure.value)
                      ? number.format(Number(figure.value))
                      : figure.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>
      ) : null}

      <Section>
        <Container className="flex flex-col gap-16">
          {sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="grid gap-6 lg:grid-cols-12 lg:gap-gutter"
            >
              <h2 id={section.id} className="text-h2 lg:col-span-4">
                {section.title}
              </h2>
              <div className="lg:col-span-7 lg:col-start-6">
                <RichText data={section.content} locale={locale} />
              </div>
            </section>
          ))}
        </Container>
      </Section>

      {testimonial ? (
        <Testimonial
          quote={fr(testimonial.quote)}
          author={testimonial.authorName}
          role={testimonial.authorRole ?? ''}
          organization={testimonial.organization ?? undefined}
        />
      ) : null}

      <CTASection
        id="cas-client-cta"
        title={t('ctaTitle')}
        text={t('ctaText')}
        primaryAction={{ label: t('ctaPrimary'), href: quoteHref(item.pillar) }}
        secondaryAction={{ label: t('ctaSecondary'), href: '/rendez-vous' }}
      />
    </>
  )
}
