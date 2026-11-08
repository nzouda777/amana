import type { CollectionConfig } from 'payload'

import { generatePublicToken } from '@/lib/tokens'

import { isSuperAdmin, roleIn } from '../access'
import { publicTokenField } from '../fields/public-token'
import { contentLanguageOptions, groups, interestOptions, l } from '../shared'

const marketing = roleIn('super-admin', 'sales', 'editor')

/** Abonnés newsletter (double opt-in), synchronisés avec Brevo. */
export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  labels: {
    singular: l('Abonné newsletter', 'Newsletter subscriber'),
    plural: l('Abonnés newsletter', 'Newsletter subscribers'),
  },
  admin: {
    group: groups.contacts,
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'interests', 'createdAt'],
  },
  access: { read: marketing, create: isSuperAdmin, update: marketing, delete: isSuperAdmin },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    { name: 'firstName', type: 'text' },
    { name: 'interests', type: 'select', hasMany: true, options: interestOptions },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { value: 'pending', label: l('En attente de confirmation', 'Pending confirmation') },
        { value: 'confirmed', label: l('Confirmé', 'Confirmed') },
        { value: 'unsubscribed', label: l('Désinscrit', 'Unsubscribed') },
      ],
    },
    {
      ...publicTokenField({
        name: 'confirmToken',
        label: l('Jeton de confirmation', 'Confirmation token'),
        generate: () => generatePublicToken(),
      }),
      access: { read: isSuperAdmin, update: isSuperAdmin },
    },
    { name: 'confirmTokenExpiresAt', type: 'date' },
    { name: 'confirmedAt', type: 'date' },
    { name: 'unsubscribedAt', type: 'date' },
    { name: 'locale', type: 'select', options: contentLanguageOptions, defaultValue: 'fr' },
    { name: 'source', type: 'text', label: l('Origine', 'Source') },
    { name: 'brevoContactId', type: 'text', admin: { readOnly: true } },
    { name: 'consent', type: 'relationship', relationTo: 'consents' },
  ],
}
