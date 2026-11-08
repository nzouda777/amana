import { describe, expect, it } from 'vitest'

import {
  formatXaf,
  InvalidAmountError,
  multiplyXaf,
  percentageOfXaf,
  sumXaf,
  toNonNegativeXaf,
  toXaf,
} from '@/lib/money'

// Intl insère des espaces insécables (U+00A0 / U+202F) : on les normalise pour comparer.
const normalize = (value: string) => value.replace(/[  ]/g, ' ')

describe('montants XAF', () => {
  it('formate en fr-CM sans décimales', () => {
    expect(normalize(formatXaf(toXaf(12500)))).toBe('12 500 FCFA')
    expect(normalize(formatXaf(toXaf(1_250_000)))).toBe('1 250 000 FCFA')
    expect(normalize(formatXaf(toXaf(0)))).toBe('0 FCFA')
  })

  it('accepte une autre locale d’affichage sans changer la devise', () => {
    expect(formatXaf(toXaf(5000), 'en')).toContain('5,000')
  })

  it('refuse décimales, NaN et infinis', () => {
    expect(() => toXaf(10.5)).toThrow(InvalidAmountError)
    expect(() => toXaf(Number.NaN)).toThrow(InvalidAmountError)
    expect(() => toXaf(Number.POSITIVE_INFINITY)).toThrow(InvalidAmountError)
    expect(() => toNonNegativeXaf(-1)).toThrow(InvalidAmountError)
  })

  it('additionne et multiplie en entiers', () => {
    expect(sumXaf([toXaf(1000), toXaf(2500)])).toBe(3500)
    expect(sumXaf([])).toBe(0)
    expect(multiplyXaf(toXaf(15000), 3)).toBe(45000)
    expect(() => multiplyXaf(toXaf(100), 1.5)).toThrow(InvalidAmountError)
  })

  it('calcule un pourcentage en points de base, arrondi au franc', () => {
    expect(percentageOfXaf(toXaf(10000), 1000)).toBe(1000) // 10 %
    expect(percentageOfXaf(toXaf(9999), 1925)).toBe(1925) // 19,25 % de 9 999 = 1 924,8075
    expect(percentageOfXaf(toXaf(3), 5000)).toBe(2) // 1,5 → 2
    expect(() => percentageOfXaf(toXaf(100), 12.5)).toThrow(InvalidAmountError)
  })
})
