/**
 * Vérification Cloudflare Turnstile côté serveur (Siteverify).
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Clés de test officielles « toujours valide » (développement et tests uniquement).
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 * La clé secrète de test n'accepte que le jeton factice `XXXX.DUMMY.TOKEN.XXXX`, que le
 * widget de test renvoie.
 */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA'
export const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA'

export type TurnstileVerifier = (token: string, remoteIp?: string) => Promise<boolean>

type FetchLike = (
  url: string,
  init: { method: 'POST'; body: URLSearchParams; signal?: AbortSignal },
) => Promise<{ ok: boolean; json(): Promise<unknown> }>

export function createTurnstileVerifier(
  secret: string,
  fetchImpl: FetchLike = fetch,
  timeoutMs = 8000,
): TurnstileVerifier {
  return async (token, remoteIp) => {
    if (!token || token.length > 4096) return false
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp) body.set('remoteip', remoteIp)
    try {
      const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!response.ok) return false
      const result = (await response.json()) as { success?: unknown }
      return result.success === true
    } catch {
      // Réseau indisponible : on refuse (fail closed) plutôt que d'accepter un robot.
      return false
    }
  }
}
