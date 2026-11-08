import type { Payload, Where } from 'payload'

import type { Locale } from '@/lib/i18n/config'
import type { Enrollment, Question, Quiz, QuizAttempt } from '@/payload-types'

import type {
  AccessCatalog,
  CourseAccessInfo,
  EnrollmentOrigin,
  EnrollmentStore,
  LessonAccessInfo,
  StoredEnrollment,
} from '../access'
import type { GrantInput, Id } from '../contracts'
import { type AttemptSummary, type GradableQuiz, QuizError, type QuestionKind } from '../quiz'
import type { QuizAttemptRecord, QuizAttemptStore, QuizRepository } from '../quiz-service'

/**
 * Adaptateurs Payload (Local API) des ports du domaine Formation. Tout ce qui décide d'un
 * accès lit avec `overrideAccess: true` (service système : brouillons, inscriptions de
 * tous les utilisateurs, quiz avec leurs bonnes réponses) mais ne **projette** que les
 * champs nécessaires (`select`). Rien de ce qui est lu ici n'est renvoyé tel quel au
 * navigateur : les services du domaine en tirent des décisions ou des vues publiques.
 * Les lectures qui n'ont besoin d'aucun privilège (leçons : `read: anyone`, champs
 * protégés non sélectionnés) passent par les règles publiques.
 */

// ---------------------------------------------------------------------------
// Conversions pures (testées sans base)
// ---------------------------------------------------------------------------

type Relation = number | string | { id: number | string } | null | undefined

/** Identifiant d'une relation, peuplée ou non. */
export function relationId(value: Relation): Id | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') return value.id
  return value
}

/**
 * Identifiant Postgres (entier > 0). Une valeur forgée (« abc », « 1; drop ») n'atteint
 * jamais la base : `null`, traité comme « introuvable ».
 */
export function toNumericId(id: Id | null | undefined): number | null {
  if (typeof id === 'number') return Number.isSafeInteger(id) && id > 0 ? id : null
  if (typeof id === 'string' && /^[1-9]\d{0,15}$/.test(id)) {
    const value = Number(id)
    return Number.isSafeInteger(value) ? value : null
  }
  return null
}

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export type EnrollmentDoc = Pick<
  Enrollment,
  | 'id'
  | 'user'
  | 'scope'
  | 'course'
  | 'source'
  | 'status'
  | 'startsAt'
  | 'endsAt'
  | 'order'
  | 'license'
  | 'product'
  | 'grantedBy'
  | 'revokedReason'
>

export function toStoredEnrollment(doc: EnrollmentDoc): StoredEnrollment {
  const origin: EnrollmentOrigin = {}
  const orderId = relationId(doc.order)
  const licenseId = relationId(doc.license)
  const productId = relationId(doc.product)
  const grantedBy = relationId(doc.grantedBy)
  if (orderId !== null) origin.orderId = orderId
  if (licenseId !== null) origin.licenseId = licenseId
  if (productId !== null) origin.productId = productId
  if (grantedBy !== null) origin.grantedBy = grantedBy
  return {
    id: doc.id,
    // Utilisateur absent : identifiant vide, qui ne correspond à personne (fail closed).
    userId: relationId(doc.user) ?? '',
    scope: doc.scope,
    courseId: doc.scope === 'catalog' ? null : relationId(doc.course),
    source: doc.source,
    status: doc.status,
    // Date de début illisible : l'inscription ne démarre jamais (fail closed).
    startsAt: toDate(doc.startsAt) ?? new Date(8.64e15),
    endsAt: toDate(doc.endsAt),
    origin,
    revokedReason: doc.revokedReason ?? null,
  }
}

/** Données d'écriture d'une inscription, à partir d'une demande validée par le service. */
export function toEnrollmentData(input: GrantInput) {
  return {
    user: toNumericId(input.userId) ?? 0,
    scope: input.scope,
    course: input.scope === 'course' ? toNumericId(input.courseId) : null,
    source: input.source,
    status: 'active' as const,
    startsAt: input.startsAt.toISOString(),
    endsAt: input.endsAt ? input.endsAt.toISOString() : null,
    order: toNumericId(input.origin.orderId),
    license: toNumericId(input.origin.licenseId),
    product: toNumericId(input.origin.productId),
    grantedBy: toNumericId(input.origin.grantedBy),
  }
}

export function toCourseAccessInfo(doc: {
  id: number
  _status?: 'draft' | 'published' | null
  includedInPass?: boolean | null
  instructors?: Relation[] | null
}): CourseAccessInfo {
  return {
    id: doc.id,
    published: doc._status === 'published',
    // Valeur par défaut du schéma : inclus.
    includedInPass: doc.includedInPass !== false,
    instructorIds: (doc.instructors ?? []).flatMap((value) => {
      const id = relationId(value)
      return id === null ? [] : [id]
    }),
  }
}

