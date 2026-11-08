import type { CollectionConfig } from 'payload'

import { isEditorial, whereFieldOr } from '../access'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: {
    singular: l('Partenaire', 'Partner'),
    plural: l('Partenaires et références', 'Partners and clients'),
  },
  admin: {
    group: groups.site,
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'displayAuthorized', 'order'],
  },
  defaultSort: 'order',
  access: {
    // Le public ne voit que les partenaires dont l'affichage est autorisé par écrit.
    read: whereFieldOr('displayAuthorized', true, 'super-admin', 'editor', 'instructor', 'sales'),
    create: isEditorial,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: revalidateCollection('partners'),
  fields: [
    { name: 'name', type: 'text', required: true, label: l('Nom', 'Name') },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'partner',
      index: true,
      options: [
        { value: 'client', label: l('Client', 'Client') },
        { value: 'partner', label: l('Partenaire', 'Partner') },
        { value: 'institution', label: l('Institution', 'Institution') },
      ],
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'url', type: 'text', label: l('Site web', 'Website') },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'displayAuthorized',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: l('Affichage autorisé par écrit', 'Display authorised in writing'),
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
