import type { CollectionConfig } from 'payload'

import { isEditorial, publishedOr } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, interestOptions, l } from '../shared'

/** Guide téléchargeable contre e-mail (fichier privé dans `documents`). */
export const Guides: CollectionConfig = {
  slug: 'guides',
  labels: { singular: l('Guide', 'Guide'), plural: l('Guides', 'Guides') },
  admin: {
    group: groups.resources,
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'updatedAt'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: {
    read: publishedOr('super-admin', 'editor', 'instructor', 'sales'),
    create: isEditorial,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: revalidateCollection('guides'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    { name: 'summary', type: 'textarea', localized: true, label: l('Résumé', 'Summary') },
    { name: 'description', type: 'richText', localized: true },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: l('Couverture', 'Cover') },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'documents',
      required: true,
      localized: true,
      label: l('Fichier (privé)', 'File (private)'),
    },
    { name: 'pageCount', type: 'number', label: l('Nombre de pages', 'Page count') },
    {
      name: 'interests',
      type: 'select',
      hasMany: true,
      options: interestOptions,
      label: l('Centres d’intérêt proposés à la newsletter', 'Newsletter interests offered'),
    },
    {
      name: 'capture',
      type: 'group',
      label: l('Champs du formulaire de téléchargement', 'Download form fields'),
      fields: [
        { name: 'askName', type: 'checkbox', defaultValue: true, label: l('Nom', 'Name') },
        {
          name: 'askOrganization',
          type: 'checkbox',
          defaultValue: false,
          label: l('Organisation', 'Organization'),
        },
        { name: 'askPhone', type: 'checkbox', defaultValue: false, label: l('Téléphone', 'Phone') },
      ],
    },
    seoField,
  ],
}