export function toLessonAccessInfo(doc: {
  id: number
  course?: Relation
  isPreview?: boolean | null
}): LessonAccessInfo | null {
  const courseId = relationId(doc.course)
  if (courseId === null) return null
  return { id: doc.id, courseId, isPreview: doc.isPreview === true }
}

const questionKinds: readonly QuestionKind[] = ['single', 'multiple', 'true-false']

export function toGradableQuiz(
  quiz: Pick<
    Quiz,
    'id' | 'title' | 'course' | 'instructions' | 'passingScorePercent' | 'maxAttempts'
  > & { shuffleQuestions?: boolean | null },
  questions: readonly Pick<
    Question,
    'id' | 'kind' | 'prompt' | 'points' | 'answers' | 'explanation' | 'order'
  >[],
): GradableQuiz {
  return {
    id: quiz.id,
    courseId: relationId(quiz.course),
    title: quiz.title,
    instructions: quiz.instructions?.trim() || null,
    passingScorePercent: quiz.passingScorePercent,
    maxAttempts: quiz.maxAttempts ?? 0,
    shuffleQuestions: quiz.shuffleQuestions === true,
    questions: [...questions]
      .sort((a, b) => a.order - b.order)
      .filter((question) => questionKinds.includes(question.kind))
      .map((question) => ({
        id: question.id,
        kind: question.kind,
        prompt: question.prompt,
        points: question.points ?? 1,
        answers: (question.answers ?? []).map((answer) => ({
          text: answer.text,
          isCorrect: answer.isCorrect === true,
          feedback: answer.feedback?.trim() || null,
        })),
        explanation: question.explanation?.trim() || null,
      })),
  }
}

export function toAttemptSummary(
  doc: Pick<QuizAttempt, 'attemptNumber' | 'scorePercent' | 'passed' | 'submittedAt'>,
): AttemptSummary {
  return {
    attemptNumber: doc.attemptNumber,
    scorePercent: doc.scorePercent,
    passed: doc.passed === true,
    submittedAt: toDate(doc.submittedAt) ?? new Date(0),
  }
}

/**
 * Violation d'unicité Postgres (`23505`), telle que la remonte l'adaptateur Payload :
 * erreur brute de pilote, cause chaînée, ou `ValidationError` « doit être unique ».
 */
export function isUniqueViolation(error: unknown, depth = 0): boolean {
  if (depth > 5 || typeof error !== 'object' || error === null) return false
  const candidate = error as {
    code?: unknown
    name?: unknown
    message?: unknown
    cause?: unknown
    data?: { errors?: { message?: unknown }[] }
  }
  if (candidate.code === '23505') return true
  if (candidate.name === 'ValidationError') {
    const messages = [
      candidate.message,
      ...(candidate.data?.errors ?? []).map((item) => item.message),
    ]
    if (messages.some((message) => typeof message === 'string' && /unique/i.test(message)))
      return true
  }
  return isUniqueViolation(candidate.cause, depth + 1)
}

// ---------------------------------------------------------------------------
// Adaptateurs
// ---------------------------------------------------------------------------

const enrollmentSelect = {
  user: true,
  scope: true,
  course: true,
  source: true,
  status: true,
  startsAt: true,
  endsAt: true,
  order: true,
  license: true,
  product: true,
  grantedBy: true,
  revokedReason: true,
} as const

export function createPayloadAccessCatalog(payload: Payload): AccessCatalog {
  return {
    async getCourses(courseIds) {
      const ids = courseIds.flatMap((id) => {
        const numeric = toNumericId(id)
        return numeric === null ? [] : [numeric]
      })
      if (ids.length === 0) return []
      // Brouillons compris (un cours dépublié reste accessible à ses inscrits) : privilège
      // système, projection minimale.
      const result = await payload.find({
        collection: 'courses',
        where: { id: { in: ids } },
        select: { _status: true, includedInPass: true, instructors: true },
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })
      return result.docs.map(toCourseAccessInfo)
    },
    async getLesson(lessonId) {
      const id = toNumericId(lessonId)
      if (id === null) return null
      // `lessons` est lisible par tous ; aucun champ protégé n'est sélectionné.
      const result = await payload.find({
        collection: 'lessons',
        where: { id: { equals: id } },
        select: { course: true, isPreview: true },
        depth: 0,
        limit: 1,
        overrideAccess: false,
      })
      const doc = result.docs[0]
      return doc ? toLessonAccessInfo(doc) : null
    },
    async listPassCourseIds() {
      const result = await payload.find({
        collection: 'courses',
        where: {
          and: [{ _status: { equals: 'published' } }, { includedInPass: { equals: true } }],
        },
        select: {},
        depth: 0,
        pagination: false,
        overrideAccess: false,
      })
      return result.docs.map((doc) => doc.id)
    },
  }
}

