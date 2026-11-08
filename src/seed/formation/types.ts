/**
 * Forme des données de démonstration du pôle Formation (cours, capsules, quiz).
 * Les textes sont saisis en typographie « clavier » ; `build.ts` applique `typographyFr()`.
 */
import type { Course, Question } from '@/payload-types'

import type { Block } from '../lib/richtext'

/** Contenu riche : paragraphes (chaînes) ou blocs construits avec `lib/richtext`. */
export type RichSource = Array<Block | string>

export type JobRole = NonNullable<Course['jobRoles']>[number]

export type AnswerSeed = {
  text: string
  /** Bonne réponse : stockée côté serveur uniquement (quiz non lisibles par le client). */
  correct?: boolean
  /** Retour affiché après correction, pour cette réponse précise. */
  feedback: string
}

export type QuestionSeed = {
  kind: Question['kind']
  prompt: string
  answers: AnswerSeed[]
  explanation: string
  points?: number
}

export type QuizSeed = {
  /** Clé locale au cours, référencée par les leçons `quiz` et les `gateQuiz`. */
  key: string
  title: string
  instructions: string
  passingScorePercent: number
  /** 0 = illimité. */
  maxAttempts: number
  questions: QuestionSeed[]
}

/** Support PDF provisoire (collection `documents`, privée). */
export type PdfSeed = {
  title: string
  /** Nom de fichier, unique dans le cours. */
  file: string
}

type LessonBase = {
  /** Unique dans le cours. */
  slug: string
  title: string
  minutes: number
  /** Extrait gratuit, jouable sans compte. */
  preview?: boolean
  resources?: Array<{ label: string; pdf: PdfSeed }>
}

export type LessonSeed =
  | (LessonBase & { type: 'video'; transcript: RichSource })
  | (LessonBase & { type: 'text' | 'case-study'; body: RichSource })
  | (LessonBase & { type: 'pdf'; pdf: PdfSeed })
  | (LessonBase & { type: 'quiz'; quiz: string })

export type ModuleSeed = {
  title: string
  description: string
  /** Quiz à réussir avant le module suivant (clé d'un quiz du cours). */
  gateQuiz?: string
  lessons: LessonSeed[]
}

export type CourseSeed = {
  slug: string
  title: string
  subtitle: string
  summary: string
  description: RichSource
  format: Course['format']
  audience: Course['audience']
  level: NonNullable<Course['level']>
  /** Slugs de `categories`. */
  themes: string[]
  jobRoles?: JobRole[]
  /** Clés des formateurs (`instructors.ts`). */
  instructors: string[]
  objectives: string[]
  prerequisites: string
  featured: boolean
  includedInPass: boolean
  certificateEnabled: boolean
  modules: ModuleSeed[]
  quizzes: QuizSeed[]
  seo: { title: string; description: string }
}
