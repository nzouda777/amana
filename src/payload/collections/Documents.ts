import path from 'node:path'

import type { CollectionConfig } from 'payload'

import { isCourseStaff, isStaff } from '../access'
import { groups, l } from '../shared'

/**
 * Fichiers privés : guides à télécharger contre e-mail, ressources de leçons, PDF de
 * certificats et de factures, bons de commande. Lecture réservée au personnel ; le
 * public y accède uniquement via des routes serveur qui vérifient le droit (ADR 008).
 */
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: {
    singular: l('Document privé', 'Private document'),
    plural: l('Documents privés', 'Private documents'),
  },
  admin: { group: groups.system, useAsTitle: 'title' },
  access: { read: isStaff, create: isCourseStaff, update: isCourseStaff, delete: isCourseStaff },
  upload: {
    staticDir: path.resolve(process.cwd(), 'private-files'),
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    {
      name: 'kind',
      type: 'select',
      index: true,
      options: [
        { value: 'guide', label: l('Guide', 'Guide') },
        { value: 'lesson-resource', label: l('Ressource de leçon', 'Lesson resource') },
        { value: 'certificate', label: l('Certificat', 'Certificate') },
        { value: 'invoice', label: l('Facture', 'Invoice') },
        { value: 'purchase-order', label: l('Bon de commande', 'Purchase order') },
        { value: 'other', label: l('Autre', 'Other') },
      ],
      defaultValue: 'other',
    },
  ],
}
