import { createHmac } from 'node:crypto'

import { VideoProviderError } from '../contracts'

/**
 * Signature d'URL Bunny CDN, authentification par jeton « avancée » (HMAC-SHA256),
 * d'après la documentation et l'implémentation de référence Node.js de Bunny
 * (vérifiées le 2026-11-07) :
 * https://bunny.net/docs/cdn/security/token-authentication/advanced
 * https://github.com/BunnyWay/BunnyCDN.TokenAuthentication
 *
 *   message = signature_path + expires + user_ip + signing_data
 *   token   = "HS256-" + base64url(HMAC-SHA256(clé, message))   (sans remplissage "=")
 *
 * - `signature_path` : `token_path` s'il est fourni (jeton de répertoire), sinon le chemin.
 * - `signing_data` : paramètres triés par nom, `clé=valeur` bruts joints par `&`, hors
 *   `token` et `expires` ; `token_path` et `token_ignore_params` en font partie.
 * - Jeton dans le chemin (`/bcdn_token=…/chemin`) : obligatoire en HLS, les segments
 *   relatifs héritent du jeton sans rien changer au lecteur.
 * - Pas de verrouillage par IP : sur les réseaux mobiles (CGNAT, bascule 3G/4G/Wi-Fi),
 *   l'adresse change en cours de lecture (ADR 017).
 */

export type BunnySignOptions = {
  /** URL absolue sans paramètres de requête. */
  url: string
  /** « URL Token Authentication Key » de la Pull Zone de la bibliothèque. */
  securityKey: string
  /** Échéance, horodatage UNIX en secondes. */
  expires: number
  /** Répertoire couvert par le jeton (commence et finit par `/`). */
  tokenPath?: string
  /** Paramètres ajoutés par le lecteur ignorés à la vérification (recommandé par Bunny). */
  ignoreParams?: boolean
  /** Jeton dans le chemin (HLS) plutôt qu'en paramètre de requête. */
  pathBased?: boolean
}

export function signBunnyUrl(options: BunnySignOptions): string {
  if (options.securityKey === '')
    throw new VideoProviderError('not-configured', 'Clé de signature Bunny absente.')
  if (!Number.isInteger(options.expires) || options.expires <= 0)
    throw new VideoProviderError('invalid-payload', 'Échéance de signature invalide.')

  const parsed = new URL(options.url)
  if (parsed.search !== '' || parsed.hash !== '')
    throw new VideoProviderError('invalid-payload', 'URL à signer sans paramètres attendue.')
  if (
    options.tokenPath !== undefined &&
    (!options.tokenPath.startsWith('/') ||
      !options.tokenPath.endsWith('/') ||
      !parsed.pathname.startsWith(options.tokenPath))
  ) {
    throw new VideoProviderError('invalid-payload', 'token_path doit contenir le chemin signé.')
  }

  const parameters: Record<string, string> = {}
  if (options.ignoreParams) parameters.token_ignore_params = 'true'
  if (options.tokenPath !== undefined) parameters.token_path = options.tokenPath
  const keys = Object.keys(parameters).sort()
  const value = (key: string) => parameters[key] ?? ''
  const signingData = keys.map((key) => `${key}=${value(key)}`).join('&')
  const urlData = keys.map((key) => `${key}=${encodeURIComponent(value(key))}`).join('&')

  const signaturePath = options.tokenPath ?? parsed.pathname
  const expires = String(options.expires)
  const digest = createHmac('sha256', options.securityKey)
    .update(signaturePath)
    .update(expires)
    .update(signingData)
    .digest('base64url')
  const token = `HS256-${digest}`
  const tail = urlData === '' ? '' : `&${urlData}`

  return options.pathBased
    ? `${parsed.origin}/bcdn_token=${token}${tail}&expires=${expires}${parsed.pathname}`
    : `${parsed.origin}${parsed.pathname}?token=${token}${tail}&expires=${expires}`
}
