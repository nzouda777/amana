import { sql } from '@payloadcms/db-postgres'
import type { Where } from 'payload'

import { type CatalogEntry, type CatalogLanguage } from '@/features/lms/catalog'
import { buildPublicOutline, type PublicModule } from '@/features/lms/course-page'
import { summarizeRatings } from '@/features/lms/reviews'
import { toPrefixTsQuery } from '@/features/site/search'
import { getPayloadClient } from '@/lib/payload'
import type { Category, Course, Media, Path } from '@/payload-types'

import { cached, type Locale } from '../../(site)/_data/cache'

/**
 * Lectures publiques de la formation (Local API, `overrideAccess: false`, `depth`
 * explicite, ADR 007). Deux exceptions, toujours avec une projection minimale :
 * - les **noms des formateurs** et le **prénom des auteurs d'avis**, stockés dans `users`
 *   (lecture réservée au titulaire du compte) : `firstName` et `lastName` seulement ;
 * - aucune autre. Les champs protégés des leçons (vidéo, texte, PDF, transcription) ne
 *   sont jamais sélectionnés ici : la fiche publique ne contient aucun contenu payant.
 */

const published: Where = { _status: { equals: 'published' } }

const formationCollections = [
  'courses',
  'modules',
  'lessons',
  'products',
  'categories',
  'media',
  'paths',
  'reviews',
] as const

/* ------------------------------------------------------------------ Partagé */

export type ThemeRef = { slug: string; title: string }
export type CoverImage = { src: string; alt: string; width: number; height: number }

export type CourseCardData = Omit<CatalogEntry, 'id'> & {
  id: number
  themes: ThemeRef[]
  instructors: string[]
  compareAt: number | null
  hasFreePreview: boolean
  jobRoles: NonNullable<Course['jobRoles']>
  cover: CoverImage | null
}

const populatedCategory = (value: number | Category | null | undefined): ThemeRef[] =>
  value && typeof value === 'object' ? [{ slug: value.slug, title: value.title }] : []

function coverOf(value: number | Media | null | undefined): CoverImage | null {
  if (!value || typeof value !== 'object' || !value.url) return null
  const card = value.sizes?.card
  return card?.url
    ? { src: card.url, alt: value.alt, width: card.width ?? 640, height: card.height ?? 360 }
    : { src: value.url, alt: value.alt, width: value.width ?? 1280, height: value.height ?? 720 }
}

const relationIds = (values: readonly (number | { id: number })[] | null | undefined): number[] =>
  (values ?? []).map((value) => (typeof value === 'object' ? value.id : value))

/** « Prénom Nom » des formateurs (champs publics uniquement). */
async function instructorNames(ids: readonly number[]): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'users',
    where: { id: { in: [...new Set(ids)] } },
    select: { firstName: true, lastName: true },
    depth: 0,
    pagination: false,
    // `users` n'est lisible que par son titulaire : projection des seuls noms affichés.
    overrideAccess: true,
  })
  return new Map(
    result.docs.map((doc) => [
      doc.id,
      [doc.firstName, doc.lastName].filter(Boolean).join(' ').trim(),
    ]),
  )
}

/** Prix des produits « cours » en vente, par cours. */
async function coursePrices(
  courseIds: readonly number[],
): Promise<Map<number, { price: number; compareAt: number | null }>> {
  if (courseIds.length === 0) return new Map()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: {
      and: [
        { kind: { equals: 'course' } },
        { active: { equals: true } },
        { course: { in: [...courseIds] } },
      ],
    },
    select: { course: true, price: true, compareAtPrice: true },
    depth: 0,
    pagination: false,
    overrideAccess: false,
  })
  const prices = new Map<number, { price: number; compareAt: number | null }>()
  for (const doc of result.docs) {
    const courseId = typeof doc.course === 'object' ? doc.course?.id : doc.course
    if (typeof courseId !== 'number' || prices.has(courseId)) continue
    prices.set(courseId, { price: doc.price, compareAt: doc.compareAtPrice ?? null })
  }
  return prices
}

