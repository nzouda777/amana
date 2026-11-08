import { beforeEach, describe, expect, it } from 'vitest'

import type { AccessDecision, AccessService, Id, Viewer } from '@/features/lms/contracts'
import {
  type AttemptSummary,
  buildAttemptFeedback,
  evaluateAttemptEligibility,
  type GradableQuiz,
  gradeQuiz,
  QuizError,
  quizSubmissionSchema,
  seededShuffle,
  summarizeAttempts,
  toPublicQuiz,
} from '@/features/lms/quiz'
import {
  type QuizAttemptRecord,
  type QuizAttemptStore,
  type QuizRepository,
  QuizService,
} from '@/features/lms/quiz-service'
import { REVIEW_MIN_COUNT_FOR_AVERAGE, summarizeRatings } from '@/features/lms/reviews'

const quiz: GradableQuiz = {
  id: 900,
  courseId: 10,
  title: 'Les fondamentaux',
  instructions: null,
  passingScorePercent: 70,
  maxAttempts: 3,
  shuffleQuestions: false,
  questions: [
    {
      id: 1,
      kind: 'single',
      prompt: 'Le riba désigne…',
      points: 1,
      explanation: 'Le riba est l’intérêt.',
      answers: [
        { text: 'L’intérêt', isCorrect: true, feedback: 'Exact.' },
        { text: 'Le partage des pertes', isCorrect: false, feedback: 'Non : c’est la moudaraba.' },
        { text: 'Un contrat de location', isCorrect: false, feedback: null },
      ],
    },
    {
      id: 2,
      kind: 'multiple',
      prompt: 'Contrats participatifs',
      points: 2,
      explanation: null,
      answers: [
        { text: 'Moucharaka', isCorrect: true, feedback: null },
        { text: 'Moudaraba', isCorrect: true, feedback: null },
        { text: 'Mourabaha', isCorrect: false, feedback: 'Vente à marge, pas participatif.' },
      ],
    },
    {
      id: 3,
      kind: 'true-false',
      prompt: 'Le gharar est toléré sans limite.',
      points: 1,
      explanation: 'Seul un gharar mineur est toléré.',
      answers: [
        { text: 'Vrai', isCorrect: false, feedback: null },
        { text: 'Faux', isCorrect: true, feedback: null },
      ],
    },
  ],
}

const allRight = {
  answers: [
    { questionId: 1, selected: [0] },
    { questionId: 2, selected: [1, 0] },
    { questionId: 3, selected: [1] },
  ],
}

describe('toPublicQuiz : aucune bonne réponse avant soumission', () => {
  it('ne contient ni isCorrect, ni retour, ni explication', () => {
    const json = JSON.stringify(toPublicQuiz(quiz))
    expect(json).not.toMatch(/isCorrect|feedback|explanation/)
    expect(json).not.toContain('Exact.')
    expect(json).not.toContain('Le riba est l’intérêt.')
    const publicQuiz = toPublicQuiz(quiz)
    expect(publicQuiz.questions[0]).toEqual({
      id: 1,
      kind: 'single',
      prompt: 'Le riba désigne…',
      points: 1,
      answers: [
        { index: 0, text: 'L’intérêt' },
        { index: 1, text: 'Le partage des pertes' },
        { index: 2, text: 'Un contrat de location' },
      ],
    })
  })

  it('ne recopie pas un champ ajouté plus tard au modèle serveur', () => {
    const extended = {
      ...quiz,
      secret: 'interne',
      questions: quiz.questions.map((question) => ({ ...question, solutionNote: 'interne' })),
    }
    expect(JSON.stringify(toPublicQuiz(extended))).not.toContain('interne')
  })

  it('mélange déterministe des questions selon la graine', () => {
    const shuffled = { ...quiz, shuffleQuestions: true }
    const a = toPublicQuiz(shuffled, { shuffleSeed: '7:900:1' }).questions.map((q) => q.id)
    const b = toPublicQuiz(shuffled, { shuffleSeed: '7:900:1' }).questions.map((q) => q.id)
    expect(a).toEqual(b)
    expect([...a].sort()).toEqual([1, 2, 3])
    expect(toPublicQuiz(quiz, { shuffleSeed: 'x' }).questions.map((q) => q.id)).toEqual([1, 2, 3])
  })

  it('seededShuffle conserve les éléments et varie selon la graine', () => {
    const items = Array.from({ length: 20 }, (_, index) => index)
    const orders = new Set(['a', 'b', 'c', 'd'].map((seed) => seededShuffle(items, seed).join(',')))
    expect(orders.size).toBeGreaterThan(1)
    for (const seed of ['a', 'b'])
      expect(seededShuffle(items, seed).sort((x, y) => x - y)).toEqual(items)
  })

  it('normalise seuil et tentatives incohérents', () => {
    const odd = toPublicQuiz({ ...quiz, passingScorePercent: 140, maxAttempts: -2 })
    expect(odd.passingScorePercent).toBe(100)
    expect(odd.maxAttempts).toBe(0)
  })
})

