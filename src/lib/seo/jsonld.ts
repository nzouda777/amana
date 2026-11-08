/**
 * Données structurées schema.org (SPEC §6) : constructeurs purs, testés par
 * `tests/unit/lib/seo.test.ts` avec `validateJsonLd`. Rendu : `serializeJsonLd` dans une
 * balise `<script type="application/ld+json">` (composant `JsonLd` du site).
 */

export type JsonLdNode = { '@type': string; [key: string]: unknown }
export type JsonLdDocument = { '@context': 'https://schema.org'; [key: string]: unknown }

const CONTEXT = 'https://schema.org' as const

/** Supprime les propriétés vides (undefined, null, chaîne vide, tableau vide). */
function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
    ),
  ) as T
}

/** JSON sûr dans un `<script>` : `<` échappé (aucune fermeture de balise possible). */
export function serializeJsonLd(data: JsonLdDocument): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export const organizationId = (siteUrl: string) => `${siteUrl}/#organization`
export const websiteId = (siteUrl: string) => `${siteUrl}/#website`

export type OrganizationInput = {
  siteUrl: string
  /** Page d'accueil de la locale (URL absolue). */
  homeUrl: string
  name: string
  legalName?: string | null
  description?: string | null
  logoUrl: string
  email?: string | null
  telephone?: string | null
  streetAddress?: string | null
  city?: string | null
  country?: string | null
  sameAs?: readonly string[]
  areaServed?: readonly string[]
  inLanguage: string
}

/**
 * Valeur provisoire du seed : `TODO(client)`, domaine réservé `.example` (RFC 2606) ou
 * numéro factice (+237 600 000 000). Jamais émise dans les données structurées.
 */
export function isPlaceholder(value: string): boolean {
  return value.includes('TODO') || /\.example\b/.test(value) || /^\+?\d{0,4}60{8}$/.test(value)
}

const real = (value: string | null | undefined) =>
  value && !isPlaceholder(value) ? value : undefined

/**
 * Graphe du site, émis par le gabarit : `Organization` (le cabinet), `ProfessionalService`
 * (l'activité de conseil, localisée à Douala) et `WebSite`.
 */
export function siteGraphJsonLd(input: OrganizationInput): JsonLdDocument {
  const address = real(input.city)
    ? compact({
        '@type': 'PostalAddress',
        streetAddress: real(input.streetAddress),
        addressLocality: real(input.city),
        addressCountry: input.country === 'Cameroun' ? 'CM' : real(input.country),
      })
    : undefined
  const organization = compact({
    '@type': 'Organization',
    '@id': organizationId(input.siteUrl),
    name: input.name,
    legalName: real(input.legalName),
    url: input.homeUrl,
    logo: input.logoUrl,
    description: input.description,
    email: real(input.email),
    telephone: real(input.telephone),
    address,
    sameAs: input.sameAs ? [...input.sameAs] : undefined,
  })
  const service = compact({
    '@type': 'ProfessionalService',
    '@id': `${input.siteUrl}/#service`,
    name: input.name,
    url: input.homeUrl,
    image: input.logoUrl,
    description: input.description,
    email: real(input.email),
    telephone: real(input.telephone),
    address,
    areaServed: input.areaServed ? [...input.areaServed] : undefined,
    parentOrganization: { '@id': organizationId(input.siteUrl) },
  })
  const website = compact({
    '@type': 'WebSite',
    '@id': websiteId(input.siteUrl),
    name: input.name,
    url: input.homeUrl,
    inLanguage: input.inLanguage,
    publisher: { '@id': organizationId(input.siteUrl) },
  })
  return { '@context': CONTEXT, '@graph': [organization, service, website] }
}

export type BreadcrumbEntry = { name: string; url?: string }

/** Fil d'Ariane ; la dernière étape (page courante) peut ne pas avoir d'URL. */
export function breadcrumbJsonLd(entries: readonly BreadcrumbEntry[]): JsonLdDocument {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, index) =>
      compact({ '@type': 'ListItem', position: index + 1, name: entry.name, item: entry.url }),
    ),
  }
}

export type ArticleInput = {
  siteUrl: string
  url: string
  headline: string
  description?: string | null
  datePublished?: string | null
  dateModified?: string | null
  authors: readonly { name: string; url?: string }[]
  imageUrl: string
  inLanguage: string
  section?: string | null
}

