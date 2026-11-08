import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Jeton signé à durée courte (HMAC-SHA256), sans stockage : lien de téléchargement d'un
 * guide après consentement. Format `base64url(json).base64url(signature)`.
 */

export type SignedPayload = { sub: string; exp: number }

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

export function createSignedToken(
  subject: string,
  ttlSeconds: number,
  secret: string,
  now: number = Date.now(),
): string {
  const payload: SignedPayload = { sub: subject, exp: Math.floor(now / 1000) + ttlSeconds }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${data}.${sign(data, secret)}`
}

/** Sujet du jeton s'il est intact et non expiré, sinon `null`. */
export function verifySignedToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): string | null {
  const [data, signature, extra] = token.split('.')
  if (!data || !signature || extra !== undefined) return null
  const expected = Buffer.from(sign(data, secret))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as unknown
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof (payload as SignedPayload).sub !== 'string' ||
      typeof (payload as SignedPayload).exp !== 'number'
    )
      return null
    const { sub, exp } = payload as SignedPayload
    return exp * 1000 > now ? sub : null
  } catch {
    return null
  }
}

/** Compare deux signatures hexadécimales en temps constant. */
export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a.trim().toLowerCase(), 'utf8')
  const right = Buffer.from(b.trim().toLowerCase(), 'utf8')
  return left.length === right.length && timingSafeEqual(left, right)
}

export function hmacHex(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}
