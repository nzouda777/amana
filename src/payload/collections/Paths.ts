import type { CollectionConfig } from 'payload'

import { isCourseStaff, isEditorial, publishedOr } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

/** Parcours : suite ordonnée de cours vendue à prix groupé (via `products`). */
export const Paths: CollectionConfig = {
  slug: 'paths',
  labels: { singular: l('Parcours', 'Path'), plural: l('Parcours', 'Paths') },
  admin: { group: groups.training, useAsTitle: 'title', defaultColumns: ['title', '_status'] },
  versions: { drafts: true, maxPerDoc: 25 },
  access: {
    read: publishedOr('super-admin', 'editor', 'instructor', 'sales'),
    create: isCourseStaff,
    update: isCourseStaff,
    delete: isEditorial,
  },
  hooks: revalidateCollection('paths'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    { name: 'summary', type: 'textarea', localized: true },
    { name: 'description', type: 'richText', localized: true },
    {
      name: 'courses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      required: true,
      label: l('Cours (dans l’ordre)', 'Courses (in order)'),
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'certificateEnabled', type: 'checkbox', defaultValue: true },
    seoField,
  ],
}
