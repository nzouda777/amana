import { beforeEach, describe, expect, it } from 'vitest'

import {
  type AccessCatalog,
  AccessServiceError,
  assertValidGrant,
  computePassWindow,
  type CourseAccessInfo,
  coverageEnd,
  EnrollmentAccessService,
  type EnrollmentStore,
  evaluateEnrollments,
  findIdempotentGrant,
  isCourseStaffFor,
  type LessonAccessInfo,
  type StoredEnrollment,
} from '@/features/lms/access'
import type { EnrollmentRecord, GrantInput, Id, Viewer } from '@/features/lms/contracts'

const now = new Date('2026-11-07T12:00:00Z')
const day = 24 * 60 * 60 * 1000
const at = (offsetDays: number) => new Date(now.getTime() + offsetDays * day)

const record = (overrides: Partial<EnrollmentRecord>): EnrollmentRecord => ({
  id: 1,
  scope: 'course',
  courseId: 10,
  source: 'purchase',
  status: 'active',
  startsAt: at(-1),
  endsAt: null,
  ...overrides,
})

// ---------------------------------------------------------------------------
// Doubles en mémoire
// ---------------------------------------------------------------------------

class MemoryCatalog implements AccessCatalog {
  courses: CourseAccessInfo[] = [
    { id: 10, published: true, includedInPass: true, instructorIds: [50] },
    { id: 20, published: true, includedInPass: false, instructorIds: [] },
    { id: 30, published: false, includedInPass: true, instructorIds: [] },
  ]
  lessons: LessonAccessInfo[] = [
    { id: 101, courseId: 10, isPreview: true },
    { id: 102, courseId: 10, isPreview: false },
    { id: 201, courseId: 20, isPreview: false },
    { id: 301, courseId: 30, isPreview: true },
  ]
  async getCourses(ids: readonly Id[]) {
    return this.courses.filter((course) => ids.some((id) => String(id) === String(course.id)))
  }
  async getLesson(id: Id) {
    return this.lessons.find((lesson) => String(lesson.id) === String(id)) ?? null
  }
  async listPassCourseIds() {
    return this.courses
      .filter((course) => course.published && course.includedInPass)
      .map((course) => course.id)
  }
}

class MemoryEnrollments implements EnrollmentStore {
  rows: StoredEnrollment[] = []
  /** Simule une requête mal bornée (renvoie tout, sans filtre utilisateur). */
  leaky = false
  private nextId = 1

  async findForUserCourse(userId: Id, courseId: Id) {
    if (this.leaky) return this.rows
    return this.rows.filter(
      (row) =>
        String(row.userId) === String(userId) &&
        (row.scope === 'catalog' || String(row.courseId) === String(courseId)),
    )
  }
  async listForUser(userId: Id) {
    if (this.leaky) return this.rows
    return this.rows.filter((row) => String(row.userId) === String(userId))
  }
  async findByOrigin(origin: { orderId?: Id; licenseId?: Id }) {
    return this.rows.filter(
      (row) =>
        (origin.orderId !== undefined && row.origin.orderId === origin.orderId) ||
        (origin.licenseId !== undefined && row.origin.licenseId === origin.licenseId),
    )
  }
  async findGrantCandidates(input: Pick<GrantInput, 'userId' | 'scope' | 'courseId' | 'source'>) {
    return this.rows.filter(
      (row) =>
        row.userId === input.userId && row.scope === input.scope && row.source === input.source,
    )
  }
  async create(input: GrantInput) {
    const row: StoredEnrollment = {
      id: this.nextId++,
      userId: input.userId,
      scope: input.scope,
      courseId: input.courseId,
      source: input.source,
      status: 'active',
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      origin: input.origin,
    }
    this.rows.push(row)
    return row
  }
  async revoke(ids: readonly Id[], reason: string) {
    let count = 0
    for (const row of this.rows) {
      if (ids.includes(row.id)) {
        row.status = 'revoked'
        row.revokedReason = reason
        count += 1
      }
    }
    return count
  }
}

const learner: Viewer = { id: 7, roles: ['learner'] }
const otherLearner: Viewer = { id: 8, roles: ['learner'] }

let catalog: MemoryCatalog
let store: MemoryEnrollments
let service: EnrollmentAccessService

