import type { CollectionConfig } from 'payload'

import { isEditorial, publishedOr } from '../access'
import { pageBlocks } from '../blocks'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: l('Page', 'Page'), plural: l('Pages', 'Pages') },
  admin: {
    group: groups.site,
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: {
    read: publishedOr('super-admin', 'editor', 'instructor', 'sales'),
    create: isEditorial,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: revalidateCollection('pages'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    { name: 'layout', type: 'blocks', blocks: pageBlocks, label: l('Mise en page', 'Layout') },
    seoField,
  ],
}
