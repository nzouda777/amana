import { z } from 'zod'

import { sameId } from './access'
import type { Id } from './contracts'

/**
 * Progression et complétion (SPEC §4.1), en fonctions pures. Le serveur ne fait jamais
 * confiance à un « terminé » envoyé par le client pour une vidéo ou un quiz :
 * - vidéo : terminée quand la position atteint 90 % de la durée connue ;
 * - texte, PDF, étude de cas : terminée à la fin du défilement ou manuellement ;
 * - quiz : terminée uniquement quand le quiz est réussi (tentative corrigée côté serveur).
 */

export const lessonTypes = ['video', 'text', 'pdf', 'quiz', 'case-study'] as const
export type LessonType = (typeof lessonTypes)[number]

/** Part de la vidéo à visionner pour la marquer terminée. */
export const VIDEO_COMPLETION_RATIO = 0.9

/** Position maximale acceptée (24 h) : borne les valeurs absurdes. */
export const MAX_POSITION_SECONDS = 24 * 60 * 60

// ---------------------------------------------------------------------------
// Plan de cours et état
// ---------------------------------------------------------------------------

export type OutlineLesson = {
  id: Id
  order: number
  type: LessonType
  /** Quiz de la leçon (type `quiz`). */
  quizId: Id | null
}

export type OutlineModule = {
  id: Id
  order: number
  /** Quiz à réussir avant d'accéder aux modules suivants. */
  gateQuizId: Id | null
  lessons: readonly OutlineLesson[]
}

export type CourseOutline = { courseId: Id; modules: readonly OutlineModule[] }

export type LessonProgressRecord = {
  lessonId: Id
  completed: boolean
  positionSeconds: number
  updatedAt: Date | null
}

export type LessonState = 'completed' | 'in-progress' | 'not-started' | 'locked'

export type LessonStatus = {
  lessonId: Id
  moduleId: Id
  state: LessonState
  positionSeconds: number
}

export type CourseProgress = {
  courseId: Id
  totalLessons: number
  completedLessons: number
  /** Entier 0–100 ; 100 uniquement si le cours est entièrement terminé. */
  percent: number
  /** Quiz des leçons de type quiz et quiz de passage des modules, sans doublon. */
  requiredQuizIds: Id[]
  pendingQuizIds: Id[]
  isComplete: boolean
  lessons: LessonStatus[]
  /** Leçon où reprendre (« Continuer le cours »), `null` si tout est terminé. */
  resumeLessonId: Id | null
}

const byOrder = <T extends { order: number }>(items: readonly T[]): T[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.order - b.item.order || a.index - b.index)
    .map(({ item }) => item)

const includesId = (ids: readonly Id[], id: Id) => ids.some((known) => sameId(known, id))

/** Leçon comptée dans la progression (une leçon quiz sans quiz n'a rien à accomplir). */
const isCountable = (lesson: OutlineLesson) => lesson.type !== 'quiz' || lesson.quizId !== null

/** Modules et leçons triés selon leur ordre (stable). */
export function orderedLessons(
  outline: CourseOutline,
): { module: OutlineModule; lesson: OutlineLesson }[] {
  return byOrder(outline.modules).flatMap((courseModule) =>
    byOrder(courseModule.lessons).map((lesson) => ({ module: courseModule, lesson })),
  )
}

/**
 * Progression d'un cours. Les enregistrements de progression qui ne correspondent à
 * aucune leçon du plan (autre cours, leçon supprimée) sont ignorés.
 */