/** Cours qui ont au moins une leçon d'extrait gratuit. */
async function coursesWithPreview(courseIds: readonly number[]): Promise<Set<number>> {
  if (courseIds.length === 0) return new Set()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'lessons',
    where: { and: [{ isPreview: { equals: true } }, { course: { in: [...courseIds] } }] },
    select: { course: true },
    depth: 0,
    pagination: false,
    overrideAccess: false,
  })
  return new Set(
    result.docs.flatMap((doc) => {
      const id = typeof doc.course === 'object' ? doc.course?.id : doc.course
      return typeof id === 'number' ? [id] : []
    }),
  )
}

const cardSelect = {
  title: true,
  slug: true,
  summary: true,
  format: true,
  level: true,
  language: true,
  themes: true,
  jobRoles: true,
  instructors: true,
  durationMinutes: true,
  featured: true,
  coverImage: true,
  createdAt: true,
  trailer: true,
} as const

type CardDoc = Pick<
  Course,
  | 'id'
  | 'title'
  | 'slug'
  | 'summary'
  | 'format'
  | 'level'
  | 'language'
  | 'themes'
  | 'jobRoles'
  | 'instructors'
  | 'durationMinutes'
  | 'featured'
  | 'coverImage'
  | 'createdAt'
  | 'trailer'
>

const languages: readonly CatalogLanguage[] = ['fr', 'en', 'ar']

async function toCards(docs: readonly CardDoc[]): Promise<CourseCardData[]> {
  const ids = docs.map((doc) => doc.id)
  const [names, prices, previews] = await Promise.all([
    instructorNames(
      docs.flatMap((doc) => relationIds(doc.instructors as (number | { id: number })[])),
    ),
    coursePrices(ids),
    coursesWithPreview(ids),
  ])
  return docs.map((doc, index) => {
    const price = prices.get(doc.id)
    const themes = (doc.themes ?? []).flatMap(populatedCategory)
    return {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      summary: doc.summary ?? null,
      format: doc.format,
      level: doc.level ?? null,
      language: languages.find((language) => language === doc.language) ?? 'fr',
      themeSlugs: themes.map((theme) => theme.slug),
      themes,
      durationMinutes: Math.max(0, Math.round(doc.durationMinutes ?? 0)),
      price: price?.price ?? null,
      compareAt: price?.compareAt ?? null,
      featured: doc.featured === true,
      createdAt: doc.createdAt,
      position: index,
      instructors: relationIds(doc.instructors as (number | { id: number })[]).flatMap((id) => {
        const name = names.get(id)
        return name ? [name] : []
      }),
      // Un extrait vidéo du cours compte aussi comme aperçu gratuit.
      hasFreePreview: previews.has(doc.id) || Boolean(doc.trailer?.videoId),
      jobRoles: doc.jobRoles ?? [],
      cover: coverOf(doc.coverImage),
    }
  })
}

async function findCards(locale: Locale, where: Where): Promise<CourseCardData[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'courses',
    where: { and: [published, where] },
    select: cardSelect,
    populate: {
      categories: { title: true, slug: true },
      media: { url: true, alt: true, width: true, height: true, sizes: true },
    },
    sort: 'createdAt',
    locale,
    depth: 1,
    pagination: false,
    overrideAccess: false,
  })
  return toCards(result.docs)
}

/* ---------------------------------------------------------------- Catalogue */

/** Tout le catalogue publié (cours et capsules), pour filtrer en mémoire. */
export function getCatalog(locale: Locale): Promise<CourseCardData[]> {
  return cached(['formation-catalog', locale], { collections: formationCollections }, () =>
    findCards(locale, { id: { exists: true } }),
  )
}

/** Cartes de cours dans l'ordre demandé (bloc « Cours à la une »). */
export function getCourseCards(ids: readonly number[], locale: Locale): Promise<CourseCardData[]> {
  const key = [...ids].join(',')
  return cached(
    ['formation-cards', key, locale],
    { collections: formationCollections },
    async () => {
      if (ids.length === 0) return []
      const cards = await findCards(locale, { id: { in: [...ids] } })
      return ids.flatMap((id) => cards.filter((card) => card.id === id))
    },
  )
}

