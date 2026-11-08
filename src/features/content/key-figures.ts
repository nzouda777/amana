/**
 * Chiffres clés intégrés à une phrase (bloc `stats`, DESIGN §9 « pas en grille de compteurs »).
 *
 * La phrase est un texte localisé contenant des jetons `{{cle}}` résolus au rendu contre
 * `site-settings.keyFigures` : un chiffre se met à jour à un seul endroit, toutes les
 * phrases qui le citent suivent. Logique pure, sans dépendance à Payload ni à Next.
 *
 * Politique pour un jeton inconnu (ADR 010) :
 * - à l'enregistrement, le bloc `stats` refuse une phrase dont un jeton est inconnu ;
 * - au rendu (la clé a pu être supprimée depuis), en développement le jeton reste visible
 *   tel quel pour être repéré ; en production la phrase entière n'est pas rendue (`null`),
 *   car retirer un chiffre au milieu d'une phrase produirait un texte faux.
 */

/** Clé d'un chiffre : minuscules, chiffres, tirets (ex. `professionnels-formes`). */
export const KEY_FIGURE_KEY_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

/** Jeton `{{cle}}`, espaces internes tolérés (`{{ cle }}`). */
const TOKEN_PATTERN = /\{\{\s*([^{}\s]+)\s*\}\}/g

export type KeyFigure = {
  key: string
  value: string
  label?: string | null
}

export type StatsSegment =
  | { kind: 'text'; text: string }
  | { kind: 'figure'; key: string; value: string; label: string | null }

export type ParsedStatsSentence = {
  segments: StatsSegment[]
  /** Clés citées dans la phrase mais absentes des réglages, sans doublon, dans l'ordre. */
  missing: string[]
}

export type ResolveMode = 'development' | 'production'

function indexByKey(figures: readonly KeyFigure[]): Map<string, KeyFigure> {
  return new Map(figures.map((figure) => [figure.key, figure]))
}

function pushText(segments: StatsSegment[], text: string): void {
  if (text === '') return
  const last = segments.at(-1)
  if (last?.kind === 'text') last.text += text
  else segments.push({ kind: 'text', text })
}

/** Découpe la phrase en segments texte / chiffre ; les jetons inconnus restent du texte. */
export function parseStatsSentence(
  sentence: string,
  figures: readonly KeyFigure[],
): ParsedStatsSentence {
  const byKey = indexByKey(figures)
  const segments: StatsSegment[] = []
  const missing: string[] = []
  let cursor = 0
  for (const match of sentence.matchAll(TOKEN_PATTERN)) {
    const [token, key = ''] = match
    pushText(segments, sentence.slice(cursor, match.index))
    const figure = byKey.get(key)
    if (figure) {
      segments.push({ kind: 'figure', key, value: figure.value, label: figure.label ?? null })
    } else {
      pushText(segments, token)
      if (!missing.includes(key)) missing.push(key)
    }
    cursor = match.index + token.length
  }
  pushText(segments, sentence.slice(cursor))
  return { segments, missing }
}

/** Clés citées dans la phrase et absentes des réglages (validation à l'enregistrement). */
export function findUnknownFigureKeys(sentence: string, figures: readonly KeyFigure[]): string[] {
  return parseStatsSentence(sentence, figures).missing
}

/**
 * Segments à rendre, ou `null` si la phrase ne doit pas être affichée
 * (jeton inconnu en production). Voir la politique en tête de fichier.
 */
export function resolveStatsSentence(
  sentence: string,
  figures: readonly KeyFigure[],
  mode: ResolveMode,
): StatsSegment[] | null {
  const { segments, missing } = parseStatsSentence(sentence, figures)
  if (missing.length > 0 && mode === 'production') return null
  return segments
}

/** Version texte brut (attribut `aria-label`, méta description, tests). */
export function statsSentenceToText(segments: readonly StatsSegment[]): string {
  return segments
    .map((segment) => (segment.kind === 'text' ? segment.text : segment.value))
    .join('')
}

/** Clés présentes plusieurs fois dans `keyFigures` (unicité contrôlée à l'enregistrement). */
export function findDuplicateFigureKeys(figures: readonly Pick<KeyFigure, 'key'>[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const { key } of figures) {
    if (seen.has(key)) duplicates.add(key)
    seen.add(key)
  }
  return [...duplicates]
}
