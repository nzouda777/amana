import type { CollectionConfig } from 'payload'

import { anyone, isCourseStaff } from '../access'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

export const Modules: CollectionConfig = {
  slug: 'modules',
  labels: { singular: l('Module', 'Module'), plural: l('Modules', 'Modules') },
  admin: {
    group: groups.training,
    useAsTitle: 'title',
    defaultColumns: ['title', 'course', 'order'],
  },
  defaultSort: 'order',
  // Le plan de cours (titres) est public ; les contenus de leçon sont protégés champ par champ.
  access: { read: anyone, create: isCourseStaff, update: isCourseStaff, delete: isCourseStaff },
  hooks: revalidateCollection('modules'),
  indexes: [{ fields: ['course', 'order'] }],
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    { name: 'order', type: 'number', required: true, defaultValue: 0, label: l('Ordre', 'Order') },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'gateQuiz',
      type: 'relationship',
      relationTo: 'quizzes',
      label: l(
        'Quiz à réussir avant le module suivant (optionnel)',
        'Quiz required before next module (optional)',
      ),
    },
    {
      name: 'lessons',
      type: 'join',
      collection: 'lessons',
      on: 'module',
      defaultSort: 'order',
      label: l('Leçons', 'Lessons'),
    },
  ],
}
