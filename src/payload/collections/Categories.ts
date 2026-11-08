import type { CollectionConfig } from 'payload'

import { anyone, isEditorial } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

/** Thèmes partagés : catégories d'articles et thèmes du catalogue de cours. */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: l('Thème', 'Topic'), plural: l('Thèmes', 'Topics') },
  admin: { group: groups.resources, useAsTitle: 'title' },
  access: { read: anyone, create: isEditorial, update: isEditorial, delete: isEditorial },
  hooks: revalidateCollection('categories'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    { name: 'description', type: 'textarea', localized: true },
  ],
}
