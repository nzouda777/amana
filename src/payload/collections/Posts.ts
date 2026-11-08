import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { estimateReadingMinutes } from '@/features/content/reading-time'

import { isEditorial, publishedOr } from '../access'
import { editorialEditor } from '../fields/editors'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

const computeReadingTime: CollectionBeforeChangeHook = ({ data }) => {
  if (data.content) data.readingTimeMinutes = estimateReadingMinutes(data.content)
  return data
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: l('Article', 'Article'), plural: l('Articles', 'Articles') },
  admin: {
    group: groups.resources,
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', '_status'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  defaultSort: '-publishedAt',
  access: {
    read: publishedOr('super-admin', 'editor', 'instructor', 'sales'),
    create: isEditorial,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: { ...revalidateCollection('posts'), beforeChange: [computeReadingTime] },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    { name: 'excerpt', type: 'textarea', localized: true, label: l('Chapeau', 'Excerpt') },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: l('Visuel', 'Cover') },
    {
      name: 'content',
      type: 'richText',
      editor: editorialEditor,
      required: true,
      localized: true,
      label: l('Contenu', 'Content'),
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      index: true,
    },
    { name: 'authors', type: 'relationship', relationTo: 'authors', hasMany: true },
    { name: 'relatedPosts', type: 'relationship', relationTo: 'posts', hasMany: true, maxRows: 3 },
    { name: 'publishedAt', type: 'date', index: true, admin: { position: 'sidebar' } },
    {
      name: 'readingTimeMinutes',
      type: 'number',
      localized: true,
      admin: { position: 'sidebar', readOnly: true },
      label: l('Temps de lecture (min)', 'Reading time (min)'),
    },
    seoField,
  ],
}
