import { describe, expect, it } from 'vitest'

import {
  accessQualifiesForCertificate,
  certificateRecipientName,
  evaluateCertificateEligibility,
  evaluatePathCertificateEligibility,
} from '@/features/lms/certificate'
import type { AccessDecision } from '@/features/lms/contracts'
import {
  adjacentLessons,
  applyProgressUpdate,
  collapseProgressBatch,
  computeCourseProgress,
  computePathProgress,
  type CourseOutline,
  isLessonUnlocked,
  type LessonProgressRecord,
  orderedLessons,
  progressBatchSchema,
} from '@/features/lms/progress'

const t0 = new Date('2026-11-07T10:00:00Z')
const later = (minutes: number) => new Date(t0.getTime() + minutes * 60_000)

/**
 * Cours 10 : module A (vidéo 1, texte 2, quiz 3 → quiz 900, quiz de passage 901),
 * module B (PDF 4, étude de cas 5). Ordres volontairement mélangés.
 */
const outline: CourseOutline = {
  courseId: 10,
  modules: [
    {
      id: 'B',
      order: 2,
      gateQuizId: null,
      lessons: [
        { id: 5, order: 2, type: 'case-study', quizId: null },
        { id: 4, order: 1, type: 'pdf', quizId: null },
      ],
    },
    {
      id: 'A',
      order: 1,
      gateQuizId: 901,
      lessons: [
        { id: 3, order: 3, type: 'quiz', quizId: 900 },
        { id: 1, order: 1, type: 'video', quizId: null },
        { id: 2, order: 2, type: 'text', quizId: null },
      ],
    },
  ],
}

const done = (lessonId: number, updatedAt = t0): LessonProgressRecord => ({
  lessonId,
  completed: true,
  positionSeconds: 0,
  updatedAt,
})
const opened = (
  lessonId: number,
  positionSeconds: number,
  updatedAt = t0,
): LessonProgressRecord => ({
  lessonId,
  completed: false,
  positionSeconds,
  updatedAt,
})

