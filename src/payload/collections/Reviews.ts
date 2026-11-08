import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { normalizeNewReview, reviewStatuses } from '@/features/lms/reviews'

import { authenticated, hasAnyRole, isEditorial, whereFieldOr } from '../access'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l, options } from '../shared'

const moderators = ['super-admin', 'editor'] as const

const normalizeOnCreate: CollectionBeforeChangeHook = ({ data, operation, req }) =>
  operation === 'create'
    ? normalizeNewReview(data, req.user, hasAnyRole(req.user, moderators))
    : data

/** Avis réservés aux inscrits ayant ≥ 50 % de progression (contrôle dans le service LMS), modérés. */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: l('Avis', 'Review'), plural: l('Avis', 'Reviews') },
  admin: {
    group: groups.learners,
    defaultColumns: ['course', 'user', 'rating', 'status', 'createdAt'],
  },
  access: {
    read: whereFieldOr('status', 'approved', 'super-admin', 'editor', 'instructor'),
    create: authenticated,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: { ...revalidateCollection('reviews'), beforeChange: [normalizeOnCreate] },
  indexes: [{ fields: ['user', 'course'], unique: true }, { fields: ['course', 'status'] }],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'body', type: 'textarea', maxLength: 2000, label: l('Avis', 'Review') },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      access: { update: isEditorial },
      options: options(reviewStatuses, {
        pending: l('En attente', 'Pending'),
        approved: l('Publié', 'Approved'),
        rejected: l('Refusé', 'Rejected'),
      }),
    },
    { name: 'moderationNote', type: 'textarea', access: { read: isEditorial } },
  ],
}
