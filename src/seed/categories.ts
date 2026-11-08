/** Thèmes partagés : catégories d'articles et thèmes du catalogue. */
import { type IdMap, type Seeder, upsert } from './lib/upsert'

export const categoriesSeed = [
  {
    slug: 'fondamentaux',
    title: 'Fondamentaux',
    description: 'Les principes et les contrats de base de la finance islamique.',
  },
  {
    slug: 'banque-participative',
    title: 'Banque participative',
    description: 'Fenêtres islamiques, produits bancaires et organisation des établissements.',
  },
  {
    slug: 'takaful',
    title: 'Takaful',
    description: 'Assurance islamique : modèles, produits et gouvernance.',
  },
  {
    slug: 'audit-conformite',
    title: 'Audit et conformité',
    description: 'Contrôle charia, gouvernance et procédures.',
  },
  {
    slug: 'marches-sukuk',
    title: 'Marchés et sukuk',
    description: 'Sukuk, marchés de capitaux et gestion de la liquidité.',
  },
  {
    slug: 'reglementation',
    title: 'Réglementation CEMAC',
    description: 'Cadre réglementaire de la finance islamique en Afrique centrale.',
  },
  {
    slug: 'ethique-des-affaires',
    title: 'Éthique des affaires',
    description: 'Pratiques commerciales, transparence et responsabilité.',
  },
]

export async function seedCategories(seeder: Seeder): Promise<IdMap> {
  const ids: IdMap = new Map()
  for (const category of categoriesSeed) {
    const doc = await upsert(
      seeder,
      'categories',
      { field: 'slug', value: category.slug },
      category,
    )
    ids.set(category.slug, doc.id)
  }
  return ids
}
