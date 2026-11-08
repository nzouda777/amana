import type { LessonType } from './progress'

/**
 * Plan public d'un cours (fiche cours) : modules et leçons **sans contenu** (titres,
 * types, durées, extraits). Logique pure, testée sans base.
 */

export type PublicLesson = {
  id: number
  slug: string
  title: string
  type: LessonType
  durationMinutes: number
  isPreview: boolean
}

export type PublicModule = {
  id: number
  title: string
  description: string | null
  durationMinutes: number
  lessons: PublicLesson[]
}

type ModuleDoc = { id: number; title: string; description?: string | null; order: number }
type LessonDoc = {
  id: number
  slug: string
  title: string
  module: number | { id: number }
  order: number
  type: LessonType
  isPreview?: boolean | null
  durationMinutes?: number | null
}

const minutes = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0

/**
 * Modules dans l'ordre, chacun avec ses leçons dans l'ordre ; une leçon dont le module
 * n'appartient pas au cours est ignorée. Les champs sont recopiés un à un : aucun champ
 * de contenu ne peut transiter, même si l'appelant en a lu davantage.
 */
export function buildPublicOutline(
  modules: readonly ModuleDoc[],
  lessons: readonly LessonDoc[],
): PublicModule[] {
  return [...modules]
    .sort((a, b) => a.order - b.order || a.id - b.id)
    .map((part) => {
      const own = lessons
        .filter((lesson) => {
          const moduleId = typeof lesson.module === 'object' ? lesson.module.id : lesson.module
          return moduleId === part.id
        })
        .sort((a, b) => a.order - b.order || a.id - b.id)
        .map((lesson): PublicLesson => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          type: lesson.type,
          durationMinutes: minutes(lesson.durationMinutes),
          isPreview: lesson.isPreview === true,
        }))
      return {
        id: part.id,
        title: part.title,
        description: part.description?.trim() || null,
        durationMinutes: own.reduce((sum, lesson) => sum + lesson.durationMinutes, 0),
        lessons: own,
      }
    })
}

export type OutlineStats = {
  modules: number
  lessons: number
  previews: number
  quizzes: number
  byType: Record<LessonType, number>
}

export function outlineStats(outline: readonly PublicModule[]): OutlineStats {
  const byType: Record<LessonType, number> = {
    video: 0,
    text: 0,
    pdf: 0,
    quiz: 0,
    'case-study': 0,
  }
  let lessons = 0
  let previews = 0
  for (const part of outline) {
    for (const lesson of part.lessons) {
      lessons += 1
      byType[lesson.type] += 1
      if (lesson.isPreview) previews += 1
    }
  }
  return { modules: outline.length, lessons, previews, quizzes: byType.quiz, byType }
}

/** Leçons d'extrait jouables depuis la fiche : vidéo, texte et étude de cas. */
export const previewableTypes: readonly LessonType[] = ['video', 'text', 'case-study']

export function isPreviewable(lesson: Pick<PublicLesson, 'isPreview' | 'type'>): boolean {
  return lesson.isPreview && previewableTypes.includes(lesson.type)
}

/** Durée ISO 8601 (`PT3H20M`) pour les données structurées ; `undefined` si nulle. */
export function isoDuration(totalMinutes: number): string | undefined {
  const value = minutes(totalMinutes)
  if (value === 0) return undefined
  const hours = Math.floor(value / 60)
  const rest = value % 60
  return `PT${hours ? `${hours}H` : ''}${rest ? `${rest}M` : ''}`
}