export function articleJsonLd(input: ArticleInput): JsonLdDocument {
  return {
    '@context': CONTEXT,
    ...compact({
      '@type': 'Article',
      mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
      url: input.url,
      headline: input.headline.slice(0, 110),
      description: input.description,
      image: [input.imageUrl],
      datePublished: input.datePublished,
      dateModified: input.dateModified ?? input.datePublished,
      author: input.authors.length
        ? input.authors.map((author) => compact({ '@type': 'Person', ...author }))
        : [{ '@id': organizationId(input.siteUrl) }],
      publisher: { '@id': organizationId(input.siteUrl) },
      inLanguage: input.inLanguage,
      articleSection: input.section,
    }),
  }
}

export type EventInput = {
  siteUrl: string
  name: string
  description?: string | null
  startDate: string
  endDate?: string | null
  /** Page publique de l'événement (liste des webinaires). */
  url: string
  /** Lien de connexion ; à défaut, la page publique. */
  joinUrl?: string | null
  imageUrl: string
  performers: readonly string[]
  inLanguage: string
  /** Gratuit (aucun produit lié). */
  free: boolean
}

/** Webinaire (événement en ligne). */
export function eventJsonLd(input: EventInput): JsonLdDocument {
  return {
    '@context': CONTEXT,
    ...compact({
      '@type': 'Event',
      name: input.name,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: { '@type': 'VirtualLocation', url: input.joinUrl ?? input.url },
      image: [input.imageUrl],
      url: input.url,
      inLanguage: input.inLanguage,
      organizer: { '@id': organizationId(input.siteUrl) },
      performer: input.performers.map((name) => ({ '@type': 'Person', name })),
      isAccessibleForFree: input.free,
    }),
  }
}

export type CourseInput = {
  siteUrl: string
  url: string
  name: string
  description: string
  inLanguage: string
  imageUrl: string
  instructors: readonly string[]
  /** `Beginner`, `Intermediate`, `Advanced` (libellés schema.org usuels). */
  educationalLevel?: string | null
  /** Durée ISO 8601 (`PT3H20M`). */
  timeRequired?: string
  /** Prix TTC en XAF entiers ; absent : pas d'offre publiée (aucun prix inventé). */
  priceXaf?: number | null
  /** Moyenne affichée seulement à partir de 3 avis publiés (SPEC §3). */
  rating?: { average: number; count: number } | null
  /** Thèmes du cours. */
  about?: readonly string[]
}

/**
 * Cours en ligne (`Course`, recommandations Google « Course info ») : fournisseur = le
 * cabinet, instance en ligne à son rythme, offre en XAF quand un produit est en vente.
 */
export function courseJsonLd(input: CourseInput): JsonLdDocument {
  const offers =
    input.priceXaf !== undefined && input.priceXaf !== null
      ? [
          {
            '@type': 'Offer',
            category: input.priceXaf === 0 ? 'Free' : 'Paid',
            price: input.priceXaf,
            priceCurrency: 'XAF',
            url: input.url,
          },
        ]
      : undefined
  return {
    '@context': CONTEXT,
    ...compact({
      '@type': 'Course',
      '@id': `${input.url}#course`,
      url: input.url,
      name: input.name.slice(0, 110),
      description: input.description,
      inLanguage: input.inLanguage,
      image: [input.imageUrl],
      provider: { '@id': organizationId(input.siteUrl) },
      educationalLevel: input.educationalLevel,
      timeRequired: input.timeRequired,
      about: input.about ? [...input.about] : undefined,
      isAccessibleForFree: input.priceXaf === 0,
      offers,
      hasCourseInstance: [
        compact({
          '@type': 'CourseInstance',
          courseMode: 'Online',
          courseWorkload: input.timeRequired,
          instructor: input.instructors.map((name) => ({ '@type': 'Person', name })),
        }),
      ],
      aggregateRating: input.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: input.rating.average,
            ratingCount: input.rating.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    }),
  }
}

export type FaqEntry = { question: string; answer: string }

export function faqPageJsonLd(entries: readonly FaqEntry[]): JsonLdDocument {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  }
}
