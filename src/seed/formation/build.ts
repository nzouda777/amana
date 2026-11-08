/**
 * Transformation pure des données de démonstration en documents Payload : typographie
 * française (`typographyFr`, idempotente, donc sans effet si le rendu l'applique à
 * nouveau), identifiants vidéo factices, relations résolues. Testable sans base.
 */
import type { RequiredDataFromCollectionSlug } from 'payload'

import { typographyFr, typographyFrLexical } from '@/lib/typography'

import { type RichText, rt } from '../lib/richtext'
import { type IdMap, idsOf } from '../lib/upsert'
import type {
  CourseSeed,
  LessonSeed,
  ModuleSeed,
  PdfSeed,
  QuestionSeed,
  QuizSeed,
  RichSource,
} from './types'

/**
 * Identifiants vidéo de démonstration : `demo-` suivi de minuscules, chiffres et tirets.
 * Le fournisseur reste `bunny` (seule option du schéma) ; l'implémentation factice du
 * `VideoProvider` reconnaît le préfixe. TODO(client) : identifiants Bunny Stream réels.
 */
export const DEMO_VIDEO_PREFIX = 'demo-'
export const DEMO_VIDEO_ID_PATTERN = /^demo-[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Vidéo d'une leçon : `demo-<slug du cours>-<slug de la leçon>`. */
export const demoLessonVideoId = (courseSlug: string, lessonSlug: string): string =>
  `${DEMO_VIDEO_PREFIX}${courseSlug}-${lessonSlug}`

/** Extrait du cours (aperçu de 30 s pour les capsules) : `demo-extrait-<slug du cours>`. */
export const demoTrailerVideoId = (courseSlug: string): string =>
  `${DEMO_VIDEO_PREFIX}extrait-${courseSlug}`

const t = typographyFr

export function richFr(source: RichSource): RichText {
  return typographyFrLexical(rt(...source))
}

/** Titre (clé naturelle) du support PDF provisoire d'un cours. */
export function pdfDocumentTitle(course: Pick<CourseSeed, 'title'>, pdf: PdfSeed): string {
  return `${course.title} — ${pdf.title} (PDF provisoire)`
}

/** Lignes ASCII du PDF provisoire. */
export function pdfDocumentLines(course: Pick<CourseSeed, 'slug'>, pdf: PdfSeed): string[] {
  return [
    'Amana Conseil',
    'Support de cours provisoire (demonstration)',
    `Cours : ${course.slug}`,
    `Document : ${pdf.file}`,
    'TODO(client) : remplacer par le support definitif.',
  ]
}

export const pdfFileName = (course: Pick<CourseSeed, 'slug'>, pdf: PdfSeed): string =>
  `${course.slug}-${pdf.file}`

/** Supports PDF d'un cours (leçons `pdf` et ressources), sans doublon. */
export function coursePdfs(course: CourseSeed): PdfSeed[] {
  const byFile = new Map<string, PdfSeed>()
  for (const lesson of course.modules.flatMap((m) => m.lessons)) {
    if (lesson.type === 'pdf') byFile.set(lesson.pdf.file, lesson.pdf)
    for (const resource of lesson.resources ?? []) byFile.set(resource.pdf.file, resource.pdf)
  }
  return [...byFile.values()]
}

export function buildCourseData(
  course: CourseSeed,
  refs: { themes: IdMap; instructors: IdMap },
): RequiredDataFromCollectionSlug<'courses'> {
  return {
    title: t(course.title),
    slug: course.slug,
    subtitle: t(course.subtitle),
    summary: t(course.summary),
    description: richFr(course.description),
    format: course.format,
    audience: course.audience,
    level: course.level,
    language: 'fr',
    themes: idsOf(refs.themes, course.themes),
    jobRoles: course.format === 'capsule' ? (course.jobRoles ?? []) : [],
    instructors: idsOf(refs.instructors, course.instructors),
    objectives: course.objectives.map((text) => ({ text: t(text) })),
    prerequisites: t(course.prerequisites),
    trailer: { provider: 'bunny', videoId: demoTrailerVideoId(course.slug) },
    featured: course.featured,
    includedInPass: course.includedInPass,
    certificateEnabled: course.certificateEnabled,
    seo: { title: t(course.seo.title), description: t(course.seo.description), noIndex: false },
    _status: 'published',
  }
}

export function buildQuizData(
  quiz: QuizSeed,
  courseId: number,
): RequiredDataFromCollectionSlug<'quizzes'> {
  return {
    title: t(quiz.title),
    course: courseId,
    instructions: t(quiz.instructions),
    passingScorePercent: quiz.passingScorePercent,
    maxAttempts: quiz.maxAttempts,
    shuffleQuestions: false,
  }
}

export function buildQuestionData(
  question: QuestionSeed,
  quizId: number,
  order: number,
): RequiredDataFromCollectionSlug<'questions'> {
  return {
    quiz: quizId,
    order,
    kind: question.kind,
    prompt: t(question.prompt),
    answers: question.answers.map((answer) => ({
      text: t(answer.text),
      isCorrect: answer.correct === true,
      feedback: t(answer.feedback),
    })),
    explanation: t(question.explanation),
    points: question.points ?? 1,
  }
}

export function buildModuleData(
  moduleSeed: ModuleSeed,
  courseId: number,
  order: number,
  gateQuizId: number | null,
): RequiredDataFromCollectionSlug<'modules'> {
  return {
    title: t(moduleSeed.title),
    course: courseId,
    order,
    description: t(moduleSeed.description),
    gateQuiz: gateQuizId,
  }
}

export type LessonRefs = {
  moduleId: number
  order: number
  courseSlug: string
  /** Quiz du cours, par clé. */
  quizzes: IdMap
  /** Documents PDF du cours, par nom de fichier. */
  pdfs: IdMap
}

function refOf(map: IdMap, key: string, what: string): number {
  const id = map.get(key)
  if (id === undefined) throw new Error(`Seed : ${what} inconnu « ${key} ».`)
  return id
}

export function buildLessonData(
  lesson: LessonSeed,
  refs: LessonRefs,
): RequiredDataFromCollectionSlug<'lessons'> {
  const base: RequiredDataFromCollectionSlug<'lessons'> = {
    title: t(lesson.title),
    slug: lesson.slug,
    module: refs.moduleId,
    order: refs.order,
    type: lesson.type,
    isPreview: lesson.preview === true,
    durationMinutes: lesson.minutes,
    resources: (lesson.resources ?? []).map((resource) => ({
      label: t(resource.label),
      file: refOf(refs.pdfs, resource.pdf.file, 'support PDF'),
    })),
    // Champs propres à un autre type vidés : un changement de type au rejeu ne laisse rien.
    video: { provider: 'bunny', videoId: null, durationSeconds: null },
    body: null,
    pdf: null,
    quiz: null,
    transcript: null,
  }
  switch (lesson.type) {
    case 'video':
      return {
        ...base,
        video: {
          provider: 'bunny',
          videoId: demoLessonVideoId(refs.courseSlug, lesson.slug),
          durationSeconds: lesson.minutes * 60,
        },
        transcript: richFr(lesson.transcript),
      }
    case 'text':
    case 'case-study':
      return { ...base, body: richFr(lesson.body) }
    case 'pdf':
      return { ...base, pdf: refOf(refs.pdfs, lesson.pdf.file, 'support PDF') }
    case 'quiz':
      return { ...base, quiz: refOf(refs.quizzes, lesson.quiz, 'quiz') }
  }
}
