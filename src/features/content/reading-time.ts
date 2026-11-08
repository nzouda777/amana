/** Logique éditoriale pure (aucune dépendance à Payload ou Next). */

type LexicalNode = { text?: unknown; children?: unknown }

function isNode(value: unknown): value is LexicalNode {
  return typeof value === 'object' && value !== null
}

/** Extrait le texte brut d'un état Lexical sérialisé (`{ root: { children } }`). */
export function lexicalToPlainText(state: unknown): string {
  const parts: string[] = []
  const visit = (node: unknown): void => {
    if (!isNode(node)) return
    if (typeof node.text === 'string') parts.push(node.text)
    if (Array.isArray(node.children)) node.children.forEach(visit)
  }
  if (isNode(state) && 'root' in state) visit((state as { root: unknown }).root)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export const WORDS_PER_MINUTE = 200

/** Temps de lecture arrondi à la minute supérieure, minimum 1 minute. */
export function estimateReadingMinutes(state: unknown, wordsPerMinute = WORDS_PER_MINUTE): number {
  const text = lexicalToPlainText(state)
  const words = text === '' ? 0 : text.split(' ').length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}
