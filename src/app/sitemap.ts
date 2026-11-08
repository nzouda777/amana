import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'

import { legalSlugs } from '@/features/site/legal'
import { collectionTag } from '@/lib/cache/tags'
import type { AppPathname } from '@/lib/i18n/routing'
import { getPayloadClient } from '@/lib/payload'
import { getSiteUrl } from '@/lib/seo/config'
import { buildSitemap, type SitemapDoc } from '@/lib/seo/sitemap'

/** Régénéré au plus toutes les heures ; invalidé par les hooks Payload (tags de collection). */
export const revalidate = 3600

const serviceRoutes: Partial<Record<string, AppPathname>> = {
  audit: '/audit-conformite/[slug]',
  conseil: '/conseil-accompagnement/[slug]',
  takaful: '/takaful-finance/[slug]',
}

type Collection =
  | 'pages'
  | 'services'
  | 'case-studies'
  | 'posts'
  | 'guides'
  | 'glossary-terms'
  | 'courses'
  | 'paths'

const loadDocs = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const find = async (collection: Collection, drafts: boolean) => {
      const result = await payload.find({
        collection,
        where: drafts ? { _status: { equals: 'published' } } : {},
        locale: 'fr',
        depth: 0,
        limit: 1000,
        pagination: false,
        select: { slug: true, updatedAt: true, seo: true },
        overrideAccess: false,
      })
      return result.docs as SitemapDoc[]
    }
    const services = await payload.find({
      collection: 'services',
      where: { _status: { equals: 'published' } },
      locale: 'fr',
      depth: 0,
      limit: 1000,
      pagination: false,
      select: { slug: true, updatedAt: true, seo: true, pillar: true },
      overrideAccess: false,
    })
    const [pages, caseStudies, posts, guides, glossaryTerms, courses, paths] = await Promise.all([
      find('pages', true),
      find('case-studies', true),
      find('posts', true),
      find('guides', true),
      find('glossary-terms', false),
      find('courses', true),
      find('paths', true),
    ])
    return {
      pages,
      caseStudies,
      posts,
      guides,
      glossaryTerms,
      courses,
      paths,
      services: services.docs.flatMap((service) => {
        const route = serviceRoutes[service.pillar]
        return route ? [{ ...service, route }] : []
      }),
    }
  },
  ['sitemap'],
  {
    tags: [
      'pages',
      'services',
      'case-studies',
      'posts',
      'guides',
      'glossary-terms',
      'courses',
      'paths',
    ].map(collectionTag),
  },
)

/** Sitemap des pages publiques indexables (locales ouvertes seulement, ADR 014). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docs = await loadDocs()
  return buildSitemap(getSiteUrl(), { ...docs, legalSlugs })
}
