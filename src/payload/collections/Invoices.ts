import type { CollectionConfig } from 'payload'

import { isSales, nobody, ownerOr } from '../access'
import { xafField } from '../fields/money'
import { groups, l } from '../shared'

/**
 * Factures : numérotation séquentielle continue (séquence Postgres dédiée, attribuée par
 * le service Commerce en M4), PDF archivé, jamais supprimées — une erreur se corrige
 * par un avoir (`creditNoteFor`).
 */
export const Invoices: CollectionConfig = {
  slug: 'invoices',
  labels: { singular: l('Facture', 'Invoice'), plural: l('Factures', 'Invoices') },
  admin: {
    group: groups.commerce,
    useAsTitle: 'number',
    defaultColumns: ['number', 'billingName', 'total', 'status', 'issuedAt'],
  },
  access: {
    read: ownerOr('customer', 'super-admin', 'sales'),
    create: isSales,
    update: isSales,
    delete: nobody,
  },
  fields: [
    {
      name: 'number',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'sequence',
      type: 'number',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'invoice',
      options: [
        { value: 'invoice', label: l('Facture', 'Invoice') },
        { value: 'credit-note', label: l('Avoir', 'Credit note') },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'issued',
      index: true,
      options: [
        { value: 'issued', label: l('Émise', 'Issued') },
        { value: 'paid', label: l('Payée', 'Paid') },
        { value: 'overdue', label: l('Échue', 'Overdue') },
        { value: 'void', label: l('Annulée par avoir', 'Voided') },
      ],
    },
    { name: 'order', type: 'relationship', relationTo: 'orders', index: true },
    { name: 'quote', type: 'relationship', relationTo: 'quotes' },
    { name: 'customer', type: 'relationship', relationTo: 'users', index: true },
    { name: 'organization', type: 'relationship', relationTo: 'organizations', index: true },
    { name: 'creditNoteFor', type: 'relationship', relationTo: 'invoices' },
    { name: 'issuedAt', type: 'date', required: true, index: true },
    { name: 'dueAt', type: 'date', index: true, label: l('Échéance', 'Due date') },
    { name: 'billingName', type: 'text', required: true },
    { name: 'billingAddress', type: 'textarea' },
    { name: 'billingNiu', type: 'text', label: l('NIU du client', 'Customer tax ID') },
    {
      name: 'lines',
      type: 'array',
      fields: [
        { name: 'description', type: 'text', required: true },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        xafField({
          name: 'unitPrice',
          label: l('Prix unitaire', 'Unit price'),
          required: true,
          allowNegative: true,
        }),
        xafField({
          name: 'lineTotal',
          label: l('Total', 'Total'),
          required: true,
          allowNegative: true,
        }),
      ],
    },
    xafField({
      name: 'subtotal',
      label: l('Sous-total', 'Subtotal'),
      required: true,
      allowNegative: true,
    }),
    xafField({ name: 'vatTotal', label: l('TVA', 'VAT'), allowNegative: true }),
    xafField({
      name: 'total',
      label: l('Total TTC', 'Total'),
      required: true,
      allowNegative: true,
    }),
    { name: 'pdf', type: 'upload', relationTo: 'documents' },
  ],
}