describe('computeCourseProgress', () => {
  it('cours neuf : 0 %, reprise sur la première leçon, module B verrouillé', () => {
    const progress = computeCourseProgress(outline, [], [])
    expect(progress.totalLessons).toBe(5)
    expect(progress.percent).toBe(0)
    expect(progress.isComplete).toBe(false)
    expect(progress.resumeLessonId).toBe(1)
    expect(progress.requiredQuizIds).toEqual([900, 901])
    expect(progress.lessons.map((lesson) => [lesson.lessonId, lesson.state])).toEqual([
      [1, 'not-started'],
      [2, 'not-started'],
      [3, 'not-started'],
      [4, 'locked'],
      [5, 'locked'],
    ])
  })

  it('une leçon quiz n’est terminée que par le quiz réussi, jamais par un « terminé » client', () => {
    const progress = computeCourseProgress(outline, [done(3)], [])
    expect(progress.lessons.find((lesson) => lesson.lessonId === 3)?.state).toBe('in-progress')
    expect(
      computeCourseProgress(outline, [], [900]).lessons.find((lesson) => lesson.lessonId === 3)
        ?.state,
    ).toBe('completed')
  })

  it('le quiz de passage déverrouille le module suivant', () => {
    const progress = computeCourseProgress(outline, [done(1), done(2)], [900, 901])
    expect(isLessonUnlocked(progress, 4)).toBe(true)
    expect(progress.resumeLessonId).toBe(4)
    expect(isLessonUnlocked(computeCourseProgress(outline, [], [900]), 4)).toBe(false)
    expect(isLessonUnlocked(progress, 999)).toBe(false)
  })

  it('complet seulement avec toutes les leçons et tous les quiz requis', () => {
    const all = [done(1), done(2), done(4), done(5)]
    const complete = computeCourseProgress(outline, all, [900, 901])
    expect(complete).toMatchObject({ percent: 100, isComplete: true, resumeLessonId: null })
    expect(complete.pendingQuizIds).toEqual([])

    // Leçons terminées (le module B l'a été avant l'ajout du quiz de passage) mais
    // quiz de passage manquant : pas complet, plafonné à 99 %.
    const gatePending = computeCourseProgress(outline, all, [900])
    expect(gatePending.isComplete).toBe(false)
    expect(gatePending.percent).toBe(99)
    expect(gatePending.pendingQuizIds).toEqual([901])
    expect(gatePending.lessons.find((lesson) => lesson.lessonId === 4)?.state).toBe('completed')
  })

  it('pourcentage entier arrondi à l’inférieur', () => {
    expect(computeCourseProgress(outline, [done(1)], []).percent).toBe(20)
    expect(computeCourseProgress(outline, [done(1), done(2)], [900]).percent).toBe(60)
  })

  it('ignore la progression d’un autre cours (leçon inconnue)', () => {
    const progress = computeCourseProgress(outline, [done(777), done(1)], [12345])
    expect(progress.completedLessons).toBe(1)
    expect(progress.pendingQuizIds).toEqual([900, 901])
  })

  it('reprend sur la dernière leçon ouverte non terminée', () => {
    const progress = computeCourseProgress(
      outline,
      [opened(1, 120, later(1)), opened(2, 0, later(5))],
      [],
    )
    expect(progress.resumeLessonId).toBe(2)
    expect(progress.lessons[0]).toMatchObject({ state: 'in-progress', positionSeconds: 120 })
  })

  it('une leçon ouverte puis verrouillée n’est pas proposée en reprise', () => {
    const progress = computeCourseProgress(
      outline,
      [done(1), done(2), opened(4, 0, later(3))],
      [900],
    )
    expect(progress.lessons.find((lesson) => lesson.lessonId === 4)?.state).toBe('locked')
    expect(progress.resumeLessonId).toBeNull()
  })

  it('cours vide ou leçon quiz sans quiz', () => {
    expect(computeCourseProgress({ courseId: 1, modules: [] }, [], [])).toMatchObject({
      totalLessons: 0,
      percent: 0,
      isComplete: false,
      resumeLessonId: null,
    })
    const orphanQuiz: CourseOutline = {
      courseId: 2,
      modules: [
        {
          id: 'M',
          order: 0,
          gateQuizId: null,
          lessons: [
            { id: 1, order: 0, type: 'text', quizId: null },
            { id: 2, order: 1, type: 'quiz', quizId: null },
          ],
        },
      ],
    }
    expect(computeCourseProgress(orphanQuiz, [done(1)], [])).toMatchObject({
      totalLessons: 1,
      isComplete: true,
    })
  })

  it('un même quiz utilisé en leçon et en passage n’est compté qu’une fois', () => {
    const shared: CourseOutline = {
      courseId: 3,
      modules: [
        {
          id: 'M',
          order: 0,
          gateQuizId: 5,
          lessons: [{ id: 1, order: 0, type: 'quiz', quizId: 5 }],
        },
      ],
    }
    expect(computeCourseProgress(shared, [], []).requiredQuizIds).toEqual([5])
  })
})

describe('navigation', () => {
  it('ordre des leçons et voisines', () => {
    expect(orderedLessons(outline).map(({ lesson }) => lesson.id)).toEqual([1, 2, 3, 4, 5])
    expect(adjacentLessons(outline, 1)).toEqual({ previousId: null, nextId: 2 })
    expect(adjacentLessons(outline, 3)).toEqual({ previousId: 2, nextId: 4 })
    expect(adjacentLessons(outline, 5)).toEqual({ previousId: 4, nextId: null })
    expect(adjacentLessons(outline, 42)).toEqual({ previousId: null, nextId: null })
  })
})

