import type { Where } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import type {
  CaseStudy,
  Category,
  Event,
  Faq,
  GlossaryTerm,
  Guide,
  Page,
  Post,
  Service,
  TeamMember,
} from '@/payload-types'
import type { Pillar } from '@/payload/shared'

import { cached, type Locale } from './cache'

/**
 * Lectures publiques du site (Local API). Toujours `overrideAccess: false` : les règles
 * d'accès publiques s'appliquent (brouillons, partenaires et témoignages non autorisés
 * exclus), et `depth` explicite (ADR 007).
 */

const published: Where = { _status: { equals: 'published' } }

type SlugCollection = 'pages' | 'services' | 'posts' | 'case-studies' | 'guides' | 'glossary-terms'

/**
 * Identifiant d'un document par son slug. Les slugs sont localisés : un contenu pas encore
 * traduit n'a pas de slug dans la locale demandée ; on retombe alors sur le slug français
 * (le contenu s'affiche avec le repli de locale de Payload).
 */
async function idBySlug(
  collection: SlugCollection,
  slug: string,
  locale: Locale,
  where: Where[] = [],
): Promise<number | null> {
  const payload = await getPayloadClient()
  for (const candidate of locale === 'fr' ? (['fr'] as const) : ([locale, 'fr'] as const)) {
    const result = await payload.find({
      collection,
      where: { and: [{ slug: { equals: slug } }, ...where] },
      locale: candidate,
      depth: 0,
      limit: 1,
      select: {},
      overrideAccess: false,
    })
    const doc = result.docs[0]
    if (doc) return doc.id
  }
  return null
}

/* ------------------------------------------------------------------ Globals */

export function getSiteGlobals(locale: Locale) {
  return cached(
    ['site-globals', locale],
    { globals: ['site-settings', 'navigation', 'footer', 'legal-disclaimer'] },
    async () => {
      const payload = await getPayloadClient()
      const read = <S extends 'site-settings' | 'navigation' | 'footer' | 'legal-disclaimer'>(
        slug: S,
      ) => payload.findGlobal({ slug, locale, depth: 0, overrideAccess: false })
      const [settings, navigation, footer, disclaimer] = await Promise.all([
        read('site-settings'),
        read('navigation'),
        read('footer'),
        read('legal-disclaimer'),
      ])
      return { settings, navigation, footer, disclaimer }
    },
  )
}

/* -------------------------------------------------------------------- Pages */

/** Page composée de blocs ; profondeur 2 pour les logos des partenaires (média). */
export function getPage(slug: string, locale: Locale): Promise<Page | null> {
  return cached(
    ['page', slug, locale],
    {
      collections: [
        'pages',
        'services',
        'testimonials',
        'partners',
        'case-studies',
        'faqs',
        'guides',
        'courses',
        'media',
      ],
    },
    async () => {
      const id = await idBySlug('pages', slug, locale, [published])
      if (id === null) return null
      const payload = await getPayloadClient()
      return payload.findByID({ collection: 'pages', id, locale, depth: 2, overrideAccess: false })
    },
  )
}

/* ----------------------------------------------------------------- Services */

export function getServicesByPillar(pillar: Pillar, locale: Locale): Promise<Service[]> {
  return cached(['services', pillar, locale], { collections: ['services'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'services',
      where: { and: [{ pillar: { equals: pillar } }, published] },
      sort: 'order',
      locale,
      depth: 0,
      limit: 50,
      overrideAccess: false,
    })
    return result.docs
  })
}

export function getService(pillar: Pillar, slug: string, locale: Locale): Promise<Service | null> {
  return cached(
    ['service', pillar, slug, locale],
    { collections: ['services', 'faqs'] },
    async () => {
      const id = await idBySlug('services', slug, locale, [
        published,
        { pillar: { equals: pillar } },
      ])
      if (id === null) return null
      const payload = await getPayloadClient()
      return payload.findByID({
        collection: 'services',
        id,
        locale,
        depth: 1,
        overrideAccess: false,
      })
    },
  )
}

