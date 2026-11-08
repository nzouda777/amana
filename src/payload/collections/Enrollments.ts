import type { CollectionConfig } from 'payload'

import { enrollmentScopes, enrollmentSources, enrollmentStatuses } from '@/features/lms/contracts'

import { isSales, isSuperAdmin, ownerOr } from '../access'
import { groups, l, options } from '../shared'

/**
 * Source unique de vérité des droits d'accès aux cours (ADR 002), quelle que soit
 * l'origine : achat, pass, licence, cadeau, attribution manuelle. Écrites par
 * `AccessService` (webhook de paiement vérifié, licences) ; jamais par le client.
 */
export const Enrollments: CollectionConfig = {
  slug: 'enrollments',
  labels: { singular: l('Inscription', 'Enrollment'), plural: l('Inscriptions', 'Enrollments') },
  admin: {
    group: groups.learners,
    useAsTitle: 'id',
    defaultColumns: ['user', 'scope', 'course', 'source', 'status', 'endsAt'],
  },
  access: {
    read: ownerOr('user', 'super-admin', 'sales'),
    create: isSales,
    update: isSales,
    delete: isSuperAdmin,
  },
  indexes: [{ fields: ['user', 'course'] }, { fields: ['user', 'scope', 'status'] }],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'scope',
      type: 'select',
      required: true,
      defaultValue: 'course',
      options: options(enrollmentScopes, {
        course: l('Un cours', 'One course'),
        catalog: l('Catalogue du pass (cours « inclus dans le pass »)', 'Pass catalogue'),
      }),
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      index: true,
      admin: { condition: (_, sibling) => sibling?.scope !== 'catalog' },
      validate: (value: unknown, { siblingData }: { siblingData: Partial<{ scope: string }> }) =>
        siblingData.scope === 'catalog' ||
        Boolean(value) ||
        'Cours requis pour une inscription à un cours.',
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      index: true,
      options: options(enrollmentSources, {
        purchase: l('Achat', 'Purchase'),
        pass: l('Pass d’accès', 'Access pass'),
        license: l('Licence entreprise', 'Business license'),
        gift: l('Cadeau', 'Gift'),
        admin: l('Attribution manuelle', 'Manual grant'),
      }),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,
      options: options(enrollmentStatuses, {
        active: l('Actif', 'Active'),
        suspended: l('Suspendu', 'Suspended'),
        revoked: l('Révoqué', 'Revoked'),
      }),
    },
    { name: 'startsAt', type: 'date', required: true, label: l('Début d’accès', 'Access starts') },
    {
      name: 'endsAt',
      type: 'date',
      index: true,
      label: l('Fin d’accès (vide = illimité)', 'Access ends (empty = unlimited)'),
    },
    { name: 'order', type: 'relationship', relationTo: 'orders', index: true },
    { name: 'license', type: 'relationship', relationTo: 'licenses', index: true },
    { name: 'product', type: 'relationship', relationTo: 'products' },
    {
      name: 'grantedBy',
      type: 'relationship',
      relationTo: 'users',
      label: l('Accordé par', 'Granted by'),
    },
    { name: 'revokedReason', type: 'textarea' },
    { name: 'completedAt', type: 'date', label: l('Terminé le', 'Completed at') },
  ],
}
