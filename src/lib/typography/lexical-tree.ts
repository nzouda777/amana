/**
 * Types minimaux d'un état Lexical sérialisé (format Payload), sans dépendre de
 * `lexical` : les transformations restent des fonctions pures sur du JSON.
 */

export type LexicalNode = {
  type: string
  version?: number
  children?: LexicalNode[]
  text?: string
  format?: number | string
  [key: string]: unknown
}

export type LexicalState = {
  root: LexicalNode & { children: LexicalNode[] }
  [key: string]: unknown
}

/** Bit de format « code en ligne » d'un nœud de texte Lexical. */
export const TEXT_FORMAT_CODE = 16

export function isLexicalState(value: unknown): value is LexicalState {
  if (typeof value !== 'object' || value === null || !('root' in value)) return false
  const root = (value as { root: unknown }).root
  return (
    typeof root === 'object' &&
    root !== null &&
    Array.isArray((root as { children?: unknown }).children)
  )
}

export function isTextNode(node: LexicalNode): node is LexicalNode & { text: string } {
  return node.type === 'text' && typeof node.text === 'string'
}

export function hasCodeFormat(node: LexicalNode): boolean {
  return typeof node.format === 'number' && (node.format & TEXT_FORMAT_CODE) !== 0
}

/** Éléments en ligne : leur texte appartient au bloc parent. */
export const INLINE_ELEMENTS: ReadonlySet<string> = new Set(['link', 'autolink'])

/** Copie profonde d'un état (les fonctions publiques ne modifient jamais leur entrée). */
export function cloneState<T>(state: T): T {
  return structuredClone(state)
}