const purchase = (overrides: Partial<GrantInput> = {}): GrantInput => ({
  userId: 7,
  scope: 'course',
  courseId: 10,
  source: 'purchase',
  origin: { orderId: 900, productId: 5 },
  startsAt: at(-1),
  endsAt: null,
  ...overrides,
})

beforeEach(() => {
  catalog = new MemoryCatalog()
  store = new MemoryEnrollments()
  service = new EnrollmentAccessService({ catalog, enrollments: store, now: () => now })
})

// ---------------------------------------------------------------------------

describe('evaluateEnrollments — compléments', () => {
  it('le début d’accès est inclusif', () => {
    expect(evaluateEnrollments([record({ startsAt: now })], 10, true, now).allowed).toBe(true)
  })

  it('compare les identifiants nombre / chaîne', () => {
    expect(evaluateEnrollments([record({ courseId: '10' })], 10, true, now).allowed).toBe(true)
  })

  it('un pass suspendu ou révoqué n’ouvre rien, même sur un cours inclus', () => {
    const pass = { scope: 'catalog' as const, courseId: null, source: 'pass' as const }
    expect(evaluateEnrollments([record({ ...pass, status: 'suspended' })], 10, true, now)).toEqual({
      allowed: false,
      reason: 'suspended',
    })
    expect(evaluateEnrollments([record({ ...pass, status: 'revoked' })], 10, true, now)).toEqual({
      allowed: false,
      reason: 'revoked',
    })
  })

  it('un achat valide l’emporte sur un pass révoqué', () => {
    const decision = evaluateEnrollments(
      [
        record({ id: 1, scope: 'catalog', courseId: null, source: 'pass', status: 'revoked' }),
        record({ id: 2 }),
      ],
      10,
      true,
      now,
    )
    expect(decision).toMatchObject({ allowed: true, enrollmentId: 2 })
  })

  it('l’échéance tient compte d’un renouvellement de pass consécutif', () => {
    const current = record({
      id: 1,
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      startsAt: at(-20),
      endsAt: at(10),
    })
    const renewal = record({
      id: 2,
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      startsAt: at(10),
      endsAt: at(40),
    })
    const decision = evaluateEnrollments([current, renewal], 10, true, now)
    expect(decision).toMatchObject({ allowed: true, enrollmentId: 1 })
    expect(decision.allowed && decision.expiresAt?.getTime()).toBe(at(40).getTime())
    // Le jour du basculement, le renouvellement prend le relais sans interruption.
    expect(evaluateEnrollments([current, renewal], 10, true, at(10))).toMatchObject({
      allowed: true,
      enrollmentId: 2,
    })
  })

  it('un trou entre deux pass n’est pas comblé', () => {
    const current = record({ scope: 'catalog', courseId: null, source: 'pass', endsAt: at(5) })
    const later = record({
      id: 2,
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      startsAt: at(6),
      endsAt: at(30),
    })
    const decision = evaluateEnrollments([current, later], 10, true, now)
    expect(decision.allowed && decision.expiresAt?.getTime()).toBe(at(5).getTime())
    expect(evaluateEnrollments([current, later], 10, true, at(5.5))).toEqual({
      allowed: false,
      reason: 'expired',
    })
  })
})

describe('coverageEnd', () => {
  it('undefined sans couverture, null si illimité', () => {
    expect(coverageEnd([], now)).toBeUndefined()
    expect(coverageEnd([record({ endsAt: at(-1), startsAt: at(-5) })], now)).toBeUndefined()
    expect(coverageEnd([record({ endsAt: at(3) }), record({ startsAt: at(2) })], now)).toBeNull()
  })

  it('ignore les inscriptions non actives dans la chaîne', () => {
    const chain = [
      record({ endsAt: at(3) }),
      record({ startsAt: at(3), endsAt: at(9), status: 'suspended' }),
    ]
    expect(coverageEnd(chain, now)?.getTime()).toBe(at(3).getTime())
  })
})

