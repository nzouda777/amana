import { isLexicalState, type LexicalNode, type LexicalState } from '@/lib/typography/lexical-tree'

/**
 * Pages légales (`/legal/[slug]`). Pas de collection dédiée : chaque document est une
 * entrée de `pages` dont le slug figure dans cette liste, composée de blocs « Texte »
 * (voir docs/adr/011). Toute autre page n'est pas servie sous `/legal`.
 */
export const legalSlugs = [
  'mentions-legales',
  'cgv',
  'cgu',
  'confidentialite',
  'cookies',
  'remboursement',
  'avertissement',
] as const
export type LegalSlug = (typeof legalSlugs)[number]

export function isLegalSlug(value: string): value is LegalSlug {
  return (legalSlugs as readonly string[]).includes(value)
}

/** Fusionne plusieurs états Lexical (blocs « Texte » successifs) en un seul document. */
export function mergeRichText(states: readonly unknown[]): LexicalState | null {
  const valid = states.filter(isLexicalState)
  const first = valid[0]
  if (!first) return null
  const children: LexicalNode[] = valid.flatMap((state) => state.root.children)
  return { ...first, root: { ...first.root, children } }
}
