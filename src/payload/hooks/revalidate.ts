import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  RequestContext,
} from 'payload'

import { revalidateContent, revalidateGlobal } from '@/lib/cache/revalidate'

/**
 * `context.disableRevalidate = true` désactive l'invalidation (seed, scripts hors
 * requête Next, où `revalidateTag` n'est pas disponible).
 */
function isDisabled(context: RequestContext): boolean {
  return context.disableRevalidate === true
}

export function revalidateCollection(collection: string): {
  afterChange: CollectionAfterChangeHook[]
  afterDelete: CollectionAfterDeleteHook[]
} {
  return {
    afterChange: [
      ({ doc, context }) => {
        if (!isDisabled(context))
          revalidateContent(collection, (doc as { id?: number | string }).id)
        return doc
      },
    ],
    afterDelete: [
      ({ id, doc, context }) => {
        if (!isDisabled(context)) revalidateContent(collection, id)
        return doc
      },
    ],
  }
}

export function revalidateGlobalHook(slug: string): GlobalAfterChangeHook {
  return ({ doc, context }) => {
    if (!isDisabled(context)) revalidateGlobal(slug)
    return doc
  }
}
