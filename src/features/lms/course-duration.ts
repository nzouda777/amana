import type { PayloadRequest } from 'payload'

/** Somme des durées de leçons (minutes), valeurs absentes ou invalides ignorées. */
export function sumLessonMinutes(lessons: readonly { durationMinutes?: number | null }[]): number {
  return lessons.reduce((total, lesson) => {
    const minutes = lesson.durationMinutes
    return typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0
      ? total + minutes
      : total
  }, 0)
}

/**
 * Recalcule `courses.durationMinutes` à partir de ses leçons. Appelé par les hooks de
 * `lessons`, dans la même transaction (`req`) ; `skipDurationRecompute` évite toute boucle.
 */
export async function recomputeCourseDuration(
  req: PayloadRequest,
  courseId: number | string,
): Promise<void> {
  const { docs } = await req.payload.find({
    collection: 'lessons',
    where: { course: { equals: courseId } },
    depth: 0,
    pagination: false,
    select: { durationMinutes: true },
    req,
  })
  await req.payload.update({
    collection: 'courses',
    id: courseId,
    depth: 0,
    data: { durationMinutes: sumLessonMinutes(docs) },
    context: { skipDurationRecompute: true },
    req,
  })
}
