import type { CollectionConfig } from 'payload'

import { isSales, isSuperAdmin } from '../access'
import { xafField } from '../fields/money'
import { groups, l } from '../shared'

/** Devis B2B → bon de commande → facture à échéance → paiement différé (sans pénalité financière). */
export const Quotes: CollectionConfig = {
  slug: 'quotes',
  labels: { singular: l('Devis', 'Quote'), plural: l('Devis', 'Quotes') },
  admin: {
    group: groups.business,
    useAsTitle: 'number',
    defaultColumns: ['number', 'organization', 'status', 'total', 'validUntil'],
  },
  access: { read: isSales, create: isSales, update: isSales, delete: isSuperAdmin },
  fields: [
    { name: 'number', type: 'text', required: true, unique: true, index: true },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
    },
    { name: 'lead', type: 'relationship', relationTo: 'leads' },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      label: l('Commercial', 'Sales owner'),
    },
    { name: 'contactName', type: 'text' },
    { name: 'contactEmail', type: 'email' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: [
        { value: 'draft', label: l('Brouillon', 'Draft') },
        { value: 'sent', label: l('Envoyé', 'Sent') },
        { value: 'accepted', label: l('Accepté', 'Accepted') },
        { value: 'purchase-order', label: l('Bon de commande reçu', 'Purchase order received') },
        { value: 'invoiced', label: l('Facturé', 'Invoiced') },
        { value: 'paid', label: l('Payé', 'Paid') },
        { value: 'declined', label: l('Refusé', 'Declined') },
        { value: 'expired', label: l('Expiré', 'Expired') },
      ],
    },
    {
      name: 'lines',
      type: 'array',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'description', type: 'text', required: true },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        xafField({ name: 'unitPrice', label: l('Prix unitaire', 'Unit price'), required: true }),
      ],
    },
    xafField({ name: 'subtotal', label: l('Sous-total', 'Subtotal') }),
    xafField({ name: 'vatTotal', label: l('TVA', 'VAT') }),
    xafField({ name: 'total', label: l('Total TTC', 'Total') }),
    { name: 'validUntil', type: 'date' },
    {
      name: 'paymentTermsDays',
      type: 'number',
      defaultValue: 30,
      min: 0,
      label: l('Délai de paiement (jours)', 'Payment terms (days)'),
    },
    { name: 'purchaseOrderNumber', type: 'text' },
    { name: 'purchaseOrderFile', type: 'upload', relationTo: 'documents' },
    { name: 'invoice', type: 'relationship', relationTo: 'invoices' },
    { name: 'notes', type: 'textarea' },
  ],
}
