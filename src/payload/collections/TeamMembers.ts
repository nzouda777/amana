import type { CollectionConfig } from 'payload'

import { anyone, isEditorial } from '../access'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  labels: { singular: l('Membre de l’équipe', 'Team member'), plural: l('Équipe', 'Team') },
  admin: {
    group: groups.site,
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'isComplianceCommittee', 'order'],
  },
  defaultSort: 'order',
  access: { read: anyone, create: isEditorial, update: isEditorial, delete: isEditorial },
  hooks: revalidateCollection('team-members'),
  fields: [
    { name: 'name', type: 'text', required: true, label: l('Nom', 'Name') },
    { name: 'role', type: 'text', required: true, localized: true, label: l('Fonction', 'Role') },
    {
      name: 'isComplianceCommittee',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: l('Membre du comité de conformité charia', 'Sharia compliance committee member'),
    },
    {
      name: 'qualifications',
      type: 'textarea',
      localized: true,
      label: l('Qualifications', 'Qualifications'),
    },
    { name: 'bio', type: 'richText', localized: true, label: l('Biographie', 'Biography') },
    { name: 'photo', type: 'upload', relationTo: 'media', label: l('Photo', 'Photo') },
    { name: 'linkedinUrl', type: 'text', label: 'LinkedIn' },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
      label: l('Ordre', 'Order'),
    },
  ],
}
