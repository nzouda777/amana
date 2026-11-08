import type { CollectionConfig } from 'payload'

import { isEditorial, isStaff, publishedOr } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

/** Webinaires et sessions en présentiel / en direct. */
export const Events: CollectionConfig = {
  slug: 'events',
  labels: {
    singular: l('Événement', 'Event'),
    plural: l('Webinaires et sessions', 'Webinars and sessions'),
  },
  admin: {
    group: groups.resources,
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'startsAt', '_status'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  defaultSort: 'startsAt',
  access: {
    read: publishedOr('super-admin', 'editor', 'instructor', 'sales'),
    create: isEditorial,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: revalidateCollection('events'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    {
      name: 'kind',
      type: 'select',
      required: true,
      index: true,
      options: [
        { value: 'webinar', label: l('Webinaire', 'Webinar') },
        { value: 'in-person', label: l('Présentiel', 'In person') },
        { value: 'live', label: l('Classe en direct', 'Live class') },
      ],
    },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
      label: l('Début', 'Starts at'),
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
      label: l('Fin', 'Ends at'),
    },
    {
      name: 'timezone',
      type: 'text',
      defaultValue: 'Africa/Douala',
      label: l('Fuseau horaire', 'Time zone'),
    },
    { name: 'summary', type: 'textarea', localized: true, label: l('Résumé', 'Summary') },
    { name: 'description', type: 'richText', localized: true },
    { name: 'venue', type: 'text', localized: true, label: l('Lieu', 'Venue') },
    { name: 'address', type: 'textarea', label: l('Adresse', 'Address') },
    {
      name: 'onlineUrl',
      type: 'text',
      // Lien de connexion communiqué aux inscrits uniquement.
      access: { read: isStaff },
      label: l('Lien de connexion (privé)', 'Join link (private)'),
    },
    { name: 'capacity', type: 'number', min: 0, label: l('Places', 'Capacity') },
    { name: 'speakers', type: 'relationship', relationTo: 'team-members', hasMany: true },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      label: l('Produit (place payante)', 'Product (paid seat)'),
    },
    {
      name: 'replayVideoId',
      type: 'text',
      label: l('Identifiant vidéo du replay', 'Replay video ID'),
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    seoField,
  ],
}