describe('gradeQuiz', () => {
  it('tout juste : 100 %, réussi', () => {
    expect(gradeQuiz(quiz, allRight)).toMatchObject({
      earnedPoints: 4,
      totalPoints: 4,
      scorePercent: 100,
      passed: true,
    })
  })

  it('choix multiple en tout ou rien', () => {
    const partial = gradeQuiz(quiz, {
      answers: [
        { questionId: 1, selected: [0] },
        { questionId: 2, selected: [0] },
        { questionId: 3, selected: [1] },
      ],
    })
    expect(partial.questions[1]).toMatchObject({ correct: false, earnedPoints: 0 })
    expect(partial).toMatchObject({ earnedPoints: 2, scorePercent: 50, passed: false })
    const tooMany = gradeQuiz(quiz, {
      answers: [{ questionId: 2, selected: [0, 1, 2] }],
    })
    expect(tooMany.questions[1]!.correct).toBe(false)
  })

  it('choix unique : deux réponses cochées = faux', () => {
    const result = gradeQuiz(quiz, { answers: [{ questionId: 1, selected: [0, 1] }] })
    expect(result.questions[0]!.correct).toBe(false)
  })

  it('question sans réponse = fausse ; soumission vide = 0 %', () => {
    expect(gradeQuiz(quiz, { answers: [] })).toMatchObject({ scorePercent: 0, passed: false })
  })

  it('seuil comparé en entiers, sans erreur d’arrondi', () => {
    const thirds: GradableQuiz = {
      ...quiz,
      passingScorePercent: 67,
      questions: [quiz.questions[0]!, quiz.questions[2]!, { ...quiz.questions[0]!, id: 4 }],
    }
    const twoOfThree = {
      answers: [
        { questionId: 1, selected: [0] },
        { questionId: 3, selected: [1] },
        { questionId: 4, selected: [2] },
      ],
    }
    expect(gradeQuiz(thirds, twoOfThree)).toMatchObject({ scorePercent: 66, passed: false })
    expect(gradeQuiz({ ...thirds, passingScorePercent: 66 }, twoOfThree).passed).toBe(true)
    expect(gradeQuiz({ ...thirds, passingScorePercent: 0 }, { answers: [] }).passed).toBe(true)
  })

  it('points invalides ramenés à 1', () => {
    const weird: GradableQuiz = {
      ...quiz,
      questions: [
        { ...quiz.questions[0]!, points: 0 },
        { ...quiz.questions[2]!, points: 2.5 },
      ],
    }
    expect(gradeQuiz(weird, { answers: [{ questionId: 1, selected: [0] }] })).toMatchObject({
      totalPoints: 2,
      earnedPoints: 1,
    })
  })

  it('rejette les soumissions forgées', () => {
    const forged = [
      { answers: [{ questionId: 99, selected: [0] }] },
      {
        answers: [
          { questionId: 1, selected: [0] },
          { questionId: '1', selected: [1] },
        ],
      },
      { answers: [{ questionId: 1, selected: [3] }] },
      { answers: [{ questionId: 2, selected: [0, 0] }] },
    ]
    for (const submission of forged) {
      expect(() => gradeQuiz(quiz, submission)).toThrow(QuizError)
    }
  })

  it('une question sans bonne réponse n’est jamais juste', () => {
    const broken: GradableQuiz = {
      ...quiz,
      questions: [
        {
          ...quiz.questions[0]!,
          answers: quiz.questions[0]!.answers.map((answer) => ({ ...answer, isCorrect: false })),
        },
      ],
    }
    expect(gradeQuiz(broken, { answers: [{ questionId: 1, selected: [] }] }).passed).toBe(false)
  })

  it('quiz sans question : erreur de configuration', () => {
    expect(() => gradeQuiz({ ...quiz, questions: [] }, { answers: [] })).toThrow(QuizError)
  })
})

