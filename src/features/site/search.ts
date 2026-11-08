/**
 * Recherche globale (SPEC §4.5) : logique pure. La requête SQL (Postgres FTS `french` +
 * `unaccent`) est dans `src/app/[locale]/(site)/_data/search.ts`.
 */

export const searchKinds = ['service', 'course', 'page', 'article', 'glossary'] as const
export type SearchKind = (typeof searchKinds)[number]

export type SearchHit = {
  kind: SearchKind
  id: number
  slug: string
  title: string
  excerpt: string | null
  /** Pôle du service (route de la fiche). */
  pillar: string | null
  rank: number
}

export type SearchGroup = { kind: SearchKind; hits: SearchHit[] }

export const MAX_QUERY_LENGTH = 100
const MAX_TERMS = 8

/** Mots utiles de la saisie (lettres et chiffres, accents conservés), sans doublon. */
export function searchTerms(input: string): string[] {
  const words = input
    .slice(0, MAX_QUERY_LENGTH)
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
  return [...new Set(words ?? [])].filter((word) => word.length >= 2).slice(0, MAX_TERMS)
}

/**
 * Requête `to_tsquery` sûre : chaque mot devient un préfixe (`mourab:*`), mots reliés par
 * ET. Aucun opérateur saisi par l'utilisateur n'est transmis. `null` si rien à chercher.
 */
export function toPrefixTsQuery(input: string): string | null {
  const terms = searchTerms(input)
  if (terms.length === 0) return null
  return terms.map((term) => `${term}:*`).join(' & ')
}

/** Regroupe par type, dans l'ordre d'affichage, groupes vides exclus ; tri par pertinence. */
export function groupSearchHits(hits: readonly SearchHit[]): SearchGroup[] {
  return searchKinds
    .map((kind) => ({
      kind,
      hits: hits.filter((hit) => hit.kind === kind).sort((a, b) => b.rank - a.rank),
    }))
    .filter((group) => group.hits.length > 0)
}
