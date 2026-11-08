/**
 * Durée de validité des URL de lecture signées (ADR 017). Le jeton est vérifié par le CDN
 * à chaque segment : il doit couvrir une lecture normale, sans durer au-delà. Quand il
 * expire (pause longue), le lecteur redemande une URL au serveur, qui revérifie l'accès.
 */

export const PLAYBACK_TTL_MIN_SECONDS = 15 * 60
export const PLAYBACK_TTL_MAX_SECONDS = 4 * 60 * 60
/** Marge ajoutée à la durée de la vidéo (pauses, ralentissement à 0,75×). */
export const PLAYBACK_TTL_MARGIN_SECONDS = 15 * 60
/** Durée inconnue (vidéo en cours d'encodage, métadonnée absente). */
export const PLAYBACK_TTL_DEFAULT_SECONDS = 60 * 60

/** Durée de la vidéo lue à 0,75× (× 4/3) + marge, bornée à [15 min ; 4 h]. */
export function playbackTtlSeconds(durationSeconds: number | null | undefined): number {
  if (
    durationSeconds === null ||
    durationSeconds === undefined ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return PLAYBACK_TTL_DEFAULT_SECONDS
  }
  const wanted = Math.ceil((durationSeconds * 4) / 3) + PLAYBACK_TTL_MARGIN_SECONDS
  return Math.min(PLAYBACK_TTL_MAX_SECONDS, Math.max(PLAYBACK_TTL_MIN_SECONDS, wanted))
}

/** Valide une durée demandée par l'appelant (entier, dans les bornes). */
export function assertTtl(ttlSeconds: number): number {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > PLAYBACK_TTL_MAX_SECONDS) {
    throw new RangeError(
      `Durée de validité invalide : ${ttlSeconds} s (entier entre 60 et ${PLAYBACK_TTL_MAX_SECONDS}).`,
    )
  }
  return ttlSeconds
}
