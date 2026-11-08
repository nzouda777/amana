import { describe, expect, it } from 'vitest'

import {
  foldForMatch,
  linkGlossaryTerms,
  type GlossaryLinkTerm,
} from '@/features/content/glossary-link'
import type { LexicalNode, LexicalState } from '@/lib/typography'

const text = (value: string, format = 0): LexicalNode => ({
  type: 'text',
  text: value,
  format,
  version: 1,
})
const element = (type: string, children: LexicalNode[], extra: Record<string, unknown> = {}) =>
  ({ type, children, version: 1, ...extra }) as LexicalNode
const paragraph = (...children: LexicalNode[]) => element('paragraph', children)
const state = (...children: LexicalNode[]): LexicalState => ({
  root: { type: 'root', version: 1, children } as LexicalState['root'],
})

const terms: GlossaryLinkTerm[] = [
  { id: 1, slug: 'riba', term: 'riba' },
  { id: 2, slug: 'gharar', term: 'gharar' },
  { id: 3, slug: 'charia', term: 'charia', variants: ['chariah', 'sharia'] },
  {
    id: 4,
    slug: 'fenetre-islamique',
    term: 'fenêtre islamique',
    variants: ['fenêtres islamiques'],
  },
  { id: 5, slug: 'finance-islamique', term: 'finance islamique' },
  { id: 6, slug: 'finance', term: 'finance' },
  { id: 7, slug: 'mourabaha', term: 'mourabaha', variants: ['mourabahas', 'murabaha'] },
]

const options = { href: (term: GlossaryLinkTerm) => `/ressources/glossaire/${term.slug}` }

type Link = { slug: string; text: string; url: string }

function links(node: LexicalNode): Link[] {
  if (node.type === 'link') {
    const fields = node.fields as { glossaryTerm?: string; url: string }
    return [
      {
        slug: fields.glossaryTerm ?? '',
        url: fields.url,
        text: (node.children ?? []).map((child) => child.text ?? '').join(''),
      },
    ]
  }
  return (node.children ?? []).flatMap(links)
}

function plain(node: LexicalNode): string {
  return node.type === 'text' ? (node.text ?? '') : (node.children ?? []).map(plain).join('')
}

describe('foldForMatch', () => {
  it('replie casse, accents et apostrophes sans changer la longueur', () => {
    expect(foldForMatch('Fenêtre ISLAMIQUE')).toBe('fenetre islamique')
    expect(foldForMatch('l’ijara')).toBe("l'ijara")
    expect(foldForMatch('Œuvre').length).toBe('Œuvre'.length)
  })
})

