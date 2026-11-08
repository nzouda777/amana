import type { CollectionConfig } from 'payload'

import { isCourseStaff } from '../access'
import { groups, l } from '../shared'

/** Les quiz ne sont jamais lus par le client : correction côté serveur (M3). */
export const Quizzes: CollectionConfig = {
  slug: 'quizzes',
  labels: { singular: l('Quiz', 'Quiz'), plural: l('Quiz', 'Quizzes') },
  admin: {
    group: groups.training,
    useAsTitle: 'title',
    defaultColumns: ['title', 'course', 'passingScorePercent'],
  },
  access: {
    read: isCourseStaff,
    create: isCourseStaff,
    update: isCourseStaff,
    delete: isCourseStaff,
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    { name: 'course', type: 'relationship', relationTo: 'courses', index: true },
    { name: 'instructions', type: 'textarea', localized: true },
    {
      name: 'passingScorePercent',
      type: 'number',
      required: true,
      defaultValue: 70,
      min: 0,
      max: 100,
      label: l('Seuil de réussite (%)', 'Passing score (%)'),
    },
    {
      name: 'maxAttempts',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: l('Tentatives max. (0 = illimité)', 'Max attempts (0 = unlimited)'),
    },
    { name: 'shuffleQuestions', type: 'checkbox', defaultValue: false },
    { name: 'questions', type: 'join', collection: 'questions', on: 'quiz', defaultSort: 'order' },
  ],
}
