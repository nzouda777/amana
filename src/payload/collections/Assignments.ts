import type { CollectionConfig } from 'payload'

import { isSales } from '../access'
import { groups, l } from '../shared'

/** Capsule assignée à un membre ou à une équipe, avec échéance. */
export const Assignments: CollectionConfig = {
  slug: 'assignments',
  labels: { singular: l('Assignation', 'Assignment'), plural: l('Assignations', 'Assignments') },
  admin: {
    group: groups.business,
    defaultColumns: ['organization', 'course', 'member', 'team', 'dueAt'],
  },
  access: { read: isSales, create: isSales, update: isSales, delete: isSales },
  indexes: [{ fields: ['organization', 'course'] }],
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
    },
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'org-members',
      index: true,
      validate: (value: unknown, { siblingData }: { siblingData: Partial<{ team: string }> }) =>
        Boolean(value) || Boolean(siblingData.team) || 'Choisir un membre ou une équipe.',
    },
    { name: 'team', type: 'text' },
    { name: 'dueAt', type: 'date', index: true, label: l('Échéance', 'Due date') },
    { name: 'assignedBy', type: 'relationship', relationTo: 'users' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { value: 'active', label: l('Active', 'Active') },
        { value: 'cancelled', label: l('Annulée', 'Cancelled') },
      ],
    },
  ],
}
