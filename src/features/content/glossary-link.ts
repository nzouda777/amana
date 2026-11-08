/**
 * Liaison automatique du glossaire (SPEC §4.4) : dans un état Lexical, la première
 * occurrence de chaque terme devient un lien vers sa fiche. Logique pure.
 *
 * Règles :
 * - recherche insensible à la casse et aux accents (`Gharar` = `gharar`, `Charia` = `charia`,
 *   `fenetre islamique` = `fenêtre islamique`), apostrophes droites et courbes équivalentes ;
 * - mots entiers uniquement (`riba` ne correspond pas dans `ribat`) ;
 * - une seule fois par terme et par document, toutes variantes confondues ;
 * - à position égale, la variante la plus longue l'emporte (`finance islamique` avant `finance`) ;
 * - ignorés : titres, liens existants, code, termes exclus (fiche du terme elle-même) ;
 * - une occurrence répartie sur deux nœuds de texte (mise en forme différente) n'est pas liée.
 *
 * Le lien produit est un nœud `link` Payload standard (`linkType: 'custom'`), rendu par
 * les convertisseurs par défaut, avec un marqueur `fields.glossaryTerm` (slug) qui permet
 * au rendu d'ajouter une infobulle.
 */
import {
  cloneState,
  hasCodeFormat,
  isLexicalState,
  isTextNode,
  type LexicalNode,
} from '@/lib/typography/lexical-tree'

export type GlossaryLinkTerm = {
  id: number | string
  slug: string
  /** Libellé principal (ex. « mourabaha »). */
  term: string
  /** Variantes reconnues (pluriels, graphies, translittérations). */
  variants?: readonly string[]
}

export type GlossaryLinkOptions = {
  /** URL de la fiche d'un terme (dépend de la locale, fournie par l'appelant). */
  href: (term: GlossaryLinkTerm) => string
  /** Identifiants à ne pas lier (ex. la fiche du terme en cours d'affichage). */
  exclude?: ReadonlyArray<number | string>
  /** Nombre maximal de liens ajoutés au document. */
  maxLinks?: number
}

/** Nœuds dont le contenu n'est jamais lié. */
const SKIPPED_NODES: ReadonlySet<string> = new Set(['heading', 'link', 'autolink', 'code'])

const WORD_CHAR = /[\p{L}\p{N}]/u
const COMBINING_MARKS = /[̀-ͯ]/g

/** Repliement caractère par caractère : la chaîne repliée garde les positions. */
function foldChar(char: string): string {
  if (char === '’' || char === '‘') return "'"
  const folded = char.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()
  if (folded.length === 1) return folded
  const lower = char.toLowerCase()
  return lower.length === 1 ? lower : char
}

/** Replie une chaîne (casse, accents, apostrophes) en conservant sa longueur. */
export function foldForMatch(input: string): string {
  let output = ''
  for (let i = 0; i < input.length; i += 1) output += foldChar(input.charAt(i))
  return output
}

type Matcher = { term: GlossaryLinkTerm; needle: string }
type Match = { matcher: Matcher; start: number; end: number }

function buildMatchers(
  terms: readonly GlossaryLinkTerm[],
  exclude: ReadonlySet<string>,
): Matcher[] {
  const matchers: Matcher[] = []
  for (const term of terms) {
    if (exclude.has(String(term.id))) continue
    const variants = new Set(
      [term.term, ...(term.variants ?? [])]
        .map((variant) => foldForMatch(variant.trim().replace(/\s+/g, ' ')))
        .filter((variant) => variant !== ''),
    )
    for (const needle of variants) matchers.push({ term, needle })
  }
  // Variantes longues d'abord : à position égale, la plus longue gagne.
  return matchers.sort((a, b) => b.needle.length - a.needle.length)
}

function isWordBoundary(text: string, index: number): boolean {
  return index < 0 || index >= text.length || !WORD_CHAR.test(text.charAt(index))
}

function findFirstMatch(folded: string, from: number, matchers: readonly Matcher[]): Match | null {
  let best: Match | null = null
  for (const matcher of matchers) {
    let start = folded.indexOf(matcher.needle, from)
    while (start !== -1) {
      const end = start + matcher.needle.length
      if (isWordBoundary(folded, start - 1) && isWordBoundary(folded, end)) break
      start = folded.indexOf(matcher.needle, start + 1)
    }
    if (start === -1) continue
    const end = start + matcher.needle.length
    if (!best || start < best.start || (start === best.start && end > best.end))
      best = { matcher, start, end }
  }
  return best
}

function textWith(source: LexicalNode, text: string): LexicalNode {
  return { ...source, text }
}

function linkNode(
  source: LexicalNode,
  text: string,
  term: GlossaryLinkTerm,
  url: string,
): LexicalNode {
  return {
    type: 'link',
    version: 3,
    direction: null,
    format: '',
    indent: 0,
    fields: { linkType: 'custom', url, newTab: false, glossaryTerm: term.slug },
    children: [textWith(source, text)],
  }
}

/**
 * Lie la première occurrence de chaque terme du glossaire dans un état Lexical.
 * Pure : renvoie une copie ; une valeur qui n'est pas un état Lexical est renvoyée telle quelle.
 */
export function linkGlossaryTerms<T>(
  state: T,
  terms: readonly GlossaryLinkTerm[],
  options: GlossaryLinkOptions,
): T {
  if (!isLexicalState(state) || terms.length === 0) return state
  const exclude = new Set((options.exclude ?? []).map(String))
  let matchers = buildMatchers(terms, exclude)
  const maxLinks = options.maxLinks ?? Number.POSITIVE_INFINITY
  let added = 0

  const linkText = (node: LexicalNode & { text: string }): LexicalNode[] => {
    const output: LexicalNode[] = []
    const folded = foldForMatch(node.text)
    let cursor = 0
    while (matchers.length > 0 && added < maxLinks) {
      const match = findFirstMatch(folded, cursor, matchers)
      if (!match) break
      const { term } = match.matcher
      if (match.start > cursor) output.push(textWith(node, node.text.slice(cursor, match.start)))
      output.push(linkNode(node, node.text.slice(match.start, match.end), term, options.href(term)))
      cursor = match.end
      added += 1
      matchers = matchers.filter((matcher) => matcher.term.id !== term.id)
    }
    if (output.length === 0) return [node]
    if (cursor < node.text.length) output.push(textWith(node, node.text.slice(cursor)))
    return output
  }

  const visit = (node: LexicalNode): void => {
    if (!Array.isArray(node.children) || SKIPPED_NODES.has(node.type)) return
    const children: LexicalNode[] = []
    for (const child of node.children) {
      if (matchers.length === 0 || added >= maxLinks) {
        children.push(child)
      } else if (isTextNode(child) && !hasCodeFormat(child)) {
        children.push(...linkText(child))
      } else {
        visit(child)
        children.push(child)
      }
    }
    node.children = children
  }

  const copy = cloneState(state)
  visit(copy.root)
  return copy
}
