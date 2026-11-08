import {
  applyEdits,
  computeTypographyEdits,
  findLinkRanges,
  type TextRange,
  type TypographyEdit,
} from './french'
import {
  cloneState,
  hasCodeFormat,
  INLINE_ELEMENTS,
  isLexicalState,
  isTextNode,
  type LexicalNode,
} from './lexical-tree'

/** Types de blocs dont le texte ne doit jamais être retouché. */
const SKIPPED_BLOCKS: ReadonlySet<string> = new Set(['code'])

type Segment = { node: LexicalNode & { text: string }; start: number; end: number; opaque: boolean }

/**
 * Rassemble le texte d'un bloc (paragraphe, titre, élément de liste…) : texte des
 * nœuds `text` et des liens, séparateurs pour les sauts de ligne et sous-blocs.
 * Le contexte d'un nœud (caractère précédent ou suivant) vient ainsi de ses voisins,
 * même quand la ponctuation est dans un nœud de format différent (`**Attention** !`).
 */
function collectBlock(
  block: LexicalNode,
  nested: LexicalNode[],
): { text: string; segments: Segment[] } {
  let text = ''
  const segments: Segment[] = []
  const visit = (children: LexicalNode[]): void => {
    for (const child of children) {
      if (isTextNode(child)) {
        segments.push({
          node: child,
          start: text.length,
          end: text.length + child.text.length,
          opaque: hasCodeFormat(child),
        })
        text += child.text
      } else if (INLINE_ELEMENTS.has(child.type) && Array.isArray(child.children)) {
        visit(child.children)
      } else if (child.type === 'tab') {
        text += '\t'
      } else {
        // Saut de ligne, sous-bloc (liste imbriquée), nœud inconnu : frontière.
        text += '\n'
        if (Array.isArray(child.children)) nested.push(child)
      }
    }
  }
  visit(block.children ?? [])
  return { text, segments }
}

/** Répartit les modifications calculées sur le texte du bloc entre ses nœuds. */
function distribute(segments: Segment[], edits: TypographyEdit[]): void {
  const local = new Map<Segment, TypographyEdit[]>()
  const push = (segment: Segment, edit: TypographyEdit) => {
    const list = local.get(segment) ?? []
    list.push({ start: edit.start - segment.start, end: edit.end - segment.start, text: edit.text })
    local.set(segment, list)
  }

  for (const edit of edits) {
    if (edit.start === edit.end) {
      // Insertion : à la fin du nœud précédent, sinon au début du suivant.
      const target =
        segments.find((s) => !s.opaque && s.start < edit.start && edit.start <= s.end) ??
        segments.find((s) => !s.opaque && s.start === edit.start)
      if (target) push(target, edit)
      continue
    }
    const touched = segments.filter((s) => s.start < edit.end && s.end > edit.start)
    if (touched.length === 0 || touched.some((s) => s.opaque)) continue
    touched.forEach((segment, position) => {
      push(segment, {
        start: Math.max(edit.start, segment.start),
        end: Math.min(edit.end, segment.end),
        text: position === 0 ? edit.text : '',
      })
    })
  }

  for (const [segment, list] of local) {
    segment.node.text = applyEdits(segment.node.text, list)
  }
}

function processBlock(block: LexicalNode): void {
  if (SKIPPED_BLOCKS.has(block.type)) return
  const nested: LexicalNode[] = []
  const { text, segments } = collectBlock(block, nested)
  if (segments.length > 0) {
    const opaque: TextRange[] = segments
      .filter((s) => s.opaque)
      .map((s) => ({ start: s.start, end: s.end }))
    opaque.push(...findLinkRanges(text))
    distribute(segments, computeTypographyEdits(text, { opaque }))
  }
  nested.forEach(processBlock)
}

/**
 * Typographie française d'un état Lexical (champ `richText` de Payload).
 * Pure : renvoie une copie. Laisse intacts le code (bloc ou format en ligne), les URL
 * des liens (seul leur texte visible est traité) et les structures inconnues.
 * Toute valeur qui n'est pas un état Lexical est renvoyée telle quelle.
 */
export function typographyFrLexical<T>(state: T): T {
  if (!isLexicalState(state)) return state
  const copy = cloneState(state)
  processBlock(copy.root)
  return copy
}
