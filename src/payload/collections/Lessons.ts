import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'

import { recomputeCourseDuration } from '@/features/lms/course-duration'

import { anyone, isCourseStaff } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

/** La leçon hérite du cours de son module (dénormalisé pour les requêtes et l'unicité du slug). */
const inheritCourseFromModule: CollectionBeforeValidateHook = async ({ data, req }) => {
  const moduleId: unknown = data?.module
  if (!data || (typeof moduleId !== 'number' && typeof moduleId !== 'string')) return data
  const parent = await req.payload.findByID({
    collection: 'modules',
    id: moduleId,
    depth: 0,
    req,
    select: { course: true },
  })
  return { ...data, course: parent.course }
}

const revalidate = revalidateCollection('lessons')

const refreshCourseDuration = async ({
  doc,
  req,
  context,
}: Parameters<CollectionAfterChangeHook>[0] | Parameters<CollectionAfterDeleteHook>[0]) => {
  if (context.skipDurationRecompute) return doc
  const courseId: unknown = doc.course
  if (typeof courseId === 'number' || typeof courseId === 'string') {
    await recomputeCourseDuration(req, courseId)
  }
  return doc
}

/** Contenu protégé : lisible via l'API par le personnel pédagogique uniquement (ADR 002). */
const protectedRead = { read: isCourseStaff }

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  labels: { singular: l('Leçon', 'Lesson'), plural: l('Leçons', 'Lessons') },
  admin: {
    group: groups.training,
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'module', 'order', 'isPreview'],
  },
  defaultSort: 'order',
  access: { read: anyone, create: isCourseStaff, update: isCourseStaff, delete: isCourseStaff },
  hooks: {
    beforeValidate: [inheritCourseFromModule],
    afterChange: [refreshCourseDuration, ...revalidate.afterChange],
    afterDelete: [refreshCourseDuration, ...revalidate.afterDelete],
  },
  indexes: [{ fields: ['course', 'slug'], unique: true }, { fields: ['module', 'order'] }],
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: l('Titre', 'Title') },
    { ...slugField({ localized: false }), unique: false },
    { name: 'module', type: 'relationship', relationTo: 'modules', required: true, index: true },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    { name: 'order', type: 'number', required: true, defaultValue: 0, label: l('Ordre', 'Order') },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'video',
      options: [
        { value: 'video', label: l('Vidéo', 'Video') },
        { value: 'text', label: l('Texte', 'Text') },
        { value: 'pdf', label: 'PDF' },
        { value: 'quiz', label: 'Quiz' },
        { value: 'case-study', label: l('Étude de cas', 'Case study') },
      ],
    },
    {
      name: 'isPreview',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: l('Extrait gratuit (sans compte)', 'Free preview (no account)'),
    },
    {
      name: 'durationMinutes',
      type: 'number',
      min: 0,
      defaultValue: 0,
      label: l('Durée (min)', 'Duration (min)'),
    },
    {
      name: 'video',
      type: 'group',
      access: protectedRead,
      admin: { condition: (_, sibling) => sibling?.type === 'video' },
      fields: [
        {
          name: 'provider',
          type: 'select',
          defaultValue: 'bunny',
          options: [{ value: 'bunny', label: 'Bunny Stream' }],
        },
        { name: 'videoId', type: 'text', label: l('Identifiant vidéo', 'Video ID') },
        { name: 'durationSeconds', type: 'number', min: 0 },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      access: protectedRead,
      admin: {
        condition: (_, sibling) => sibling?.type === 'text' || sibling?.type === 'case-study',
      },
      label: l('Contenu', 'Content'),
    },
    {
      name: 'pdf',
      type: 'upload',
      relationTo: 'documents',
      access: protectedRead,
      admin: { condition: (_, sibling) => sibling?.type === 'pdf' },
    },
    {
      name: 'quiz',
      type: 'relationship',
      relationTo: 'quizzes',
      admin: { condition: (_, sibling) => sibling?.type === 'quiz' },
    },
    {
      name: 'resources',
      type: 'array',
      access: protectedRead,
      label: l('Ressources', 'Resources'),
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'file', type: 'upload', relationTo: 'documents' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'transcript',
      type: 'richText',
      localized: true,
      access: protectedRead,
      label: l('Transcription', 'Transcript'),
    },
  ],
}
