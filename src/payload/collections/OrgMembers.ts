import type { CollectionConfig } from 'payload'

import { orgMemberRoles } from '@/features/b2b/contracts'

import { isSales, ownerOr } from '../access'
import { groups, jobRoleOptions, l, options } from '../shared'

export const OrgMembers: CollectionConfig = {
  slug: 'org-members',
  labels: {
    singular: l('Membre d’organisation', 'Organization member'),
    plural: l('Membres', 'Members'),
  },
  admin: {
    group: groups.business,
    defaultColumns: ['organization', 'user', 'role', 'team', 'status'],
  },
  access: {
    read: ownerOr('user', 'super-admin', 'sales'),
    create: isSales,
    update: isSales,
    delete: isSales,
  },
  indexes: [
    { fields: ['organization', 'user'], unique: true },
    { fields: ['organization', 'team'] },
  ],
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
    },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'learner',
      options: options(orgMemberRoles, {
        owner: l('Propriétaire', 'Owner'),
        admin: l('Administrateur', 'Admin'),
        learner: l('Apprenant', 'Learner'),
      }),
    },
    { name: 'team', type: 'text', label: l('Équipe', 'Team') },
    { name: 'jobRole', type: 'select', options: jobRoleOptions, label: l('Métier', 'Job role') },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,
      options: [
        { value: 'active', label: l('Actif', 'Active') },
        { value: 'deactivated', label: l('Désactivé', 'Deactivated') },
      ],
    },
  ],
}