/** Cours à la une (repli du bloc quand l'éditeur n'a rien choisi). */
export function getFeaturedCourseCards(locale: Locale, limit = 3): Promise<CourseCardData[]> {
  return cached(
    ['formation-featured', locale, limit],
    { collections: formationCollections },
    async () => {
      const cards = await findCards(locale, {
        and: [{ featured: { equals: true } }, { format: { equals: 'course' } }],
      })
      return cards.slice(0, limit)
    },
  )
}

/**
 * Recherche plein texte (Postgres `french` + `unaccent`) sur les cours publiés : titre,
 * résumé, sous-titre et description SEO, dans la locale demandée ou en français.
 * Identifiant → pertinence.
 */
export function searchCourses(input: string, locale: Locale): Promise<Array<[number, number]>> {
  const tsquery = toPrefixTsQuery(input)
  if (!tsquery) return Promise.resolve([])
  return cached(['formation-search', tsquery, locale], { collections: ['courses'] }, async () => {
    const payload = await getPayloadClient()
    const locales =
      locale === 'fr' ? sql`ARRAY['fr']::_locales[]` : sql`ARRAY[${locale}, 'fr']::_locales[]`
    const result = await payload.db.drizzle.execute(sql`
      WITH q AS (SELECT to_tsquery('french'::regconfig, public.amana_unaccent(${tsquery})) AS query)
      SELECT c.id, MAX(ts_rank(amana_search_vector(l.title, l.summary,
          concat_ws(' ', l.subtitle, l.seo_description)), q.query)) AS rank
      FROM courses c JOIN courses_locales l ON l._parent_id = c.id, q
      WHERE c._status = 'published' AND l._locale = ANY(${locales})
        AND amana_search_vector(l.title, l.summary, concat_ws(' ', l.subtitle, l.seo_description)) @@ q.query
      GROUP BY c.id
      ORDER BY rank DESC
      LIMIT 200
    `)
    const rows = (result as unknown as { rows: { id: number | string; rank: number | string }[] })
      .rows
    return rows.map((row): [number, number] => [Number(row.id), Number(row.rank)])
  })
}

/* ----------------------------------------------------------------- Fiche */

export type CourseReview = {
  id: number
  rating: number
  body: string | null
  author: string
  date: string
}

export type CourseDetail = {
  card: CourseCardData
  subtitle: string | null
  description: Course['description']
  objectives: string[]
  prerequisites: string | null
  audience: Course['audience']
  certificateEnabled: boolean
  includedInPass: boolean
  hasTrailer: boolean
  seo: Course['seo']
  updatedAt: string
  modules: PublicModule[]
  reviews: { count: number; average: number | null; items: CourseReview[] }
  paths: { slug: string; title: string }[]
  related: CourseCardData[]
}

