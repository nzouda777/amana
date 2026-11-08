import { randomBytes } from 'node:crypto'

/**
 * Jetons publics (codes de certificat, invitations, paniers invités, références de
 * paiement). Jamais d'identifiant séquentiel exposé publiquement.
 */
export const PUBLIC_TOKEN_BYTES = 24 // 192 bits ≥ 128 bits exigés

/** Jeton URL-safe (base64url, 32 caractères pour 24 octets). */
export function generatePublicToken(bytes: number = PUBLIC_TOKEN_BYTES): string {
  if (!Number.isInteger(bytes) || bytes < 16) {
    throw new RangeError('Un jeton public doit contenir au moins 16 octets (128 bits).')
  }
  return randomBytes(bytes).toString('base64url')
}

// Alphabet Crockford base32 : sans I, L, O, U (lisible au téléphone, sans ambiguïté).
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/**
 * Code lisible par un humain (ex. certificat imprimé : `AMC-7K3Q-9XWD-…`).
 * 26 caractères base32 = 130 bits d'entropie.
 */
export function generateReadableCode(prefix: string, length = 26): string {
  if (length * 5 < 128) {
    throw new RangeError('Un code public doit porter au moins 128 bits d’entropie.')
  }
  const bytes = randomBytes(length)
  let code = ''
  for (const byte of bytes) code += CROCKFORD[byte & 31]
  const groups = code.match(/.{1,4}/g) ?? []
  return [prefix, ...groups].join('-')
}
