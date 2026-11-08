import type {
  AccessDecision,
  AccessService,
  EnrollmentRecord,
  GrantInput,
  GrantResult,
  Id,
  Viewer,
} from './contracts'

const DAY_MS = 24 * 60 * 60 * 1000

export const sameId = (a: Id | null | undefined, b: Id | null | undefined): boolean =>
  a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b)

// ---------------------------------------------------------------------------
// Décision pure (ADR 002)
// ---------------------------------------------------------------------------

const isValidAt = (enrollment: EnrollmentRecord, at: number): boolean =>
  enrollment.status === 'active' &&
  enrollment.startsAt.getTime() <= at &&
  (enrollment.endsAt === null || enrollment.endsAt.getTime() > at)

/**
 * Fin de la couverture continue à partir de `at` : un accès valide maintenant, prolongé
 * par les inscriptions actives qui démarrent au plus tard à sa fin (pass renouvelé avant
 * son terme, ADR 003). `null` : illimité ; `undefined` : aucune couverture à `at`.
 */
export function coverageEnd(
  enrollments: readonly EnrollmentRecord[],
  at: Date,
): Date | null | undefined {
  const active = enrollments.filter((enrollment) => enrollment.status === 'active')
  let end = at.getTime()
  let covered = false
  for (;;) {
    const extending = active.filter(
      (enrollment) =>
        enrollment.startsAt.getTime() <= end &&
        (enrollment.endsAt === null || enrollment.endsAt.getTime() > end),
    )
    if (extending.length === 0) break
    if (extending.some((enrollment) => enrollment.endsAt === null)) return null
    // Chaque candidate a une fin strictement postérieure à `end` : la boucle progresse.
    end = Math.max(...extending.map((enrollment) => (enrollment.endsAt as Date).getTime()))
    covered = true
  }
  return covered ? new Date(end) : undefined
}

/**
 * Décision d'accès pure, à partir des inscriptions candidates d'un utilisateur pour un
 * cours (portée `course` sur ce cours, ou portée `catalog` si le cours est inclus dans
 * le pass). `AccessService` charge ces inscriptions puis délègue ici.
 *
 * Priorité : une inscription valide l'emporte ; sinon on explique le refus le plus
 * informatif (révoqué > suspendu > expiré > pas encore commencé > aucune inscription).
 * Parmi les inscriptions valides, on retient celle qui dure le plus longtemps ; l'échéance
 * renvoyée tient compte des renouvellements consécutifs.
 */
export function evaluateEnrollments(
  enrollments: readonly EnrollmentRecord[],
  courseId: Id,
  courseIncludedInPass: boolean,
  at: Date,
): AccessDecision {
  const now = at.getTime()
  const relevant = enrollments.filter((enrollment) =>
    enrollment.scope === 'catalog' ? courseIncludedInPass : sameId(enrollment.courseId, courseId),
  )

  const valid = relevant.filter((enrollment) => isValidAt(enrollment, now))

  if (valid.length > 0) {
    const best = valid.reduce((current, candidate) => {
      if (current.endsAt === null) return current
      if (candidate.endsAt === null) return candidate
      return candidate.endsAt.getTime() > current.endsAt.getTime() ? candidate : current
    })
    return {
      allowed: true,
      reason: 'enrollment',
      enrollmentId: best.id,
      source: best.source,
      expiresAt: coverageEnd(relevant, at) ?? best.endsAt,
    }
  }

  if (relevant.some((enrollment) => enrollment.status === 'revoked'))
    return { allowed: false, reason: 'revoked' }
  if (relevant.some((enrollment) => enrollment.status === 'suspended'))
    return { allowed: false, reason: 'suspended' }
  if (
    relevant.some((enrollment) => enrollment.endsAt !== null && enrollment.endsAt.getTime() <= now)
  ) {
    return { allowed: false, reason: 'expired' }
  }
  if (relevant.length > 0) return { allowed: false, reason: 'not-started' }
  return { allowed: false, reason: 'no-enrollment' }
}

/**
 * Fenêtre d'un nouveau pass (ADR 003) : il démarre à la fin de la couverture « pass » en
 * cours (renouvellement anticipé sans perte de jours), sinon maintenant.
 */
