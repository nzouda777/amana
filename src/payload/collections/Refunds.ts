import type { CollectionConfig } from 'payload'

import { isSales, isSuperAdmin } from '../access'
import { xafField } from '../fields/money'
import { groups, l } from '../shared'

export const Refunds: CollectionConfig = {
  slug: 'refunds',
  labels: { singular: l('Remboursement', 'Refund'), plural: l('Remboursements', 'Refunds') },
  admin: { group: groups.commerce, defaultColumns: ['order', 'amount', 'status', 'createdAt'] },
  access: { read: isSales, create: isSuperAdmin, update: isSuperAdmin, delete: isSuperAdmin },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'payment', type: 'relationship', relationTo: 'payments', index: true },
    xafField({ name: 'amount', label: l('Montant (XAF)', 'Amount (XAF)'), required: true }),
    { name: 'reason', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'requested',
      index: true,
      options: [
        { value: 'requested', label: l('Demandé', 'Requested') },
        { value: 'processing', label: l('En cours', 'Processing') },
        { value: 'completed', label: l('Effectué', 'Completed') },
        { value: 'failed', label: l('Échec', 'Failed') },
      ],
    },
    { name: 'externalRefundReference', type: 'text' },
    { name: 'processedBy', type: 'relationship', relationTo: 'users' },
    {
      name: 'creditNote',
      type: 'relationship',
      relationTo: 'invoices',
      label: l('Avoir', 'Credit note'),
    },
  ],
}
