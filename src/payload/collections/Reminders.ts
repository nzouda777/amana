import type { CollectionConfig } from 'payload'

import { isSales } from '../access'
import { groups, jobRoleOptions, l } from '../shared'

/** Règles de relance (assignations) et rappels périodiques de bonnes pratiques. */
export const Reminders: CollectionConfig = {
  slug: 'reminders',
  labels: { singular: l('Règle de relance', 'Reminder rule'), plural: l('Relances', 'Reminders') },
  admin: {
    group: groups.business,
    useAsTitle: 'name',
    defaultColumns: ['name', 'organization', 'trigger', 'active'],
  },
  access: { read: isSales, create: isSales, update: isSales, delete: isSales },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      index: true,
      label: l('Organisation (vide = toutes)', 'Organization (empty = all)'),
    },
    {
      name: 'trigger',
      type: 'select',
      required: true,
      options: [
        { value: 'before-due', label: l('Avant échéance', 'Before due date') },
        { value: 'overdue', label: l('Échéance dépassée', 'Overdue') },
        { value: 'not-started', label: l('Non commencé', 'Not started') },
        {
          value: 'monthly-best-practices',
          label: l('Rappel mensuel par métier', 'Monthly best practices'),
        },
      ],
    },
    {
      name: 'offsetDays',
      type: 'number',
      defaultValue: 3,
      label: l('Décalage (jours)', 'Offset (days)'),
    },
    {
      name: 'maxPerAssignment',
      type: 'number',
      defaultValue: 3,
      min: 1,
      label: l('Plafond de relances', 'Max reminders'),
    },
    { name: 'jobRoles', type: 'select', hasMany: true, options: jobRoleOptions },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true },
    { name: 'lastRunAt', type: 'date', admin: { readOnly: true } },
  ],
}
