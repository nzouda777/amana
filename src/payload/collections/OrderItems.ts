import type { CollectionConfig } from 'payload'

import { isSales, isSuperAdmin } from '../access'
import { basisPointsField, xafField } from '../fields/money'
import { groups, l } from '../shared'
import { productKindOptions } from './Products'

/** Lignes de commande : instantané du produit et du prix au moment de l'achat. */
export const OrderItems: CollectionConfig = {
  slug: 'order-items',
  labels: {
    singular: l('Ligne de commande', 'Order item'),
    plural: l('Lignes de commande', 'Order items'),
  },
  admin: {
    group: groups.commerce,
    useAsTitle: 'titleSnapshot',
    defaultColumns: ['order', 'titleSnapshot', 'quantity', 'lineTotal'],
  },
  access: { read: isSales, create: isSuperAdmin, update: isSuperAdmin, delete: isSuperAdmin },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    { name: 'kind', type: 'select', required: true, options: productKindOptions },
    { name: 'titleSnapshot', type: 'text', required: true },
    xafField({ name: 'unitPrice', label: l('Prix unitaire TTC', 'Unit price'), required: true }),
    { name: 'quantity', type: 'number', required: true, min: 1, defaultValue: 1 },
    xafField({ name: 'discount', label: l('Remise', 'Discount') }),
    basisPointsField('vatRateBasisPoints', l('Taux de TVA', 'VAT rate')),
    xafField({ name: 'vatAmount', label: l('Dont TVA', 'Incl. VAT') }),
    xafField({ name: 'lineTotal', label: l('Total ligne TTC', 'Line total'), required: true }),
    { name: 'fulfilledAt', type: 'date' },
  ],
}