export function computeCourseProgress(
  outline: CourseOutline,
  records: readonly LessonProgressRecord[],
  passedQuizIds: readonly Id[],
): CourseProgress {
  const recordFor = (lessonId: Id) => records.find((record) => sameId(record.lessonId, lessonId))

  const requiredQuizIds: Id[] = []
  const requireQuiz = (quizId: Id | null) => {
    if (quizId !== null && !includesId(requiredQuizIds, quizId)) requiredQuizIds.push(quizId)
  }

  const lessons: LessonStatus[] = []
  let locked = false
  for (const courseModule of byOrder(outline.modules)) {
    for (const lesson of byOrder(courseModule.lessons)) {
      if (!isCountable(lesson)) continue
      requireQuiz(lesson.quizId)
      const record = recordFor(lesson.id)
      const completed =
        lesson.type === 'quiz'
          ? lesson.quizId !== null && includesId(passedQuizIds, lesson.quizId)
          : record?.completed === true
      const state: LessonState = completed
        ? 'completed'
        : locked
          ? 'locked'
          : record
            ? 'in-progress'
            : 'not-started'
      lessons.push({
        lessonId: lesson.id,
        moduleId: courseModule.id,
        state,
        positionSeconds: record ? Math.max(0, Math.floor(record.positionSeconds)) : 0,
      })
    }
    requireQuiz(courseModule.gateQuizId)
    if (courseModule.gateQuizId !== null && !includesId(passedQuizIds, courseModule.gateQuizId))
      locked = true
  }

  const totalLessons = lessons.length
  const completedLessons = lessons.filter((lesson) => lesson.state === 'completed').length
  const pendingQuizIds = requiredQuizIds.filter((quizId) => !includesId(passedQuizIds, quizId))
  const isComplete =
    totalLessons > 0 && completedLessons === totalLessons && pendingQuizIds.length === 0
  const raw = totalLessons === 0 ? 0 : Math.floor((completedLessons * 100) / totalLessons)

  return {
    courseId: outline.courseId,
    totalLessons,
    completedLessons,
    percent: isComplete ? 100 : Math.min(raw, 99),
    requiredQuizIds,
    pendingQuizIds,
    isComplete,
    lessons,
    resumeLessonId: pickResumeLesson(lessons, records),
  }
}

/**
 * Leçon à reprendre : la dernière leçon ouverte non terminée (et non verrouillée), sinon
 * la première leçon non terminée accessible, sinon `null`.
 */
function pickResumeLesson(
  lessons: readonly LessonStatus[],
  records: readonly LessonProgressRecord[],
): Id | null {
  const open = lessons.filter((lesson) => lesson.state === 'in-progress')
  let latest: { lessonId: Id; time: number } | null = null
  for (const lesson of open) {
    const time = records
      .find((record) => sameId(record.lessonId, lesson.lessonId))
      ?.updatedAt?.getTime()
    if (time !== undefined && (latest === null || time > latest.time))
      latest = { lessonId: lesson.lessonId, time }
  }
  if (latest) return latest.lessonId
  const next = lessons.find(
    (lesson) => lesson.state === 'in-progress' || lesson.state === 'not-started',
  )
  return next?.lessonId ?? null
}

/** Une leçon est-elle ouverte à l'apprenant (pas derrière un quiz de passage non réussi) ? */
export function isLessonUnlocked(progress: CourseProgress, lessonId: Id): boolean {
  const lesson = progress.lessons.find((candidate) => sameId(candidate.lessonId, lessonId))
  return lesson !== undefined && lesson.state !== 'locked'
}

/** Leçons précédente et suivante dans l'ordre du cours (navigation du lecteur). */
export function adjacentLessons(
  outline: CourseOutline,
  lessonId: Id,
): { previousId: Id | null; nextId: Id | null } {
  const ids = orderedLessons(outline).map(({ lesson }) => lesson.id)
  const index = ids.findIndex((id) => sameId(id, lessonId))
  if (index === -1) return { previousId: null, nextId: null }
  return { previousId: ids[index - 1] ?? null, nextId: ids[index + 1] ?? null }
}

// ---------------------------------------------------------------------------
// Parcours
// ---------------------------------------------------------------------------

export type PathProgress = {
  totalCourses: number
  completedCourses: number
  totalLessons: number
  completedLessons: number
  percent: number
  isComplete: boolean
}

/** Progression agrégée d'un parcours, pondérée par le nombre de leçons. */
export function computePathProgress(courses: readonly CourseProgress[]): PathProgress {
  const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0)
  const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0)
  const completedCourses = courses.filter((course) => course.isComplete).length
  const isComplete = courses.length > 0 && completedCourses === courses.length
  const raw = totalLessons === 0 ? 0 : Math.floor((completedLessons * 100) / totalLessons)
  return {
    totalCourses: courses.length,
    completedCourses,
    totalLessons,
    completedLessons,
    percent: isComplete ? 100 : Math.min(raw, 99),
    isComplete,
  }
}

