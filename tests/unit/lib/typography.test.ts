import { describe, expect, it } from 'vitest'

import { NARROW_NBSP as N, NBSP as S, typographyFr, typographyFrLexical } from '@/lib/typography'
import type { LexicalNode, LexicalState } from '@/lib/typography'

describe('typographyFr — ponctuation haute', () => {
  it.each([
    ['Pourquoi ?', `Pourquoi${N}?`],
    ['Pourquoi?', `Pourquoi${N}?`],
    ['Attention !', `Attention${N}!`],
    ['un point ; un autre', `un point${N}; un autre`],
    ['Vraiment ?!', `Vraiment${N}?!`],
    ['Vraiment  ?', `Vraiment${N}?`],
    [`Déjà${S}?`, `Déjà${N}?`],
    ['Fin ? Oui.', `Fin${N}? Oui.`],
    ['(vraiment ?)', `(vraiment${N}?)`],
  ])('%j → %j', (input, expected) => {
    expect(typographyFr(input)).toBe(expected)
  })

  it('remplace une espace fine existante sans la doubler', () => {
    expect(typographyFr(`Pourquoi${N}?`)).toBe(`Pourquoi${N}?`)
  })

  it('ne touche pas la ponctuation en début de texte ou de ligne', () => {
    expect(typographyFr('? fin')).toBe('? fin')
    expect(typographyFr('ligne\n! suite')).toBe('ligne\n! suite')
  })

  it('ne touche pas les signes collés à la suite (code, paramètres)', () => {
    expect(typographyFr('a;b')).toBe('a;b')
    expect(typographyFr('recherche?q=sukuk')).toBe('recherche?q=sukuk')
    expect(typographyFr('x!=y')).toBe('x!=y')
  })

  it('ne lie pas une parenthèse ouvrante et un point d’interrogation', () => {
    expect(typographyFr('le montant (?) reste')).toBe('le montant (?) reste')
  })
})

describe('typographyFr — deux-points', () => {
  it('ajoute une espace insécable normale avant les deux-points', () => {
    expect(typographyFr('Livrables : rapport')).toBe(`Livrables${S}: rapport`)
    expect(typographyFr('Livrables: rapport')).toBe(`Livrables${S}: rapport`)
    expect(typographyFr('Note :')).toBe(`Note${S}:`)
    expect(typographyFr(`Note${N}: x`)).toBe(`Note${S}: x`)
  })

  it('laisse intacts heures, rapports et schémas', () => {
    expect(typographyFr('Rendez-vous à 14:30 à Douala')).toBe('Rendez-vous à 14:30 à Douala')
    expect(typographyFr('un ratio 3:2')).toBe('un ratio 3:2')
    expect(typographyFr('a::b')).toBe('a::b')
  })
})

describe('typographyFr — guillemets et apostrophes', () => {
  it('convertit les guillemets droits en guillemets français', () => {
    expect(typographyFr('le "gharar" excessif')).toBe(`le «${N}gharar${N}» excessif`)
    expect(typographyFr('" mot "')).toBe(`«${N}mot${N}»`)
    expect(typographyFr('("citation")')).toBe(`(«${N}citation${N}»)`)
  })

  it('convertit les guillemets anglais', () => {
    expect(typographyFr('le “takaful” mutualiste')).toBe(`le «${N}takaful${N}» mutualiste`)
  })

  it('normalise les espaces dans des guillemets français existants', () => {
    expect(typographyFr('«mot»')).toBe(`«${N}mot${N}»`)
    expect(typographyFr('« mot »')).toBe(`«${N}mot${N}»`)
    expect(typographyFr(`«${S}mot${S}»`)).toBe(`«${N}mot${N}»`)
  })

  it('ponctuation après guillemet fermant', () => {
    expect(typographyFr('Il a dit "non" !')).toBe(`Il a dit «${N}non${N}»${N}!`)
  })

  it('remplace l’apostrophe droite entre deux lettres', () => {
    expect(typographyFr("l'audit d'une banque aujourd'hui")).toBe(
      'l’audit d’une banque aujourd’hui',
    )
    expect(typographyFr("l'«ijara»")).toBe(`l’«${N}ijara${N}»`)
  })

  it('laisse les apostrophes isolées', () => {
    expect(typographyFr("'citation'")).toBe("'citation'")
  })
})

