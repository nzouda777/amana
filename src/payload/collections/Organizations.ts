import type { CollectionConfig } from 'payload'

import { isSales, isSuperAdmin } from '../access'
import { groups, l } from '../shared'

/**
 * Organisations clientes (B2B). Lecture via l'API réservée au personnel ; les membres
 * passent par `features/b2b` (isolation par organisation, M5).
 */
export const Organizations: CollectionConfig = {
  slug: 'organizations',
  labels: {
    singular: l('Organisation', 'Organization'),
    plural: l('Organisations', 'Organizations'),
  },
  admin: {
    group: groups.business,
    useAsTitle: 'name',
    defaultColumns: ['name', 'niu', 'status', 'createdAt'],
  },
  access: { read: isSales, create: isSales, update: isSales, delete: isSuperAdmin },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      label: l('Raison sociale', 'Legal name'),
    },
    { name: 'niu', type: 'text', index: true, label: 'NIU' },
    { name: 'rccm', type: 'text', label: 'RCCM' },
    {
      name: 'billingAddress',
      type: 'group',
      label: l('Adresse de facturation', 'Billing address'),
      fields: [
        { name: 'line1', type: 'text' },
        { name: 'line2', type: 'text' },
        { name: 'poBox', type: 'text', label: l('Boîte postale', 'PO box') },
        { name: 'city', type: 'text' },
        { name: 'country', type: 'text', defaultValue: 'CM' },
      ],
    },
    { name: 'billingEmail', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,
      options: [
        { value: 'active', label: l('Active', 'Active') },
        { value: 'inactive', label: l('Inactive', 'Inactive') },
      ],
    },
    {
      name: 'accountManager',
      type: 'relationship',
      relationTo: 'users',
      label: l('Commercial référent', 'Account manager'),
    },
    { name: 'notes', type: 'textarea' },
    { name: 'members', type: 'join', collection: 'org-members', on: 'organization' },
    { name: 'licenses', type: 'join', collection: 'licenses', on: 'organization' },
  ],
}
