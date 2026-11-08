import type { CollectionConfig, FieldHook } from 'payload'

import { isSales } from '../access'
import { basisPointsField, xafField } from '../fields/money'
import { groups, l } from '../shared'

const normalizeCode: FieldHook = ({ value }) =>
  typeof value === 'string' ? value.trim().toUpperCase().replace(/\s+/g, '') : value

/** Coupons : remise en pourcentage ou montant fixe. Aucun jeu-concours, aucune fausse rareté. */
export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: { singular: l('Coupon', 'Coupon'), plural: l('Coupons', 'Coupons') },
  admin: {
    group: groups.commerce,
    useAsTitle: 'code',
    defaultColumns: ['code', 'kind', 'active', 'endsAt', 'redemptionCount'],
  },
  access: { read: isSales, create: isSales, update: isSales, delete: isSales },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [normalizeCode] },
    },
    { name: 'description', type: 'text' },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'percentage',
      options: [
        { value: 'percentage', label: l('Pourcentage', 'Percentage') },
        { value: 'fixed', label: l('Montant fixe', 'Fixed amount') },
      ],
    },
    {
      ...basisPointsField('percentBasisPoints', l('Remise', 'Discount')),
      admin: { condition: (_, s) => s?.kind === 'percentage' },
    },
    xafField({
      name: 'amount',
      label: l('Remise (XAF)', 'Discount (XAF)'),
      admin: { condition: (_, s) => s?.kind === 'fixed' },
    }),
    xafField({
      name: 'minimumOrderAmount',
      label: l('Montant minimum de commande', 'Minimum order amount'),
    }),
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: l('Produits ciblés (vide = tous)', 'Target products (empty = all)'),
    },
    { name: 'startsAt', type: 'date' },
    { name: 'endsAt', type: 'date', index: true },
    {
      name: 'maxRedemptions',
      type: 'number',
      min: 1,
      label: l('Utilisations max.', 'Max redemptions'),
    },
    { name: 'maxRedemptionsPerUser', type: 'number', min: 1 },
    { name: 'redemptionCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true },
  ],
}
