import type { CollectionConfig } from 'payload'

import { anyone, isEditorial } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

export const GlossaryTerms: CollectionConfig = {
  slug: 'glossary-terms',
  labels: {
    singular: l('Terme du glossaire', 'Glossary term'),
    plural: l('Glossaire', 'Glossary'),
  },
  admin: {
    group: groups.resources,
    useAsTitle: 'term',
    defaultColumns: ['term', 'transliteration', 'arabic'],
  },
  defaultSort: 'term',
  access: { read: anyone, create: isEditorial, update: isEditorial, delete: isEditorial },
  hooks: revalidateCollection('glossary-terms'),
  fields: [
    { name: 'term', type: 'text', required: true, localized: true, label: l('Terme', 'Term') },
    slugField({ from: 'term' }),
    {
      name: 'transliteration',
      type: 'text',
      label: l('Translittération (ex. murabaha)', 'Transliteration (e.g. murabaha)'),
    },
    { name: 'arabic', type: 'text', label: l('Graphie arabe', 'Arabic script') },
    {
      name: 'shortDefinition',
      type: 'textarea',
      required: true,
      localized: true,
      maxLength: 240,
      label: l('Définition courte (infobulle, liens automatiques)', 'Short definition'),
    },
    {
      name: 'definition',
      type: 'richText',
      localized: true,
      label: l('Définition complète', 'Full definition'),
    },
    {
      name: 'synonyms',
      type: 'array',
      label: l('Variantes reconnues pour les liens automatiques', 'Variants for auto-linking'),
      fields: [{ name: 'value', type: 'text', required: true, localized: true }],
    },
    { name: 'relatedTerms', type: 'relationship', relationTo: 'glossary-terms', hasMany: true },
    seoField,
  ],
}
