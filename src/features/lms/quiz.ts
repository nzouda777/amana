import { z } from 'zod'

import { sameId } from './access'
import type { Id } from './contracts'

/**
 * Règles pures des quiz : validation de saisie (back-office), projection publique sans
 * les bonnes réponses, correction côté serveur, tentatives et retour (ADR 018).
 */

export const questionKinds = ['single', 'multiple', 'true-false'] as const
export type QuestionKind = (typeof questionKinds)[number]

export type AnswerOption = { isCorrect?: boolean | null }

/**
 * Cohérence des réponses d'une question :
 * - `single` et `true-false` : exactement une bonne réponse ;
 * - `true-false` : exactement deux réponses ;
 * - `multiple` : au moins une bonne réponse.
 * Retourne `true` ou un message d'erreur (format attendu par `validate` de Payload).
 */
export function validateQuestionAnswers(
  kind: QuestionKind | null | undefined,
  answers: readonly AnswerOption[] | null | undefined,
): true | string {
  const list = answers ?? []
  if (list.length < 2) return 'Une question doit proposer au moins deux réponses.'
  const correct = list.filter((answer) => answer.isCorrect === true).length
  switch (kind) {
    case 'true-false':
      if (list.length !== 2) return 'Une question vrai/faux propose exactement deux réponses.'
      return correct === 1 || 'Une question vrai/faux a exactement une bonne réponse.'
    case 'multiple':
      return correct >= 1 || 'Au moins une réponse doit être correcte.'
    case 'single':
    default:
      return correct === 1 || 'Une question à choix unique a exactement une bonne réponse.'
  }
}

// ---------------------------------------------------------------------------
// Modèle serveur (jamais sérialisé vers le client)
// ---------------------------------------------------------------------------

export type GradableAnswer = { text: string; isCorrect: boolean; feedback: string | null }

export type GradableQuestion = {
  id: Id
  kind: QuestionKind
  prompt: string
  points: number
  answers: readonly GradableAnswer[]
  explanation: string | null
}

export type GradableQuiz = {
  id: Id
  /** Cours auquel le quiz appartient ; `null` = quiz orphelin, jamais proposé. */
  courseId: Id | null
  title: string
  instructions: string | null
  passingScorePercent: number
  /** 0 = illimité. */
  maxAttempts: number
  shuffleQuestions: boolean
  questions: readonly GradableQuestion[]
}

export class QuizError extends Error {
  constructor(
    public readonly code: 'invalid-submission' | 'invalid-quiz' | 'attempt-conflict',
    message: string,
  ) {
    super(message)
    this.name = 'QuizError'
  }
}

const normalizePoints = (points: number) => (Number.isInteger(points) && points >= 1 ? points : 1)

const normalizeThreshold = (percent: number) =>
  Number.isFinite(percent) ? Math.min(100, Math.max(0, Math.ceil(percent))) : 100

const normalizeMaxAttempts = (maxAttempts: number) =>
  Number.isInteger(maxAttempts) && maxAttempts > 0 ? maxAttempts : 0

// ---------------------------------------------------------------------------
// Projection publique
// ---------------------------------------------------------------------------

export type PublicQuestion = {
  id: Id
  kind: QuestionKind
  prompt: string
  points: number
  /** `index` : position d'origine, seule valeur renvoyée à la soumission. */
  answers: { index: number; text: string }[]
}

export type PublicQuiz = {
  id: Id
  title: string
  instructions: string | null
  passingScorePercent: number
  maxAttempts: number
  questions: PublicQuestion[]
}

/** Graine déterministe (FNV-1a 32 bits) : même ordre à chaque rechargement de la tentative. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Mélange de Fisher-Yates avec un générateur mulberry32 (non cryptographique, suffisant ici). */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let state = hashSeed(seed)
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    const current = result[index] as T
    result[index] = result[other] as T
    result[other] = current
  }
  return result
}

/**
 * Quiz tel qu'envoyé au navigateur avant soumission : champs reconstruits un à un (aucune
 * copie d'objet), donc ni `isCorrect`, ni retour par réponse, ni explication.
 */
