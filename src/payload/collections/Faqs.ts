import type { CollectionConfig } from 'payload'

import { anyone, isEditorial } from '../access'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: l('Question fréquente', 'FAQ item'), plural: l('FAQ', 'FAQ') },
  admin: {
    group: groups.site,
    useAsTitle: 'question',
    defaultColumns: ['question', 'topic', 'order'],
  },
  defaultSort: 'order',
  access: { read: anyone, create: isEditorial, update: isEditorial, delete: isEditorial },
  hooks: revalidateCollection('faqs'),
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      localized: true,
      label: l('Question', 'Question'),
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      localized: true,
      label: l('Réponse', 'Answer'),
    },
    {
      name: 'topic',
      type: 'select',
      index: true,
      defaultValue: 'general',
      options: [
        { value: 'general', label: l('Général', 'General') },
        { value: 'formation', label: l('Formation', 'Training') },
        { value: 'audit', label: l('Audit', 'Audit') },
        { value: 'conseil', label: l('Conseil', 'Advisory') },
        { value: 'takaful', label: 'Takaful' },
        { value: 'commerce', label: l('Achats et paiement', 'Purchases and payment') },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