export function computePassWindow(
  existing: readonly EnrollmentRecord[],
  at: Date,
  durationDays: number,
): { startsAt: Date; endsAt: Date } {
  if (!Number.isInteger(durationDays) || durationDays < 1) {
    throw new AccessServiceError('invalid-grant', 'Durée de pass invalide (jours entiers ≥ 1).')
  }
  const catalog = existing.filter((enrollment) => enrollment.scope === 'catalog')
  const end = coverageEnd(catalog, at)
  const startsAt = end instanceof Date ? end : at
  return { startsAt, endsAt: new Date(startsAt.getTime() + durationDays * DAY_MS) }
}

// ---------------------------------------------------------------------------
// Personnel pédagogique
// ---------------------------------------------------------------------------

export type CourseAccessInfo = {
  id: Id
  /** Publié (`_status: published`). Un cours dépublié reste accessible à ses inscrits. */
  published: boolean
  includedInPass: boolean
  instructorIds: readonly Id[]
}

export type LessonAccessInfo = { id: Id; courseId: Id; isPreview: boolean }

/** Super-admin et éditeurs : tous les cours ; formateur : ses cours uniquement. */
export function isCourseStaffFor(viewer: Viewer, course: Pick<CourseAccessInfo, 'instructorIds'>) {
  if (!viewer) return false
  if (viewer.roles.includes('super-admin') || viewer.roles.includes('editor')) return true
  return (
    viewer.roles.includes('instructor') &&
    course.instructorIds.some((instructorId) => sameId(instructorId, viewer.id))
  )
}

// ---------------------------------------------------------------------------
// Ports (implémentés sur Payload, en mémoire dans les tests)
// ---------------------------------------------------------------------------

export type EnrollmentOrigin = GrantInput['origin']

export type StoredEnrollment = EnrollmentRecord & {
  userId: Id
  origin: EnrollmentOrigin
  revokedReason?: string | null
}

export interface AccessCatalog {
  /** Cours demandés (brouillons compris) ; les identifiants inconnus sont omis. */
  getCourses(courseIds: readonly Id[]): Promise<CourseAccessInfo[]>
  getLesson(lessonId: Id): Promise<LessonAccessInfo | null>
  /** Cours publiés et `includedInPass`. */
  listPassCourseIds(): Promise<Id[]>
}

export interface EnrollmentStore {
  /** Inscriptions de l'utilisateur : portée `course` sur ce cours, et portée `catalog`. */
  findForUserCourse(userId: Id, courseId: Id): Promise<StoredEnrollment[]>
  listForUser(userId: Id): Promise<StoredEnrollment[]>
  /** Inscriptions issues d'une commande ou d'une licence (tous statuts). */
  findByOrigin(origin: { orderId?: Id; licenseId?: Id }): Promise<StoredEnrollment[]>
  /** Inscriptions de l'utilisateur pour cette portée, ce cours et cette source. */
  findGrantCandidates(
    input: Pick<GrantInput, 'userId' | 'scope' | 'courseId' | 'source'>,
  ): Promise<StoredEnrollment[]>
  create(input: GrantInput): Promise<StoredEnrollment>
  revoke(enrollmentIds: readonly Id[], reason: string, at: Date): Promise<number>
}

export type AccessServiceErrorCode = 'invalid-grant' | 'course-not-found' | 'invalid-origin'

export class AccessServiceError extends Error {
  constructor(
    public readonly code: AccessServiceErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'AccessServiceError'
  }
}

// ---------------------------------------------------------------------------
// Règles d'attribution
// ---------------------------------------------------------------------------

const originKeys = ['orderId', 'licenseId', 'productId', 'grantedBy'] as const

const sameOrigin = (a: EnrollmentOrigin, b: EnrollmentOrigin): boolean =>
  originKeys.every((key) =>
    a[key] === undefined || a[key] === null
      ? b[key] === undefined || b[key] === null
      : sameId(a[key], b[key]),
  )

/** Une commande ou une licence identifie un droit de façon durable (rejouable). */
const hasDurableOrigin = (origin: EnrollmentOrigin): boolean =>
  origin.orderId !== undefined || origin.licenseId !== undefined

