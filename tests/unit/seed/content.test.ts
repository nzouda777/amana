import { describe, expect, it } from 'vitest'

import {
  findDuplicateFigureKeys,
  findUnknownFigureKeys,
  KEY_FIGURE_KEY_PATTERN,
} from '@/features/content/key-figures'
import { keyFiguresSeed } from '@/seed/globals'
import { glossarySeed } from '@/seed/glossary'
import { placeholderPdf } from '@/seed/lib/placeholder-pdf'
import { callout, inline, rt } from '@/seed/lib/richtext'
import { postsSeed } from '@/seed/posts'
import { guidesSeed } from '@/seed/resources'
import { servicePath, servicesSeed } from '@/seed/services'

/** Garde-fous éditoriaux et SEO du jeu de démonstration (aucune base requise). */

const seoEntries = [
  ...servicesSeed.map((s) => [`service ${s.slug}`, s.seo] as const),
  ...postsSeed.map((p) => [`article ${p.slug}`, p.seo] as const),
  ...guidesSeed.map((g) => [`guide ${g.slug}`, g.seo] as const),
]

/** Translittérations anglaises à ne pas employer dans les textes français. */
const FORBIDDEN_SPELLINGS = /\b(murabaha|musharaka|mudaraba|sharia|shariah|ijarah)\b/i

function plainText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(plainText).join(' ')
  if (typeof value === 'object' && value !== null) {
    const node = value as {
      text?: unknown
      children?: unknown
      root?: unknown
      fields?: { title?: unknown; content?: unknown }
    }
    // `fields` : blocs Lexical (encadrés `callout`), titre et contenu compris.
    return [node.text, node.children, node.root, node.fields?.title, node.fields?.content]
      .map(plainText)
      .join(' ')
  }
  return ''
}

describe('seed — SEO', () => {
  it.each(seoEntries)('%s : titre ≤ 60, description ≤ 155', (_name, seo) => {
    expect(seo.title.length).toBeLessThanOrEqual(60)
    expect(seo.description.length).toBeLessThanOrEqual(155)
    expect(seo.description.length).toBeGreaterThan(50)
  })
})

describe('seed — services', () => {
  it('couvre les trois pôles et toutes les offres de SPEC §2', () => {
    const slugs = servicesSeed.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(servicesSeed.filter((s) => s.pillar === 'audit').length).toBeGreaterThanOrEqual(3)
    expect(slugs).toEqual(
      expect.arrayContaining([
        'structuration-produits',
        'fenetre-islamique',
        'politiques-procedures',
        'creation-activite',
        'comite-conformite',
        'suivi-conformite',
      ]),
    )
    expect(servicesSeed.some((s) => s.pillar === 'takaful')).toBe(true)
  })

  it.each(servicesSeed)('$slug : problème, offre, méthode, livrables, FAQ, CTA', (service) => {
    expect(service.problem.length).toBeGreaterThan(0)
    expect(service.offer.length).toBeGreaterThan(0)
    expect(service.method.length).toBeGreaterThanOrEqual(3)
    expect(service.deliverables.length).toBeGreaterThanOrEqual(2)
    expect(service.faq.length).toBeGreaterThanOrEqual(1)
    expect(service.cta.label).not.toMatch(/→|en savoir plus/i)
  })

  it('construit les routes françaises par pôle', () => {
    expect(servicePath({ pillar: 'audit', slug: 'x' })).toBe('/audit-conformite/x')
    expect(servicePath({ pillar: 'conseil', slug: 'x' })).toBe('/conseil-accompagnement/x')
    expect(servicePath({ pillar: 'takaful', slug: 'x' })).toBe('/takaful-finance/x')
  })
})

describe('seed — glossaire', () => {
  it('contient 40 termes aux slugs uniques', () => {
    expect(glossarySeed).toHaveLength(40)
    expect(new Set(glossarySeed.map((t) => t.slug)).size).toBe(40)
  })

  it('ne référence que des termes existants', () => {
    const slugs = new Set(glossarySeed.map((t) => t.slug))
    for (const term of glossarySeed)
      for (const related of term.related ?? [])
        expect(slugs, `${term.slug} → ${related}`).toContain(related)
  })

  it('respecte la longueur maximale de la définition courte', () => {
    for (const term of glossarySeed) expect(term.short.length, term.slug).toBeLessThanOrEqual(240)
  })

  it('contient les termes clés avec la translittération française', () => {
    const terms = glossarySeed.map((t) => t.term.toLowerCase())
    for (const expected of [
      'mourabaha',
      'ijara',
      'moucharaka',
      'moudaraba',
      'sukuk',
      'takaful',
      'riba',
      'gharar',
      'charia',
    ])
      expect(terms).toContain(expected)
  })
})

describe('seed — cohérence éditoriale', () => {
  it('six articles aux articles liés existants', () => {
    expect(postsSeed).toHaveLength(6)
    const slugs = new Set(postsSeed.map((p) => p.slug))
    for (const post of postsSeed)
      for (const related of post.related) expect(slugs).toContain(related)
  })

  it('deux guides', () => {
    expect(guidesSeed).toHaveLength(2)
  })

  it('emploie la translittération française dans les textes', () => {
    const texts = [
      ...postsSeed.map((p) => [p.slug, plainText([p.title, p.excerpt, p.content])] as const),
      ...servicesSeed.map(
        (s) => [s.slug, plainText([s.title, s.summary, s.problem, s.offer, s.faq])] as const,
      ),
    ]
    for (const [slug, text] of texts) expect(text, slug).not.toMatch(FORBIDDEN_SPELLINGS)
  })
})

describe('seed — chiffres clés et encadrés', () => {
  it('clés uniques, au bon format', () => {
    expect(findDuplicateFigureKeys(keyFiguresSeed)).toEqual([])
    for (const { key } of keyFiguresSeed) expect(key).toMatch(KEY_FIGURE_KEY_PATTERN)
  })

  it('la phrase de l’accueil ne cite que des clés existantes', () => {
    const sentence =
      'Depuis sa création, le cabinet a formé plus de {{professionnels-formes}} professionnels, mené {{missions}} missions d’audit et de conseil, et intervient dans {{pays}} pays de la zone CEMAC.'
    expect(findUnknownFigureKeys(sentence, keyFiguresSeed)).toEqual([])
  })

  it('les encadrés sont des blocs Lexical `callout` à identifiant stable', () => {
    const block = callout('retenir', 'Texte', 'À retenir')
    expect(block).toMatchObject({
      type: 'block',
      version: 2,
      fields: { blockType: 'callout', variant: 'retenir', title: 'À retenir' },
    })
    const id = (block.fields as { id: string }).id
    expect(id).toMatch(/^[0-9a-f]{24}$/)
    expect((callout('retenir', 'Texte', 'À retenir').fields as { id: string }).id).toBe(id)
    expect(plainText(postsSeed.map((post) => post.content))).toContain('Point de vigilance')
  })
})

describe('seed — outils', () => {
  it('analyse la syntaxe en ligne', () => {
    expect(inline('a **b** _c_ [d](/e)').map((n) => n.type)).toEqual([
      'text',
      'text',
      'text',
      'text',
      'text',
      'link',
    ])
    expect(rt('x').root.children[0]?.type).toBe('paragraph')
  })

  it('génère un PDF valide minimal', () => {
    const pdf = placeholderPdf(['Ligne (1)'])
    const text = pdf.toString('latin1')
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
    const xref = Number(/startxref\n(\d+)/.exec(text)?.[1])
    expect(text.slice(xref, xref + 4)).toBe('xref')
    expect(text).toContain('(Ligne \\(1\\)) Tj')
  })
})
