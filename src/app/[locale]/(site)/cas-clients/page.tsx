import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { CTASection } from '@/components/patterns/Editorial'
import { ServiceCases } from '@/components/patterns/ServiceTemplate'
import { EmptyState } from '@/components/ui/EmptyState'
import { Container, Section } from '@/components/ui/Layout'
import { typographyFr } from '@/lib/typography'

import { PageHeader } from '../_components/PageHeader'
import { getCaseStudies } from '../_data/queries'
import { pageMetadata, localeParams, resolveLocale } from '../_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.cases' })
  return pageMetadata({
    locale,
    route: '/cas-clients',
    title: t('title'),
    description: t('metaDescription'),
  })
}

/** Index des cas clients (ADR 009). */
export default async function CaseStudiesPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const [t, cases] = await Promise.all([getTranslations('site.cases'), getCaseStudies(locale)])
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('home'), href: '/' }, { label: t('title') }]}
        title={t('title')}
        lead={t('lead')}
      />
      {cases.length === 0 ? (
        <Section>
          <Container>
            <EmptyState title={t('empty')} />
          </Container>
        </Section>
      ) : (
        <ServiceCases
          limit={cases.length}
          title={t('listTitle')}
          cases={cases.map((item) => ({
            title: fr(item.title),
            client: item.clientIsAnonymous
              ? (item.sector ?? t('anonymous'))
              : (item.clientName ?? t('anonymous')),
            summary: fr(item.summary ?? ''),
            href: { pathname: '/cas-clients/[slug]', params: { slug: item.slug } },
          }))}
        />
      )}
      <CTASection
        id="cas-clients-cta"
        title={t('ctaTitle')}
        text={t('ctaText')}
        primaryAction={{ label: t('ctaPrimary'), href: '/devis' }}
        secondaryAction={{ label: t('ctaSecondary'), href: '/rendez-vous' }}
      />
    </>
  )
}
