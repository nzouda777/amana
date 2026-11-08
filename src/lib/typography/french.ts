/**
 * Typographie française (DESIGN §3), logique pure sans dépendance.
 *
 * Règles appliquées :
 * - espace fine insécable (U+202F) avant `;`, `!`, `?` ;
 * - espace insécable (U+00A0) avant `:` ;
 * - guillemets français « … » avec espaces fines insécables à l'intérieur ;
 *   les guillemets droits `"…"` et anglais `“…”` sont convertis ;
 * - apostrophe typographique `’` entre deux lettres (`l'audit` → `l’audit`).
 *
 * Ne touche jamais : URL, adresses e-mail, balises et entités HTML, blocs `<code>`,
 * heures et rapports (`14:30`, `3:2`), paramètres d'URL (`?q=`), ponctuation en début
 * de texte. La fonction est idempotente.
 *
 * Le cœur produit une liste de modifications positionnées (`TypographyEdit`) sur un
 * texte, ce qui permet de l'appliquer aussi à un arbre Lexical réparti sur plusieurs
 * nœuds de texte (voir `lexical.ts`).
 */

/** Espace fine insécable (U+202F). */
export const NARROW_NBSP = '\u202F'
/** Espace insécable (U+00A0). */
export const NBSP = '\u00A0'

export type TextRange = { start: number; end: number }
export type TypographyEdit = { start: number; end: number; text: string }

export type EditOptions = {
  /** Plages à ne jamais modifier (URL, code…). */
  opaque?: readonly TextRange[]
  /** Plages invisibles et transparentes (balises en ligne) : ignorées pour le contexte. */
  transparent?: readonly TextRange[]
  /** Plages protégées qui font frontière comme un retour à la ligne (balises de bloc, code). */
  boundaries?: readonly TextRange[]
}

