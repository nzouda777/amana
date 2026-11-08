import type { CollectionConfig } from 'payload'

import { isSuperAdmin, ownerOr } from '../access'
import { groups, l } from '../shared'

/** Écrit uniquement par le service LMS (Server Actions validées), lu par son propriétaire. */
export const LessonProgress: CollectionConfig = {
  slug: 'lesson-progress',
  labels: {
    singular: l('Progression de leçon', 'Lesson progress'),
    plural: l('Progressions', 'Progress'),
  },
  admin: {
    group: groups.learners,
    defaultColumns: ['user', 'lesson', 'completed', 'positionSeconds', 'updatedAt'],
  },
  access: {
    read: ownerOr('user', 'super-admin', 'instructor'),
    create: isSuperAdmin,
    update: isSuperAdmin,
    delete: isSuperAdmin,
  },
  indexes: [{ fields: ['user', 'lesson'], unique: true }, { fields: ['user', 'course'] }],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'lesson', type: 'relationship', relationTo: 'lessons', required: true, index: true },
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    {
      name: 'positionSeconds',
      type: 'number',
      min: 0,
      defaultValue: 0,
      label: l('Position vidéo (s)', 'Video position (s)'),
    },
    { name: 'completed', type: 'checkbox', defaultValue: false, index: true },
    { name: 'completedAt', type: 'date' },
  ],
}
