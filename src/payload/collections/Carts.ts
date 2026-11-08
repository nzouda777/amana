import type { CollectionConfig } from 'payload'

import { generatePublicToken } from '@/lib/tokens'

import { isSuperAdmin, ownerOr } from '../access'
import { publicTokenField } from '../fields/public-token'
import { groups, l } from '../shared'

/**
 * Panier invité (cookie portant `guestToken`) ou connecté ; fusion à la connexion.
 * Les prix ne sont jamais stockés ici : ils sont relus sur `products` au moment du calcul.
 */
export const Carts: CollectionConfig = {
  slug: 'carts',
  labels: { singular: l('Panier', 'Cart'), plural: l('Paniers', 'Carts') },
  admin: { group: groups.commerce, defaultColumns: ['user', 'status', 'updatedAt'] },
  access: {
    read: ownerOr('user', 'super-admin', 'sales'),
    create: isSuperAdmin,
    update: isSuperAdmin,
    delete: isSuperAdmin,
  },
  fields: [
    publicTokenField({
      name: 'guestToken',
      label: l('Jeton invité', 'Guest token'),
      generate: () => generatePublicToken(),
    }),
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      index: true,
      options: [
        { value: 'open', label: l('Ouvert', 'Open') },
        { value: 'converted', label: l('Converti en commande', 'Converted') },
        { value: 'merged', label: l('Fusionné', 'Merged') },
        { value: 'abandoned', label: l('Abandonné', 'Abandoned') },
      ],
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true, min: 1, defaultValue: 1 },
      ],
    },
    { name: 'coupon', type: 'relationship', relationTo: 'coupons' },
    { name: 'expiresAt', type: 'date', index: true },
  ],
}