describe('computePathProgress', () => {
  it('pondère par le nombre de leçons, complet quand chaque cours l’est', () => {
    const a = computeCourseProgress(outline, [done(1)], [])
    const b = computeCourseProgress(outline, [done(1), done(2), done(4), done(5)], [900, 901])
    expect(computePathProgress([a, b])).toEqual({
      totalCourses: 2,
      completedCourses: 1,
      totalLessons: 10,
      completedLessons: 6,
      percent: 60,
      isComplete: false,
    })
    expect(computePathProgress([b, b])).toMatchObject({ percent: 100, isComplete: true })
    expect(computePathProgress([])).toMatchObject({ percent: 0, isComplete: false })
  })
})

describe('applyProgressUpdate', () => {
  const video = { type: 'video' as const, durationSeconds: 600 }
  const text = { type: 'text' as const, durationSeconds: null }

  it('vidéo terminée à 90 % de la durée, pas avant', () => {
    const below = applyProgressUpdate(null, video, { positionSeconds: 539 }, t0)
    expect(below).toMatchObject({ ok: true, next: { completed: false }, justCompleted: false })
    const reached = applyProgressUpdate(null, video, { positionSeconds: 540 }, t0)
    expect(reached).toEqual({
      ok: true,
      next: { positionSeconds: 540, completed: true, completedAt: t0 },
      justCompleted: true,
    })
  })

  it('refuse un « terminé » client sur une vidéo de durée connue', () => {
    const result = applyProgressUpdate(
      null,
      video,
      { positionSeconds: 10, markCompleted: true },
      t0,
    )
    expect(result).toMatchObject({ ok: true, next: { completed: false } })
  })

  it('accepte un « terminé » client sur une vidéo de durée inconnue', () => {
    const result = applyProgressUpdate(
      null,
      { type: 'video', durationSeconds: null },
      { markCompleted: true },
      t0,
    )
    expect(result).toMatchObject({ ok: true, next: { completed: true } })
  })

  it('borne la position à la durée et l’arrondit', () => {
    const result = applyProgressUpdate(null, video, { positionSeconds: 5_000.7 }, t0)
    expect(result).toMatchObject({ ok: true, next: { positionSeconds: 600, completed: true } })
    expect(applyProgressUpdate(null, video, { positionSeconds: 12.9 }, t0)).toMatchObject({
      next: { positionSeconds: 12 },
    })
  })

  it('rejette les positions invalides', () => {
    for (const positionSeconds of [-1, Number.NaN, Number.POSITIVE_INFINITY, 90_000]) {
      expect(applyProgressUpdate(null, video, { positionSeconds }, t0)).toEqual({
        ok: false,
        reason: 'invalid-position',
      })
    }
  })

  it('« terminé » est irréversible et garde sa date', () => {
    const first = applyProgressUpdate(null, text, { markCompleted: true }, t0)
    expect(first).toMatchObject({ ok: true, justCompleted: true })
    if (!first.ok) throw new Error('attendu')
    const second = applyProgressUpdate(first.next, text, { markCompleted: false }, later(10))
    expect(second).toEqual({ ok: true, next: first.next, justCompleted: false })
    const rewatch = applyProgressUpdate(
      { positionSeconds: 590, completed: true, completedAt: t0 },
      video,
      { positionSeconds: 30 },
      later(5),
    )
    expect(rewatch).toEqual({
      ok: true,
      next: { positionSeconds: 30, completed: true, completedAt: t0 },
      justCompleted: false,
    })
  })

  it('leçon texte, PDF, étude de cas : terminées manuellement', () => {
    for (const type of ['text', 'pdf', 'case-study'] as const) {
      expect(
        applyProgressUpdate(null, { type, durationSeconds: null }, { markCompleted: true }, t0),
      ).toMatchObject({ ok: true, next: { completed: true } })
      expect(
        applyProgressUpdate(null, { type, durationSeconds: null }, { positionSeconds: 5 }, t0),
      ).toMatchObject({ ok: true, next: { completed: false } })
    }
  })

  it('une leçon quiz ne se termine pas par la progression', () => {
    expect(
      applyProgressUpdate(
        null,
        { type: 'quiz', durationSeconds: null },
        { markCompleted: true },
        t0,
      ),
    ).toEqual({ ok: false, reason: 'not-completable' })
  })
})

