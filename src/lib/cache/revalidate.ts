import { revalidateTag } from 'next/cache'

import { contentCacheTags, globalTag } from './tags'

/**
 * Invalide le cache des pages publiques après une modification de contenu.
 * Profil `max` (Next 16) : stale-while-revalidate, la prochaine visite régénère.
 */
export function revalidateContent(collection: string, id?: string | number | null): void {
  for (const tag of contentCacheTags(collection, id)) revalidateTag(tag, 'max')
}

export function revalidateGlobal(slug: string): void {
  revalidateTag(globalTag(slug), 'max')
}