export function toPublicQuiz(
  quiz: GradableQuiz,
  options: { shuffleSeed?: string } = {},
): PublicQuiz {
  const questions =
    quiz.shuffleQuestions && options.shuffleSeed !== undefined
      ? seededShuffle(quiz.questions, options.shuffleSeed)
      : [...quiz.questions]
  return {
    id: quiz.id,
    title: quiz.title,
    instructions: quiz.instructions,
    passingScorePercent: normalizeThreshold(quiz.passingScorePercent),
    maxAttempts: normalizeMaxAttempts(quiz.maxAttempts),
    questions: questions.map((question) => ({
      id: question.id,
      kind: question.kind,
      prompt: question.prompt,
      points: normalizePoints(question.points),
      answers: question.answers.map((answer, index) => ({ index, text: answer.text })),
    })),
  }
}

// ---------------------------------------------------------------------------
// Soumission et correction
// ---------------------------------------------------------------------------

export const QUIZ_MAX_QUESTIONS = 200
export const QUIZ_MAX_ANSWERS = 50

const idSchema = z.union([z.number().int().positive(), z.string().trim().min(1).max(64)])

export const quizSubmissionSchema = z.strictObject({
  answers: z
    .array(
      z.strictObject({
        questionId: idSchema,
        selected: z
          .array(
            z
              .number()
              .int()
              .min(0)
              .max(QUIZ_MAX_ANSWERS - 1),
          )
          .max(QUIZ_MAX_ANSWERS),
      }),
    )
    .max(QUIZ_MAX_QUESTIONS),
})

export type QuizSubmission = z.infer<typeof quizSubmissionSchema>

export type GradedQuestion = {
  questionId: Id
  selected: number[]
  correctIndices: number[]
  correct: boolean
  points: number
  earnedPoints: number
}

export type GradedAttempt = {
  earnedPoints: number
  totalPoints: number
  /** Entier 0–100, arrondi à l'inférieur. */
  scorePercent: number
  passed: boolean
  questions: GradedQuestion[]
}

const sameSet = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value) => b.includes(value))

/**
 * Correction côté serveur. Tout ou rien par question (choix multiple : exactement les
 * bonnes réponses). Une question sans réponse est fausse. Une soumission incohérente
 * (question inconnue ou en double, indice hors bornes ou répété) est rejetée : un client
 * honnête n'en produit jamais. La réussite se compare en entiers (pas d'erreur d'arrondi).
 */
export function gradeQuiz(quiz: GradableQuiz, submission: QuizSubmission): GradedAttempt {
  if (quiz.questions.length === 0) throw new QuizError('invalid-quiz', 'Quiz sans question.')

  const seen: Id[] = []
  for (const answer of submission.answers) {
    if (seen.some((id) => sameId(id, answer.questionId)))
      throw new QuizError('invalid-submission', 'Question répondue deux fois.')
    seen.push(answer.questionId)
    const question = quiz.questions.find((candidate) => sameId(candidate.id, answer.questionId))
    if (!question) throw new QuizError('invalid-submission', 'Question étrangère au quiz.')
    if (new Set(answer.selected).size !== answer.selected.length)
      throw new QuizError('invalid-submission', 'Réponse choisie deux fois.')
    if (answer.selected.some((index) => index >= question.answers.length))
      throw new QuizError('invalid-submission', 'Réponse inexistante.')
  }

  const questions = quiz.questions.map((question): GradedQuestion => {
    const points = normalizePoints(question.points)
    const selected = [
      ...(submission.answers.find((answer) => sameId(answer.questionId, question.id))?.selected ??
        []),
    ].sort((a, b) => a - b)
    const correctIndices = question.answers.flatMap((answer, index) =>
      answer.isCorrect ? [index] : [],
    )
    const correct =
      correctIndices.length > 0 &&
      (question.kind === 'multiple'
        ? sameSet(selected, correctIndices)
        : selected.length === 1 && correctIndices.includes(selected[0] as number))
    return {
      questionId: question.id,
      selected,
      correctIndices,
      correct,
      points,
      earnedPoints: correct ? points : 0,
    }
  })

  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0)
  const earnedPoints = questions.reduce((sum, question) => sum + question.earnedPoints, 0)
  const threshold = normalizeThreshold(quiz.passingScorePercent)
  return {
    earnedPoints,
    totalPoints,
    scorePercent: Math.floor((earnedPoints * 100) / totalPoints),
    passed: earnedPoints * 100 >= threshold * totalPoints,
    questions,
  }
}