describe('computePassWindow (ADR 003)', () => {
  it('démarre maintenant sans pass en cours', () => {
    expect(computePassWindow([], now, 30)).toEqual({ startsAt: now, endsAt: at(30) })
  })

  it('un renouvellement anticipé prolonge à partir de la fin du pass en cours', () => {
    const pass = record({ scope: 'catalog', courseId: null, source: 'pass', endsAt: at(7) })
    expect(computePassWindow([pass], now, 90)).toEqual({ startsAt: at(7), endsAt: at(97) })
  })

  it('un pass expiré ne décale pas le nouveau', () => {
    const expired = record({
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      startsAt: at(-40),
      endsAt: at(-10),
    })
    expect(computePassWindow([expired], now, 30).startsAt).toEqual(now)
  })

  it('ignore les achats de cours et refuse une durée invalide', () => {
    expect(computePassWindow([record({ endsAt: at(50) })], now, 30).startsAt).toEqual(now)
    expect(() => computePassWindow([], now, 0)).toThrow(AccessServiceError)
    expect(() => computePassWindow([], now, 1.5)).toThrow(AccessServiceError)
  })
})

describe('isCourseStaffFor', () => {
  const course = { instructorIds: [50] as Id[] }
  it('super-admin et éditeur partout, formateur sur ses cours, ventes jamais', () => {
    expect(isCourseStaffFor({ id: 1, roles: ['super-admin'] }, course)).toBe(true)
    expect(isCourseStaffFor({ id: 1, roles: ['editor'] }, course)).toBe(true)
    expect(isCourseStaffFor({ id: 50, roles: ['instructor'] }, course)).toBe(true)
    expect(isCourseStaffFor({ id: 51, roles: ['instructor'] }, course)).toBe(false)
    expect(isCourseStaffFor({ id: 50, roles: ['learner'] }, course)).toBe(false)
    expect(isCourseStaffFor({ id: 1, roles: ['sales'] }, course)).toBe(false)
    expect(isCourseStaffFor(null, course)).toBe(false)
  })
})

describe('EnrollmentAccessService.canAccessCourse', () => {
  it('cours inconnu : not-found, même anonyme', async () => {
    expect(await service.canAccessCourse(null, 999)).toEqual({
      allowed: false,
      reason: 'not-found',
    })
  })

  it('anonyme : not-authenticated', async () => {
    expect(await service.canAccessCourse(null, 10)).toEqual({
      allowed: false,
      reason: 'not-authenticated',
    })
  })

  it('accès après attribution, refus pour un autre utilisateur (IDOR)', async () => {
    await service.grant(purchase())
    expect(await service.canAccessCourse(learner, 10)).toMatchObject({
      allowed: true,
      reason: 'enrollment',
      source: 'purchase',
    })
    expect(await service.canAccessCourse(otherLearner, 10)).toEqual({
      allowed: false,
      reason: 'no-enrollment',
    })
  })

  it('refiltre par utilisateur si le stockage renvoie trop de lignes', async () => {
    await service.grant(purchase())
    store.leaky = true
    expect((await service.canAccessCourse(otherLearner, 10)).allowed).toBe(false)
    expect(await service.listAccessibleCourses(8)).toEqual([])
  })

  it('accès expiré', async () => {
    await service.grant(purchase({ startsAt: at(-30), endsAt: at(-1) }))
    expect(await service.canAccessCourse(learner, 10)).toEqual({
      allowed: false,
      reason: 'expired',
    })
  })

  it('le pass n’ouvre pas un cours non inclus ni un cours dépublié', async () => {
    await service.grant({
      userId: 7,
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      origin: { orderId: 901 },
      startsAt: at(-1),
      endsAt: at(29),
    })
    expect((await service.canAccessCourse(learner, 10)).allowed).toBe(true)
    expect((await service.canAccessCourse(learner, 20)).allowed).toBe(false)
    expect((await service.canAccessCourse(learner, 30)).allowed).toBe(false)
  })

  it('un achat reste valable sur un cours dépublié', async () => {
    await service.grant(purchase({ courseId: 30 }))
    expect((await service.canAccessCourse(learner, 30)).allowed).toBe(true)
  })

  it('personnel pédagogique : accès « staff », l’inscription l’emporte si elle existe', async () => {
    const instructor: Viewer = { id: 50, roles: ['instructor'] }
    expect(await service.canAccessCourse(instructor, 10)).toEqual({
      allowed: true,
      reason: 'staff',
      expiresAt: null,
    })
    expect((await service.canAccessCourse(instructor, 20)).allowed).toBe(false)
    expect((await service.canAccessCourse({ id: 2, roles: ['sales'] }, 10)).allowed).toBe(false)
    await service.grant(purchase({ userId: 50 }))
    expect(await service.canAccessCourse(instructor, 10)).toMatchObject({ reason: 'enrollment' })
  })

  it('le personnel garde l’accès malgré une inscription révoquée', async () => {
    const editor: Viewer = { id: 60, roles: ['editor'] }
    await service.grant(purchase({ userId: 60 }))
    await service.revokeByOrigin({ orderId: 900 }, 'remboursement')
    expect(await service.canAccessCourse(editor, 10)).toMatchObject({ reason: 'staff' })
  })
})

