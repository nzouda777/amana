import { describe, expect, it } from 'vitest'

import { estimateReadingMinutes, lexicalToPlainText } from '@/features/content/reading-time'
import { evaluateEnrollments } from '@/features/lms/access'
import type { EnrollmentRecord } from '@/features/lms/contracts'
import { sumLessonMinutes } from '@/features/lms/course-duration'
import { validateQuestionAnswers } from '@/features/lms/quiz'
import { canReview, normalizeNewReview } from '@/features/lms/reviews'

const now = new Date('2026-11-02T12:00:00Z')
const day = 24 * 60 * 60 * 1000
const enrollment = (overrides: Partial<EnrollmentRecord>): EnrollmentRecord => ({
  id: 1,
  scope: 'course',
  courseId: 10,
  source: 'purchase',
  status: 'active',
  startsAt: new Date(now.getTime() - day),
  endsAt: null,
  ...overrides,
})

describe('evaluateEnrollments (ADR 002)', () => {
  it('refuse sans inscription', () => {
    expect(evaluateEnrollments([], 10, true, now)).toEqual({
      allowed: false,
      reason: 'no-enrollment',
    })
  })

  it('accorde un achat à vie', () => {
    expect(evaluateEnrollments([enrollment({})], 10, true, now)).toMatchObject({
      allowed: true,
      reason: 'enrollment',
      source: 'purchase',
      expiresAt: null,
    })
  })

  it('ignore les inscriptions d’autres cours', () => {
    expect(evaluateEnrollments([enrollment({ courseId: 99 })], 10, true, now).allowed).toBe(false)
  })

  it('un pass (portée catalogue) ouvre uniquement les cours inclus', () => {
    const pass = enrollment({
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      endsAt: new Date(now.getTime() + 30 * day),
    })
    expect(evaluateEnrollments([pass], 10, true, now)).toMatchObject({
      allowed: true,
      source: 'pass',
    })
    expect(evaluateEnrollments([pass], 10, false, now)).toEqual({
      allowed: false,
      reason: 'no-enrollment',
    })
  })

  it('explique les refus : expiré, pas commencé, suspendu, révoqué', () => {
    const expired = enrollment({ endsAt: new Date(now.getTime() - 1) })
    expect(evaluateEnrollments([expired], 10, true, now)).toEqual({
      allowed: false,
      reason: 'expired',
    })
    const future = enrollment({ startsAt: new Date(now.getTime() + day) })
    expect(evaluateEnrollments([future], 10, true, now)).toEqual({
      allowed: false,
      reason: 'not-started',
    })
    expect(evaluateEnrollments([enrollment({ status: 'suspended' })], 10, true, now)).toEqual({
      allowed: false,
      reason: 'suspended',
    })
    expect(
      evaluateEnrollments([enrollment({ status: 'revoked' }), expired], 10, true, now),
    ).toEqual({
      allowed: false,
      reason: 'revoked',
    })
  })

  it('retient l’accès le plus long parmi plusieurs origines', () => {
    const license = enrollment({
      id: 2,
      source: 'license',
      endsAt: new Date(now.getTime() + 10 * day),
    })
    const pass = enrollment({
      id: 3,
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      endsAt: new Date(now.getTime() + 90 * day),
    })
    expect(evaluateEnrollments([license, pass], 10, true, now)).toMatchObject({ enrollmentId: 3 })
    const lifetime = enrollment({ id: 4, source: 'gift' })
    expect(evaluateEnrollments([license, lifetime, pass], 10, true, now)).toMatchObject({
      enrollmentId: 4,
      expiresAt: null,
    })
  })

  it('la fin d’accès est exclusive', () => {
    const endsNow = enrollment({ endsAt: now })
    expect(evaluateEnrollments([endsNow], 10, true, now).allowed).toBe(false)
  })
})

describe('quiz', () => {
  const answers = (...correct: boolean[]) => correct.map((isCorrect) => ({ isCorrect }))

  it('choix unique : exactement une bonne réponse', () => {
    expect(validateQuestionAnswers('single', answers(true, false, false))).toBe(true)
    expect(validateQuestionAnswers('single', answers(true, true))).toBeTypeOf('string')
    expect(validateQuestionAnswers('single', answers(false, false))).toBeTypeOf('string')
  })

  it('choix multiple : au moins une bonne réponse', () => {
    expect(validateQuestionAnswers('multiple', answers(true, true, false))).toBe(true)
    expect(validateQuestionAnswers('multiple', answers(false, false))).toBeTypeOf('string')
  })

  it('vrai/faux : deux réponses, une correcte', () => {
    expect(validateQuestionAnswers('true-false', answers(true, false))).toBe(true)
    expect(validateQuestionAnswers('true-false', answers(true, false, false))).toBeTypeOf('string')
  })

  it('au moins deux réponses', () => {
    expect(validateQuestionAnswers('single', answers(true))).toBeTypeOf('string')
    expect(validateQuestionAnswers('single', null)).toBeTypeOf('string')
  })
})

describe('avis', () => {
  it('seuil de 50 % de progression', () => {
    expect(canReview(49)).toBe(false)
    expect(canReview(50)).toBe(true)
  })

  it('un apprenant écrit en son nom et passe en modération', () => {
    const normalized = normalizeNewReview(
      { user: 999, status: 'approved', rating: 5 },
      { id: 7 },
      false,
    )
    expect(normalized).toEqual({ user: 7, status: 'pending', rating: 5 })
  })

  it('un modérateur garde les valeurs saisies ; un anonyme est refusé', () => {
    expect(normalizeNewReview({ user: 3, status: 'approved' }, { id: 1 }, true)).toEqual({
      user: 3,
      status: 'approved',
    })
    expect(() => normalizeNewReview({}, null, false)).toThrow()
  })
})

describe('durées et lecture', () => {
  it('somme les durées valides des leçons', () => {
    expect(
      sumLessonMinutes([
        { durationMinutes: 5 },
        { durationMinutes: null },
        { durationMinutes: -2 },
        { durationMinutes: 7 },
      ]),
    ).toBe(12)
    expect(sumLessonMinutes([])).toBe(0)
  })

  it('extrait le texte Lexical et estime le temps de lecture', () => {
    const state = {
      root: {
        children: [
          { type: 'paragraph', children: [{ text: 'Bonjour' }, { text: 'le monde' }] },
          { type: 'paragraph', children: [{ text: 'mot '.repeat(399).trim() }] },
        ],
      },
    }
    expect(
      lexicalToPlainText({ root: { children: [{ children: [{ text: 'a' }, { text: 'b' }] }] } }),
    ).toBe('a b')
    expect(estimateReadingMinutes(state)).toBe(3) // 402 mots / 200
    expect(estimateReadingMinutes(null)).toBe(1)
  })
})