describe('quizSubmissionSchema', () => {
  it('rejette champs inconnus, indices négatifs ou non entiers, lots trop grands', () => {
    const invalid: unknown[] = [
      { answers: [{ questionId: 1, selected: [-1] }] },
      { answers: [{ questionId: 1, selected: [0.5] }] },
      { answers: [{ questionId: 1, selected: [0], isCorrect: true }] },
      { answers: [], score: 100 },
      { answers: Array.from({ length: 201 }, (_, i) => ({ questionId: i + 1, selected: [] })) },
      { answers: [{ questionId: '', selected: [] }] },
      null,
    ]
    for (const value of invalid) expect(quizSubmissionSchema.safeParse(value).success).toBe(false)
    expect(quizSubmissionSchema.safeParse(allRight).success).toBe(true)
  })
})

const attempt = (attemptNumber: number, passed = false, scorePercent = 40): AttemptSummary => ({
  attemptNumber,
  passed,
  scorePercent,
  submittedAt: new Date(2026, 10, attemptNumber),
})

describe('evaluateAttemptEligibility', () => {
  it('première tentative, tentatives restantes', () => {
    expect(evaluateAttemptEligibility(3, [])).toEqual({
      allowed: true,
      attemptNumber: 1,
      attemptsRemaining: 3,
    })
    expect(evaluateAttemptEligibility(3, [attempt(1), attempt(2)])).toEqual({
      allowed: true,
      attemptNumber: 3,
      attemptsRemaining: 1,
    })
  })

  it('limite atteinte, quiz déjà réussi', () => {
    expect(evaluateAttemptEligibility(2, [attempt(1), attempt(2)])).toEqual({
      allowed: false,
      reason: 'max-attempts-reached',
    })
    expect(evaluateAttemptEligibility(0, [attempt(1, true)])).toEqual({
      allowed: false,
      reason: 'already-passed',
    })
  })

  it('illimité, numérotation après un trou', () => {
    expect(evaluateAttemptEligibility(0, [attempt(1), attempt(5)])).toEqual({
      allowed: true,
      attemptNumber: 6,
      attemptsRemaining: null,
    })
  })
})

describe('summarizeAttempts', () => {
  it('historique trié et meilleur score', () => {
    const history = summarizeAttempts([attempt(1, false, 40), attempt(2, true, 80)])
    expect(history).toMatchObject({ count: 2, passed: true, bestScorePercent: 80 })
    expect(history.attempts.map((item) => item.attemptNumber)).toEqual([2, 1])
    expect(summarizeAttempts([])).toMatchObject({ count: 0, bestScorePercent: null })
  })
})

