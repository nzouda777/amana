import type { useTranslations } from 'next-intl'

import type { NavItem } from '@/components/patterns/SiteHeader'
import type { SiteFooterProps } from '@/components/patterns/SiteFooter'
import type { Pillar } from '@/components/patterns/PillarIndex'

type DemoT = ReturnType<typeof useTranslations<'styleguide.demo'>>

/** Données de démonstration : en M2, elles viennent des globals Payload `navigation` et `footer`. */
export function demoNavigation(t: DemoT): NavItem[] {
  return [
    {
      id: 'formation',
      label: t('nav.training'),
      title: t('nav.trainingTitle'),
      summary: t('nav.trainingSummary'),
      href: '/formation',
      offers: [
        {
          label: t('nav.offers.courses'),
          description: t('nav.offers.coursesDescription'),
          href: '/formation/cours',
        },
        {
          label: t('nav.offers.business'),
          description: t('nav.offers.businessDescription'),
          href: '/formation/entreprises',
        },
        {
          label: t('nav.offers.inPerson'),
          description: t('nav.offers.inPersonDescription'),
          href: '/formation/presentiel',
        },
      ],
      featured: {
        kind: t('nav.featuredKind'),
        title: t('nav.featuredTitle'),
        description: t('nav.featuredDescription'),
        href: {
          pathname: '/formation/cours/[slug]',
          params: { slug: 'introduction-finance-islamique' },
        },
        cta: t('nav.featuredCta'),
      },
    },
    {
      id: 'audit',
      label: t('nav.audit'),
      title: t('nav.auditTitle'),
      summary: t('nav.auditSummary'),
      href: '/audit-conformite',
      offers: [
        {
          label: t('nav.offers.products'),
          description: t('nav.offers.productsDescription'),
          href: { pathname: '/audit-conformite/[slug]', params: { slug: 'produits' } },
        },
        {
          label: t('nav.offers.window'),
          description: t('nav.offers.windowDescription'),
          href: { pathname: '/audit-conformite/[slug]', params: { slug: 'fenetre-islamique' } },
        },
        {
          label: t('nav.offers.followUp'),
          description: t('nav.offers.followUpDescription'),
          href: { pathname: '/audit-conformite/[slug]', params: { slug: 'suivi' } },
        },
      ],
      featured: {
        kind: t('nav.featuredAuditKind'),
        title: t('nav.featuredAuditTitle'),
        href: { pathname: '/ressources/guides/[slug]', params: { slug: 'premier-audit' } },
        cta: t('nav.featuredAuditCta'),
      },
    },
    {
      id: 'conseil',
      label: t('nav.advisory'),
      title: t('nav.advisoryTitle'),
      summary: t('nav.advisorySummary'),
      href: '/conseil-accompagnement',
      offers: [
        {
          label: t('nav.offers.structuring'),
          href: { pathname: '/conseil-accompagnement/[slug]', params: { slug: 'structuration' } },
        },
        {
          label: t('nav.offers.committee'),
          href: { pathname: '/conseil-accompagnement/[slug]', params: { slug: 'comite' } },
        },
        {
          label: t('nav.offers.policies'),
          href: { pathname: '/conseil-accompagnement/[slug]', params: { slug: 'politiques' } },
        },
      ],
    },
    {
      id: 'takaful',
      label: t('nav.takaful'),
      title: t('nav.takafulTitle'),
      summary: t('nav.takafulSummary'),
      href: '/takaful-finance',
      offers: [
        {
          label: t('nav.offers.takafulProducts'),
          href: { pathname: '/takaful-finance/[slug]', params: { slug: 'produits' } },
        },
        {
          label: t('nav.offers.financing'),
          href: { pathname: '/takaful-finance/[slug]', params: { slug: 'financement' } },
        },
        {
          label: t('nav.offers.takafulFaq'),
          href: { pathname: '/takaful-finance/[slug]', params: { slug: 'faq' } },
        },
      ],
    },
    { id: 'ressources', label: t('nav.resources'), href: '/ressources' },
    { id: 'a-propos', label: t('nav.about'), href: '/a-propos' },
  ]
}

const pillarSummaries = {
  formation: 'pillars.trainingSummary',
  audit: 'pillars.auditSummary',
  conseil: 'pillars.advisorySummary',
  takaful: 'pillars.takafulSummary',
} as const

export function demoPillars(t: DemoT): Pillar[] {
  return demoNavigation(t).flatMap((item) => {
    const summaryKey = pillarSummaries[item.id as keyof typeof pillarSummaries]
    if (!summaryKey || !item.offers) return []
    return [
      {
        id: item.id,
        title: item.title ?? item.label,
        summary: t(summaryKey),
        href: item.href,
        offers: item.offers.map(({ label, href }) => ({ label, href })),
      },
    ]
  })
}

export function demoFooter(t: DemoT): Omit<SiteFooterProps, 'year' | 'newsletter'> {
  return {
    columns: [
      {
        title: t('footer.training'),
        links: [
          { label: t('footer.catalogue'), href: '/formation/cours' },
          { label: t('footer.business'), href: '/formation/entreprises' },
          { label: t('footer.verify'), href: '/certificats/verifier' },
        ],
      },
      {
        title: t('footer.services'),
        links: [
          { label: t('footer.audit'), href: '/audit-conformite' },
          { label: t('footer.advisory'), href: '/conseil-accompagnement' },
          { label: t('footer.takaful'), href: '/takaful-finance' },
        ],
      },
      {
        title: t('footer.company'),
        links: [
          { label: t('footer.about'), href: '/a-propos' },
          { label: t('footer.resources'), href: '/ressources' },
          { label: t('footer.contact'), href: '/contact' },
        ],
      },
    ],
    contact: {
      address: [t('footer.address1'), t('footer.address2')],
      phone: { label: t('footer.phone'), href: 'tel:+237600000000' },
      email: { label: t('footer.email'), href: 'mailto:contact@amana-conseil.cm' },
      whatsapp: { label: t('footer.whatsapp'), href: 'https://wa.me/237600000000' },
    },
    legalLinks: [
      {
        label: t('footer.legal'),
        href: { pathname: '/legal/[slug]', params: { slug: 'mentions-legales' } },
      },
      { label: t('footer.terms'), href: { pathname: '/legal/[slug]', params: { slug: 'cgv' } } },
      {
        label: t('footer.privacy'),
        href: { pathname: '/legal/[slug]', params: { slug: 'confidentialite' } },
      },
    ],
  }
}
