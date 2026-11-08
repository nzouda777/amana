import type { CollectionConfig } from 'payload'

import { isEditorial, publishedOr } from '../access'
import { editorialEditor } from '../fields/editors'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l, leadTypeOptions, pillarOptions } from '../shared'

/** Pages de service sur le gabarit commun (DESIGN §9) : Audit, Conseil, Takaful, Formation. */
export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: l('Service', 'Service'), plural: l('Services', 'Services') },
  admin: {
    group: groups.site,
    useAsTitle: 'title',
    defaultColumns: ['title', 'pillar', 'order', '_status'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  defaultSort: 'order',
  access: {
    read: publishedOr('super-admin', 'editor', 'instructor', 'sales'),
    create: isEditorial,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: revalidateCollection('services'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    {
      name: 'pillar',
      type: 'select',
      required: true,
      index: true,
      options: pillarOptions,
      label: l('Pôle', 'Pillar'),
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
      label: l('Ordre', 'Order'),
    },
    { name: 'summary', type: 'textarea', localized: true, label: l('Résumé', 'Summary') },
    { name: 'heroImage', type: 'upload', relationTo: 'media', label: l('Visuel', 'Image') },
    {
      name: 'problem',
      type: 'richText',
      editor: editorialEditor,
      localized: true,
      label: l('Problème', 'Problem'),
    },
    {
      name: 'offer',
      type: 'richText',
      editor: editorialEditor,
      localized: true,
      label: l('Offre', 'Offer'),
    },
    {
      name: 'method',
      type: 'array',
      label: l('Méthode (étapes)', 'Method (steps)'),
      fields: [
        { name: 'title', type: 'text', required: true, localized: true, label: l('Étape', 'Step') },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          label: l('Description', 'Description'),
        },
      ],
    },
    {
      name: 'deliverables',
      type: 'array',
      label: l('Livrables', 'Deliverables'),
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          label: l('Livrable', 'Deliverable'),
        },
      ],
    },
    { name: 'faq', type: 'relationship', relationTo: 'faqs', hasMany: true, label: 'FAQ' },
    {
      name: 'cta',
      type: 'group',
      label: l('Appel à l’action', 'Call to action'),
      fields: [
        { name: 'label', type: 'text', localized: true, label: l('Libellé', 'Label') },
        {
          name: 'leadType',
          type: 'select',
          options: leadTypeOptions,
          label: l('Type de demande (devis)', 'Request type (quote)'),
        },
      ],
    },
    seoField,
  ],
}