describe('buildAttemptFeedback', () => {
  const failing = {
    answers: [
      { questionId: 1, selected: [1] },
      { questionId: 2, selected: [2] },
    ],
  }

  it('échec avec tentatives restantes : pas de solution ni d’explication', () => {
    const feedback = buildAttemptFeedback(quiz, gradeQuiz(quiz, failing), {
      attemptNumber: 1,
      attemptsRemaining: 2,
    })
    expect(feedback.solutionsRevealed).toBe(false)
    expect(JSON.stringify(feedback)).not.toMatch(/correctIndices|explanation/)
    expect(feedback.questions[0]).toEqual({
      questionId: 1,
      correct: false,
      selected: [1],
      selectedFeedback: [{ index: 1, feedback: 'Non : c’est la moudaraba.' }],
    })
    // Retour uniquement sur les réponses choisies.
    expect(JSON.stringify(feedback)).not.toContain('Exact.')
  })

  it('réussite ou dernière tentative : solutions et explications révélées', () => {
    const passed = buildAttemptFeedback(quiz, gradeQuiz(quiz, allRight), {
      attemptNumber: 2,
      attemptsRemaining: 1,
    })
    expect(passed).toMatchObject({ solutionsRevealed: true, passed: true, attemptsRemaining: 0 })
    expect(passed.questions[0]).toMatchObject({
      correctIndices: [0],
      explanation: 'Le riba est l’intérêt.',
    })
    expect(passed.questions[1]).not.toHaveProperty('explanation')

    const last = buildAttemptFeedback(quiz, gradeQuiz(quiz, failing), {
      attemptNumber: 3,
      attemptsRemaining: 0,
    })
    expect(last.solutionsRevealed).toBe(true)
    expect(last.questions[1]).toMatchObject({ correctIndices: [0, 1] })
  })

  it('illimité : jamais révélé avant réussite', () => {
    const feedback = buildAttemptFeedback(quiz, gradeQuiz(quiz, failing), {
      attemptNumber: 9,
      attemptsRemaining: null,
    })
    expect(feedback.solutionsRevealed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// QuizService
// ---------------------------------------------------------------------------

class MemoryAttempts implements QuizAttemptStore {
  rows: (QuizAttemptRecord & { id: number })[] = []
  async listAttempts(userId: Id, quizId: Id) {
    return this.rows
      .filter((row) => row.userId === userId && row.quizId === quizId)
      .map((row) => ({
        attemptNumber: row.attemptNumber,
        passed: row.passed,
        scorePercent: row.scorePercent,
        submittedAt: row.submittedAt,
      }))
  }
  async createAttempt(record: QuizAttemptRecord) {
    // Contrainte d'unicité (utilisateur, quiz, numéro), comme en base.
    if (
      this.rows.some(
        (row) =>
          row.userId === record.userId &&
          row.quizId === record.quizId &&
          row.attemptNumber === record.attemptNumber,
      )
    ) {
      throw new QuizError('attempt-conflict', 'numéro déjà pris')
    }
    const row = { ...record, id: this.rows.length + 1 }
    this.rows.push(row)
    return { id: row.id }
  }
}

const learner: Viewer = { id: 7, roles: ['learner'] }
const now = new Date('2026-11-07T12:00:00Z')

describe('QuizService', () => {
  let attempts: MemoryAttempts
  let decisions: Record<string, AccessDecision>
  let passedEvents: unknown[]
  let quizzes: Record<string, GradableQuiz>
  let service: QuizService

  beforeEach(() => {
    attempts = new MemoryAttempts()
    passedEvents = []
    decisions = { '7:10': { allowed: true, reason: 'enrollment', expiresAt: null } }
    quizzes = {
      '900': quiz,
      '901': { ...quiz, id: 901, courseId: 20 },
      '902': { ...quiz, id: 902, courseId: null },
    }
    const repository: QuizRepository = {
      async getGradableQuiz(id) {
        return quizzes[String(id)] ?? null
      },
    }
    const access: Pick<AccessService, 'canAccessCourse'> = {
      async canAccessCourse(viewer, courseId) {
        if (!viewer) return { allowed: false, reason: 'not-authenticated' }
        return (
          decisions[`${String(viewer.id)}:${String(courseId)}`] ?? {
            allowed: false,
            reason: 'no-enrollment',
          }
        )
      },
    }
    service = new QuizService({
      quizzes: repository,
      attempts,
      access,
      now: () => now,
      onQuizPassed: async (event) => {
        passedEvents.push(event)
      },
    })
  })

  it('affiche le quiz sans solutions à un inscrit', async () => {
    const view = await service.getQuizForViewer(learner, 900, { expectedCourseId: 10 })
    expect(view.ok).toBe(true)
    if (!view.ok) return
    expect(JSON.stringify(view.quiz)).not.toMatch(/isCorrect|feedback|explanation/)
    expect(view.eligibility).toEqual({ allowed: true, attemptNumber: 1, attemptsRemaining: 3 })
  })

  it('refuse l’anonyme, le non-inscrit, l’accès expiré', async () => {
    expect(await service.getQuizForViewer(null, 900)).toEqual({
      ok: false,
      reason: 'not-authenticated',
    })
    expect(await service.submit({ id: 8, roles: ['learner'] }, 900, allRight)).toEqual({
      ok: false,
      reason: 'no-enrollment',
    })
    decisions['7:10'] = { allowed: false, reason: 'expired' }
    expect(await service.submit(learner, 900, allRight)).toEqual({ ok: false, reason: 'expired' })
    expect(attempts.rows).toHaveLength(0)
  })

  it('quiz d’un autre cours que celui de l’URL, quiz orphelin ou inconnu : not-found', async () => {
    decisions['7:20'] = { allowed: true, reason: 'enrollment', expiresAt: null }
    expect(await service.submit(learner, 901, allRight, { expectedCourseId: 10 })).toEqual({
      ok: false,
      reason: 'not-found',
    })
    expect(await service.submit(learner, 902, allRight)).toEqual({ ok: false, reason: 'not-found' })
    expect(await service.getQuizForViewer(learner, 999)).toEqual({ ok: false, reason: 'not-found' })
  })

  it('corrige, enregistre côté serveur et notifie la réussite', async () => {
    const result = await service.submit(learner, 900, allRight, {
      expectedCourseId: 10,
      startedAt: new Date(now.getTime() - 60_000),
    })
    expect(result).toMatchObject({ ok: true, feedback: { passed: true, scorePercent: 100 } })
    expect(attempts.rows[0]).toMatchObject({
      userId: 7,
      quizId: 900,
      courseId: 10,
      attemptNumber: 1,
      scorePercent: 100,
      passed: true,
      submittedAt: now,
      answers: [
        { questionId: 1, selected: [0] },
        { questionId: 2, selected: [0, 1] },
        { questionId: 3, selected: [1] },
      ],
    })
    expect(passedEvents).toEqual([{ userId: 7, quizId: 900, courseId: 10 }])
  })

  it('l’identité vient du serveur, jamais de la soumission', async () => {
    const forged = { ...allRight, userId: 1 }
    expect(await service.submit(learner, 900, forged)).toEqual({
      ok: false,
      reason: 'invalid-submission',
    })
  })

  it('un quiz déjà réussi ne se repasse pas', async () => {
    await service.submit(learner, 900, allRight)
    expect(await service.submit(learner, 900, allRight)).toEqual({
      ok: false,
      reason: 'already-passed',
    })
    expect(attempts.rows).toHaveLength(1)
    const view = await service.getQuizForViewer(learner, 900)
    expect(view.ok && view.eligibility).toEqual({ allowed: false, reason: 'already-passed' })
  })

  it('tentatives limitées, solutions révélées à la dernière', async () => {
    const wrong = { answers: [{ questionId: 1, selected: [1] }] }
    const first = await service.submit(learner, 900, wrong)
    expect(first).toMatchObject({
      ok: true,
      feedback: { attemptNumber: 1, attemptsRemaining: 2, solutionsRevealed: false },
    })
    await service.submit(learner, 900, wrong)
    const third = await service.submit(learner, 900, wrong)
    expect(third).toMatchObject({
      ok: true,
      feedback: { attemptNumber: 3, attemptsRemaining: 0, solutionsRevealed: true },
    })
    expect(await service.submit(learner, 900, allRight)).toEqual({
      ok: false,
      reason: 'max-attempts-reached',
    })
    expect(passedEvents).toEqual([])
  })

  it('soumissions simultanées : une seule tentative par numéro', async () => {
    quizzes['900'] = { ...quiz, maxAttempts: 1 }
    const wrong = { answers: [{ questionId: 1, selected: [1] }] }
    const results = await Promise.all([
      service.submit(learner, 900, wrong),
      service.submit(learner, 900, wrong),
    ])
    expect(results.filter((result) => result.ok)).toHaveLength(1)
    expect(results.find((result) => !result.ok)).toEqual({ ok: false, reason: 'attempt-conflict' })
    expect(attempts.rows).toHaveLength(1)
  })

  it('soumission invalide : rien n’est enregistré', async () => {
    for (const raw of [
      null,
      { answers: [{ questionId: 99, selected: [0] }] },
      { answers: [{ questionId: 1, selected: [7] }] },
    ]) {
      expect(await service.submit(learner, 900, raw)).toEqual({
        ok: false,
        reason: 'invalid-submission',
      })
    }
    expect(attempts.rows).toHaveLength(0)
  })

  it('une date de début dans le futur est ignorée', async () => {
    await service.submit(learner, 900, allRight, { startedAt: new Date(now.getTime() + 1) })
    expect(attempts.rows[0]!.startedAt).toBeNull()
  })

  it('le personnel pédagogique peut passer le quiz (prévisualisation)', async () => {
    decisions['50:10'] = { allowed: true, reason: 'staff', expiresAt: null }
    expect((await service.submit({ id: 50, roles: ['instructor'] }, 900, allRight)).ok).toBe(true)
  })
})

describe('summarizeRatings', () => {
  it(`moyenne affichée à partir de ${REVIEW_MIN_COUNT_FOR_AVERAGE} avis`, () => {
    expect(summarizeRatings([5, 4])).toEqual({ count: 2, average: null })
    expect(summarizeRatings([5, 4, 4])).toEqual({ count: 3, average: 4.3 })
    expect(summarizeRatings([5, 4, 0, 6, 3.5])).toEqual({ count: 2, average: null })
  })
})
