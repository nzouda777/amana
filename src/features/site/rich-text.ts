/**
 * Outils purs sur les états Lexical sérialisés (texte riche Payload) pour le rendu du site :
 * ancres et sommaire des titres, conversion en paragraphes de texte brut (FAQ, extraits).
 */
import { slugify } from '@/lib/slug'
import { cloneState, isLexicalState, type LexicalNode } from '@/lib/typography/lexical-tree'

export type TocEntry = { id: string; text: string; level: 2 | 3 }

/** Propriété ajoutée aux nœuds `heading` : identifiant d'ancre lu par le convertisseur JSX. */
export const ANCHOR_KEY = 'anchorId'

function textOf(node: LexicalNode): string {
  if (typeof node.text === 'string') return node.text
  return (node.children ?? []).map(textOf).join('')
}

/**
 * Ajoute un identifiant d'ancre stable à chaque titre h2/h3 et renvoie le sommaire.
 * Identifiants : slug du texte, suffixé (`-2`, `-3`) en cas de doublon. Pure : copie.
 */
export function withHeadingAnchors<T>(state: T): { state: T; toc: TocEntry[] } {
  if (!isLexicalState(state)) return { state, toc: [] }
  const copy = cloneState(state)
  const toc: TocEntry[] = []
  const used = new Map<string, number>()

  const visit = (node: LexicalNode): void => {
    if (node.type === 'heading' && (node.tag === 'h2' || node.tag === 'h3')) {
      const text = textOf(node).replace(/\s+/g, ' ').trim()
      const base = slugify(text) || 'section'
      const count = (used.get(base) ?? 0) + 1
      used.set(base, count)
      const id = count === 1 ? base : `${base}-${count}`
      node[ANCHOR_KEY] = id
      toc.push({ id, text, level: node.tag === 'h2' ? 2 : 3 })
      return
    }
    node.children?.forEach(visit)
  }
  copy.root.children.forEach(visit)
  return { state: copy, toc }
}

/**
 * Texte brut d'un état Lexical, un bloc de premier niveau par paragraphe (séparés par une
 * ligne vide), éléments de liste sur leur propre ligne. Utilisé pour les réponses de FAQ.
 */
export function richTextToParagraphs(state: unknown): string {
  if (!isLexicalState(state)) return ''
  const blocks: string[] = []
  for (const block of state.root.children) {
    if (block.type === 'list') {
      const items = (block.children ?? []).map((item) => textOf(item).trim()).filter(Boolean)
      if (items.length) blocks.push(items.join('\n'))
      continue
    }
    const text = textOf(block).replace(/\s+/g, ' ').trim()
    if (text) blocks.push(text)
  }
  return blocks.join('\n\n')
}

/** Paragraphes de premier niveau en texte brut (sections « problème » d'une page). */
export function richTextParagraphList(state: unknown): string[] {
  return richTextToParagraphs(state)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
