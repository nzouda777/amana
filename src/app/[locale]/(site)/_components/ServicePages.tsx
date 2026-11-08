import { getTranslations } from 'next-intl/server'

import { ServiceTemplate } from '@/components/patterns/ServiceTemplate'
import type { Href } from '@/components/ui/Link'
import { isQuoteType } from '@/features/leads/schemas'
import { richTextToParagraphs } from '@/features/site/rich-text'
import { typographyFr } from '@/lib/typography'
import type { CaseStudy, Faq, Service } from '@/payload-types'
import type { LeadType } from '@/payload/shared'

import { getCaseStudies, getFaqsByTopic, getServicesByPillar } from '../_data/queries'
import type { Locale } from '../_data/cache'
import { pillarHubPath, quoteHref, serviceHref } from '../_lib/href'
import { pillarActionHref, pillarLeadType } from '../_lib/pillars'
import { populated } from './blocks/types'
import { Disclaimer } from './Disclaimer'
import { BreadcrumbJsonLd } from './JsonLd'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { ContactForm } from './forms/ContactForm'
import { RichText } from './RichText'

/**
 * Pôles de service (Audit, Conseil, Takaful) sur le gabarit commun `ServiceTemplate` :
 * hub du pôle (offres = services de la collection) et fiche d'un service.
 */

export type ServicePillar = 'audit' | 'conseil' | 'takaful'

const fr = (locale: Locale) => (text: string) => (locale === 'fr' ? typographyFr(text) : text)

function caseItems(cases: readonly CaseStudy[], anonymous: string) {
  return cases.map((item) => ({
    title: item.title,
    client: item.clientIsAnonymous ? (item.sector ?? anonymous) : (item.clientName ?? anonymous),
    summary: item.summary ?? '',
    href: { pathname: '/cas-clients/[slug]' as const, params: { slug: item.slug } },
  }))
}

function faqItems(faqs: readonly Faq[], locale: Locale) {
  const f = fr(locale)
  return faqs.map((faq) => ({
    id: String(faq.id),
    question: f(faq.question),
    answer: f(richTextToParagraphs(faq.answer)),
  }))
}

/** Action principale d'une fiche de service selon le type de demande. */
function serviceActionHref(leadType: LeadType | null | undefined, pillar: ServicePillar): Href {
  if (leadType === 'accompagnement') return '/rendez-vous'
  if (leadType === 'takaful') return '#contact-pole'
  if (leadType && isQuoteType(leadType)) return quoteHref(leadType)
  return pillarActionHref[pillar]
}

export async function ServiceHub({ pillar, locale }: { pillar: ServicePillar; locale: Locale }) {
  const [t, tc, services, faqs, cases] = await Promise.all([
    getTranslations({ locale, namespace: `site.services.${pillar}` }),
    getTranslations({ locale, namespace: 'site.services' }),
    getServicesByPillar(pillar, locale),
    getFaqsByTopic(pillar, locale),
    getCaseStudies(locale, { pillar }),
  ])
  const f = fr(locale)
  const breadcrumb: BreadcrumbItem[] = [{ label: tc('home'), href: '/' }, { label: t('title') }]
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumb} />
      <ServiceTemplate
        hero={{
          breadcrumb,
          title: t('title'),
          lead: t('lead'),
          primaryAction: { label: t('action'), href: pillarActionHref[pillar] },
        }}
        notice={pillar === 'takaful' ? <Disclaimer locale={locale} /> : undefined}
        problem={{ title: t('problemTitle'), paragraphs: [t('problem1'), t('problem2')] }}
        offers={services.map((service) => ({
          id: service.slug,
          title: f(service.title),
          description: f(service.summary ?? ''),
          href: serviceHref(pillar, service.slug),
        }))}
        cases={caseItems(cases, tc('anonymousClient'))}
        faq={faqItems(faqs, locale)}
        cta={{
          title: t('ctaTitle'),
          text: t('ctaText'),
          primaryAction: { label: t('action'), href: pillarActionHref[pillar] },
        }}
        form={
          <ContactForm
            subject={pillarLeadType[pillar]}
            fixedSubject
            compact
            sourcePage={pillarHubPath[pillar]}
          />
        }
      />
    </>
  )
}

export async function ServiceDetail({
  pillar,
  service,
  locale,
}: {
  pillar: ServicePillar
  service: Service
  locale: Locale
}) {
  const [t, tc, cases] = await Promise.all([
    getTranslations({ locale, namespace: `site.services.${pillar}` }),
    getTranslations({ locale, namespace: 'site.services' }),
    getCaseStudies(locale, { serviceId: service.id }),
  ])
  const f = fr(locale)
  const leadType = service.cta?.leadType ?? pillarLeadType[pillar]
  const actionLabel = service.cta?.label ?? t('action')
  const action = { label: actionLabel, href: serviceActionHref(leadType, pillar) }
  const faqs = (service.faq ?? []).filter(populated<Faq>)
  const contactSubject = isQuoteType(leadType) ? leadType : pillarLeadType[pillar]

  const breadcrumb: BreadcrumbItem[] = [
    { label: tc('home'), href: '/' },
    { label: t('title'), href: pillarHubPath[pillar] },
    { label: f(service.title) },
  ]
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumb} />
      <ServiceTemplate
        hero={{
          breadcrumb,
          title: f(service.title),
          lead: f(service.summary ?? ''),
          primaryAction: action,
        }}
        notice={pillar === 'takaful' ? <Disclaimer locale={locale} /> : undefined}
        problem={{
          title: tc('problemTitle'),
          content: service.problem ? (
            <RichText data={service.problem} locale={locale} bare />
          ) : undefined,
        }}
        offers={[]}
        offerContent={service.offer ? <RichText data={service.offer} locale={locale} /> : undefined}
        method={(service.method ?? []).map((step) => ({
          title: f(step.title),
          description: f(step.description ?? ''),
        }))}
        deliverables={(service.deliverables ?? []).map((item) => f(item.label))}
        cases={caseItems(cases, tc('anonymousClient'))}
        faq={faqItems(faqs, locale)}
        cta={{ title: tc('ctaTitle'), text: tc('ctaText'), primaryAction: action }}
        form={
          <ContactForm
            subject={contactSubject}
            fixedSubject
            compact
            sourcePage={`${pillarHubPath[pillar]}/${service.slug}`}
          />
        }
      />
    </>
  )
}