async function courseIdBySlug(slug: string, locale: Locale): Promise<number | null> {
  const payload = await getPayloadClient()
  for (const candidate of locale === 'fr' ? (['fr'] as const) : ([locale, 'fr'] as const)) {
    const result = await payload.find({
      collection: 'courses',
      where: { and: [{ slug: { equals: slug } }, published] },
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

/** « Prénom N. » : jamais le nom complet ni l'adresse d'un apprenant sur une page publique. */
export function reviewerLabel(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string | null {
  const first = firstName?.trim()
  if (!first) return null
  const initial = lastName?.trim().charAt(0)
  return initial ? `${first} ${initial.toLocaleUpperCase()}.` : first
}

async function courseReviews(courseId: number): Promise<CourseDetail['reviews']> {
  const payload = await getPayloadClient()
  // Règle publique : seuls les avis `approved` sont lisibles.
  const result = await payload.find({
    collection: 'reviews',
    where: { and: [{ course: { equals: courseId } }, { status: { equals: 'approved' } }] },
    select: { rating: true, body: true, user: true, createdAt: true },
    sort: '-createdAt',
    depth: 0,
    limit: 200,
    overrideAccess: false,
  })
  const userIds = result.docs.flatMap((doc) => (typeof doc.user === 'number' ? [doc.user] : []))
  const users =
    userIds.length === 0
      ? []
      : (
          await payload.find({
            collection: 'users',
            where: { id: { in: userIds } },
            // Prénom et initiale du nom seulement (affichage public de l'avis).
            select: { firstName: true, lastName: true },
            depth: 0,
            pagination: false,
            overrideAccess: true,
          })
        ).docs
  const labels = new Map(
    users.map((user) => [user.id, reviewerLabel(user.firstName, user.lastName)]),
  )
  const summary = summarizeRatings(result.docs.map((doc) => doc.rating))
  return {
    ...summary,
    items: result.docs.slice(0, 6).flatMap((doc) => {
      const author = typeof doc.user === 'number' ? labels.get(doc.user) : null
      return author
        ? [
            {
              id: doc.id,
              rating: doc.rating,
              body: doc.body?.trim() || null,
              author,
              date: doc.createdAt,
            },
          ]
        : []
    }),
  }
}

export function getCourseDetail(slug: string, locale: Locale): Promise<CourseDetail | null> {
  return cached(
    ['formation-course', slug, locale],
    { collections: formationCollections },
    async () => {
      const id = await courseIdBySlug(slug, locale)
      if (id === null) return null
      const payload = await getPayloadClient()
      const course = await payload.findByID({
        collection: 'courses',
        id,
        select: {
          ...cardSelect,
          subtitle: true,
          description: true,
          objectives: true,
          prerequisites: true,
          audience: true,
          certificateEnabled: true,
          includedInPass: true,
          seo: true,
          updatedAt: true,
        },
        populate: {
          categories: { title: true, slug: true },
          media: { url: true, alt: true, width: true, height: true, sizes: true },
        },
        locale,
        depth: 1,
        overrideAccess: false,
      })
      const [modules, lessons, reviews, paths] = await Promise.all([
        payload.find({
          collection: 'modules',
          where: { course: { equals: id } },
          select: { title: true, description: true, order: true },
          sort: 'order',
          locale,
          depth: 0,
          pagination: false,
          overrideAccess: false,
        }),
        // Plan de cours seulement : aucun champ de contenu (vidéo, texte, PDF, transcription).
        payload.find({
          collection: 'lessons',
          where: { course: { equals: id } },
          select: {
            title: true,
            slug: true,
            module: true,
            order: true,
            type: true,
            isPreview: true,
            durationMinutes: true,
          },
          sort: 'order',
          locale,
          depth: 0,
          pagination: false,
          overrideAccess: false,
        }),
        courseReviews(id),
        payload.find({
          collection: 'paths',
          where: { and: [published, { courses: { contains: id } }] },
          select: { title: true, slug: true },
          locale,
          depth: 0,
          pagination: false,
          overrideAccess: false,
        }),
      ])
      const [card] = await toCards([course])
      if (!card) return null

      const themeSlugs = card.themeSlugs
      const related = themeSlugs.length
        ? (await getCatalog(locale))
            .filter(
              (other) =>
                other.id !== id &&
                other.format === card.format &&
                other.themeSlugs.some((theme) => themeSlugs.includes(theme)),
            )
            .slice(0, 3)
        : []

      return {
        card,
        subtitle: course.subtitle ?? null,
        description: course.description ?? null,
        objectives: (course.objectives ?? []).map((item) => item.text).filter(Boolean),
        prerequisites: course.prerequisites?.trim() || null,
        audience: course.audience,
        certificateEnabled: course.certificateEnabled !== false,
        includedInPass: course.includedInPass !== false,
        hasTrailer: Boolean(course.trailer?.videoId),
        seo: course.seo,
        updatedAt: course.updatedAt,
        modules: buildPublicOutline(modules.docs, lessons.docs),
        reviews,
        paths: paths.docs.map((path) => ({ slug: path.slug, title: path.title })),
        related,
      }
    },
  )
}

/** Slugs publiés (locale par défaut) pour `generateStaticParams`. */
export function getCourseSlugs(): Promise<string[]> {
  return cached(['formation-course-slugs'], { collections: ['courses'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'courses',
      where: published,
      select: { slug: true },
      locale: 'fr',
      depth: 0,
      pagination: false,
      overrideAccess: false,
    })
    return result.docs.map((doc) => doc.slug)
  })
}

/* ---------------------------------------------------------------- Parcours */

export type PathSummary = {
  id: number
  slug: string
  title: string
  summary: string | null
  courseCount: number
  price: number | null
}

export type PathDetail = PathSummary & {
  description: Path['description']
  certificateEnabled: boolean
  seo: Path['seo']
  updatedAt: string
  courses: CourseCardData[]
  /** Somme des prix à l'unité des cours (comparaison honnête, jamais un prix barré fictif). */
  separatePrice: number | null
}

async function pathPrices(pathIds: readonly number[]): Promise<Map<number, number>> {
  if (pathIds.length === 0) return new Map()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: {
      and: [
        { kind: { equals: 'path' } },
        { active: { equals: true } },
        { path: { in: [...pathIds] } },
      ],
    },
    select: { path: true, price: true },
    depth: 0,
    pagination: false,
    overrideAccess: false,
  })
  const prices = new Map<number, number>()
  for (const doc of result.docs) {
    const pathId = typeof doc.path === 'object' ? doc.path?.id : doc.path
    if (typeof pathId === 'number' && !prices.has(pathId)) prices.set(pathId, doc.price)
  }
  return prices
}

export function getPaths(locale: Locale): Promise<PathSummary[]> {
  return cached(['formation-paths', locale], { collections: formationCollections }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'paths',
      where: published,
      select: { title: true, slug: true, summary: true, courses: true },
      sort: 'createdAt',
      locale,
      depth: 0,
      pagination: false,
      overrideAccess: false,
    })
    const prices = await pathPrices(result.docs.map((doc) => doc.id))
    return result.docs.map((doc) => ({
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      summary: doc.summary ?? null,
      courseCount: (doc.courses ?? []).length,
      price: prices.get(doc.id) ?? null,
    }))
  })
}

