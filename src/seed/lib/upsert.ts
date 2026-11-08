import type {
  CollectionSlug,
  DataFromGlobalSlug,
  GlobalSlug,
  Payload,
  RequestContext,
  RequiredDataFromCollectionSlug,
  Where,
} from 'payload'

/** Le seed écrit en français ; les autres locales retombent sur `fr` (fallback). */
export const SEED_LOCALE = 'fr'

/** Hors requête Next : pas d'invalidation de cache (voir `hooks/revalidate.ts`). */
export const seedContext: RequestContext = { disableRevalidate: true }

export type SeedStats = Map<string, { created: number; updated: number; deleted: number }>

export type Seeder = { payload: Payload; stats: SeedStats }

type DocRef = { id: number }

type CommonOptions = {
  locale: string
  depth: number
  overrideAccess: boolean
  context: RequestContext
}

/**
 * Vue non générique de l'API locale : les génériques de Payload sur une union de
 * collections ne se résolvent pas (intersection réduite à `never`). Le typage des
 * données reste assuré par la signature publique de `upsert`.
 */
type LooseLocalApi = {
  find(options: {
    collection: string
    where: Where
    limit: number
    pagination: boolean
    depth: number
    locale: string
    overrideAccess: boolean
  }): Promise<{ docs: DocRef[] }>
  create(options: CommonOptions & { collection: string; data: object }): Promise<DocRef>
  update(options: CommonOptions & { collection: string; id: number; data: object }): Promise<DocRef>
  delete(options: CommonOptions & { collection: string; where: Where }): Promise<{ docs: DocRef[] }>
  updateGlobal(options: CommonOptions & { slug: string; data: object }): Promise<unknown>
}

function api(seeder: Seeder): LooseLocalApi {
  return seeder.payload as unknown as LooseLocalApi
}

const options = (): CommonOptions => ({
  locale: SEED_LOCALE,
  depth: 0,
  overrideAccess: true,
  context: seedContext,
})

export function count(
  seeder: Seeder,
  collection: string,
  kind: 'created' | 'updated' | 'deleted',
  amount = 1,
): void {
  const entry = seeder.stats.get(collection) ?? { created: 0, updated: 0, deleted: 0 }
  entry[kind] += amount
  seeder.stats.set(collection, entry)
}

/**
 * Crée ou met à jour un document repéré par une clé naturelle (slug, nom, question…),
 * ce qui rend le seed rejouable sans doublon. Les contenus à brouillons doivent passer
 * `_status: 'published'`.
 */
export async function upsert<S extends CollectionSlug>(
  seeder: Seeder,
  collection: S,
  key: { field: string; value: string },
  data: RequiredDataFromCollectionSlug<S>,
): Promise<DocRef> {
  return upsertWhere(seeder, collection, { [key.field]: { equals: key.value } }, data)
}

/**
 * Comme `upsert`, avec une clé composite (ex. module = cours + ordre, leçon = cours + slug).
 * Le filtre doit désigner au plus un document.
 */
export async function upsertWhere<S extends CollectionSlug>(
  seeder: Seeder,
  collection: S,
  where: Where,
  data: RequiredDataFromCollectionSlug<S>,
): Promise<DocRef> {
  const existing = await api(seeder).find({
    collection,
    where,
    limit: 1,
    pagination: false,
    depth: 0,
    locale: SEED_LOCALE,
    overrideAccess: true,
  })
  const found = existing.docs[0]
  if (found) {
    count(seeder, collection, 'updated')
    return api(seeder).update({ ...options(), collection, id: found.id, data })
  }
  count(seeder, collection, 'created')
  return api(seeder).create({ ...options(), collection, data })
}

/**
 * Supprime les documents d'un parent semé qui ne figurent plus dans le jeu de données
 * (leçon retirée d'un cours, question retirée d'un quiz) : rejouer le seed après une
 * modification redonne exactement l'état décrit, sans orphelin.
 */
export async function prune(
  seeder: Seeder,
  collection: CollectionSlug,
  parent: { field: string; id: number },
  keep: readonly number[],
): Promise<void> {
  const where: Where =
    keep.length > 0
      ? { and: [{ [parent.field]: { equals: parent.id } }, { id: { not_in: [...keep] } }] }
      : { [parent.field]: { equals: parent.id } }
  const { docs } = await api(seeder).delete({ ...options(), collection, where })
  if (docs.length > 0) count(seeder, collection, 'deleted', docs.length)
}

/** Données d'un global, sans les champs gérés par Payload. */
export type GlobalData<S extends GlobalSlug> = Omit<
  DataFromGlobalSlug<S>,
  'id' | 'createdAt' | 'updatedAt' | 'globalType'
>

/** Met à jour un global (toujours idempotent). */
export async function updateGlobal<S extends GlobalSlug>(
  seeder: Seeder,
  slug: S,
  data: GlobalData<S>,
): Promise<void> {
  await api(seeder).updateGlobal({ ...options(), slug, data })
  count(seeder, `global:${slug}`, 'updated')
}

/** Index clé → identifiant, pour relier les documents entre modules. */
export type IdMap = Map<string, number>

export function idsOf(map: IdMap, keys: readonly string[]): number[] {
  return keys.map((key) => {
    const id = map.get(key)
    if (id === undefined) throw new Error(`Seed : référence inconnue « ${key} ».`)
    return id
  })
}
