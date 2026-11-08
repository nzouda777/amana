import type { Id } from './contracts'

/**
 * Catalogue de formation (SPEC §4.1) : filtres lus dans l'URL (partageable, rendu
 * serveur, formulaire GET sans JavaScript), tri et pagination. Logique pure : la lecture
 * des cours et la recherche plein texte Postgres sont faites par l'appelant.
 *
 * Paramètres d'URL, stables dans toutes les langues : `q`, `theme`, `niveau`, `format`,
 * `duree`, `prix`, `langue`, `tri`, `page`. Une valeur inconnue est ignorée (jamais
 * d'erreur pour un lien ancien ou bricolé).
 */

export const catalogLevels = ['beginner', 'intermediate', 'advanced'] as const
export type CatalogLevel = (typeof catalogLevels)[number]

export const catalogFormats = ['course', 'capsule'] as const
export type CatalogFormat = (typeof catalogFormats)[number]

export const catalogLanguages = ['fr', 'en', 'ar'] as const
export type CatalogLanguage = (typeof catalogLanguages)[number]

/** Durée totale : moins d'une heure, une à trois heures, plus de trois heures. */
export const durationBuckets = ['moins-1h', '1h-3h', 'plus-3h'] as const
export type DurationBucket = (typeof durationBuckets)[number]

/** Prix en XAF entiers (ADR 004). */
export const priceBuckets = ['gratuit', 'moins-30000', '30000-60000', 'plus-60000'] as const
export type PriceBucket = (typeof priceBuckets)[number]

/**
 * Tri : `recommandes` (à la une, puis cours avant capsules, puis ordre éditorial),
 * `pertinence` (recherche), `recents`, prix croissant / décroissant, durée croissante.
 */
export const catalogSorts = [
  'recommandes',
  'pertinence',
  'recents',
  'prix-croissant',
  'prix-decroissant',
  'duree',
] as const
export type CatalogSort = (typeof catalogSorts)[number]

export const CATALOG_PAGE_SIZE = 12
export const CATALOG_QUERY_MAX = 100

export type CatalogFilters = {
  q?: string
  theme?: string
  level?: CatalogLevel
  format?: CatalogFormat
  duration?: DurationBucket
  price?: PriceBucket
  language?: CatalogLanguage
  sort: CatalogSort
  page: number
}

export type CatalogFilterKey = Exclude<keyof CatalogFilters, 'sort' | 'page'>

/** Nom du paramètre d'URL de chaque filtre. */
export const catalogParamNames = {
  q: 'q',
  theme: 'theme',
  level: 'niveau',
  format: 'format',
  duration: 'duree',
  price: 'prix',
  language: 'langue',
  sort: 'tri',
  page: 'page',
} as const satisfies Record<keyof CatalogFilters, string>

export type SearchParams = Record<string, string | string[] | undefined>

const single = (value: string | string[] | undefined): string | undefined =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined

const pick = <T extends string>(values: readonly T[], raw: string | undefined): T | undefined =>
  raw !== undefined && (values as readonly string[]).includes(raw) ? (raw as T) : undefined

/** Filtres de l'URL. `themes` : slugs connus (un thème inconnu est ignoré). */
export function parseCatalogFilters(
  params: SearchParams,
  themes: readonly string[],
): CatalogFilters {
  const read = (key: keyof CatalogFilters) => single(params[catalogParamNames[key]])
  const q = read('q')?.replace(/\s+/g, ' ').slice(0, CATALOG_QUERY_MAX).trim() || undefined
  const theme = read('theme')
  const rawPage = Number(read('page') ?? '1')
  const page = Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= 1000 ? rawPage : 1
  const filters: CatalogFilters = {
    sort: pick(catalogSorts, read('sort')) ?? (q ? 'pertinence' : 'recommandes'),
    page,
  }
  if (q) filters.q = q
  if (theme && themes.includes(theme)) filters.theme = theme
  const level = pick(catalogLevels, read('level'))
  if (level) filters.level = level
  const format = pick(catalogFormats, read('format'))
  if (format) filters.format = format
  const duration = pick(durationBuckets, read('duration'))
  if (duration) filters.duration = duration
  const price = pick(priceBuckets, read('price'))
  if (price) filters.price = price
  const language = pick(catalogLanguages, read('language'))
  if (language) filters.language = language
  // Sans recherche, la pertinence n'a pas de sens.
  if (!filters.q && filters.sort === 'pertinence') filters.sort = 'recommandes'
  return filters
}

/** Le visiteur a-t-il restreint le catalogue (filtre ou recherche) ? */
export function hasActiveFilters(filters: CatalogFilters): boolean {
  return activeFilterKeys(filters).length > 0
}

export const catalogFilterKeys: readonly CatalogFilterKey[] = [
  'q',
  'theme',
  'level',
  'format',
  'duration',
  'price',
  'language',
]

export function activeFilterKeys(filters: CatalogFilters): CatalogFilterKey[] {
  return catalogFilterKeys.filter((key) => filters[key] !== undefined)
}