describe('envoi groupé de progression', () => {
  it('valide la forme du lot et sa taille', () => {
    expect(
      progressBatchSchema.safeParse([{ lessonId: 1, positionSeconds: 12.5, clientTimestamp: 1 }])
        .success,
    ).toBe(true)
    const invalid: unknown[] = [
      [{ lessonId: 0, clientTimestamp: 1 }],
      [{ lessonId: 1, positionSeconds: -3, clientTimestamp: 1 }],
      [{ lessonId: 1, clientTimestamp: 1, userId: 99 }],
      [{ lessonId: '1', clientTimestamp: 1 }],
      Array.from({ length: 51 }, () => ({ lessonId: 1, clientTimestamp: 1 })),
      { lessonId: 1 },
    ]
    for (const value of invalid) expect(progressBatchSchema.safeParse(value).success).toBe(false)
  })

  it('garde la position la plus récente et le « terminé » d’un envoi rejoué', () => {
    const collapsed = collapseProgressBatch([
      { lessonId: 1, positionSeconds: 300, clientTimestamp: 30, markCompleted: true },
      { lessonId: 1, positionSeconds: 100, clientTimestamp: 10 },
      { lessonId: 2, clientTimestamp: 5, markCompleted: true },
      { lessonId: 1, clientTimestamp: 40 },
      { lessonId: 2, positionSeconds: 7, clientTimestamp: 4 },
    ])
    expect(collapsed).toEqual([
      { lessonId: 1, positionSeconds: 300, clientTimestamp: 40, markCompleted: true },
      { lessonId: 2, positionSeconds: 7, clientTimestamp: 5, markCompleted: true },
    ])
  })
})

// ---------------------------------------------------------------------------
// Certificats
// ---------------------------------------------------------------------------

const enrolled: AccessDecision = { allowed: true, reason: 'enrollment', expiresAt: null }
const complete = computeCourseProgress(outline, [done(1), done(2), done(4), done(5)], [900, 901])
const quizMissing = computeCourseProgress(outline, [done(1), done(2), done(4), done(5)], [900])
const halfway = computeCourseProgress(outline, [done(1), done(2)], [900, 901])

describe('accessQualifiesForCertificate', () => {
  it('inscription active ou échue, jamais staff, extrait, révoqué, suspendu', () => {
    expect(accessQualifiesForCertificate(enrolled)).toBe(true)
    expect(accessQualifiesForCertificate({ allowed: false, reason: 'expired' })).toBe(true)
    expect(accessQualifiesForCertificate({ allowed: true, reason: 'staff', expiresAt: null })).toBe(
      false,
    )
    expect(
      accessQualifiesForCertificate({ allowed: true, reason: 'preview', expiresAt: null }),
    ).toBe(false)
    for (const reason of ['revoked', 'suspended', 'no-enrollment', 'not-authenticated'] as const) {
      expect(accessQualifiesForCertificate({ allowed: false, reason })).toBe(false)
    }
  })
})