async function pathIdBySlug(slug: string, locale: Locale): Promise<number | null> {
  const payload = await getPayloadClient()
  for (const candidate of locale === 'fr' ? (['fr'] as const) : ([locale, 'fr'] as const)) {
    const result = await payload.find({
      collection: 'paths',
      where: { and: [{ slug: { equals: slug } }, published] },
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

export function getPathDetail(slug: string, locale: Locale): Promise<PathDetail | null> {
  return cached(
    ['formation-path', slug, locale],
    { collections: formationCollections },
    async () => {
      const id = await pathIdBySlug(slug, locale)
      if (id === null) return null
      const payload = await getPayloadClient()
      const path = await payload.findByID({
        collection: 'paths',
        id,
        select: {
          title: true,
          slug: true,
          summary: true,
          description: true,
          courses: true,
          certificateEnabled: true,
          seo: true,
          updatedAt: true,
        },
        locale,
        depth: 0,
        overrideAccess: false,
      })
      const courseIds = relationIds(path.courses as (number | { id: number })[])
      const [cards, prices] = await Promise.all([
        getCourseCards(courseIds, locale),
        pathPrices([id]),
      ])
      const unitPrices = cards.map((card) => card.price)
      const separatePrice =
        cards.length > 0 && unitPrices.every((price): price is number => price !== null)
          ? unitPrices.reduce((sum, price) => sum + price, 0)
          : null
      return {
        id,
        slug: path.slug,
        title: path.title,
        summary: path.summary ?? null,
        courseCount: cards.length,
        price: prices.get(id) ?? null,
        description: path.description ?? null,
        certificateEnabled: path.certificateEnabled !== false,
        seo: path.seo,
        updatedAt: path.updatedAt,
        courses: cards,
        separatePrice,
      }
    },
  )
}

export function getPathSlugs(): Promise<string[]> {
  return cached(['formation-path-slugs'], { collections: ['paths'] }, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'paths',
      where: published,
      select: { slug: true },
      locale: 'fr',
      depth: 0,
      pagination: false,
      overrideAccess: false,
    })
    return result.docs.map((doc) => doc.slug)
  })
}
