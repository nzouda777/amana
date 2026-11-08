import { describe, expect, it } from 'vitest'

import {
  activeFilterKeys,
  applyCatalog,
  type CatalogEntry,
  type CatalogFilters,
  hasActiveFilters,
  matchesDuration,
  matchesPrice,
  parseCatalogFilters,
  toCatalogQuery,
} from '@/features/lms/catalog'
import {
  buildPublicOutline,
  isoDuration,
  isPreviewable,
  outlineStats,
} from '@/features/lms/course-page'
import { courseJsonLd } from '@/lib/seo/jsonld'
import { validateJsonLd } from '@/lib/seo/validate'

const themes = ['fondamentaux', 'takaful']

const entry = (overrides: Partial<CatalogEntry>): CatalogEntry => ({
  id: 1,
  slug: 'cours',
  title: 'Cours',
  summary: null,
  format: 'course',
  level: 'beginner',
  language: 'fr',
  themeSlugs: ['fondamentaux'],
  durationMinutes: 120,
  price: 25_000,
  featured: false,
  createdAt: '2026-10-01T00:00:00.000Z',
  position: 0,
  ...overrides,
})

const catalog: CatalogEntry[] = [
  entry({ id: 1, slug: 'bases', title: 'Bases', featured: true, price: 25_000, position: 0 }),
  entry({
    id: 2,
    slug: 'takaful',
    title: 'Takaful',
    themeSlugs: ['takaful'],
    price: 30_000,
    durationMinutes: 200,
    level: 'intermediate',
    position: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
  }),
  entry({ id: 3, slug: 'sukuk', title: 'Sukuk', price: 60_000, level: 'advanced', position: 2 }),
  entry({
    id: 4,
    slug: 'riba',
    title: 'Repérer le riba',
    format: 'capsule',
    price: null,
    durationMinutes: 6,
    featured: true,
    position: 3,
  }),
  entry({
    id: 5,
    slug: 'gratuit',
    title: 'Découverte',
    price: 0,
    durationMinutes: 30,
    position: 4,
  }),
]

const base: CatalogFilters = { sort: 'recommandes', page: 1 }

describe('catalogue : lecture des filtres de l’URL', () => {
  it('valeurs par défaut sans paramètre', () => {
    expect(parseCatalogFilters({}, themes)).toEqual({ sort: 'recommandes', page: 1 })
  })

  it('lit chaque filtre connu et ignore les valeurs inconnues', () => {
    const filters = parseCatalogFilters(
      {
        theme: 'takaful',
        niveau: 'advanced',
        format: 'capsule',
        duree: '1h-3h',
        prix: 'gratuit',
        langue: 'ar',
        tri: 'duree',
        page: '2',
      },
      themes,
    )
    expect(filters).toEqual({
      theme: 'takaful',
      level: 'advanced',
      format: 'capsule',
      duration: '1h-3h',
      price: 'gratuit',
      language: 'ar',
      sort: 'duree',
      page: 2,
    })
    expect(
      parseCatalogFilters(
        { theme: 'inconnu', niveau: 'expert', format: 'x', prix: '-1', tri: 'drop', page: 'abc' },
        themes,
      ),
    ).toEqual({ sort: 'recommandes', page: 1 })
  })

  it('pertinence par défaut avec une recherche, jamais sans', () => {
    expect(parseCatalogFilters({ q: '  mourabaha  ' }, themes)).toMatchObject({
      q: 'mourabaha',
      sort: 'pertinence',
    })
    expect(parseCatalogFilters({ tri: 'pertinence' }, themes).sort).toBe('recommandes')
  })

  it('borne la recherche et la page, prend la première valeur répétée', () => {
    const long = 'a'.repeat(500)
    expect(parseCatalogFilters({ q: long }, themes).q).toHaveLength(100)
    expect(parseCatalogFilters({ page: '0' }, themes).page).toBe(1)
    expect(parseCatalogFilters({ page: '1001' }, themes).page).toBe(1)
    expect(parseCatalogFilters({ page: '2.5' }, themes).page).toBe(1)
    expect(parseCatalogFilters({ niveau: ['beginner', 'advanced'] }, themes).level).toBe('beginner')
  })

  it('filtres actifs (hors tri et page)', () => {
    expect(hasActiveFilters(base)).toBe(false)
    expect(activeFilterKeys({ ...base, level: 'beginner', q: 'x', page: 3 })).toEqual([
      'q',
      'level',
    ])
  })
})