describe('linkGlossaryTerms', () => {
  it('lie la première occurrence uniquement, sans modifier l’entrée', () => {
    const input = state(paragraph(text('Le riba est interdit. Le riba est aussi…')))
    const output = linkGlossaryTerms(input, terms, options)
    expect(links(output.root)).toEqual([
      { slug: 'riba', text: 'riba', url: '/ressources/glossaire/riba' },
    ])
    expect(plain(output.root)).toBe(plain(input.root))
    expect(links(input.root)).toEqual([])
  })

  it('est insensible à la casse et aux accents, et garde le texte d’origine', () => {
    const output = linkGlossaryTerms(
      state(paragraph(text('La Fenetre Islamique et la CHARIA.'))),
      terms,
      options,
    )
    expect(links(output.root).map((l) => [l.slug, l.text])).toEqual([
      ['fenetre-islamique', 'Fenetre Islamique'],
      ['charia', 'CHARIA'],
    ])
  })

  it('ne lie que des mots entiers', () => {
    const output = linkGlossaryTerms(
      state(paragraph(text('Le ribat et les ghararistes ne sont pas concernés.'))),
      terms,
      options,
    )
    expect(links(output.root)).toEqual([])
  })

  it('préfère la variante la plus longue à position égale', () => {
    const output = linkGlossaryTerms(
      state(paragraph(text('La finance islamique, puis la finance.'))),
      terms,
      options,
    )
    expect(links(output.root).map((l) => [l.slug, l.text])).toEqual([
      ['finance-islamique', 'finance islamique'],
      ['finance', 'finance'],
    ])
  })

  it('reconnaît les variantes et ne lie qu’une fois par terme toutes variantes confondues', () => {
    const output = linkGlossaryTerms(
      state(paragraph(text('Deux mourabahas, puis une murabaha, puis la mourabaha.'))),
      terms,
      options,
    )
    expect(links(output.root).map((l) => l.text)).toEqual(['mourabahas'])
  })

  it('cherche dans tout le document, au-delà du premier paragraphe', () => {
    const output = linkGlossaryTerms(
      state(paragraph(text('Introduction.')), paragraph(text('Le gharar excessif.'))),
      terms,
      options,
    )
    expect(links(output.root).map((l) => l.slug)).toEqual(['gharar'])
  })

  it('ignore les titres et les liens existants', () => {
    const output = linkGlossaryTerms(
      state(
        element('heading', [text('Le riba')], { tag: 'h2' }),
        paragraph(
          element('link', [text('gharar')], { fields: { linkType: 'custom', url: '/x' } }),
          text(' puis riba et gharar.'),
        ),
      ),
      terms,
      options,
    )
    const found = links(output.root)
    expect(found.filter((l) => l.slug !== '').map((l) => [l.slug, l.text])).toEqual([
      ['riba', 'riba'],
      ['gharar', 'gharar'],
    ])
    expect(found.find((l) => l.url === '/x')?.text).toBe('gharar')
  })

  it('ignore le code en ligne et les blocs de code', () => {
    const output = linkGlossaryTerms(
      state(paragraph(text('riba', 16)), element('code', [text('gharar')])),
      terms,
      options,
    )
    expect(links(output.root)).toEqual([])
  })

  it('conserve la mise en forme du nœud découpé', () => {
    const output = linkGlossaryTerms(state(paragraph(text('Avant riba après', 1))), terms, options)
    const children = output.root.children[0]?.children ?? []
    expect(children.map((child) => child.type)).toEqual(['text', 'link', 'text'])
    expect(children.map(plain)).toEqual(['Avant ', 'riba', ' après'])
    expect(children[0]?.format).toBe(1)
    expect(children[1]?.children?.[0]?.format).toBe(1)
  })

  it('lie plusieurs termes différents dans un même nœud', () => {
    const output = linkGlossaryTerms(
      state(paragraph(text('Riba, gharar et charia.'))),
      terms,
      options,
    )
    expect(links(output.root).map((l) => l.slug)).toEqual(['riba', 'gharar', 'charia'])
  })

  it('respecte exclude et maxLinks', () => {
    const doc = state(paragraph(text('Riba, gharar et charia.')))
    expect(
      links(linkGlossaryTerms(doc, terms, { ...options, exclude: [1] }).root).map((l) => l.slug),
    ).toEqual(['gharar', 'charia'])
    expect(links(linkGlossaryTerms(doc, terms, { ...options, maxLinks: 1 }).root)).toHaveLength(1)
  })

  it('gère les apostrophes typographiques', () => {
    const output = linkGlossaryTerms(
      state(paragraph(text('L’ijara et l’ijara.'))),
      [{ id: 9, slug: 'ijara', term: 'ijara' }],
      options,
    )
    expect(links(output.root).map((l) => l.text)).toEqual(['ijara'])
  })

  it('produit un nœud link Payload standard', () => {
    const output = linkGlossaryTerms(state(paragraph(text('riba'))), terms, options)
    const link = output.root.children[0]?.children?.[0]
    expect(link).toMatchObject({
      type: 'link',
      version: 3,
      fields: {
        linkType: 'custom',
        url: '/ressources/glossaire/riba',
        newTab: false,
        glossaryTerm: 'riba',
      },
    })
  })

  it('renvoie l’entrée telle quelle si ce n’est pas un état Lexical ou sans termes', () => {
    expect(linkGlossaryTerms(null, terms, options)).toBeNull()
    const doc = state(paragraph(text('riba')))
    expect(linkGlossaryTerms(doc, [], options)).toBe(doc)
  })
})