// ---------------------------------------------------------------------------
// Mise à jour de la progression d'une leçon
// ---------------------------------------------------------------------------

export type StoredLessonProgress = {
  positionSeconds: number
  completed: boolean
  completedAt: Date | null
}

export type ProgressUpdate = { positionSeconds?: number; markCompleted?: boolean }

export type ProgressUpdateResult =
  | { ok: true; next: StoredLessonProgress; justCompleted: boolean }
  | { ok: false; reason: 'invalid-position' | 'not-completable' }

/**
 * Applique une mise à jour envoyée par le lecteur. « Terminé » est irréversible ; la
 * position est bornée à la durée connue de la vidéo ; un « terminé » explicite n'est
 * accepté que pour les leçons à lire (ou une vidéo dont la durée est inconnue).
 */
export function applyProgressUpdate(
  current: StoredLessonProgress | null,
  lesson: { type: LessonType; durationSeconds: number | null },
  update: ProgressUpdate,
  at: Date,
): ProgressUpdateResult {
  if (lesson.type === 'quiz') return { ok: false, reason: 'not-completable' }

  const previous: StoredLessonProgress = current ?? {
    positionSeconds: 0,
    completed: false,
    completedAt: null,
  }

  let positionSeconds = previous.positionSeconds
  if (update.positionSeconds !== undefined) {
    const value = update.positionSeconds
    if (!Number.isFinite(value) || value < 0 || value > MAX_POSITION_SECONDS)
      return { ok: false, reason: 'invalid-position' }
    const duration =
      lesson.durationSeconds !== null && lesson.durationSeconds > 0 ? lesson.durationSeconds : null
    positionSeconds = Math.floor(duration === null ? value : Math.min(value, duration))
  }

  let reached = false
  if (lesson.type === 'video') {
    const duration = lesson.durationSeconds
    if (duration !== null && duration > 0) {
      reached = positionSeconds >= duration * VIDEO_COMPLETION_RATIO
    } else {
      reached = update.markCompleted === true
    }
  } else {
    reached = update.markCompleted === true
  }

  const completed = previous.completed || reached
  return {
    ok: true,
    next: {
      positionSeconds,
      completed,
      completedAt: previous.completed ? previous.completedAt : completed ? at : null,
    },
    justCompleted: completed && !previous.completed,
  }
}

// ---------------------------------------------------------------------------
// Envoi groupé du lecteur (toutes les 15 s, `visibilitychange`, file hors ligne)
// ---------------------------------------------------------------------------

export const PROGRESS_BATCH_MAX = 50

export const progressBatchSchema = z
  .array(
    z.strictObject({
      lessonId: z.number().int().positive(),
      positionSeconds: z.number().min(0).max(MAX_POSITION_SECONDS).optional(),
      markCompleted: z.boolean().optional(),
      /** Horodatage client (ms) : ordonne les envois rejoués après une coupure. */
      clientTimestamp: z.number().int().nonnegative(),
    }),
  )
  .max(PROGRESS_BATCH_MAX)

export type ProgressBatchItem = z.infer<typeof progressBatchSchema>[number]

/**
 * Regroupe un lot par leçon : la position la plus récente (horodatage client) l'emporte,
 * un « terminé » présent dans le lot est conservé.
 */
export function collapseProgressBatch(items: readonly ProgressBatchItem[]): ProgressBatchItem[] {
  const byLesson = new Map<number, ProgressBatchItem>()
  for (const item of items) {
    const known = byLesson.get(item.lessonId)
    if (!known) {
      byLesson.set(item.lessonId, { ...item })
      continue
    }
    const [latest, older] =
      item.clientTimestamp >= known.clientTimestamp ? [item, known] : [known, item]
    const positionSeconds = latest.positionSeconds ?? older.positionSeconds
    const markCompleted = known.markCompleted === true || item.markCompleted === true
    byLesson.set(item.lessonId, {
      lessonId: item.lessonId,
      clientTimestamp: latest.clientTimestamp,
      ...(positionSeconds !== undefined ? { positionSeconds } : {}),
      ...(markCompleted ? { markCompleted: true } : {}),
    })
  }
  return [...byLesson.values()]
}
