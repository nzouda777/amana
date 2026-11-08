import { sameId } from './access'
import type { AccessDenialReason, AccessService, Id, Viewer } from './contracts'
import {
  type AttemptEligibility,
  type AttemptFeedback,
  type AttemptHistory,
  type AttemptSummary,
  buildAttemptFeedback,
  evaluateAttemptEligibility,
  type GradableQuiz,
  type GradedAttempt,
  gradeQuiz,
  type PublicQuiz,
  QuizError,
  quizSubmissionSchema,
  summarizeAttempts,
  toPublicQuiz,
} from './quiz'

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------

export interface QuizRepository {
  /** Quiz complet (bonnes réponses comprises), lu côté serveur uniquement. */
  getGradableQuiz(quizId: Id): Promise<GradableQuiz | null>
}

export type QuizAttemptRecord = {
  userId: Id
  quizId: Id
  courseId: Id
  attemptNumber: number
  answers: { questionId: Id; selected: number[] }[]
  scorePercent: number
  passed: boolean
  startedAt: Date | null
  submittedAt: Date
}

export interface QuizAttemptStore {
  listAttempts(userId: Id, quizId: Id): Promise<AttemptSummary[]>
  /**
   * Enregistre une tentative. Contrainte d'unicité (utilisateur, quiz, numéro) en base :
   * deux soumissions simultanées ne dépassent jamais `maxAttempts`. Lève
   * `QuizError('attempt-conflict')` si le numéro est déjà pris.
   */
  createAttempt(record: QuizAttemptRecord): Promise<{ id: Id }>
}

export type QuizServiceOptions = {
  quizzes: QuizRepository
  attempts: QuizAttemptStore
  access: Pick<AccessService, 'canAccessCourse'>
  now?: () => Date
  /** Après une tentative réussie : complétion du cours, job de certificat. */
  onQuizPassed?: (event: { userId: Id; quizId: Id; courseId: Id }) => Promise<void>
}

export type QuizDenialReason =
  | AccessDenialReason
  | 'invalid-submission'
  | 'already-passed'
  | 'max-attempts-reached'
  | 'attempt-conflict'

export type QuizView =
  | {
      ok: true
      quiz: PublicQuiz
      eligibility: AttemptEligibility
      history: AttemptHistory
    }
  | { ok: false; reason: AccessDenialReason }

export type QuizSubmitResult =
  { ok: true; attemptId: Id; feedback: AttemptFeedback } | { ok: false; reason: QuizDenialReason }

/**
 * Quiz côté serveur : accès vérifié par `AccessService` sur le cours du quiz, bonnes
 * réponses jamais exposées avant soumission, correction et enregistrement serveur.
 */
export class QuizService {
  private readonly now: () => Date

  constructor(private readonly options: QuizServiceOptions) {
    this.now = options.now ?? (() => new Date())
  }

  private async load(
    viewer: Viewer,
    quizId: Id,
    expectedCourseId: Id | undefined,
  ): Promise<
    | { ok: true; quiz: GradableQuiz & { courseId: Id }; userId: Id }
    | { ok: false; reason: AccessDenialReason }
  > {
    if (!viewer) return { ok: false, reason: 'not-authenticated' }
    const quiz = await this.options.quizzes.getGradableQuiz(quizId)
    if (!quiz || !sameId(quiz.id, quizId) || quiz.courseId === null || quiz.questions.length === 0)
      return { ok: false, reason: 'not-found' }
    if (expectedCourseId !== undefined && !sameId(quiz.courseId, expectedCourseId))
      return { ok: false, reason: 'not-found' }
    const decision = await this.options.access.canAccessCourse(viewer, quiz.courseId, this.now())
    // Un extrait gratuit ne donne pas droit au quiz : il faut l'accès au cours.
    if (!decision.allowed || decision.reason === 'preview') {
      return { ok: false, reason: decision.allowed ? 'no-enrollment' : decision.reason }
    }
    return { ok: true, quiz: { ...quiz, courseId: quiz.courseId }, userId: viewer.id }
  }

  private shuffleSeed(userId: Id, quizId: Id, attemptNumber: number): string {
    return `${String(userId)}:${String(quizId)}:${attemptNumber}`
  }

  /** Quiz à afficher (sans solutions), éligibilité de la prochaine tentative et historique. */
  async getQuizForViewer(
    viewer: Viewer,
    quizId: Id,
    options: { expectedCourseId?: Id } = {},
  ): Promise<QuizView> {
    const loaded = await this.load(viewer, quizId, options.expectedCourseId)
    if (!loaded.ok) return loaded
    const attempts = await this.options.attempts.listAttempts(loaded.userId, loaded.quiz.id)
    const eligibility = evaluateAttemptEligibility(loaded.quiz.maxAttempts, attempts)
    const attemptNumber = eligibility.allowed ? eligibility.attemptNumber : attempts.length
    return {
      ok: true,
      quiz: toPublicQuiz(loaded.quiz, {
        shuffleSeed: this.shuffleSeed(loaded.userId, loaded.quiz.id, attemptNumber),
      }),
      eligibility,
      history: summarizeAttempts(attempts),
    }
  }

  /** Corrige et enregistre une tentative. `rawSubmission` vient du client : il est validé ici. */
  async submit(
    viewer: Viewer,
    quizId: Id,
    rawSubmission: unknown,
    options: { expectedCourseId?: Id; startedAt?: Date | null } = {},
  ): Promise<QuizSubmitResult> {
    const loaded = await this.load(viewer, quizId, options.expectedCourseId)
    if (!loaded.ok) return loaded
    const parsed = quizSubmissionSchema.safeParse(rawSubmission)
    if (!parsed.success) return { ok: false, reason: 'invalid-submission' }

    const { quiz, userId } = loaded
    const attempts = await this.options.attempts.listAttempts(userId, quiz.id)
    const eligibility = evaluateAttemptEligibility(quiz.maxAttempts, attempts)
    if (!eligibility.allowed) return { ok: false, reason: eligibility.reason }

    let graded: GradedAttempt
    try {
      graded = gradeQuiz(quiz, parsed.data)
    } catch (error) {
      if (error instanceof QuizError && error.code === 'invalid-submission')
        return { ok: false, reason: 'invalid-submission' }
      throw error
    }

    const submittedAt = this.now()
    const startedAt =
      options.startedAt && options.startedAt.getTime() <= submittedAt.getTime()
        ? options.startedAt
        : null
    let created: { id: Id }
    try {
      created = await this.options.attempts.createAttempt({
        userId,
        quizId: quiz.id,
        courseId: quiz.courseId,
        attemptNumber: eligibility.attemptNumber,
        answers: graded.questions.map((question) => ({
          questionId: question.questionId,
          selected: question.selected,
        })),
        scorePercent: graded.scorePercent,
        passed: graded.passed,
        startedAt,
        submittedAt,
      })
    } catch (error) {
      if (error instanceof QuizError && error.code === 'attempt-conflict')
        return { ok: false, reason: 'attempt-conflict' }
      throw error
    }

    if (graded.passed && this.options.onQuizPassed) {
      await this.options.onQuizPassed({ userId, quizId: quiz.id, courseId: quiz.courseId })
    }

    const attemptsRemaining =
      eligibility.attemptsRemaining === null ? null : eligibility.attemptsRemaining - 1
    return {
      ok: true,
      attemptId: created.id,
      feedback: buildAttemptFeedback(quiz, graded, {
        attemptNumber: eligibility.attemptNumber,
        attemptsRemaining,
      }),
    }
  }
}
