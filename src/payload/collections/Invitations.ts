import type { CollectionConfig, FieldHook } from 'payload'

import { invitationExpiry, invitationStatuses, orgMemberRoles } from '@/features/b2b/contracts'
import { generatePublicToken } from '@/lib/tokens'

import { isSales } from '../access'
import { publicTokenField } from '../fields/public-token'
import { groups, jobRoleOptions, l, options } from '../shared'

const defaultExpiry: FieldHook = ({ value, operation }) =>
  operation === 'create' && !value ? invitationExpiry(new Date()).toISOString() : value

/** Invitation à rejoindre une organisation : jeton à usage unique ≥ 128 bits, 7 jours. */
export const Invitations: CollectionConfig = {
  slug: 'invitations',
  labels: { singular: l('Invitation', 'Invitation'), plural: l('Invitations', 'Invitations') },
  admin: {
    group: groups.business,
    useAsTitle: 'email',
    defaultColumns: ['email', 'organization', 'status', 'expiresAt'],
  },
  access: { read: isSales, create: isSales, update: isSales, delete: isSales },
  indexes: [{ fields: ['organization', 'email'] }],
  fields: [
    publicTokenField({
      name: 'token',
      label: l('Jeton', 'Token'),
      generate: () => generatePublicToken(),
    }),
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
    },
    { name: 'email', type: 'email', required: true, index: true },
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
    { name: 'team', type: 'text' },
    { name: 'jobRole', type: 'select', options: jobRoleOptions },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: options(invitationStatuses, {
        pending: l('En attente', 'Pending'),
        accepted: l('Acceptée', 'Accepted'),
        expired: l('Expirée', 'Expired'),
        revoked: l('Révoquée', 'Revoked'),
      }),
    },
    { name: 'expiresAt', type: 'date', index: true, hooks: { beforeChange: [defaultExpiry] } },
    { name: 'invitedBy', type: 'relationship', relationTo: 'users' },
    { name: 'acceptedAt', type: 'date' },
    { name: 'acceptedBy', type: 'relationship', relationTo: 'users' },
  ],
}
