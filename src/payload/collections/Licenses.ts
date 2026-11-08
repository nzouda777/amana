import type { CollectionConfig } from 'payload'

import { isSales, isSuperAdmin } from '../access'
import { groups, l } from '../shared'

/** Licence à N sièges : chaque siège attribué crée des `enrollments` (source `license`). */
export const Licenses: CollectionConfig = {
  slug: 'licenses',
  labels: { singular: l('Licence', 'License'), plural: l('Licences', 'Licenses') },
  admin: {
    group: groups.business,
    defaultColumns: ['organization', 'product', 'seats', 'endsAt', 'status'],
  },
  access: { read: isSales, create: isSales, update: isSales, delete: isSuperAdmin },
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
    },
    { name: 'product', type: 'relationship', relationTo: 'products', required: true },
    { name: 'seats', type: 'number', required: true, min: 1, label: l('Sièges', 'Seats') },
    { name: 'startsAt', type: 'date', required: true },
    { name: 'endsAt', type: 'date', required: true, index: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,
      options: [
        { value: 'active', label: l('Active', 'Active') },
        { value: 'suspended', label: l('Suspendue', 'Suspended') },
        { value: 'cancelled', label: l('Résiliée', 'Cancelled') },
      ],
    },
    { name: 'order', type: 'relationship', relationTo: 'orders' },
    { name: 'quote', type: 'relationship', relationTo: 'quotes' },
  ],
}