describe('EnrollmentAccessService.canAccessLesson', () => {
  it('extrait gratuit sans compte sur un cours publié', async () => {
    expect(await service.canAccessLesson(null, 101)).toEqual({
      allowed: true,
      reason: 'preview',
      expiresAt: null,
    })
  })

  it('pas d’extrait sur un cours dépublié', async () => {
    expect(await service.canAccessLesson(null, 301)).toEqual({
      allowed: false,
      reason: 'not-authenticated',
    })
  })

  it('leçon payante : refus sans inscription, accès avec', async () => {
    expect(await service.canAccessLesson(learner, 102)).toEqual({
      allowed: false,
      reason: 'no-enrollment',
    })
    await service.grant(purchase())
    expect(await service.canAccessLesson(learner, 102)).toMatchObject({ reason: 'enrollment' })
    // L'inscription prime sur l'extrait (échéance, source).
    expect(await service.canAccessLesson(learner, 101)).toMatchObject({ reason: 'enrollment' })
  })

  it('leçon d’un autre cours que celui de l’URL : not-found', async () => {
    await service.grant(purchase())
    // Achat du cours 10 ; URL forgée « cours 10 / leçon 201 » (leçon du cours 20).
    expect(await service.canAccessLesson(learner, 201, { expectedCourseId: 10 })).toEqual({
      allowed: false,
      reason: 'not-found',
    })
    expect(await service.canAccessLesson(learner, 201)).toEqual({
      allowed: false,
      reason: 'no-enrollment',
    })
    expect((await service.canAccessLesson(learner, 102, { expectedCourseId: '10' })).allowed).toBe(
      true,
    )
  })

  it('leçon inconnue : not-found', async () => {
    expect(await service.canAccessLesson(learner, 999)).toEqual({
      allowed: false,
      reason: 'not-found',
    })
  })

  it('un extrait reste ouvert même si l’accès payant est expiré', async () => {
    await service.grant(purchase({ startsAt: at(-30), endsAt: at(-1) }))
    expect(await service.canAccessLesson(learner, 101)).toMatchObject({ reason: 'preview' })
    expect(await service.canAccessLesson(learner, 102)).toEqual({
      allowed: false,
      reason: 'expired',
    })
  })
})

