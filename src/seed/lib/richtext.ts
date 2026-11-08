/**
 * Construction d'états Lexical (format Payload) pour le seed, à partir d'une syntaxe
 * en ligne minimale : `**gras**`, `_italique_`, `[libellé](/chemin)`.
 */
import { createHash } from 'node:crypto'

import type { Service } from '@/payload-types'

/** Type d'un champ `richText` tel que généré par Payload. */
export type RichText = NonNullable<Service['problem']>

/** Nœud Lexical sérialisé. */
export type Block = { type: string; version: number; [key: string]: unknown }

const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2

const INLINE_PATTERN = /\*\*([^*]+)\*\*|_([^_]+)_|\[([^\]]+)\]\(([^)\s]+)\)/g

function textNode(text: string, format = 0): Block {
  return { type: 'text', text, format, detail: 0, mode: 'normal', style: '', version: 1 }
}

function element(type: string, children: Block[], extra: Record<string, unknown> = {}): Block {
  return { type, version: 1, direction: 'ltr', format: '', indent: 0, children, ...extra }
}

function linkNode(label: string, url: string): Block {
  return element('link', [textNode(label)], {
    version: 3,
    fields: { linkType: 'custom', url, newTab: url.startsWith('http') },
  })
}

/** Analyse la syntaxe en ligne d'une chaîne en nœuds Lexical. */
export function inline(source: string): Block[] {
  const nodes: Block[] = []
  let cursor = 0
  for (const match of source.matchAll(INLINE_PATTERN)) {
    if (match.index > cursor) nodes.push(textNode(source.slice(cursor, match.index)))
    const [, bold, italic, label, url] = match
    if (bold !== undefined) nodes.push(textNode(bold, FORMAT_BOLD))
    else if (italic !== undefined) nodes.push(textNode(italic, FORMAT_ITALIC))
    else if (label !== undefined && url !== undefined) nodes.push(linkNode(label, url))
    cursor = match.index + match[0].length
  }
  if (cursor < source.length) nodes.push(textNode(source.slice(cursor)))
  return nodes
}

export const p = (source: string): Block =>
  element('paragraph', inline(source), { textFormat: 0, textStyle: '' })

export const h2 = (source: string): Block => element('heading', inline(source), { tag: 'h2' })

export const h3 = (source: string): Block => element('heading', inline(source), { tag: 'h3' })

export type CalloutVariant = 'retenir' | 'avertissement'

/** Identifiant stable (24 hexadécimaux, format attendu par Payload) : seed rejouable sans diff. */
function stableBlockId(seed: string): string {
  return createHash('sha256').update(seed).digest('hex').slice(0, 24)
}

/**
 * Encadré : bloc Lexical `callout` (`src/payload/fields/editors.ts`), dans les champs
 * qui utilisent `editorialEditor` (articles, services, blocs texte des pages).
 */
export function callout(variant: CalloutVariant, source: string | Block[], title?: string): Block {
  const children = typeof source === 'string' ? [p(source)] : source
  return {
    type: 'block',
    version: 2,
    format: '',
    fields: {
      id: stableBlockId(`${variant}|${title ?? ''}|${JSON.stringify(children)}`),
      blockName: '',
      blockType: 'callout',
      variant,
      ...(title === undefined ? {} : { title }),
      content: rt(...children),
    },
  }
}

function list(kind: 'bullet' | 'number', items: readonly string[]): Block {
  return element(
    'list',
    items.map((item, index) => element('listitem', inline(item), { value: index + 1 })),
    { listType: kind, start: 1, tag: kind === 'bullet' ? 'ul' : 'ol' },
  )
}

export const ul = (...items: string[]): Block => list('bullet', items)
export const ol = (...items: string[]): Block => list('number', items)

/** État Lexical complet. Une chaîne seule devient un paragraphe. */
export function rt(...blocks: Array<Block | string>): RichText {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: blocks.map((block) => (typeof block === 'string' ? p(block) : block)),
    },
  }
}