/** Slugs publiés (locale par défaut) pour `generateStaticParams`. */
export function getServiceSlugs(pillar: Pillar): Promise<string[]> {
  return cached(['service-slugs', pillar], { collections: ['services'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'services',
      where: { and: [{ pillar: { equals: pillar } }, published] },
      locale: 'fr',
      depth: 0,
      limit: 200,
      select: { slug: true },
      overrideAccess: false,
    })
    return result.docs.map((doc) => doc.slug)
  })
}

export function getFaqsByTopic(topic: Faq['topic'], locale: Locale): Promise<Faq[]> {
  return cached(['faqs', topic ?? 'general', locale], { collections: ['faqs'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'faqs',
      where: { topic: { equals: topic } },
      sort: 'order',
      locale,
      depth: 0,
      limit: 30,
      overrideAccess: false,
    })
    return result.docs
  })
}

/* ------------------------------------------------------------- Cas clients */

export function getCaseStudies(
  locale: Locale,
  filter: { pillar?: Pillar; serviceId?: number } = {},
): Promise<CaseStudy[]> {
  return cached(
    ['case-studies', filter.pillar ?? '*', filter.serviceId ?? '*', locale],
    { collections: ['case-studies'] },
    async () => {
      const payload = await getPayloadClient()
      const conditions: Where[] = [published]
      if (filter.pillar) conditions.push({ pillar: { equals: filter.pillar } })
      if (filter.serviceId) conditions.push({ services: { contains: filter.serviceId } })
      const result = await payload.find({
        collection: 'case-studies',
        where: { and: conditions },
        sort: '-publishedAt',
        locale,
        depth: 0,
        limit: 50,
        overrideAccess: false,
      })
      return result.docs
    },
  )
}

export function getCaseStudy(slug: string, locale: Locale): Promise<CaseStudy | null> {
  return cached(
    ['case-study', slug, locale],
    { collections: ['case-studies', 'services', 'testimonials'] },
    async () => {
      const id = await idBySlug('case-studies', slug, locale, [published])
      if (id === null) return null
      const payload = await getPayloadClient()
      return payload.findByID({
        collection: 'case-studies',
        id,
        locale,
        depth: 1,
        overrideAccess: false,
      })
    },
  )
}

export function getCaseStudySlugs(): Promise<string[]> {
  return cached(['case-study-slugs'], { collections: ['case-studies'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'case-studies',
      where: published,
      locale: 'fr',
      depth: 0,
      limit: 200,
      select: { slug: true },
      overrideAccess: false,
    })
    return result.docs.map((doc) => doc.slug)
  })
}

/* ---------------------------------------------------------------- Articles */

export const POSTS_PER_PAGE = 9

export function getPosts(
  locale: Locale,
  options: { page?: number; categoryId?: number; limit?: number; excludeId?: number } = {},
) {
  const page = options.page ?? 1
  const limit = options.limit ?? POSTS_PER_PAGE
  return cached(
    ['posts', locale, page, limit, options.categoryId ?? '*', options.excludeId ?? '-'],
    { collections: ['posts', 'categories'] },
    async () => {
      const payload = await getPayloadClient()
      const conditions: Where[] = [published]
      if (options.categoryId) conditions.push({ categories: { contains: options.categoryId } })
      if (options.excludeId) conditions.push({ id: { not_equals: options.excludeId } })
      return payload.find({
        collection: 'posts',
        where: { and: conditions },
        sort: '-publishedAt',
        locale,
        depth: 1,
        page,
        limit,
        select: {
          title: true,
          slug: true,
          excerpt: true,
          categories: true,
          publishedAt: true,
          readingTimeMinutes: true,
        },
        populate: { categories: { title: true, slug: true } },
        overrideAccess: false,
      })
    },
  )
}

export function getPost(slug: string, locale: Locale): Promise<Post | null> {
  return cached(
    ['post', slug, locale],
    { collections: ['posts', 'categories', 'authors'] },
    async () => {
      const id = await idBySlug('posts', slug, locale, [published])
      if (id === null) return null
      const payload = await getPayloadClient()
      return payload.findByID({ collection: 'posts', id, locale, depth: 1, overrideAccess: false })
    },
  )
}