/**
 * Inscription existante qui rend `grant` idempotent : même utilisateur, portée, cours,
 * source et origine. Pour une commande ou une licence, une inscription révoquée compte
 * aussi (un webhook rejoué après remboursement ne rouvre pas l'accès) ; pour un cadeau ou
 * une attribution manuelle sans commande, seule une inscription non révoquée compte.
 */
export function findIdempotentGrant(
  candidates: readonly StoredEnrollment[],
  input: GrantInput,
): StoredEnrollment | undefined {
  return candidates.find(
    (enrollment) =>
      sameId(enrollment.userId, input.userId) &&
      enrollment.scope === input.scope &&
      (input.scope === 'catalog' || sameId(enrollment.courseId, input.courseId)) &&
      enrollment.source === input.source &&
      sameOrigin(enrollment.origin, input.origin) &&
      (hasDurableOrigin(input.origin) || enrollment.status !== 'revoked'),
  )
}

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime())

/** Cohérence d'une demande d'attribution ; lève `AccessServiceError('invalid-grant')`. */
export function assertValidGrant(input: GrantInput): void {
  const fail = (message: string): never => {
    throw new AccessServiceError('invalid-grant', message)
  }
  if (input.userId === null || input.userId === undefined || input.userId === '')
    fail('Utilisateur requis.')
  if (input.scope === 'course' && (input.courseId === null || input.courseId === ''))
    fail('Cours requis pour une inscription à un cours.')
  if (input.scope === 'catalog' && input.courseId !== null)
    fail('Une inscription au catalogue ne cible pas de cours.')
  if (input.source === 'pass' && input.scope !== 'catalog')
    fail('Un pass ouvre le catalogue (ADR 003).')
  if (input.source === 'purchase' && input.origin.orderId === undefined)
    fail('Un achat référence sa commande.')
  if (input.source === 'license' && input.origin.licenseId === undefined)
    fail('Une licence référence sa licence.')
  if (input.source === 'admin' && input.origin.grantedBy === undefined)
    fail('Une attribution manuelle référence son auteur.')
  if (!isValidDate(input.startsAt)) fail('Date de début invalide.')
  if (input.endsAt !== null) {
    if (!isValidDate(input.endsAt)) fail('Date de fin invalide.')
    if (input.endsAt.getTime() <= input.startsAt.getTime())
      fail('La fin d’accès doit suivre le début.')
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export type AccessServiceOptions = {
  catalog: AccessCatalog
  enrollments: EnrollmentStore
  now?: () => Date
}

/**
 * `AccessService` fondé sur `enrollments` (ADR 002). Appelé côté serveur à chaque
 * requête du lecteur et avant chaque signature d'URL vidéo ; jamais mis en cache côté
 * client. Les inscriptions renvoyées par le stockage sont refiltrées par utilisateur
 * (défense en profondeur contre une requête mal bornée).
 */
export class EnrollmentAccessService implements AccessService {
  private readonly now: () => Date

  constructor(private readonly options: AccessServiceOptions) {
    this.now = options.now ?? (() => new Date())
  }

  private async getCourse(courseId: Id): Promise<CourseAccessInfo | null> {
    const [course] = await this.options.catalog.getCourses([courseId])
    return course && sameId(course.id, courseId) ? course : null
  }

  private decide(
    viewer: NonNullable<Viewer>,
    course: CourseAccessInfo,
    enrollments: readonly StoredEnrollment[],
    at: Date,
  ): AccessDecision {
    const own = enrollments.filter((enrollment) => sameId(enrollment.userId, viewer.id))
    const decision = evaluateEnrollments(
      own,
      course.id,
      course.includedInPass && course.published,
      at,
    )
    if (decision.allowed) return decision
    if (isCourseStaffFor(viewer, course)) return { allowed: true, reason: 'staff', expiresAt: null }
    return decision
  }

  async canAccessCourse(
    viewer: Viewer,
    courseId: Id,
    at: Date = this.now(),
  ): Promise<AccessDecision> {
    const course = await this.getCourse(courseId)
    if (!course) return { allowed: false, reason: 'not-found' }
    if (!viewer) return { allowed: false, reason: 'not-authenticated' }
    const enrollments = await this.options.enrollments.findForUserCourse(viewer.id, course.id)
    return this.decide(viewer, course, enrollments, at)
  }

  async canAccessLesson(
    viewer: Viewer,
    lessonId: Id,
    options: { at?: Date; expectedCourseId?: Id } = {},
  ): Promise<AccessDecision> {
    const at = options.at ?? this.now()
    const lesson = await this.options.catalog.getLesson(lessonId)
    if (!lesson || !sameId(lesson.id, lessonId)) return { allowed: false, reason: 'not-found' }
    if (
      options.expectedCourseId !== undefined &&
      !sameId(lesson.courseId, options.expectedCourseId)
    )
      return { allowed: false, reason: 'not-found' }

    const course = await this.getCourse(lesson.courseId)
    if (!course) return { allowed: false, reason: 'not-found' }

    let decision: AccessDecision = { allowed: false, reason: 'not-authenticated' }
    if (viewer) {
      const enrollments = await this.options.enrollments.findForUserCourse(viewer.id, course.id)
      decision = this.decide(viewer, course, enrollments, at)
    }
    if (decision.allowed) return decision
    // Extrait gratuit : uniquement sur un cours publié, avec ou sans compte.
    if (lesson.isPreview && course.published)
      return { allowed: true, reason: 'preview', expiresAt: null }
    return decision
  }

  async grant(input: GrantInput): Promise<GrantResult> {
    assertValidGrant(input)
    if (input.scope === 'course' && input.courseId !== null) {
      const course = await this.getCourse(input.courseId)
      if (!course)
        throw new AccessServiceError('course-not-found', `Cours inconnu : ${input.courseId}`)
    }
    const candidates = await this.options.enrollments.findGrantCandidates(input)
    const existing = findIdempotentGrant(candidates, input)
    if (existing) return { enrollmentId: existing.id, created: false }
    const created = await this.options.enrollments.create(input)
    return { enrollmentId: created.id, created: true }
  }

  async revokeByOrigin(origin: { orderId?: Id; licenseId?: Id }, reason: string): Promise<number> {
    if (origin.orderId === undefined && origin.licenseId === undefined) {
      throw new AccessServiceError('invalid-origin', 'Origine requise : commande ou licence.')
    }
    if (reason.trim() === '') throw new AccessServiceError('invalid-origin', 'Motif requis.')
    const matches = await this.options.enrollments.findByOrigin(origin)
    const ids = matches
      .filter(
        (enrollment) =>
          enrollment.status !== 'revoked' &&
          (origin.orderId === undefined || sameId(enrollment.origin.orderId, origin.orderId)) &&
          (origin.licenseId === undefined || sameId(enrollment.origin.licenseId, origin.licenseId)),
      )
      .map((enrollment) => enrollment.id)
    if (ids.length === 0) return 0
    return this.options.enrollments.revoke(ids, reason.trim(), this.now())
  }

  /** Cours actuellement accessibles par inscription (le personnel n'est pas listé). */
  async listAccessibleCourses(
    userId: Id,
    at: Date = this.now(),
  ): Promise<{ courseId: Id; decision: AccessDecision }[]> {
    const all = (await this.options.enrollments.listForUser(userId)).filter((enrollment) =>
      sameId(enrollment.userId, userId),
    )
    const ids: Id[] = []
    const push = (id: Id) => {
      if (!ids.some((known) => sameId(known, id))) ids.push(id)
    }
    for (const enrollment of all) {
      if (enrollment.scope === 'course' && enrollment.courseId !== null) push(enrollment.courseId)
    }
    if (
      all.some(
        (enrollment) => enrollment.scope === 'catalog' && isValidAt(enrollment, at.getTime()),
      )
    ) {
      for (const id of await this.options.catalog.listPassCourseIds()) push(id)
    }
    if (ids.length === 0) return []

    const courses = await this.options.catalog.getCourses(ids)
    const result: { courseId: Id; decision: AccessDecision }[] = []
    for (const id of ids) {
      const course = courses.find((candidate) => sameId(candidate.id, id))
      if (!course) continue
      const decision = evaluateEnrollments(
        all,
        course.id,
        course.includedInPass && course.published,
        at,
      )
      if (decision.allowed) result.push({ courseId: course.id, decision })
    }
    return result
  }
}
