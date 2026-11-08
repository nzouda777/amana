import { describe, expect, it } from 'vitest'

import { paginationRange } from '@/components/ui/pagination-range'

import { buildTrame, CELL, RINGS } from './trame-geometry'

describe('Trame', () => {
  it('produit (cols + 1) × (rows + 1) étoiles et un viewBox au pas du réseau', () => {
    const { width, height, stars } = buildTrame(5, 4)
    expect(width).toBe(5 * CELL)
    expect(height).toBe(4 * CELL)
    expect(stars).toHaveLength(6 * 5)
  })

  it('le tracé part du coin supérieur de fin de ligne (anneau 0) et s’étend radialement', () => {
    const { stars } = buildTrame(4, 4)
    const topEnd = stars[4]
    const bottomStart = stars[stars.length - 5]
    expect(topEnd?.ring).toBe(0)
    expect(bottomStart?.ring).toBe(RINGS - 1)
    for (const star of stars) {
      expect(star.ring).toBeGreaterThanOrEqual(0)
      expect(star.ring).toBeLessThan(RINGS)
    }
  })

  it('reste sous 6 Ko pour le réseau du héros', () => {
    const { stars } = buildTrame(5, 4)
    const bytes = stars.reduce((total, star) => total + star.d.length + 60, 0)
    expect(bytes).toBeLessThan(6 * 1024)
  })

  it('n’émet ni NaN ni « -0 »', () => {
    const d = buildTrame(3, 3)
      .stars.map((star) => star.d)
      .join('')
    expect(d).not.toMatch(/NaN|-0(?!\.)/)
  })
})

describe('paginationRange', () => {
  it('liste toutes les pages quand il y en a peu', () => {
    expect(paginationRange(2, 5)).toEqual([1, 2, 3, 4, 5])
  })
  it('insère des ellipses autour de la page courante', () => {
    expect(paginationRange(6, 12)).toEqual([1, null, 5, 6, 7, null, 12])
    expect(paginationRange(1, 12)).toEqual([1, 2, null, 12])
  })
})
