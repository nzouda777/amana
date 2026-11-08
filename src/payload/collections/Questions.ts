import type { ArrayField, CollectionConfig } from 'payload'

import { type QuestionKind, validateQuestionAnswers } from '@/features/lms/quiz'

import { isCourseStaff } from '../access'
import { groups, l } from '../shared'

const answers: ArrayField = {
  name: 'answers',
  type: 'array',
  required: true,
  minRows: 2,
  label: l('Réponses', 'Answers'),
  validate: (value, { siblingData }) =>
    validateQuestionAnswers(
      (siblingData as { kind?: QuestionKind }).kind,
      Array.isArray(value) ? (value as { isCorrect?: boolean }[]) : [],
    ),
  fields: [
    { name: 'text', type: 'text', required: true, localized: true, label: l('Réponse', 'Answer') },
    { name: 'isCorrect', type: 'checkbox', defaultValue: false, label: l('Correcte', 'Correct') },
    { name: 'feedback', type: 'textarea', localized: true, label: l('Retour affiché', 'Feedback') },
  ],
}

export const Questions: CollectionConfig = {
  slug: 'questions',
  labels: { singular: l('Question', 'Question'), plural: l('Questions', 'Questions') },
  admin: {
    group: groups.training,
    useAsTitle: 'prompt',
    defaultColumns: ['prompt', 'quiz', 'kind', 'order'],
  },
  defaultSort: 'order',
  access: {
    read: isCourseStaff,
    create: isCourseStaff,
    update: isCourseStaff,
    delete: isCourseStaff,
  },
  indexes: [{ fields: ['quiz', 'order'] }],
  fields: [
    { name: 'quiz', type: 'relationship', relationTo: 'quizzes', required: true, index: true },
    { name: 'order', type: 'number', required: true, defaultValue: 0 },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'single',
      options: [
        { value: 'single', label: l('Choix unique', 'Single choice') },
        { value: 'multiple', label: l('Choix multiple', 'Multiple choice') },
        { value: 'true-false', label: l('Vrai / faux', 'True / false') },
      ],
    },
    { name: 'prompt', type: 'text', required: true, localized: true, label: l('Énoncé', 'Prompt') },
    answers,
    {
      name: 'explanation',
      type: 'textarea',
      localized: true,
      label: l('Explication', 'Explanation'),
    },
    { name: 'points', type: 'number', defaultValue: 1, min: 1 },
  ],
}