describe('typographyFr — éléments protégés', () => {
  it('ne casse pas les URL', () => {
    const url = 'https://amana.example/recherche?q=sukuk&l=fr'
    expect(typographyFr(`Voir ${url} !`)).toBe(`Voir ${url}${N}!`)
    expect(typographyFr('www.example.cm/a?b=c')).toBe('www.example.cm/a?b=c')
    expect(typographyFr("http://example.com/l'audit")).toBe("http://example.com/l'audit")
  })

  it('ne casse pas les e-mails', () => {
    expect(typographyFr('Écrire à contact@amana.example : merci')).toBe(
      `Écrire à contact@amana.example${S}: merci`,
    )
    expect(typographyFr("o'neil@example.com")).toBe("o'neil@example.com")
  })

  it('ne modifie ni les balises ni les entités HTML', () => {
    expect(typographyFr('<a href="https://x.fr/?a=1" title="Note: x">Lien</a>')).toBe(
      '<a href="https://x.fr/?a=1" title="Note: x">Lien</a>',
    )
    expect(typographyFr('A&nbsp;B &amp; C')).toBe('A&nbsp;B &amp; C')
    expect(typographyFr('<p class="x">Bonjour</p>')).toBe('<p class="x">Bonjour</p>')
  })

  it('traite le texte entre les balises, à travers les balises', () => {
    expect(typographyFr('<p><strong>Attention</strong> !</p>')).toBe(
      `<p><strong>Attention</strong>${N}!</p>`,
    )
    expect(typographyFr('<p>"Bonjour"</p>')).toBe(`<p>«${N}Bonjour${N}»</p>`)
    expect(typographyFr('<p>!</p>')).toBe('<p>!</p>')
  })

  it('les balises de bloc font frontière', () => {
    expect(typographyFr('<p>Bonjour</p><p>! suite</p>')).toBe('<p>Bonjour</p><p>! suite</p>')
    expect(typographyFr('<p>Note :<br>texte</p>')).toBe(`<p>Note${S}:<br>texte</p>`)
    expect(typographyFr('<li>Un</li><li>"deux"</li>')).toBe(`<li>Un</li><li>«${N}deux${N}»</li>`)
  })

  it('laisse intact le contenu des blocs de code', () => {
    const html = '<p>Exemple :</p><code>a ? b : c; "x"</code>'
    expect(typographyFr(html)).toBe(`<p>Exemple${S}:</p><code>a ? b : c; "x"</code>`)
  })
})

describe('typographyFr — propriétés', () => {
  const samples = [
    'Qu\'est-ce que le "riba" ? Une question : simple ; essentielle !',
    '<p>Voir https://x.fr?a=b ; écrire à a@b.fr !</p>',
    '« déjà » ? oui : 14:30',
    '',
  ]

  it.each(samples)('est idempotente sur %j', (sample) => {
    const once = typographyFr(sample)
    expect(typographyFr(once)).toBe(once)
  })

  it('renvoie la chaîne vide telle quelle', () => {
    expect(typographyFr('')).toBe('')
  })
})

const text = (value: string, format = 0): LexicalNode => ({
  type: 'text',
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})
const element = (type: string, children: LexicalNode[], extra: Record<string, unknown> = {}) =>
  ({ type, children, version: 1, ...extra }) as LexicalNode
const state = (...children: LexicalNode[]): LexicalState => ({
  root: { type: 'root', version: 1, children } as LexicalState['root'],
})
const texts = (node: LexicalNode): string[] =>
  node.type === 'text' ? [node.text ?? ''] : (node.children ?? []).flatMap(texts)

