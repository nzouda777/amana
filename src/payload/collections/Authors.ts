import type { CollectionConfig } from 'payload'

import { anyone, isEditorial } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: l('Auteur', 'Author'), plural: l('Auteurs', 'Authors') },
  admin: { group: groups.resources, useAsTitle: 'name' },
  access: { read: anyone, create: isEditorial, update: isEditorial, delete: isEditorial },
  hooks: revalidateCollection('authors'),
  fields: [
    { name: 'name', type: 'text', required: true, label: l('Nom', 'Name') },
    slugField({ from: 'name', localized: false }),
    { name: 'role', type: 'text', localized: true, label: l('Fonction', 'Role') },
    { name: 'bio', type: 'textarea', localized: true, label: l('Biographie', 'Biography') },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'teamMember', type: 'relationship', relationTo: 'team-members' },
  ],
}
