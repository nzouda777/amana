import type { Page } from '@/payload-types'

import type { Locale } from '../../_data/cache'

export type LayoutBlock = NonNullable<Page['layout']>[number]
export type BlockOf<T extends LayoutBlock['blockType']> = Extract<LayoutBlock, { blockType: T }>

/** Contexte commun passé à chaque bloc. */
export type BlockContext = {
  locale: Locale
  /** Slug de la page (l'accueil a un héros animé et un en-tête transparent). */
  pageSlug: string
  /** Rang du bloc dans la page (le premier héros porte le h1). */
  index: number
  /** Premier bloc FAQ de la page : seul à émettre les données structurées FAQPage. */
  firstFaq?: boolean
}

/** Garde : relation peuplée (objet) plutôt qu'identifiant non résolu ou refusé. */
export function populated<T extends { id: number }>(
  value: number | T | null | undefined,
): value is T {
  return typeof value === 'object' && value !== null
}