describe('typographyFrLexical', () => {
  it('traite chaque nœud de texte et renvoie une copie', () => {
    const input = state(element('paragraph', [text("L'ijara : une location ?")]))
    const output = typographyFrLexical(input)
    expect(texts(output.root)).toEqual([`L’ijara${S}: une location${N}?`])
    expect(texts(input.root)).toEqual(["L'ijara : une location ?"])
  })

  it('utilise le contexte des nœuds voisins (mise en forme différente)', () => {
    const output = typographyFrLexical(
      state(element('paragraph', [text('Attention', 1), text(' !')])),
    )
    expect(texts(output.root)).toEqual(['Attention', `${N}!`])

    const glued = typographyFrLexical(
      state(element('paragraph', [text('Attention', 1), text('!')])),
    )
    expect(texts(glued.root).join('')).toBe(`Attention${N}!`)
  })

  it('traite le texte visible des liens mais pas leur URL', () => {
    const link = element('link', [text('le "sukuk"')], {
      fields: { linkType: 'custom', url: 'https://x.fr/?a=1 ; b', newTab: false },
    })
    const output = typographyFrLexical(
      state(element('paragraph', [text('Voir '), link, text(' !')])),
    )
    const paragraph = output.root.children[0]
    const outLink = paragraph?.children?.[1]
    expect(texts(output.root)).toEqual(['Voir ', `le «${N}sukuk${N}»`, `${N}!`])
    expect((outLink?.fields as { url: string }).url).toBe('https://x.fr/?a=1 ; b')
  })

  it('ne touche ni au code en ligne ni aux blocs de code', () => {
    const output = typographyFrLexical(
      state(
        element('paragraph', [text('Formule '), text('a ? b : c', 16), text(' ici !')]),
        element('code', [text('x ? y : "z"')]),
      ),
    )
    expect(texts(output.root.children[0] as LexicalNode)).toEqual([
      'Formule ',
      'a ? b : c',
      ` ici${N}!`,
    ])
    expect(texts(output.root.children[1] as LexicalNode)).toEqual(['x ? y : "z"'])
  })

  it('traite titres, listes imbriquées et citations', () => {
    const output = typographyFrLexical(
      state(
        element('heading', [text('Pourquoi ?')], { tag: 'h2' }),
        element('list', [
          element('listitem', [
            text('Premier : oui'),
            element('list', [element('listitem', [text('Imbriqué !')])]),
          ]),
        ]),
        element('quote', [text("C'est clair ;")]),
      ),
    )
    expect(texts(output.root)).toEqual([
      `Pourquoi${N}?`,
      `Premier${S}: oui`,
      `Imbriqué${N}!`,
      `C’est clair${N};`,
    ])
  })

  it('un saut de ligne fait frontière', () => {
    const output = typographyFrLexical(
      state(
        element('paragraph', [text('Ligne'), { type: 'linebreak', version: 1 }, text('? suite')]),
      ),
    )
    expect(texts(output.root)).toEqual(['Ligne', '? suite'])
  })

  it('protège les URL écrites dans le texte', () => {
    const output = typographyFrLexical(
      state(element('paragraph', [text('Lien : https://x.fr/?q=a ;')])),
    )
    expect(texts(output.root)).toEqual([`Lien${S}: https://x.fr/?q=a${N};`])
  })

  it('renvoie telle quelle une valeur qui n’est pas un état Lexical', () => {
    expect(typographyFrLexical(null)).toBeNull()
    expect(typographyFrLexical('texte')).toBe('texte')
    const notState = { foo: 1 }
    expect(typographyFrLexical(notState)).toBe(notState)
  })

  it('est idempotente', () => {
    const input = state(element('paragraph', [text('Le "riba" ? '), text('Non !', 1)]))
    const once = typographyFrLexical(input)
    expect(typographyFrLexical(once)).toEqual(once)
  })
})
