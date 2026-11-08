/**
 * Convention des tags de cache Next.js pour les contenus Payload.
 * Les pages vitrine étiquettent leurs lectures avec ces tags ; les hooks Payload
 * les invalident après modification.
 */
export function collectionTag(collection: string): string {
  return `collection:${collection}`
}

export function documentTag(collection: string, id: string | number): string {
  return `doc:${collection}:${id}`
}

export function globalTag(slug: string): string {
  return `global:${slug}`
}

export function contentCacheTags(collection: string, id?: string | number | null): string[] {
  const tags = [collectionTag(collection)]
  if (id !== undefined && id !== null && id !== '') tags.push(documentTag(collection, id))
  return tags
}