/**
 * Paramètres d'URL d'un état du catalogue (valeurs par défaut omises : URL courte et
 * canonique). `overrides` : `undefined` retire le filtre ; la page revient à 1 dès qu'un
 * filtre change, sauf si elle est donnée.
 */
export function toCatalogQuery(
  filters: CatalogFilters,
  overrides: Partial<{ [K in keyof CatalogFilters]: CatalogFilters[K] | undefined }> = {},
): Record<string, string> {
  const next: Partial<CatalogFilters> = { ...filters, ...overrides }
  if (!('page' in overrides)) next.page = Object.keys(overrides).length > 0 ? 1 : filters.page
  const query: Record<string, string> = {}
  for (const key of catalogFilterKeys) {
    const value = next[key]
    if (value !== undefined) query[catalogParamNames[key]] = String(value)
  }
  const defaultSort: CatalogSort = next.q ? 'pertinence' : 'recommandes'
  if (next.sort && next.sort !== defaultSort && !(next.sort === 'pertinence' && !next.q))
    query[catalogParamNames.sort] = next.sort
  if (next.page && next.page > 1) query[catalogParamNames.page] = String(next.page)
  return query
}

// ---------------------------------------------------------------------------
// Entrées et application des filtres
// ---------------------------------------------------------------------------

export type CatalogEntry = {
  id: Id
  slug: string
  title: string
  summary: string | null
  format: CatalogFormat
  level: CatalogLevel | null
  language: CatalogLanguage
  themeSlugs: readonly string[]
  durationMinutes: number
  /** Prix du produit « cours » en vente ; `null` : pas de vente à l'unité (capsules). */
  price: number | null
  featured: boolean
  createdAt: string
  /** Ordre éditorial (ordre de lecture dans le back-office). */
  position: number
}

export function matchesDuration(minutes: number, bucket: DurationBucket): boolean {
  switch (bucket) {
    case 'moins-1h':
      return minutes < 60
    case '1h-3h':
      return minutes >= 60 && minutes <= 180
    case 'plus-3h':
      return minutes > 180
  }
}

export function matchesPrice(price: number | null, bucket: PriceBucket): boolean {
  if (price === null) return false
  switch (bucket) {
    case 'gratuit':
      return price === 0
    case 'moins-30000':
      return price > 0 && price < 30_000
    case '30000-60000':
      return price >= 30_000 && price <= 60_000
    case 'plus-60000':
      return price > 60_000
  }
}

const byPosition = (a: CatalogEntry, b: CatalogEntry) =>
  a.position - b.position || a.title.localeCompare(b.title)

/** Prix absent toujours en fin de liste, quel que soit le sens. */
const byPrice = (direction: 1 | -1) => (a: CatalogEntry, b: CatalogEntry) => {
  if (a.price === null && b.price === null) return byPosition(a, b)
  if (a.price === null) return 1
  if (b.price === null) return -1
  return (a.price - b.price) * direction || byPosition(a, b)
}

function comparator(
  sort: CatalogSort,
  ranks: ReadonlyMap<string, number> | null,
): (a: CatalogEntry, b: CatalogEntry) => number {
  switch (sort) {
    case 'pertinence':
      return (a, b) =>
        (ranks?.get(String(b.id)) ?? 0) - (ranks?.get(String(a.id)) ?? 0) || byPosition(a, b)
    case 'recents':
      return (a, b) => b.createdAt.localeCompare(a.createdAt) || byPosition(a, b)
    case 'prix-croissant':
      return byPrice(1)
    case 'prix-decroissant':
      return byPrice(-1)
    case 'duree':
      return (a, b) => a.durationMinutes - b.durationMinutes || byPosition(a, b)
    case 'recommandes':
      return (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        Number(a.format === 'capsule') - Number(b.format === 'capsule') ||
        byPosition(a, b)
  }
}

export type CatalogResult<T extends CatalogEntry = CatalogEntry> = {
  items: T[]
  total: number
  page: number
  pageCount: number
}

/**
 * Filtre, trie et pagine. `searchRanks` : résultat de la recherche plein texte (identifiant
 * → pertinence) quand `q` est présent ; une entrée absente ne correspond pas. Une page au-delà
 * de la dernière est ramenée à la dernière.
 */
export function applyCatalog<T extends CatalogEntry>(
  entries: readonly T[],
  filters: CatalogFilters,
  searchRanks: ReadonlyMap<string, number> | null = null,
  pageSize = CATALOG_PAGE_SIZE,
): CatalogResult<T> {
  const matching = entries.filter(
    (entry) =>
      (!filters.q || (searchRanks?.has(String(entry.id)) ?? false)) &&
      (!filters.theme || entry.themeSlugs.includes(filters.theme)) &&
      (!filters.level || entry.level === filters.level) &&
      (!filters.format || entry.format === filters.format) &&
      (!filters.language || entry.language === filters.language) &&
      (!filters.duration || matchesDuration(entry.durationMinutes, filters.duration)) &&
      (!filters.price || matchesPrice(entry.price, filters.price)),
  )
  const sorted = [...matching].sort(comparator(filters.sort, searchRanks))
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const page = Math.min(filters.page, pageCount)
  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
    total: sorted.length,
    page,
    pageCount,
  }
}