export function getPostSlugs(): Promise<string[]> {
  return cached(['post-slugs'], { collections: ['posts'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'posts',
      where: published,
      locale: 'fr',
      depth: 0,
      limit: 500,
      select: { slug: true },
      overrideAccess: false,
    })
    return result.docs.map((doc) => doc.slug)
  })
}

export function getCategories(locale: Locale): Promise<Category[]> {
  return cached(['categories', locale], { collections: ['categories'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'categories',
      sort: 'title',
      locale,
      depth: 0,
      limit: 100,
      overrideAccess: false,
    })
    return result.docs
  })
}

/* ---------------------------------------------------------------- Glossaire */

export function getGlossaryTerms(locale: Locale) {
  return cached(['glossary', locale], { collections: ['glossary-terms'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'glossary-terms',
      sort: 'term',
      locale,
      depth: 0,
      limit: 1000,
      select: {
        term: true,
        slug: true,
        transliteration: true,
        arabic: true,
        shortDefinition: true,
        synonyms: true,
      },
      overrideAccess: false,
    })
    return result.docs
  })
}

export function getGlossaryTerm(slug: string, locale: Locale): Promise<GlossaryTerm | null> {
  return cached(['glossary-term', slug, locale], { collections: ['glossary-terms'] }, async () => {
    const id = await idBySlug('glossary-terms', slug, locale)
    if (id === null) return null
    const payload = await getPayloadClient()
    return payload.findByID({
      collection: 'glossary-terms',
      id,
      locale,
      depth: 1,
      overrideAccess: false,
    })
  })
}

/* ------------------------------------------------------------------- Guides */

export function getGuides(locale: Locale) {
  return cached(['guides', locale], { collections: ['guides'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'guides',
      where: published,
      sort: '-updatedAt',
      locale,
      depth: 0,
      limit: 100,
      select: { title: true, slug: true, summary: true, pageCount: true, updatedAt: true },
      overrideAccess: false,
    })
    return result.docs
  })
}

export function getGuide(slug: string, locale: Locale): Promise<Guide | null> {
  return cached(['guide', slug, locale], { collections: ['guides'] }, async () => {
    const id = await idBySlug('guides', slug, locale, [published])
    if (id === null) return null
    const payload = await getPayloadClient()
    return payload.findByID({ collection: 'guides', id, locale, depth: 0, overrideAccess: false })
  })
}

/* --------------------------------------------------------------- Webinaires */

export function getWebinars(locale: Locale): Promise<Event[]> {
  return cached(['webinars', locale], { collections: ['events', 'team-members'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'events',
      where: { and: [{ kind: { equals: 'webinar' } }, published] },
      sort: '-startsAt',
      locale,
      depth: 1,
      limit: 100,
      populate: { 'team-members': { name: true, role: true } },
      overrideAccess: false,
    })
    return result.docs
  })
}

/* -------------------------------------------------------------------- Équipe */

export function getTeamMembers(
  locale: Locale,
  query: { ids: number[] } | { committee: boolean },
): Promise<TeamMember[]> {
  const key = 'ids' in query ? `ids:${query.ids.join(',')}` : `committee:${query.committee}`
  return cached(['team', key, locale], { collections: ['team-members', 'media'] }, async () => {
    const payload = await getPayloadClient()
    const where: Where =
      'ids' in query
        ? { id: { in: query.ids } }
        : { isComplianceCommittee: { equals: query.committee } }
    const result = await payload.find({
      collection: 'team-members',
      where,
      sort: 'order',
      locale,
      depth: 1,
      limit: 50,
      overrideAccess: false,
    })
    if (!('ids' in query)) return result.docs
    const byId = new Map(result.docs.map((doc) => [doc.id, doc]))
    return query.ids.flatMap((id) => {
      const doc = byId.get(id)
      return doc ? [doc] : []
    })
  })
}
