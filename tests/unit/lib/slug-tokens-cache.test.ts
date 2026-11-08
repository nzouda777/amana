import { describe, expect, it } from 'vitest'

import { collectionTag, contentCacheTags, documentTag, globalTag } from '@/lib/cache/tags'
import { isValidSlug, slugify } from '@/lib/slug'
import { generatePublicToken, generateReadableCode } from '@/lib/tokens'

describe('slugify', () => {
  it('retire accents, apostrophes et ponctuation', () => {
    expect(slugify('Audit de conformité charia')).toBe('audit-de-conformite-charia')
    expect(slugify('L’assurance « takaful » : bases !')).toBe('l-assurance-takaful-bases')
    expect(slugify('  Œuvre   Sukuk  2026 ')).toBe('oeuvre-sukuk-2026')
  })

  it('retourne une chaîne vide pour une écriture non latine', () => {
    expect(slugify('التمويل الإسلامي')).toBe('')
  })

  it('valide le format', () => {
    expect(isValidSlug('banque-participative')).toBe(true)
    expect(isValidSlug('Banque')).toBe(false)
    expect(isValidSlug('a--b')).toBe(false)
    expect(isValidSlug('-a')).toBe(false)
  })
})

describe('jetons publics', () => {
  it('génère au moins 128 bits, en base64url', () => {
    const token = generatePublicToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(Buffer.from(token, 'base64url').length).toBeGreaterThanOrEqual(16)
    expect(() => generatePublicToken(8)).toThrow(RangeError)
  })

  it('ne se répète pas', () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => generatePublicToken()))
    expect(tokens.size).toBe(1000)
  })

  it('produit des codes lisibles sans caractères ambigus', () => {
    const code = generateReadableCode('AMC')
    expect(code).toMatch(/^AMC(-[0-9A-HJKMNP-TV-Z]{1,4}){7}$/)
    expect(code).not.toMatch(/[ILOU]/)
    expect(() => generateReadableCode('X', 20)).toThrow(RangeError)
  })
})

describe('tags de cache', () => {
  it('suit la convention collection / document / global', () => {
    expect(collectionTag('posts')).toBe('collection:posts')
    expect(documentTag('posts', 3)).toBe('doc:posts:3')
    expect(globalTag('footer')).toBe('global:footer')
    expect(contentCacheTags('posts', 3)).toEqual(['collection:posts', 'doc:posts:3'])
    expect(contentCacheTags('posts')).toEqual(['collection:posts'])
    expect(contentCacheTags('posts', null)).toEqual(['collection:posts'])
  })
})
