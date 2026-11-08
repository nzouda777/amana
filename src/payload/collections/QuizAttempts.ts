import type { CollectionConfig } from 'payload'

import { isSuperAdmin, ownerOr } from '../access'
import { groups, l } from '../shared'

/** Tentatives corrigées côté serveur ; jamais créées directement par le client. */
export const QuizAttempts: CollectionConfig = {
  slug: 'quiz-attempts',
  labels: {
    singular: l('Tentative de quiz', 'Quiz attempt'),
    plural: l('Tentatives de quiz', 'Quiz attempts'),
  },
  admin: {
    group: groups.learners,
    defaultColumns: ['user', 'quiz', 'scorePercent', 'passed', 'submittedAt'],
  },
  access: {
    read: ownerOr('user', 'super-admin', 'instructor'),
    create: isSuperAdmin,
    update: isSuperAdmin,
    delete: isSuperAdmin,
  },
  // Unicité du numéro de tentative : deux soumissions simultanées ne dépassent jamais
  // `maxAttempts` (QuizService, ADR 018).
  indexes: [{ fields: ['user', 'quiz', 'attemptNumber'], unique: true }],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'quiz', type: 'relationship', relationTo: 'quizzes', required: true, index: true },
    { name: 'course', type: 'relationship', relationTo: 'courses', index: true },
    { name: 'attemptNumber', type: 'number', required: true, min: 1 },
    {
      name: 'answers',
      type: 'json',
      required: true,
      admin: {
        description: '[{ questionId, selected: number[] }] — indices des réponses choisies.',
      },
    },
    { name: 'scorePercent', type: 'number', required: true, min: 0, max: 100 },
    { name: 'passed', type: 'checkbox', required: true, defaultValue: false, index: true },
    { name: 'startedAt', type: 'date' },
    { name: 'submittedAt', type: 'date', required: true },
  ],
}
