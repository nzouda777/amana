/**
 * Limitation de débit des formulaires publics. Contrat + implémentation en mémoire
 * (un processus Node). En M6, une implémentation partagée (Postgres ou Redis) remplacera
 * celle-ci derrière la même interface, pour plusieurs instances.
 */

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export interface RateLimiter {
  /** Consomme une unité pour `key` ; refuse au-delà de la limite dans la fenêtre. */
  consume(key: string): Promise<RateLimitResult>
}

export type RateLimitOptions = {
  /** Nombre maximal de requêtes par fenêtre. */
  limit: number
  /** Durée de la fenêtre glissante, en millisecondes. */
  windowMs: number
  /** Horloge injectable (tests). */
  now?: () => number
  /** Nombre maximal de clés suivies avant purge des plus anciennes. */
  maxKeys?: number
}

/** Fenêtre glissante : horodatages des requêtes récentes par clé. */
export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>()
  private readonly now: () => number
  private readonly maxKeys: number

  constructor(private readonly options: RateLimitOptions) {
    this.now = options.now ?? Date.now
    this.maxKeys = options.maxKeys ?? 10_000
  }

  async consume(key: string): Promise<RateLimitResult> {
    const now = this.now()
    const windowStart = now - this.options.windowMs
    const recent = (this.hits.get(key) ?? []).filter((time) => time > windowStart)

    if (recent.length >= this.options.limit) {
      const oldest = recent[0] ?? now
      this.hits.set(key, recent)
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((oldest + this.options.windowMs - now) / 1000)),
      }
    }

    recent.push(now)
    this.hits.delete(key)
    this.hits.set(key, recent)
    this.evict()
    return { allowed: true }
  }

  private evict(): void {
    while (this.hits.size > this.maxKeys) {
      const first = this.hits.keys().next()
      if (first.done) return
      this.hits.delete(first.value)
    }
  }
}