describe('catalogue : URL canonique d’un état', () => {
  it('omet les valeurs par défaut', () => {
    expect(toCatalogQuery(base)).toEqual({})
    expect(toCatalogQuery({ ...base, q: 'riba', sort: 'pertinence' })).toEqual({ q: 'riba' })
  })

  it('retire un filtre et revient à la première page', () => {
    const filters: CatalogFilters = { ...base, level: 'beginner', theme: 'takaful', page: 3 }
    expect(toCatalogQuery(filters, { level: undefined })).toEqual({ theme: 'takaful' })
  })

  it('conserve la page sans changement, la remplace quand demandée', () => {
    const filters: CatalogFilters = { ...base, format: 'course', sort: 'duree', page: 3 }
    expect(toCatalogQuery(filters)).toEqual({ format: 'course', tri: 'duree', page: '3' })
    expect(toCatalogQuery(filters, { page: 4 })).toEqual({
      format: 'course',
      tri: 'duree',
      page: '4',
    })
  })
})

describe('catalogue : filtres, tri, pagination', () => {
  it('tranches de durée et de prix', () => {
    expect(matchesDuration(59, 'moins-1h')).toBe(true)
    expect(matchesDuration(60, '1h-3h')).toBe(true)
    expect(matchesDuration(180, '1h-3h')).toBe(true)
    expect(matchesDuration(181, 'plus-3h')).toBe(true)
    expect(matchesPrice(0, 'gratuit')).toBe(true)
    expect(matchesPrice(29_999, 'moins-30000')).toBe(true)
    expect(matchesPrice(0, 'moins-30000')).toBe(false)
    expect(matchesPrice(30_000, '30000-60000')).toBe(true)
    expect(matchesPrice(60_000, '30000-60000')).toBe(true)
    expect(matchesPrice(60_001, 'plus-60000')).toBe(true)
    // Sans prix à l'unité (capsule) : jamais retenue par un filtre de prix.
    expect(matchesPrice(null, 'gratuit')).toBe(false)
  })

  it('recommandés : à la une, puis cours avant capsules, puis ordre éditorial', () => {
    expect(applyCatalog(catalog, base).items.map((item) => item.id)).toEqual([1, 4, 2, 3, 5])
  })

  it('combine les filtres', () => {
    const result = applyCatalog(catalog, { ...base, format: 'course', level: 'beginner' })
    expect(result.items.map((item) => item.id)).toEqual([1, 5])
    expect(result.total).toBe(2)
    expect(applyCatalog(catalog, { ...base, theme: 'takaful' }).items.map((i) => i.id)).toEqual([2])
    expect(applyCatalog(catalog, { ...base, duration: 'moins-1h' }).items.map((i) => i.id)).toEqual(
      [4, 5],
    )
    expect(applyCatalog(catalog, { ...base, language: 'en' }).total).toBe(0)
  })

  it('prix croissant et décroissant : sans prix toujours en dernier', () => {
    expect(
      applyCatalog(catalog, { ...base, sort: 'prix-croissant' }).items.map((item) => item.id),
    ).toEqual([5, 1, 2, 3, 4])
    expect(
      applyCatalog(catalog, { ...base, sort: 'prix-decroissant' }).items.map((item) => item.id),
    ).toEqual([3, 2, 1, 5, 4])
  })

  it('plus récents et durée', () => {
    expect(applyCatalog(catalog, { ...base, sort: 'recents' }).items[0]?.id).toBe(2)
    expect(applyCatalog(catalog, { ...base, sort: 'duree' }).items.map((item) => item.id)).toEqual([
      4, 5, 1, 3, 2,
    ])
  })

  it('recherche : seules les entrées trouvées, par pertinence', () => {
    const ranks = new Map([
      ['3', 0.2],
      ['2', 0.9],
    ])
    const result = applyCatalog(catalog, { ...base, q: 'x', sort: 'pertinence' }, ranks)
    expect(result.items.map((item) => item.id)).toEqual([2, 3])
    // Recherche sans résultat Postgres : rien, même si le texte n'est pas vide.
    expect(applyCatalog(catalog, { ...base, q: 'x', sort: 'pertinence' }, null).total).toBe(0)
  })

  it('pagine et ramène une page trop grande à la dernière', () => {
    const result = applyCatalog(catalog, { ...base, page: 2 }, null, 2)
    expect(result).toMatchObject({ page: 2, pageCount: 3, total: 5 })
    expect(result.items.map((item) => item.id)).toEqual([2, 3])
    expect(applyCatalog(catalog, { ...base, page: 9 }, null, 2).page).toBe(3)
    expect(applyCatalog([], base).pageCount).toBe(1)
  })
})