/** Espaces horizontales qu'une règle peut remplacer (pas les retours à la ligne). */
const SPACE = /[ \u00A0\u202F]/
const WHITESPACE = /\s/u
const LETTER = /\p{L}/u
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u
const PUNCTUATION = /[;!?]/
/** Caractères après lesquels un guillemet droit est ouvrant. */
const OPENING_CONTEXT = /[([{—–\-/'’‘“«]/
/** Après ces caractères, `; ! ?` ne reçoivent pas d'espace (`(?)`). */
const OPENING_BRACKETS = /[([{«“]/
/** Caractères autorisés juste après `; ! ?` (en plus d'un blanc ou de la fin). */
const AFTER_PUNCTUATION = /[)\]}»"'’”.,…;:!?]/

function inRanges(ranges: readonly TextRange[], index: number): TextRange | undefined {
  return ranges.find((range) => index >= range.start && index < range.end)
}

function overlaps(ranges: readonly TextRange[], start: number, end: number): boolean {
  if (start === end) return ranges.some((range) => start > range.start && start < range.end)
  return ranges.some((range) => start < range.end && end > range.start)
}

/** Calcule les modifications typographiques d'un texte, triées et sans chevauchement. */
export function computeTypographyEdits(text: string, options: EditOptions = {}): TypographyEdit[] {
  const opaque = options.opaque ?? []
  const transparent = options.transparent ?? []
  const boundaries = options.boundaries ?? []
  const edits: TypographyEdit[] = []

  const isProtected = (index: number): boolean =>
    inRanges(opaque, index) !== undefined ||
    inRanges(transparent, index) !== undefined ||
    inRanges(boundaries, index) !== undefined

  /** Premier caractère visible avant `index` (balises sautées), '' au début. */
  const prevVisible = (index: number): string => {
    let i = index - 1
    while (i >= 0) {
      if (inRanges(boundaries, i)) return '\n'
      const tag = inRanges(transparent, i)
      if (!tag) return text.charAt(i)
      i = tag.start - 1
    }
    return ''
  }

  /** Premier caractère visible à partir de `index` (balises sautées), '' à la fin. */
  const nextVisible = (index: number): string => {
    let i = index
    while (i < text.length) {
      if (inRanges(boundaries, i)) return '\n'
      const tag = inRanges(transparent, i)
      if (!tag) return text.charAt(i)
      i = tag.end
    }
    return ''
  }

  /**
   * Caractère non blanc précédant `index` (espaces et balises sautées) ;
   * '' au début du texte ou après un retour à la ligne.
   */
  const prevWordChar = (index: number): string => {
    let i = index - 1
    while (i >= 0) {
      if (inRanges(boundaries, i)) return ''
      const tag = inRanges(transparent, i)
      if (tag) {
        i = tag.start - 1
        continue
      }
      const current = text.charAt(i)
      if (!SPACE.test(current)) return WHITESPACE.test(current) ? '' : current
      i -= 1
    }
    return ''
  }

  /**
   * Place exactement une espace `space` avant la ponctuation située en `index` :
   * les espaces existantes (même séparées par des balises) sont remplacées.
   */
  const spaceBefore = (index: number, space: string): void => {
    const spaces: number[] = []
    let i = index - 1
    while (i >= 0) {
      const tag = inRanges(transparent, i)
      if (tag) {
        i = tag.start - 1
        continue
      }
      if (!SPACE.test(text.charAt(i)) || isProtected(i)) break
      spaces.push(i)
      i -= 1
    }
    const [closest, ...others] = spaces
    if (closest === undefined) {
      edits.push({ start: index, end: index, text: space })
      return
    }
    if (text.charAt(closest) !== space)
      edits.push({ start: closest, end: closest + 1, text: space })
    for (const other of others) edits.push({ start: other, end: other + 1, text: '' })
  }

  const spacesAfter = (index: number): number => {
    let end = index
    while (SPACE.test(text.charAt(end)) && !isProtected(end)) end += 1
    return end
  }

  const spacesBefore = (index: number): number => {
    let start = index
    while (start > 0 && SPACE.test(text.charAt(start - 1)) && !isProtected(start - 1)) start -= 1
    return start
  }

  // Guillemet droit ouvert en attente de fermeture (les droits vont par paires).
  let straightQuoteOpen = false

  for (let index = 0; index < text.length; index += 1) {
    if (isProtected(index)) continue
    const char = text.charAt(index)

    if (PUNCTUATION.test(char)) {
      // Une suite (`?!`) ne reçoit qu'une espace, avant son premier signe.
      let end = index
      while (end < text.length && PUNCTUATION.test(text.charAt(end)) && !isProtected(end)) end += 1
      const before = prevWordChar(index)
      const after = nextVisible(end)
      const followed = after === '' || WHITESPACE.test(after) || AFTER_PUNCTUATION.test(after)
      if (before !== '' && !OPENING_BRACKETS.test(before) && followed)
        spaceBefore(index, NARROW_NBSP)
      index = end - 1
      continue
    }

    if (char === ':') {
      const before = prevWordChar(index)
      const after = nextVisible(index + 1)
      if (before !== '' && before !== ':' && (after === '' || WHITESPACE.test(after)))
        spaceBefore(index, NBSP)
      continue
    }

    if (char === '"' || char === '“' || char === '”') {
      const before = prevVisible(index)
      const opening: boolean =
        char === '“' ||
        (char === '"' &&
          !straightQuoteOpen &&
          (before === '' || WHITESPACE.test(before) || OPENING_CONTEXT.test(before)))
      if (char === '"') straightQuoteOpen = opening
      if (opening) {
        edits.push({ start: index, end: spacesAfter(index + 1), text: `«${NARROW_NBSP}` })
      } else {
        edits.push({ start: spacesBefore(index), end: index + 1, text: `${NARROW_NBSP}»` })
      }
      continue
    }

    if (char === '«') {
      const end = spacesAfter(index + 1)
      if (end < text.length && text.slice(index + 1, end) !== NARROW_NBSP)
        edits.push({ start: index + 1, end, text: NARROW_NBSP })
      continue
    }

    if (char === '»') {
      const start = spacesBefore(index)
      if (start > 0 && text.slice(start, index) !== NARROW_NBSP)
        edits.push({ start, end: index, text: NARROW_NBSP })
      continue
    }

    if (char === "'") {
      const before = text.charAt(index - 1)
      const after = text.charAt(index + 1)
      if (LETTER.test(before) && (LETTER_OR_DIGIT.test(after) || after === '«' || after === '"'))
        edits.push({ start: index, end: index + 1, text: '’' })
    }
  }

  return normalizeEdits(edits.filter((edit) => !overlaps(opaque, edit.start, edit.end)))
}

/** Trie et retire les modifications qui en chevauchent une autre. */
function normalizeEdits(edits: TypographyEdit[]): TypographyEdit[] {
  const sorted = [...edits].sort((a, b) => a.start - b.start || a.end - b.end)
  const result: TypographyEdit[] = []
  let cursor = -1
  for (const edit of sorted) {
    const last = result[result.length - 1]
    if (edit.start < cursor) continue
    if (last && edit.start === edit.end && last.start === edit.start && last.end === edit.end)
      continue
    result.push(edit)
    cursor = edit.end
  }
  return result
}

/** Applique des modifications triées et disjointes. */
export function applyEdits(text: string, edits: readonly TypographyEdit[]): string {
  let output = ''
  let cursor = 0
  for (const edit of edits) {
    output += text.slice(cursor, edit.start) + edit.text
    cursor = edit.end
  }
  return output + text.slice(cursor)
}

const HTML_BLOCK_PATTERN = /<(code|pre|script|style|kbd|samp)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
const HTML_ENTITY_PATTERN = /&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi
const TAG_PATTERN = /<\/?([a-z][a-z0-9]*)\b[^<>]*>|<!--[\s\S]*?-->/gi
/** Balises de bloc : le texte de part et d'autre n'est pas contigu. */
const BLOCK_TAGS: ReadonlySet<string> = new Set([
  ...['address', 'article', 'aside', 'blockquote', 'br', 'dd', 'details', 'div', 'dl', 'dt'],
  ...['figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr'],
  ...['li', 'main', 'nav', 'ol', 'p', 'section', 'summary', 'table', 'tbody', 'td', 'tfoot'],
  ...['th', 'thead', 'tr', 'ul'],
])

/** URL et adresses e-mail : jamais retouchées, en texte brut comme en HTML. */
const LINK_PATTERNS: readonly RegExp[] = [
  /\b(?:https?|ftp):\/\/[^\s<>"«»]+/gi,
  /\bwww\.[^\s<>"«»]+/gi,
  /\bmailto:[^\s<>"«»]+/gi,
  /[\p{L}\p{N}._%+'-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/giu,
]

type MatchedRange = TextRange & { name: string }

function collect(text: string, pattern: RegExp): MatchedRange[] {
  return Array.from(text.matchAll(pattern), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
    name: (match[1] ?? '').toLowerCase(),
  }))
}

/** Plages d'URL et d'adresses e-mail d'un texte. */
export function findLinkRanges(text: string): TextRange[] {
  return LINK_PATTERNS.flatMap((pattern) => collect(text, pattern))
}

/**
 * Typographie française d'une chaîne (texte brut ou fragment HTML).
 * Idempotente : `typographyFr(typographyFr(s)) === typographyFr(s)`.
 */
export function typographyFr(input: string): string {
  if (input === '') return input
  const codeBlocks = collect(input, HTML_BLOCK_PATTERN)
  const tags = collect(input, TAG_PATTERN).filter(
    (tag) => !codeBlocks.some((block) => tag.start >= block.start && tag.end <= block.end),
  )
  // Les URL des attributs sont déjà couvertes par leur balise.
  const opaque = [...collect(input, HTML_ENTITY_PATTERN), ...findLinkRanges(input)]
  const boundaries = [...codeBlocks, ...tags.filter((tag) => BLOCK_TAGS.has(tag.name))]
  const transparent = tags.filter((tag) => !BLOCK_TAGS.has(tag.name))
  return applyEdits(input, computeTypographyEdits(input, { opaque, transparent, boundaries }))
}
