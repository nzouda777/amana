/**
 * Montants en francs CFA (XAF). Le XAF n'a pas de subdivision utilisée : tous les
 * montants sont des entiers (ADR 004). Ne jamais manipuler de flottants pour l'argent.
 */

declare const xafBrand: unique symbol
/** Entier de francs CFA, garanti par `toXaf`. */
export type Xaf = number & { readonly [xafBrand]: 'XAF' }

export const CURRENCY = 'XAF' as const
export type Currency = typeof CURRENCY

export class InvalidAmountError extends RangeError {
  constructor(value: unknown) {
    super(`Montant XAF invalide : ${String(value)} (entier attendu).`)
    this.name = 'InvalidAmountError'
  }
}

export function isXaf(value: unknown): value is Xaf {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

/** Valide et marque un entier comme montant XAF. Refuse décimales, NaN et infinis. */
export function toXaf(value: number): Xaf {
  if (!isXaf(value)) throw new InvalidAmountError(value)
  return value
}

/** Montant positif ou nul (prix, total). */
export function toNonNegativeXaf(value: number): Xaf {
  const amount = toXaf(value)
  if (amount < 0) throw new InvalidAmountError(value)
  return amount
}

export const ZERO_XAF: Xaf = toXaf(0)

export function sumXaf(amounts: readonly Xaf[]): Xaf {
  return toXaf(amounts.reduce<number>((total, amount) => total + amount, 0))
}

export function multiplyXaf(amount: Xaf, quantity: number): Xaf {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new InvalidAmountError(quantity)
  return toXaf(amount * quantity)
}

/**
 * Part en pourcentage d'un montant (remise, TVA), arrondie au franc le plus proche,
 * demi-unité arrondie vers le haut. `basisPoints` : 1 % = 100 (évite les flottants
 * dans les données ; 19,25 % = 1925).
 */
export function percentageOfXaf(amount: Xaf, basisPoints: number): Xaf {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) {
    throw new InvalidAmountError(basisPoints)
  }
  return toXaf(Math.round((amount * basisPoints) / 10_000))
}

const formatters = new Map<string, Intl.NumberFormat>()

/**
 * Formatage d'affichage : `Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' })`
 * → « 12 500 FCFA ». La locale d'affichage peut varier, la devise jamais.
 */
export function formatXaf(amount: Xaf, locale = 'fr-CM'): string {
  let formatter = formatters.get(locale)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: CURRENCY,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
    formatters.set(locale, formatter)
  }
  return formatter.format(amount)
}