describe('fiche cours : plan public', () => {
  const modules = [
    { id: 20, title: 'Module B', order: 2, description: '  ' },
    { id: 10, title: 'Module A', order: 1, description: 'Intro' },
  ]
  const lessons = [
    { id: 3, slug: 'c', title: 'C', module: 20, order: 1, type: 'quiz' as const },
    {
      id: 2,
      slug: 'b',
      title: 'B',
      module: { id: 10 },
      order: 2,
      type: 'text' as const,
      isPreview: true,
      durationMinutes: 12,
    },
    {
      id: 1,
      slug: 'a',
      title: 'A',
      module: 10,
      order: 1,
      type: 'video' as const,
      isPreview: true,
      durationMinutes: 8.4,
    },
    { id: 9, slug: 'x', title: 'Autre cours', module: 99, order: 1, type: 'video' as const },
  ]

  it('ordonne modules et leçons, ignore les leçons étrangères, recopie champ par champ', () => {
    const outline = buildPublicOutline(modules, [
      ...lessons,
      // Un champ de contenu lu par erreur ne doit jamais ressortir.
      { ...lessons[0]!, id: 4, slug: 'd', order: 2, body: { secret: true } } as never,
    ])
    expect(outline.map((module) => module.id)).toEqual([10, 20])
    expect(outline[0]?.lessons.map((lesson) => lesson.id)).toEqual([1, 2])
    expect(outline[0]?.durationMinutes).toBe(20)
    expect(outline[0]?.description).toBe('Intro')
    expect(outline[1]?.description).toBeNull()
    expect(JSON.stringify(outline)).not.toContain('secret')
    expect(Object.keys(outline[0]!.lessons[0]!).sort()).toEqual(
      ['durationMinutes', 'id', 'isPreview', 'slug', 'title', 'type'].sort(),
    )
  })

  it('statistiques et extraits jouables', () => {
    const outline = buildPublicOutline(modules, lessons)
    expect(outlineStats(outline)).toMatchObject({ modules: 2, lessons: 3, previews: 2, quizzes: 1 })
    expect(isPreviewable({ isPreview: true, type: 'video' })).toBe(true)
    expect(isPreviewable({ isPreview: true, type: 'pdf' })).toBe(false)
    expect(isPreviewable({ isPreview: false, type: 'text' })).toBe(false)
  })

  it('durée ISO 8601', () => {
    expect(isoDuration(200)).toBe('PT3H20M')
    expect(isoDuration(180)).toBe('PT3H')
    expect(isoDuration(45)).toBe('PT45M')
    expect(isoDuration(0)).toBeUndefined()
  })
})

describe('fiche cours : données structurées Course', () => {
  const input = {
    siteUrl: 'https://amana.test',
    url: 'https://amana.test/fr/formation/cours/bases',
    name: 'Les bases de la finance islamique',
    description: 'Principes et contrats.',
    inLanguage: 'fr',
    imageUrl: 'https://amana.test/fr/opengraph-image',
    instructors: ['Ibrahim Abdoulaye'],
    educationalLevel: 'Beginner',
    timeRequired: 'PT3H',
  }

  it('valide, avec offre en XAF et instance en ligne', () => {
    const doc = courseJsonLd({ ...input, priceXaf: 25_000 })
    expect(validateJsonLd(doc)).toEqual([])
    expect(doc).toMatchObject({
      '@type': 'Course',
      provider: { '@id': 'https://amana.test/#organization' },
      offers: [{ '@type': 'Offer', price: 25_000, priceCurrency: 'XAF', category: 'Paid' }],
      hasCourseInstance: [
        { courseMode: 'Online', instructor: [{ '@type': 'Person', name: 'Ibrahim Abdoulaye' }] },
      ],
    })
    expect(doc).not.toHaveProperty('aggregateRating')
  })

  it('aucune offre inventée sans prix, note seulement si fournie', () => {
    const doc = courseJsonLd({ ...input, priceXaf: null, rating: { average: 4.5, count: 3 } })
    expect(doc).not.toHaveProperty('offers')
    expect(doc).toMatchObject({ aggregateRating: { ratingValue: 4.5, ratingCount: 3 } })
  })
})