describe('evaluateCertificateEligibility', () => {
  const base = { certificateEnabled: true, access: enrolled, progress: complete, existing: [] }

  it('éligible quand tout est terminé', () => {
    expect(evaluateCertificateEligibility(base)).toEqual({ eligible: true })
  })

  it('refus expliqués', () => {
    expect(evaluateCertificateEligibility({ ...base, certificateEnabled: false })).toEqual({
      eligible: false,
      reason: 'certificate-disabled',
    })
    expect(evaluateCertificateEligibility({ ...base, progress: halfway })).toEqual({
      eligible: false,
      reason: 'incomplete',
    })
    expect(evaluateCertificateEligibility({ ...base, progress: quizMissing })).toEqual({
      eligible: false,
      reason: 'quiz-pending',
    })
    expect(
      evaluateCertificateEligibility({ ...base, access: { allowed: false, reason: 'revoked' } }),
    ).toEqual({ eligible: false, reason: 'no-access' })
    expect(
      evaluateCertificateEligibility({
        ...base,
        access: { allowed: true, reason: 'staff', expiresAt: null },
      }),
    ).toEqual({ eligible: false, reason: 'no-access' })
  })

  it('accès échu après avoir tout terminé : éligible', () => {
    expect(
      evaluateCertificateEligibility({ ...base, access: { allowed: false, reason: 'expired' } }),
    ).toEqual({ eligible: true })
  })

  it('idempotent : pas de second certificat, pas de réémission d’un révoqué', () => {
    expect(
      evaluateCertificateEligibility({ ...base, existing: [{ id: 4, revoked: false }] }),
    ).toEqual({ eligible: false, reason: 'already-issued', certificateId: 4 })
    expect(
      evaluateCertificateEligibility({
        ...base,
        existing: [
          { id: 4, revoked: true },
          { id: 5, revoked: false },
        ],
      }),
    ).toEqual({ eligible: false, reason: 'already-issued', certificateId: 5 })
    expect(
      evaluateCertificateEligibility({ ...base, existing: [{ id: 4, revoked: true }] }),
    ).toEqual({
      eligible: false,
      reason: 'revoked-certificate',
      certificateId: 4,
    })
  })

  it('cours sans leçon : jamais éligible', () => {
    expect(
      evaluateCertificateEligibility({
        ...base,
        progress: computeCourseProgress({ courseId: 1, modules: [] }, [], []),
      }),
    ).toEqual({ eligible: false, reason: 'incomplete' })
  })
})

describe('evaluatePathCertificateEligibility', () => {
  const base = {
    certificateEnabled: true,
    courses: [
      { access: enrolled, progress: complete },
      { access: { allowed: false, reason: 'expired' } as AccessDecision, progress: complete },
    ],
    existing: [],
  }

  it('tous les cours terminés par un inscrit', () => {
    expect(evaluatePathCertificateEligibility(base)).toEqual({ eligible: true })
  })

  it('refus : un cours inachevé, un cours sans accès, parcours vide, désactivé, déjà émis', () => {
    expect(
      evaluatePathCertificateEligibility({
        ...base,
        courses: [...base.courses, { access: enrolled, progress: halfway }],
      }),
    ).toEqual({ eligible: false, reason: 'incomplete' })
    expect(
      evaluatePathCertificateEligibility({
        ...base,
        courses: [
          ...base.courses,
          { access: { allowed: false, reason: 'no-enrollment' }, progress: complete },
        ],
      }),
    ).toEqual({ eligible: false, reason: 'no-access' })
    expect(evaluatePathCertificateEligibility({ ...base, courses: [] })).toEqual({
      eligible: false,
      reason: 'incomplete',
    })
    expect(
      evaluatePathCertificateEligibility({ ...base, certificateEnabled: false }),
    ).toMatchObject({
      reason: 'certificate-disabled',
    })
    expect(
      evaluatePathCertificateEligibility({ ...base, existing: [{ id: 1, revoked: false }] }),
    ).toMatchObject({ reason: 'already-issued' })
  })
})

describe('certificateRecipientName', () => {
  it('prénom et nom normalisés, null si absents', () => {
    expect(certificateRecipientName({ firstName: '  Aïcha ', lastName: 'Ngo  Mbappe' })).toBe(
      'Aïcha Ngo Mbappe',
    )
    expect(certificateRecipientName({ firstName: 'Moussa', lastName: null })).toBe('Moussa')
    expect(certificateRecipientName({ firstName: ' ', lastName: undefined })).toBeNull()
  })
})