// ---------------------------------------------------------------------------
// Tentatives
// ---------------------------------------------------------------------------

export type AttemptSummary = {
  attemptNumber: number
  scorePercent: number
  passed: boolean
  submittedAt: Date
}

export type AttemptEligibility =
  | { allowed: true; attemptNumber: number; attemptsRemaining: number | null }
  | { allowed: false; reason: 'already-passed' | 'max-attempts-reached' }

/**
 * Une nouvelle tentative est-elle permise ? Un quiz réussi ne se repasse pas (le score
 * retenu ne change plus) ; au-delà de `maxAttempts`, plus de tentative.
 */
export function evaluateAttemptEligibility(
  maxAttempts: number,
  attempts: readonly AttemptSummary[],
): AttemptEligibility {
  if (attempts.some((attempt) => attempt.passed))
    return { allowed: false, reason: 'already-passed' }
  const limit = normalizeMaxAttempts(maxAttempts)
  if (limit > 0 && attempts.length >= limit)
    return { allowed: false, reason: 'max-attempts-reached' }
  const attemptNumber =
    attempts.reduce((max, attempt) => Math.max(max, attempt.attemptNumber), 0) + 1
  return {
    allowed: true,
    attemptNumber,
    attemptsRemaining: limit > 0 ? limit - attempts.length : null,
  }
}

export type AttemptHistory = {
  count: number
  passed: boolean
  bestScorePercent: number | null
  attempts: AttemptSummary[]
}

/** Historique trié (plus récente en premier) et meilleur score. */
export function summarizeAttempts(attempts: readonly AttemptSummary[]): AttemptHistory {
  const sorted = [...attempts].sort((a, b) => b.attemptNumber - a.attemptNumber)
  return {
    count: sorted.length,
    passed: sorted.some((attempt) => attempt.passed),
    bestScorePercent:
      sorted.length === 0 ? null : Math.max(...sorted.map((attempt) => attempt.scorePercent)),
    attempts: sorted,
  }
}

// ---------------------------------------------------------------------------
// Retour après soumission
// ---------------------------------------------------------------------------

export type QuestionFeedback = {
  questionId: Id
  correct: boolean
  selected: number[]
  /** Retour rédigé pour chacune des réponses choisies. */
  selectedFeedback: { index: number; feedback: string }[]
  /** Présents seulement quand les solutions sont révélées. */
  correctIndices?: number[]
  explanation?: string
}

export type AttemptFeedback = {
  attemptNumber: number
  scorePercent: number
  passed: boolean
  passingScorePercent: number
  attemptsRemaining: number | null
  solutionsRevealed: boolean
  questions: QuestionFeedback[]
}

/**
 * Retour envoyé au navigateur après correction. Les bonnes réponses et l'explication ne
 * sont révélées qu'une fois le quiz réussi ou les tentatives épuisées : sinon, la
 * tentative suivante se ferait par simple recopie (ADR 018).
 */
export function buildAttemptFeedback(
  quiz: GradableQuiz,
  graded: GradedAttempt,
  attempt: { attemptNumber: number; attemptsRemaining: number | null },
): AttemptFeedback {
  const reveal = graded.passed || attempt.attemptsRemaining === 0
  return {
    attemptNumber: attempt.attemptNumber,
    scorePercent: graded.scorePercent,
    passed: graded.passed,
    passingScorePercent: normalizeThreshold(quiz.passingScorePercent),
    attemptsRemaining: graded.passed ? 0 : attempt.attemptsRemaining,
    solutionsRevealed: reveal,
    questions: graded.questions.map((result) => {
      const question = quiz.questions.find((candidate) => sameId(candidate.id, result.questionId))
      const selectedFeedback = result.selected.flatMap((index) => {
        const feedback = question?.answers[index]?.feedback?.trim()
        return feedback ? [{ index, feedback }] : []
      })
      const explanation = question?.explanation?.trim()
      return {
        questionId: result.questionId,
        correct: result.correct,
        selected: result.selected,
        selectedFeedback,
        ...(reveal ? { correctIndices: result.correctIndices } : {}),
        ...(reveal && explanation ? { explanation } : {}),
      }
    }),
  }
}
