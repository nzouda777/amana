/**
 * Documents privés provisoires (collection `documents`) : guides et supports de cours de
 * démonstration. Repérés par leur titre, créés une seule fois (le fichier n'est jamais
 * réécrit). TODO(client) : remplacer chaque fichier par le document définitif.
 */
import type { Document } from '@/payload-types'

import { placeholderPdf } from './placeholder-pdf'
import { count, SEED_LOCALE, type Seeder, seedContext } from './upsert'

export type PlaceholderDocument = {
  /** Titre affiché dans l'admin, clé naturelle du document. */
  title: string
  kind: NonNullable<Document['kind']>
  /** Nom du fichier, sans extension (minuscules, chiffres et tirets). */
  fileName: string
  /** Lignes du PDF provisoire, en ASCII (police standard sans encodage étendu). */
  lines: readonly string[]
}

export async function ensurePlaceholderDocument(
  seeder: Seeder,
  document: PlaceholderDocument,
): Promise<number> {
  const existing = await seeder.payload.find({
    collection: 'documents',
    where: { title: { equals: document.title } },
    limit: 1,
    depth: 0,
    locale: SEED_LOCALE,
    pagination: false,
    overrideAccess: true,
  })
  const found = existing.docs[0]
  if (found) return found.id

  const data = placeholderPdf(document.lines)
  const doc = await seeder.payload.create({
    collection: 'documents',
    data: { title: document.title, kind: document.kind },
    file: {
      data,
      mimetype: 'application/pdf',
      name: `${document.fileName}.pdf`,
      size: data.length,
    },
    locale: SEED_LOCALE,
    depth: 0,
    overrideAccess: true,
    context: seedContext,
  })
  count(seeder, 'documents', 'created')
  return doc.id
}