describe('EnrollmentAccessService.grant', () => {
  it('idempotent pour une même commande', async () => {
    const first = await service.grant(purchase())
    const second = await service.grant(purchase())
    expect(first).toEqual({ enrollmentId: 1, created: true })
    expect(second).toEqual({ enrollmentId: 1, created: false })
    expect(store.rows).toHaveLength(1)
  })

  it('une autre commande crée une autre inscription', async () => {
    await service.grant(purchase())
    expect(await service.grant(purchase({ origin: { orderId: 901, productId: 5 } }))).toMatchObject(
      {
        created: true,
      },
    )
  })

  it('un webhook rejoué après remboursement ne rouvre pas l’accès', async () => {
    await service.grant(purchase())
    await service.revokeByOrigin({ orderId: 900 }, 'remboursement')
    expect(await service.grant(purchase())).toEqual({ enrollmentId: 1, created: false })
    expect((await service.canAccessCourse(learner, 10)).allowed).toBe(false)
  })

  it('une attribution manuelle révoquée peut être refaite', async () => {
    const manual = purchase({ source: 'admin', origin: { grantedBy: 1 } })
    await service.grant(manual)
    store.rows[0]!.status = 'revoked'
    expect(await service.grant(manual)).toMatchObject({ created: true })
    expect((await service.canAccessCourse(learner, 10)).allowed).toBe(true)
  })

  it('refuse un cours inconnu', async () => {
    await expect(service.grant(purchase({ courseId: 999 }))).rejects.toMatchObject({
      code: 'course-not-found',
    })
  })

  it('valide la cohérence de la demande', () => {
    const invalid: Partial<GrantInput>[] = [
      { courseId: null },
      { scope: 'catalog' },
      { source: 'pass' },
      { origin: {} },
      { source: 'license', origin: { orderId: 1 } },
      { source: 'admin', origin: {} },
      { startsAt: new Date('invalid') },
      { endsAt: at(-1) },
      { endsAt: at(-1), startsAt: at(-1) },
    ]
    for (const overrides of invalid) {
      expect(() => assertValidGrant(purchase(overrides)), JSON.stringify(overrides)).toThrow(
        AccessServiceError,
      )
    }
    expect(() =>
      assertValidGrant({
        userId: 7,
        scope: 'catalog',
        courseId: null,
        source: 'pass',
        origin: { orderId: 3 },
        startsAt: now,
        endsAt: at(30),
      }),
    ).not.toThrow()
  })

  it('findIdempotentGrant distingue utilisateur, cours et origine', () => {
    const existing: StoredEnrollment = {
      ...record({}),
      userId: 7,
      origin: { orderId: 900, productId: 5 },
    }
    expect(findIdempotentGrant([existing], purchase())).toBe(existing)
    expect(findIdempotentGrant([existing], purchase({ userId: 8 }))).toBeUndefined()
    expect(findIdempotentGrant([existing], purchase({ courseId: 20 }))).toBeUndefined()
    expect(findIdempotentGrant([existing], purchase({ origin: { orderId: 900 } }))).toBeUndefined()
  })
})

describe('EnrollmentAccessService.revokeByOrigin', () => {
  it('révoque toutes les inscriptions d’une commande, une seule fois', async () => {
    await service.grant(purchase())
    await service.grant(purchase({ courseId: 20, origin: { orderId: 900, productId: 6 } }))
    await service.grant(purchase({ userId: 8, origin: { orderId: 777 } }))
    expect(await service.revokeByOrigin({ orderId: 900 }, '  remboursement  ')).toBe(2)
    expect(store.rows.filter((row) => row.status === 'revoked')).toHaveLength(2)
    expect(store.rows[0]!.revokedReason).toBe('remboursement')
    expect(await service.revokeByOrigin({ orderId: 900 }, 'remboursement')).toBe(0)
    expect((await service.canAccessCourse(otherLearner, 10)).allowed).toBe(true)
  })

  it('révoque par licence', async () => {
    await service.grant(purchase({ source: 'license', origin: { licenseId: 3 } }))
    expect(await service.revokeByOrigin({ licenseId: 3 }, 'siège retiré')).toBe(1)
    expect(await service.canAccessCourse(learner, 10)).toEqual({
      allowed: false,
      reason: 'revoked',
    })
  })

  it('refuse une origine vide (ne révoque jamais « tout ») ou un motif vide', async () => {
    await expect(service.revokeByOrigin({}, 'x')).rejects.toMatchObject({ code: 'invalid-origin' })
    await expect(service.revokeByOrigin({ orderId: 1 }, '  ')).rejects.toMatchObject({
      code: 'invalid-origin',
    })
  })
})

describe('EnrollmentAccessService.listAccessibleCourses', () => {
  it('liste les cours achetés et ceux du pass, sans doublon ni cours expiré', async () => {
    await service.grant(purchase())
    await service.grant(
      purchase({ courseId: 20, origin: { orderId: 902 }, endsAt: at(-0.5), startsAt: at(-3) }),
    )
    await service.grant({
      userId: 7,
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      origin: { orderId: 903 },
      startsAt: at(-1),
      endsAt: at(30),
    })
    const list = await service.listAccessibleCourses(7)
    expect(list.map((entry) => entry.courseId)).toEqual([10])
    expect(list[0]!.decision).toMatchObject({ allowed: true, expiresAt: null })
  })

  it('vide sans inscription', async () => {
    expect(await service.listAccessibleCourses(7)).toEqual([])
  })

  it('un pass expiré ne liste aucun cours', async () => {
    await service.grant({
      userId: 7,
      scope: 'catalog',
      courseId: null,
      source: 'pass',
      origin: { orderId: 903 },
      startsAt: at(-40),
      endsAt: at(-10),
    })
    expect(await service.listAccessibleCourses(7)).toEqual([])
  })
})
