import { unstable_cache } from 'next/cache'

import type { Locale } from '@/lib/i18n/config'
import { collectionTag, globalTag } from '@/lib/cache/tags'

/**
 * Lecture Payload mise en cache (Data Cache de Next), invalidée par les hooks Payload
 * (`revalidateTag`, `src/payload/hooks/revalidate.ts`). `unstable_cache` est conservé tant
 * que Cache Components n'est pas activé (décision à prendre globalement, hors M2).
 *
 * Les étiquettes sont celles de `src/lib/cache/tags.ts` : une collection modifiée
 * invalide toutes les lectures qui la citent.
 */
export function cached<T>(
  key: readonly (string | number)[],
  dependencies: { collections?: readonly string[]; globals?: readonly string[] },
  load: () => Promise<T>,
): Promise<T> {
  const tags = [
    ...(dependencies.collections ?? []).map(collectionTag),
    ...(dependencies.globals ?? []).map(globalTag),
  ]
  return unstable_cache(load, key.map(String), { tags })()
}

export type { Locale }
