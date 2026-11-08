import type { CollectionConfig } from 'payload'

import { passDurationsDays, productKinds } from '@/features/commerce/contracts'

import { isSales, whereFieldOr } from '../access'
import { basisPointsField, xafField } from '../fields/money'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l, options } from '../shared'

const kindIs =
  (...kinds: string[]) =>
  (_: unknown, sibling: { kind?: string } | undefined) =>
    kinds.includes(sibling?.kind ?? '')

export const productKindOptions = options(productKinds, {
  course: l('Cours', 'Course'),
  path: l('Parcours', 'Path'),
  'capsule-pack': l('Pack de capsules', 'Capsule pack'),
  'business-license': l('Licence entreprise', 'Business license'),
  'access-pass': l('Pass d’accès', 'Access pass'),
  'event-seat': l('Place en présentiel / direct', 'Event seat'),
})

/** Produit polymorphe vendable. Les prix sont TTC, en XAF entiers (ADR 004). */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: l('Produit', 'Product'), plural: l('Produits', 'Products') },
  admin: {
    group: groups.commerce,
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'price', 'active'],
  },
  access: {
    read: whereFieldOr('active', true, 'super-admin', 'sales', 'editor'),
    create: isSales,
    update: isSales,
    delete: isSales,
  },
  hooks: revalidateCollection('products'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    {
      name: 'kind',
      type: 'select',
      required: true,
      index: true,
      options: productKindOptions,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar' },
      label: l('En vente', 'On sale'),
    },
    {
      name: 'audience',
      type: 'select',
      defaultValue: 'individual',
      options: [
        { value: 'individual', label: l('Particuliers', 'Individuals') },
        { value: 'business', label: l('Entreprises', 'Business') },
      ],
    },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      index: true,
      admin: { condition: kindIs('course') },
    },
    {
      name: 'path',
      type: 'relationship',
      relationTo: 'paths',
      index: true,
      admin: { condition: kindIs('path') },
    },
    {
      name: 'courses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      label: l('Capsules / cours inclus', 'Included capsules / courses'),
      admin: { condition: kindIs('capsule-pack', 'business-license') },
    },
    {
      name: 'seats',
      type: 'number',
      min: 1,
      label: l('Nombre de sièges', 'Seats'),
      admin: { condition: kindIs('business-license') },
    },
    {
      name: 'durationDays',
      type: 'number',
      min: 1,
      label: l('Durée d’accès (jours)', 'Access duration (days)'),
      admin: {
        condition: kindIs('access-pass', 'business-license'),
        description: `Pass : ${passDurationsDays.join(' / ')} jours (ADR 003).`,
      },
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      admin: { condition: kindIs('event-seat') },
    },
    xafField({
      name: 'price',
      label: l('Prix TTC (XAF)', 'Price incl. tax (XAF)'),
      required: true,
    }),
    xafField({ name: 'compareAtPrice', label: l('Prix barré (XAF)', 'Compare-at price (XAF)') }),
    basisPointsField('vatRateBasisPoints', l('Taux de TVA', 'VAT rate')),
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}
