import type { ColorToken } from './palette'

/**
 * Paires de couleurs autorisées (DESIGN §2). Toute nouvelle combinaison texte/fond ou
 * élément graphique/fond utilisée dans l'interface est ajoutée ici ; le test
 * `tests/a11y/contrast.test.ts` vérifie chaque seuil.
 *
 * - `text` : texte courant, seuil 4,5:1 (WCAG 1.4.3 AA).
 * - `large` : titres ≥ 24 px (ou ≥ 18,66 px gras), seuil 3:1.
 * - `ui` : bordures de champs, icônes informatives, anneaux de focus, seuil 3:1 (1.4.11).
 */
export type PairUse = 'text' | 'large' | 'ui'

export type ContrastPair = {
  fg: ColorToken
  bg: ColorToken
  use: PairUse
  /** Où la paire est employée (affiché dans /styleguide). */
  usage: string
}

export const minimumRatio: Record<PairUse, number> = {
  text: 4.5,
  large: 3,
  ui: 3,
}

export const pairs: readonly ContrastPair[] = [
  // Texte sur fonds clairs
  { fg: 'ink', bg: 'paper', use: 'text', usage: 'Texte principal' },
  { fg: 'ink-muted', bg: 'paper', use: 'text', usage: 'Texte secondaire' },
  { fg: 'ink-subtle', bg: 'paper', use: 'text', usage: 'Métadonnées (≥ 14 px)' },
  { fg: 'green-700', bg: 'paper', use: 'text', usage: 'Liens, bouton secondaire' },
  { fg: 'green-800', bg: 'paper', use: 'text', usage: 'Liens au survol' },
  { fg: 'gold-700', bg: 'paper', use: 'text', usage: 'Seul or autorisé en texte sur clair' },
  { fg: 'ink', bg: 'sand-100', use: 'text', usage: 'Encarts légers' },
  { fg: 'ink-muted', bg: 'sand-100', use: 'text', usage: 'Encarts légers, texte secondaire' },
  { fg: 'ink-subtle', bg: 'sand-100', use: 'text', usage: 'Métadonnées sur encart' },
  { fg: 'green-700', bg: 'sand-100', use: 'text', usage: 'Liens dans un encart' },
  { fg: 'gold-700', bg: 'sand-100', use: 'text', usage: 'Chiffres décoratifs sur encart' },
  { fg: 'ink', bg: 'sand-300', use: 'text', usage: 'Témoignage' },
  { fg: 'ink-muted', bg: 'sand-300', use: 'text', usage: 'Auteur du témoignage' },
  { fg: 'green-900', bg: 'green-50', use: 'text', usage: 'Sélection, état actif' },
  { fg: 'green-700', bg: 'green-50', use: 'text', usage: 'Lien survolé dans une ligne teintée' },
  { fg: 'ink', bg: 'green-50', use: 'text', usage: 'Ligne teintée au survol' },
  { fg: 'ink-muted', bg: 'green-50', use: 'text', usage: 'Texte secondaire teinté' },
  { fg: 'ink', bg: 'gold-200', use: 'text', usage: 'Badges' },
  { fg: 'danger', bg: 'paper', use: 'text', usage: "Messages d'erreur" },
  { fg: 'warning', bg: 'paper', use: 'text', usage: 'Avertissements' },
  { fg: 'info', bg: 'paper', use: 'text', usage: 'Informations' },
  { fg: 'danger', bg: 'danger-50', use: 'text', usage: 'Alerte erreur' },
  { fg: 'warning', bg: 'warning-50', use: 'text', usage: 'Encadré « Avertissement »' },
  { fg: 'info', bg: 'info-50', use: 'text', usage: 'Alerte information' },
  { fg: 'ink', bg: 'warning-50', use: 'text', usage: 'Corps de l’encadré « Avertissement »' },

  // Texte sur fonds verts
  { fg: 'paper', bg: 'green-700', use: 'text', usage: 'Bouton primaire, pied de page' },
  { fg: 'paper', bg: 'green-800', use: 'text', usage: 'Bouton primaire au survol' },
  { fg: 'paper', bg: 'green-900', use: 'text', usage: 'Héros, zones « nuit »' },
  { fg: 'sand-300', bg: 'green-900', use: 'text', usage: 'Chapeau du héros' },
  { fg: 'sand-300', bg: 'green-700', use: 'text', usage: 'Texte secondaire du pied de page' },
  { fg: 'green-50', bg: 'green-900', use: 'text', usage: 'Texte secondaire sur nuit' },
  {
    fg: 'green-50',
    bg: 'green-700',
    use: 'text',
    usage: 'Mentions du pied de page (newsletter, droits)',
  },
  { fg: 'gold-500', bg: 'green-900', use: 'text', usage: 'Chiffres et filets or sur nuit' },
  { fg: 'gold-500', bg: 'green-700', use: 'large', usage: 'Titres or ≥ 24 px sur vert' },

  // Bouton or (uniquement sur fond vert)
  { fg: 'ink', bg: 'gold-500', use: 'text', usage: 'Bouton or, texte noir' },

  // Éléments graphiques et focus
  { fg: 'line-strong', bg: 'paper', use: 'ui', usage: 'Bordure des champs' },
  { fg: 'line-strong', bg: 'sand-100', use: 'ui', usage: 'Bordure des champs sur encart' },
  { fg: 'green-700', bg: 'paper', use: 'ui', usage: 'Anneau de focus sur clair, cases cochées' },
  { fg: 'green-700', bg: 'sand-100', use: 'ui', usage: 'Anneau de focus sur encart' },
  { fg: 'green-700', bg: 'sand-300', use: 'ui', usage: 'Anneau de focus sur témoignage' },
  { fg: 'gold-500', bg: 'green-900', use: 'ui', usage: 'Anneau de focus sur nuit' },
  { fg: 'gold-500', bg: 'green-700', use: 'ui', usage: 'Anneau de focus sur vert' },
  { fg: 'danger', bg: 'paper', use: 'ui', usage: 'Bordure de champ en erreur' },
  { fg: 'green-700', bg: 'line', use: 'ui', usage: 'Barre de progression sur son rail' },
]

/**
 * Combinaisons explicitement interdites (DESIGN §2). Le test vérifie qu'elles échouent
 * bien au seuil texte : si un token change et les rend conformes, la règle est à revoir.
 */
export const forbiddenPairs: readonly Pick<ContrastPair, 'fg' | 'bg' | 'usage'>[] = [
  { fg: 'gold-500', bg: 'paper', usage: 'Or charte en texte ou icône sur blanc' },
  { fg: 'gold-500', bg: 'sand-100', usage: 'Or charte en texte sur encart' },
  { fg: 'line', bg: 'paper', usage: 'Filet `line` comme bordure de champ' },
]
