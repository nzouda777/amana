import type { CollectionConfig } from 'payload'

import { paymentMethods, paymentStatuses } from '@/features/commerce/contracts'

import { isSales, isSuperAdmin } from '../access'
import { xafField } from '../fields/money'
import { groups, l } from '../shared'

/** Tentatives de paiement (une commande peut en avoir plusieurs). Écrites par `PaymentService`. */
export const Payments: CollectionConfig = {
  slug: 'payments',
  labels: { singular: l('Paiement', 'Payment'), plural: l('Paiements', 'Payments') },
  admin: {
    group: groups.commerce,
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'provider', 'method', 'status', 'amount', 'createdAt'],
  },
  access: { read: isSales, create: isSuperAdmin, update: isSuperAdmin, delete: isSuperAdmin },
  indexes: [
    { fields: ['provider', 'externalReference'], unique: true },
    { fields: ['order', 'provider', 'status'] },
  ],
  fields: [
    {
      name: 'reference',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Référence interne envoyée au fournisseur (idempotence).',
      },
    },
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'provider', type: 'text', required: true, label: l('Fournisseur', 'Provider') },
    {
      name: 'method',
      type: 'select',
      required: true,
      options: paymentMethods.map((value) => ({ value, label: value })),
    },
    {
      name: 'externalReference',
      type: 'text',
      label: l('Référence fournisseur', 'Provider reference'),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: paymentStatuses.map((value) => ({ value, label: value })),
    },
    xafField({ name: 'amount', label: l('Montant (XAF)', 'Amount (XAF)'), required: true }),
    { name: 'currency', type: 'text', defaultValue: 'XAF', admin: { readOnly: true } },
    {
      name: 'rawPayloadEncrypted',
      type: 'textarea',
      access: { read: isSuperAdmin, update: isSuperAdmin },
      admin: {
        readOnly: true,
        description: 'Dernière charge utile du fournisseur, chiffrée (AES-256-GCM, M4).',
      },
    },
    {
      name: 'confirmedBy',
      type: 'relationship',
      relationTo: 'users',
      label: l('Validé par (virement)', 'Confirmed by'),
    },
  ],
}
