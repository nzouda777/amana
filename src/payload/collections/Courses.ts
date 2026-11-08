import type { CollectionConfig } from 'payload'

import { courseEditors, isCourseStaff, isEditorial, publishedOr } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { contentLanguageOptions, groups, jobRoleOptions, l } from '../shared'

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: {
    singular: l('Cours', 'Course'),
    plural: l('Cours et capsules', 'Courses and capsules'),
  },
  admin: {
    group: groups.training,
    useAsTitle: 'title',
    defaultColumns: ['title', 'format', 'audience', 'level', '_status'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: {
    read: publishedOr('super-admin', 'editor', 'instructor', 'sales'),
    create: isCourseStaff,
    update: courseEditors,
    delete: isEditorial,
  },
  hooks: revalidateCollection('courses'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    slugField(),
    { name: 'subtitle', type: 'text', localized: true, label: l('Sous-titre', 'Subtitle') },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      label: l('Résumé (carte)', 'Summary (card)'),
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      label: l('Description', 'Description'),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'format',
          type: 'select',
          required: true,
          defaultValue: 'course',
          index: true,
          options: [
            { value: 'course', label: l('Cours', 'Course') },
            { value: 'capsule', label: l('Capsule (3–10 min)', 'Capsule (3–10 min)') },
          ],
        },
        {
          name: 'audience',
          type: 'select',
          required: true,
          defaultValue: 'individual',
          index: true,
          options: [
            { value: 'individual', label: l('Particuliers', 'Individuals') },
            { value: 'business', label: l('Entreprises', 'Business') },
            { value: 'both', label: l('Les deux', 'Both') },
          ],
        },
        {
          name: 'level',
          type: 'select',
          index: true,
          options: [
            { value: 'beginner', label: l('Débutant', 'Beginner') },
            { value: 'intermediate', label: l('Intermédiaire', 'Intermediate') },
            { value: 'advanced', label: l('Avancé', 'Advanced') },
          ],
        },
        {
          name: 'language',
          type: 'select',
          defaultValue: 'fr',
          index: true,
          options: contentLanguageOptions,
          label: l('Langue d’enseignement', 'Teaching language'),
        },
      ],
    },
    {
      name: 'themes',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      index: true,
      label: l('Thèmes', 'Topics'),
    },
    {
      name: 'jobRoles',
      type: 'select',
      hasMany: true,
      options: jobRoleOptions,
      label: l('Métiers ciblés', 'Target job roles'),
      admin: { condition: (_, sibling) => sibling?.format === 'capsule' },
    },
    {
      name: 'instructors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      index: true,
      filterOptions: { roles: { contains: 'instructor' } },
      label: l('Formateurs', 'Instructors'),
    },
    {
      name: 'objectives',
      type: 'array',
      label: l('Objectifs', 'Objectives'),
      fields: [{ name: 'text', type: 'text', required: true, localized: true }],
    },
    {
      name: 'prerequisites',
      type: 'textarea',
      localized: true,
      label: l('Prérequis', 'Prerequisites'),
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: l('Visuel', 'Cover') },
    {
      name: 'trailer',
      type: 'group',
      label: l('Extrait vidéo', 'Trailer'),
      fields: [
        {
          name: 'provider',
          type: 'select',
          defaultValue: 'bunny',
          options: [{ value: 'bunny', label: 'Bunny Stream' }],
        },
        { name: 'videoId', type: 'text', label: l('Identifiant vidéo', 'Video ID') },
      ],
    },
    {
      name: 'durationMinutes',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: l('Calculée depuis les leçons.', 'Computed from lessons.'),
      },
      label: l('Durée (min)', 'Duration (min)'),
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar' },
      label: l('À la une', 'Featured'),
    },
    {
      name: 'includedInPass',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: { position: 'sidebar' },
      label: l('Inclus dans le pass d’accès', 'Included in access pass'),
    },
    {
      name: 'certificateEnabled',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
      label: l('Délivre un certificat', 'Issues a certificate'),
    },
    {
      name: 'modules',
      type: 'join',
      collection: 'modules',
      on: 'course',
      defaultSort: 'order',
      label: 'Modules',
    },
    seoField,
  ],
}
