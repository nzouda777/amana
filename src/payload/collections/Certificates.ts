import type { CollectionConfig } from 'payload'

import { generateReadableCode } from '@/lib/tokens'

import { isSuperAdmin, ownerOr } from '../access'
import { publicTokenField } from '../fields/public-token'
import { groups, l } from '../shared'

/**
 * Certificats. Le `code` public (≥ 128 bits, non séquentiel) est la seule clé utilisée
 * par `/certificats/[code]` ; la vérification publique lit via le serveur un sous-ensemble
 * de champs (nom, cours, date, statut).
 */
export const Certificates: CollectionConfig = {
  slug: 'certificates',
  labels: { singular: l('Certificat', 'Certificate'), plural: l('Certificats', 'Certificates') },
  admin: {
    group: groups.learners,
    useAsTitle: 'code',
    defaultColumns: ['code', 'recipientName', 'courseTitle', 'issuedAt', 'revoked'],
  },
  access: {
    read: ownerOr('user', 'super-admin', 'instructor', 'sales'),
    create: isSuperAdmin,
    update: isSuperAdmin,
    delete: isSuperAdmin,
  },
  fields: [
    publicTokenField({
      name: 'code',
      label: l('Code de vérification', 'Verification code'),
      generate: () => generateReadableCode('AMC'),
    }),
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'course', type: 'relationship', relationTo: 'courses', index: true },
    { name: 'path', type: 'relationship', relationTo: 'paths', index: true },
    // Instantanés : le certificat reste exact même si le cours ou le profil changent.
    {
      name: 'recipientName',
      type: 'text',
      required: true,
      label: l('Nom du titulaire', 'Recipient name'),
    },
    { name: 'courseTitle', type: 'text', required: true, label: l('Intitulé', 'Title') },
    { name: 'durationMinutes', type: 'number', min: 0 },
    { name: 'issuedAt', type: 'date', required: true, index: true },
    {
      name: 'signatory',
      type: 'text',
      admin: { description: 'TODO(client) — responsable pédagogique' },
    },
    { name: 'pdf', type: 'upload', relationTo: 'documents' },
    { name: 'revoked', type: 'checkbox', defaultValue: false, index: true },
    { name: 'revokedAt', type: 'date' },
    { name: 'revokedReason', type: 'textarea' },
  ],
}
