import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { contrastRatio, formatRatio } from '@/styles/contrast'
import { forbiddenPairs, minimumRatio, pairs } from '@/styles/pairs'
import { palette, type ColorToken } from '@/styles/palette'

const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

/** Lit les déclarations `--color-<nom>: #hex;` de tokens.css (source de vérité). */
function readCssColors(css: string): Map<string, string> {
  const colors = new Map<string, string>()
  for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    const [, name, hex] = match
    if (name && hex) colors.set(name, hex.toLowerCase())
  }
  return colors
}

const cssColors = readCssColors(tokensCss)

describe('tokens de couleur', () => {
  it('tokens.css déclare les couleurs de marque de la charte, inchangées', () => {
    expect(cssColors.get('green-700')).toBe('#1b5e20')
    expect(cssColors.get('gold-500')).toBe('#d4af37')
    expect(cssColors.get('sand-300')).toBe('#f1e0c5')
    expect(cssColors.get('ink')).toBe('#1c1c1c')
  })

  it('palette.ts reflète exactement tokens.css', () => {
    expect(Object.fromEntries(cssColors)).toEqual(palette)
  })
})

describe('paires de contraste déclarées (src/styles/pairs.ts)', () => {
  it.each(pairs.map((pair) => [`${pair.fg} sur ${pair.bg} (${pair.use})`, pair] as const))(
    '%s',
    (_label, pair) => {
      const ratio = contrastRatio(palette[pair.fg], palette[pair.bg])
      const min = minimumRatio[pair.use]
      expect(
        ratio,
        `${pair.fg} sur ${pair.bg} : ${formatRatio(ratio)}:1 < ${min}:1 (${pair.usage})`,
      ).toBeGreaterThanOrEqual(min)
    },
  )

  it('aucune paire n’est déclarée deux fois pour le même usage', () => {
    const keys = pairs.map((pair) => `${pair.fg}/${pair.bg}/${pair.use}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('combinaisons interdites (DESIGN §2)', () => {
  it.each(forbiddenPairs.map((pair) => [`${pair.fg} sur ${pair.bg}`, pair] as const))(
    '%s reste sous 3:1',
    (_label, pair) => {
      expect(contrastRatio(palette[pair.fg], palette[pair.bg])).toBeLessThan(3)
    },
  )

  /*
   * La charte cite des ratios arrondis (2,4 / 3,3 / 7 / 7,9) ; les valeurs exactes sont
   * 2,10 / 3,74 / 8,10 / 7,87. On vérifie les règles qu'ils fondent, pas les arrondis.
   */
  const ratio = (fg: ColorToken, bg: ColorToken) => contrastRatio(palette[fg], palette[bg])

  it('or charte sur vert : titres ≥ 24 px seulement (entre 3:1 et 4,5:1)', () => {
    expect(ratio('gold-500', 'green-700')).toBeGreaterThanOrEqual(3)
    expect(ratio('gold-500', 'green-700')).toBeLessThan(4.5)
  })

  it('bouton or à texte noir : AAA (≥ 7:1)', () => {
    expect(ratio('ink', 'gold-500')).toBeGreaterThanOrEqual(7)
  })

  it('blanc sur vert Amana : AAA (≥ 7:1)', () => {
    expect(ratio('paper', 'green-700')).toBeGreaterThanOrEqual(7)
  })

  it('gold-700 est lisible en texte sur blanc (≈ 5:1)', () => {
    expect(ratio('gold-700', 'paper')).toBeGreaterThanOrEqual(4.5)
  })
})