export function createPayloadEnrollmentStore(payload: Payload): EnrollmentStore {
  const find = async (where: Where): Promise<StoredEnrollment[]> => {
    const result = await payload.find({
      collection: 'enrollments',
      where,
      select: enrollmentSelect,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    return result.docs.map(toStoredEnrollment)
  }

  return {
    async findForUserCourse(userId, courseId) {
      const user = toNumericId(userId)
      const course = toNumericId(courseId)
      if (user === null) return []
      const scopes: Where[] = [{ scope: { equals: 'catalog' } }]
      if (course !== null)
        scopes.push({ and: [{ scope: { equals: 'course' } }, { course: { equals: course } }] })
      return find({ and: [{ user: { equals: user } }, { or: scopes }] })
    },
    async listForUser(userId) {
      const user = toNumericId(userId)
      return user === null ? [] : find({ user: { equals: user } })
    },
    async findByOrigin(origin) {
      const conditions: Where[] = []
      const order = toNumericId(origin.orderId)
      const license = toNumericId(origin.licenseId)
      if (order !== null) conditions.push({ order: { equals: order } })
      if (license !== null) conditions.push({ license: { equals: license } })
      return conditions.length === 0 ? [] : find({ or: conditions })
    },
    async findGrantCandidates(input) {
      const user = toNumericId(input.userId)
      if (user === null) return []
      const conditions: Where[] = [
        { user: { equals: user } },
        { scope: { equals: input.scope } },
        { source: { equals: input.source } },
      ]
      if (input.scope === 'course') {
        const course = toNumericId(input.courseId)
        if (course === null) return []
        conditions.push({ course: { equals: course } })
      }
      return find({ and: conditions })
    },
    async create(input) {
      const doc = await payload.create({
        collection: 'enrollments',
        data: toEnrollmentData(input),
        depth: 0,
        overrideAccess: true,
      })
      return toStoredEnrollment(doc)
    },
    async revoke(enrollmentIds, reason) {
      const ids = enrollmentIds.flatMap((id) => {
        const numeric = toNumericId(id)
        return numeric === null ? [] : [numeric]
      })
      if (ids.length === 0) return 0
      const result = await payload.update({
        collection: 'enrollments',
        where: { and: [{ id: { in: ids } }, { status: { not_equals: 'revoked' } }] },
        data: { status: 'revoked', revokedReason: reason },
        depth: 0,
        overrideAccess: true,
      })
      return result.docs.length
    },
  }
}

/** Quiz avec leurs bonnes réponses : lus côté serveur uniquement (ADR 018). */
export function createPayloadQuizRepository(payload: Payload, locale: Locale): QuizRepository {
  return {
    async getGradableQuiz(quizId) {
      const id = toNumericId(quizId)
      if (id === null) return null
      const quizzes = await payload.find({
        collection: 'quizzes',
        where: { id: { equals: id } },
        select: {
          title: true,
          course: true,
          instructions: true,
          passingScorePercent: true,
          maxAttempts: true,
          shuffleQuestions: true,
        },
        locale,
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
      const quiz = quizzes.docs[0]
      if (!quiz) return null
      const questions = await payload.find({
        collection: 'questions',
        where: { quiz: { equals: id } },
        select: {
          order: true,
          kind: true,
          prompt: true,
          points: true,
          answers: true,
          explanation: true,
        },
        sort: 'order',
        locale,
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })
      return toGradableQuiz(quiz, questions.docs)
    },
  }
}

export function createPayloadQuizAttemptStore(payload: Payload): QuizAttemptStore {
  return {
    async listAttempts(userId, quizId) {
      const user = toNumericId(userId)
      const quiz = toNumericId(quizId)
      if (user === null || quiz === null) return []
      const result = await payload.find({
        collection: 'quiz-attempts',
        where: { and: [{ user: { equals: user } }, { quiz: { equals: quiz } }] },
        select: { attemptNumber: true, scorePercent: true, passed: true, submittedAt: true },
        sort: 'attemptNumber',
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })
      return result.docs.map(toAttemptSummary)
    },
    async createAttempt(record: QuizAttemptRecord) {
      const user = toNumericId(record.userId)
      const quiz = toNumericId(record.quizId)
      if (user === null || quiz === null)
        throw new QuizError('invalid-submission', 'Tentative sans utilisateur ou quiz valide.')
      try {
        const doc = await payload.create({
          collection: 'quiz-attempts',
          data: {
            user,
            quiz,
            course: toNumericId(record.courseId),
            attemptNumber: record.attemptNumber,
            answers: record.answers.map((answer) => ({
              questionId: answer.questionId,
              selected: [...answer.selected],
            })),
            scorePercent: record.scorePercent,
            passed: record.passed,
            startedAt: record.startedAt ? record.startedAt.toISOString() : null,
            submittedAt: record.submittedAt.toISOString(),
          },
          depth: 0,
          overrideAccess: true,
        })
        return { id: doc.id }
      } catch (error) {
        if (isUniqueViolation(error))
          throw new QuizError('attempt-conflict', 'Numéro de tentative déjà enregistré.')
        throw error
      }
    },
  }
}
