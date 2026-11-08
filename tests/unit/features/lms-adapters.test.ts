import type { Payload } from 'payload'
import { describe, expect, it } from 'vitest'

import { EnrollmentAccessService } from '@/features/lms/access'
import { QuizError } from '@/features/lms/quiz'
import {
  createPayloadAccessCatalog,
  createPayloadEnrollmentStore,
  createPayloadQuizAttemptStore,
  createPayloadQuizRepository,
  isUniqueViolation,
  relationId,
  toAttemptSummary,
  toCourseAccessInfo,
  toEnrollmentData,
  toGradableQuiz,
  toLessonAccessInfo,
  toNumericId,
  toStoredEnrollment,
} from '@/features/lms/server/payload-adapters'

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

describe('adaptateurs Payload : conversions', () => {
  it('identifiants de relation et identifiants numériques', () => {
    expect(relationId(5)).toBe(5)
    expect(relationId({ id: 7 })).toBe(7)
    expect(relationId(null)).toBeNull()
    expect(toNumericId(12)).toBe(12)
    expect(toNumericId('12')).toBe(12)
    for (const forged of ['abc', '0', '-1', '1; drop table', '1.5', '', 0, -3, 1.5, null])
      expect(toNumericId(forged as never), String(forged)).toBeNull()
  })

  const enrollmentDoc = {
    id: 1,
    user: 9,
    scope: 'course' as const,
    course: { id: 10 } as never,
    source: 'purchase' as const,
    status: 'active' as const,
    startsAt: '2026-11-01T00:00:00.000Z',
    endsAt: null,
    order: 44,
    license: null,
    product: 3,
    grantedBy: null,
    revokedReason: null,
  }

  it('inscription stockée : dates, origine, portée catalogue', () => {
    const stored = toStoredEnrollment(enrollmentDoc)
    expect(stored).toMatchObject({
      id: 1,
      userId: 9,
      courseId: 10,
      source: 'purchase',
      endsAt: null,
      origin: { orderId: 44, productId: 3 },
    })
    expect(stored.startsAt.toISOString()).toBe('2026-11-01T00:00:00.000Z')
    expect(stored.origin).not.toHaveProperty('licenseId')
    expect(toStoredEnrollment({ ...enrollmentDoc, scope: 'catalog' }).courseId).toBeNull()
  })

  it('fail closed : début illisible jamais commencé, utilisateur absent ne correspond à personne', () => {
    const broken = toStoredEnrollment({
      ...enrollmentDoc,
      startsAt: 'pas une date',
      user: null as never,
    })
    expect(broken.startsAt.getTime()).toBeGreaterThan(Date.now())
    expect(broken.userId).toBe('')
  })

  it('données d’écriture d’une attribution', () => {
    const data = toEnrollmentData({
      userId: '9',
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      origin: { orderId: 4, productId: 2 },
      startsAt: new Date('2026-11-01T00:00:00Z'),
      endsAt: new Date('2026-12-01T00:00:00Z'),
    })
    expect(data).toEqual({
      user: 9,
      scope: 'catalog',
      course: null,
      source: 'pass',
      status: 'active',
      startsAt: '2026-11-01T00:00:00.000Z',
      endsAt: '2026-12-01T00:00:00.000Z',
      order: 4,
      license: null,
      product: 2,
      grantedBy: null,
    })
  })

  it('cours et leçons pour la décision d’accès', () => {
    expect(
      toCourseAccessInfo({
        id: 1,
        _status: 'published',
        includedInPass: null,
        instructors: [3, { id: 4 }],
      }),
    ).toEqual({ id: 1, published: true, includedInPass: true, instructorIds: [3, 4] })
    expect(toCourseAccessInfo({ id: 2, _status: 'draft', includedInPass: false }).published).toBe(
      false,
    )
    expect(toLessonAccessInfo({ id: 5, course: 1, isPreview: null })).toEqual({
      id: 5,
      courseId: 1,
      isPreview: false,
    })
    // Leçon sans cours : introuvable plutôt qu'attribuée à un cours au hasard.
    expect(toLessonAccessInfo({ id: 6, course: null })).toBeNull()
  })

  it('quiz corrigeable : questions ordonnées, valeurs par défaut', () => {
    const quiz = toGradableQuiz(
      {
        id: 1,
        title: 'Quiz',
        course: { id: 10 } as never,
        instructions: '  ',
        passingScorePercent: 70,
        maxAttempts: null,
        shuffleQuestions: null,
      },
      [
        {
          id: 2,
          order: 2,
          kind: 'true-false',
          prompt: 'Q2',
          points: null,
          answers: [{ text: 'Vrai', isCorrect: true }, { text: 'Faux' }],
          explanation: null,
        },
        {
          id: 1,
          order: 1,
          kind: 'single',
          prompt: 'Q1',
          points: 2,
          answers: [
            { text: 'A', isCorrect: null, feedback: ' Non ' },
            { text: 'B', isCorrect: true },
          ],
          explanation: 'Parce que.',
        },
      ],
    )
    expect(quiz).toMatchObject({
      courseId: 10,
      instructions: null,
      maxAttempts: 0,
      shuffleQuestions: false,
    })
    expect(quiz.questions.map((question) => question.id)).toEqual([1, 2])
    expect(quiz.questions[0]?.answers[0]).toEqual({ text: 'A', isCorrect: false, feedback: 'Non' })
    expect(quiz.questions[1]?.points).toBe(1)
  })

  it('résumé de tentative', () => {
    expect(
      toAttemptSummary({
        attemptNumber: 2,
        scorePercent: 80,
        passed: true,
        submittedAt: '2026-11-07T10:00:00Z',
      }),
    ).toEqual({
      attemptNumber: 2,
      scorePercent: 80,
      passed: true,
      submittedAt: new Date('2026-11-07T10:00:00Z'),
    })
  })

  it('violation d’unicité, telle que remontée par Postgres ou Payload', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
    expect(isUniqueViolation(new Error('x', { cause: { code: '23505' } }))).toBe(true)
    expect(
      isUniqueViolation({
        name: 'ValidationError',
        data: { errors: [{ message: 'Value must be unique' }] },
      }),
    ).toBe(true)
    expect(isUniqueViolation(new Error('timeout'))).toBe(false)
    expect(isUniqueViolation(null)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Adaptateurs sur une Local API simulée
// ---------------------------------------------------------------------------

type Call = { op: string; args: Record<string, unknown> }

function fakePayload(responses: Record<string, (args: Record<string, unknown>) => unknown>) {
  const calls: Call[] = []
  const handler = (op: string) => async (args: Record<string, unknown>) => {
    calls.push({ op, args })
    const respond = responses[`${op}:${String(args.collection)}`]
    if (!respond) throw new Error(`appel inattendu ${op}:${String(args.collection)}`)
    return respond(args)
  }
  const payload = {
    find: handler('find'),
    create: handler('create'),
    update: handler('update'),
  } as unknown as Payload
  return { payload, calls }
}

describe('adaptateurs Payload : requêtes', () => {
  it('catalogue d’accès : brouillons lus avec privilège mais projection minimale', async () => {
    const { payload, calls } = fakePayload({
      'find:courses': () => ({
        docs: [{ id: 10, _status: 'draft', includedInPass: true, instructors: [] }],
      }),
      'find:lessons': () => ({ docs: [{ id: 5, course: 10, isPreview: true }] }),
    })
    const catalog = createPayloadAccessCatalog(payload)
    expect(await catalog.getCourses([10, 'abc'])).toEqual([
      { id: 10, published: false, includedInPass: true, instructorIds: [] },
    ])
    expect(calls[0]?.args).toMatchObject({
      where: { id: { in: [10] } },
      select: { _status: true, includedInPass: true, instructors: true },
      overrideAccess: true,
    })
    expect(await catalog.getLesson(5)).toEqual({ id: 5, courseId: 10, isPreview: true })
    // Leçons : règles publiques, aucun champ protégé demandé.
    expect(calls[1]?.args).toMatchObject({
      overrideAccess: false,
      select: { course: true, isPreview: true },
    })
    // Identifiants forgés : aucune requête.
    expect(await catalog.getCourses(['x'])).toEqual([])
    expect(await catalog.getLesson('1 or 1=1')).toBeNull()
    expect(calls).toHaveLength(2)
  })

  it('inscriptions : requêtes bornées à l’utilisateur', async () => {
    const { payload, calls } = fakePayload({ 'find:enrollments': () => ({ docs: [] }) })
    const store = createPayloadEnrollmentStore(payload)
    await store.findForUserCourse(9, 10)
    expect(calls[0]?.args.where).toEqual({
      and: [
        { user: { equals: 9 } },
        {
          or: [
            { scope: { equals: 'catalog' } },
            { and: [{ scope: { equals: 'course' } }, { course: { equals: 10 } }] },
          ],
        },
      ],
    })
    expect(await store.findForUserCourse('abc', 10)).toEqual([])
    expect(await store.findByOrigin({})).toEqual([])
    expect(calls).toHaveLength(1)
  })

  it('révocation : seulement les inscriptions non révoquées, avec motif', async () => {
    const { payload, calls } = fakePayload({
      'update:enrollments': () => ({ docs: [{ id: 1 }, { id: 2 }] }),
    })
    expect(
      await createPayloadEnrollmentStore(payload).revoke([1, 2, 'x'], 'Remboursement', new Date()),
    ).toBe(2)
    expect(calls[0]?.args).toMatchObject({
      where: { and: [{ id: { in: [1, 2] } }, { status: { not_equals: 'revoked' } }] },
      data: { status: 'revoked', revokedReason: 'Remboursement' },
      overrideAccess: true,
    })
  })

  it('AccessService branché sur les adaptateurs : extrait gratuit d’un cours publié', async () => {
    const { payload } = fakePayload({
      'find:courses': () => ({
        docs: [{ id: 10, _status: 'published', includedInPass: true, instructors: [] }],
      }),
      'find:lessons': () => ({ docs: [{ id: 5, course: 10, isPreview: true }] }),
      'find:enrollments': () => ({ docs: [] }),
    })
    const access = new EnrollmentAccessService({
      catalog: createPayloadAccessCatalog(payload),
      enrollments: createPayloadEnrollmentStore(payload),
    })
    expect(await access.canAccessLesson(null, 5, { expectedCourseId: 10 })).toMatchObject({
      allowed: true,
      reason: 'preview',
    })
    expect(await access.canAccessLesson(null, 5, { expectedCourseId: 11 })).toEqual({
      allowed: false,
      reason: 'not-found',
    })
  })

  it('quiz : lus dans la locale demandée, avec privilège serveur', async () => {
    const { payload, calls } = fakePayload({
      'find:quizzes': () => ({
        docs: [{ id: 1, title: 'Q', course: 10, passingScorePercent: 50, maxAttempts: 3 }],
      }),
      'find:questions': () => ({
        docs: [
          {
            id: 7,
            order: 1,
            kind: 'single',
            prompt: 'P',
            answers: [{ text: 'A', isCorrect: true }, { text: 'B' }],
          },
        ],
      }),
    })
    const quiz = await createPayloadQuizRepository(payload, 'ar').getGradableQuiz(1)
    expect(quiz?.questions).toHaveLength(1)
    expect(
      calls.every((call) => call.args.locale === 'ar' && call.args.overrideAccess === true),
    ).toBe(true)
  })

  it('tentatives : conflit de numéro traduit en QuizError', async () => {
    const { payload } = fakePayload({
      'create:quiz-attempts': () => {
        throw Object.assign(new Error('duplicate key'), { code: '23505' })
      },
      'find:quiz-attempts': () => ({
        docs: [
          {
            attemptNumber: 1,
            scorePercent: 40,
            passed: false,
            submittedAt: '2026-11-07T10:00:00Z',
          },
        ],
      }),
    })
    const store = createPayloadQuizAttemptStore(payload)
    expect(await store.listAttempts(9, 1)).toHaveLength(1)
    await expect(
      store.createAttempt({
        userId: 9,
        quizId: 1,
        courseId: 10,
        attemptNumber: 2,
        answers: [{ questionId: 7, selected: [0] }],
        scorePercent: 100,
        passed: true,
        startedAt: null,
        submittedAt: new Date(),
      }),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof QuizError && error.code === 'attempt-conflict',
    )
  })
})
