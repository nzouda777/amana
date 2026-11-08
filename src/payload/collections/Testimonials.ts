import type { CollectionConfig } from 'payload'

import { isEditorial, whereFieldOr } from '../access'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l, pillarOptions } from '../shared'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: l('Témoignage', 'Testimonial'), plural: l('Témoignages', 'Testimonials') },
  admin: {
    group: groups.site,
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'organization', 'displayAuthorized'],
  },
  access: {
    // Le public ne voit que les témoignages dont l'affichage est autorisé.
    read: whereFieldOr('displayAuthorized', true, 'super-admin', 'editor', 'instructor', 'sales'),
    create: isEditorial,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: revalidateCollection('testimonials'),
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      localized: true,
      label: l('Citation', 'Quote'),
    },
    { name: 'authorName', type: 'text', required: true, label: l('Auteur', 'Author') },
    { name: 'authorRole', type: 'text', localized: true, label: l('Fonction', 'Role') },
    { name: 'organization', type: 'text', label: l('Organisation', 'Organization') },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'pillar', type: 'select', options: pillarOptions, index: true },
    { name: 'course', type: 'relationship', relationTo: 'courses' },
    {
      name: 'displayAuthorized',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: l('Affichage autorisé par écrit', 'Display authorised in writing'),
    },
  ],
}
