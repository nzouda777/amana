import type { CollectionConfig } from 'payload'

import { isEditorial, publishedOr } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l, pillarOptions } from '../shared'

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: l('Cas client', 'Case study'), plural: l('Cas clients', 'Case studies') },
  admin: {
    group: groups.site,
    useAsTitle: 'title',
    defaultColumns: ['title', 'clientName', 'pillar', '_status'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: {
    read: publishedOr('super-admin', 'editor', 'instructor', 'sales'),
    create: isEditorial,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: revalidateCollection('case-studies'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    { name: 'clientName', type: 'text', label: l('Client', 'Client') },
    {
      name: 'clientIsAnonymous',
      type: 'checkbox',
      defaultValue: true,
      label: l('Client anonymisé (accord d’affichage absent)', 'Anonymised client'),
    },
    { name: 'sector', type: 'text', localized: true, label: l('Secteur', 'Sector') },
    {
      name: 'pillar',
      type: 'select',
      options: pillarOptions,
      index: true,
      label: l('Pôle', 'Pillar'),
    },
    { name: 'services', type: 'relationship', relationTo: 'services', hasMany: true },
    { name: 'summary', type: 'textarea', localized: true, label: l('Résumé', 'Summary') },
    { name: 'challenge', type: 'richText', localized: true, label: l('Enjeu', 'Challenge') },
    { name: 'approach', type: 'richText', localized: true, label: l('Démarche', 'Approach') },
    { name: 'results', type: 'richText', localized: true, label: l('Résultats', 'Results') },
    {
      name: 'keyFigures',
      type: 'array',
      label: l('Chiffres clés', 'Key figures'),
      maxRows: 4,
      fields: [
        { name: 'value', type: 'text', required: true, label: l('Valeur', 'Value') },
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          label: l('Libellé', 'Label'),
        },
      ],
    },
    { name: 'testimonial', type: 'relationship', relationTo: 'testimonials' },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: l('Visuel', 'Cover') },
    { name: 'publishedAt', type: 'date', index: true, admin: { position: 'sidebar' } },
    seoField,
  ],
}
