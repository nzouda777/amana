import type { CollectionConfig } from 'payload'

import { orderStatuses, paymentMethods } from '@/features/commerce/contracts'
import { generateReadableCode } from '@/lib/tokens'

import { isSales, isSuperAdmin, ownerOr } from '../access'
import { xafField } from '../fields/money'
import { publicTokenField } from '../fields/public-token'
import { contentLanguageOptions, groups, l, options } from '../shared'

/**
 * Commandes. `reference` (non devinable) est l'identifiant public des URLs de
 * confirmation. Créées uniquement par le service Commerce ; l'accès n'est accordé que
 * par le webhook de paiement vérifié.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: l('Commande', 'Order'), plural: l('Commandes', 'Orders') },
  admin: {
    group: groups.commerce,
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'customerEmail', 'status', 'total', 'createdAt'],
  },
  access: {
    read: ownerOr('customer', 'super-admin', 'sales'),
    create: isSuperAdmin,
    update: isSales,
    delete: isSuperAdmin,
  },
  fields: [
    publicTokenField({
      name: 'reference',
      label: l('Référence', 'Reference'),
      generate: () => generateReadableCode('CMD'),
    }),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: options(orderStatuses, {
        pending: l('En attente', 'Pending'),
        paid: l('Payée', 'Paid'),
        fulfilled: l('Accès attribués', 'Fulfilled'),
        failed: l('Échec', 'Failed'),
        cancelled: l('Annulée', 'Cancelled'),
        refunded: l('Remboursée', 'Refunded'),
      }),
    },
    { name: 'customer', type: 'relationship', relationTo: 'users', index: true },
    { name: 'customerEmail', type: 'email', required: true, index: true },
    { name: 'customerName', type: 'text' },
    { name: 'customerPhone', type: 'text' },
    { name: 'organization', type: 'relationship', relationTo: 'organizations', index: true },
    { name: 'quote', type: 'relationship', relationTo: 'quotes' },
    {
      name: 'paymentMethod',
      type: 'select',
      options: options(paymentMethods, {
        'mobile-money-mtn': l('MTN Mobile Money', 'MTN Mobile Money'),
        'mobile-money-orange': l('Orange Money', 'Orange Money'),
        card: l('Carte bancaire', 'Card'),
        'bank-transfer': l('Virement', 'Bank transfer'),
        invoice: l('Facture à échéance', 'Invoice (deferred)'),
      }),
    },
    { name: 'coupon', type: 'relationship', relationTo: 'coupons' },
    { name: 'currency', type: 'text', defaultValue: 'XAF', admin: { readOnly: true } },
    xafField({ name: 'subtotal', label: l('Sous-total', 'Subtotal'), required: true }),
    xafField({ name: 'discountTotal', label: l('Remises', 'Discounts') }),
    xafField({ name: 'vatTotal', label: l('Dont TVA', 'Incl. VAT') }),
    xafField({ name: 'total', label: l('Total TTC', 'Total'), required: true }),
    { name: 'locale', type: 'select', options: contentLanguageOptions, defaultValue: 'fr' },
    { name: 'paidAt', type: 'date' },
    { name: 'fulfilledAt', type: 'date' },
    { name: 'cancelledAt', type: 'date' },
    { name: 'notes', type: 'textarea', access: { read: isSales } },
    { name: 'items', type: 'join', collection: 'order-items', on: 'order' },
    { name: 'payments', type: 'join', collection: 'payments', on: 'order' },
  ],
}
