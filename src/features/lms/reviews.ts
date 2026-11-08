export const reviewStatuses = ['pending', 'approved', 'rejected'] as const
export type ReviewStatus = (typeof reviewStatuses)[number]

/** Seuil de progression requis pour publier un avis (SPEC §3). */
export const REVIEW_MIN_PROGRESS_PERCENT = 50

export function canReview(progressPercent: number): boolean {
  return progressPercent >= REVIEW_MIN_PROGRESS_PERCENT
}

/** Nombre d'avis publiés à partir duquel la moyenne est affichée. */
export const REVIEW_MIN_COUNT_FOR_AVERAGE = 3

/**
 * Moyenne des avis publiés, arrondie au dixième ; `null` sous le seuil d'affichage.
 * Les notes hors 1–5 ou non entières sont ignorées.
 */
export function summarizeRatings(ratings: readonly number[]): {
  count: number
  average: number | null
} {
  const valid = ratings.filter((rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5)
  if (valid.length < REVIEW_MIN_COUNT_FOR_AVERAGE) return { count: valid.length, average: null }
  const sum = valid.reduce((total, rating) => total + rating, 0)
  return { count: valid.length, average: Math.round((sum * 10) / valid.length) / 10 }
}

type ReviewInput = { user?: unknown; status?: unknown }

/**
 * Normalise un avis à la création : un non-modérateur écrit toujours en son nom,
 * et son avis part en modération. L'éligibilité (≥ 50 %) est vérifiée par le service
 * LMS qui appelle la création (M3).
 */
export function normalizeNewReview<T extends ReviewInput>(
  data: T,
  author: { id: number | string } | null | undefined,
  isModerator: boolean,
): T {
  if (isModerator) return data
  if (!author) throw new Error('Authentification requise pour publier un avis.')
  return { ...data, user: author.id, status: 'pending' satisfies ReviewStatus }
}
