import type { CollectionConfig } from 'payload'

import { isSuperAdmin, nobody } from '../access'
import { groups, l } from '../shared'

/**
 * Journal des événements de paiement traités. La contrainte d'unicité sur `eventKey`
 * (`<fournisseur>:<eventId>`) est la garantie d'idempotence des webhooks
 * (`PaymentStore.recordEvent`). Ajout au modèle de SPEC §3, voir ADR 006.
 */
export const PaymentEvents: CollectionConfig = {
  slug: 'payment-events',
  labels: {
    singular: l('Événement de paiement', 'Payment event'),
    plural: l('Événements de paiement', 'Payment events'),
  },
  admin: {
    group: groups.commerce,
    useAsTitle: 'eventKey',
    defaultColumns: ['eventKey', 'payment', 'createdAt'],
  },
  access: { read: isSuperAdmin, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'eventKey', type: 'text', required: true, unique: true, index: true },
    { name: 'payment', type: 'relationship', relationTo: 'payments', required: true, index: true },
    { name: 'status', type: 'text' },
  ],
}
