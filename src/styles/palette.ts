/**
 * Miroir TypeScript des couleurs de `tokens.css`, pour le guide de style et le test de
 * contraste. `tests/a11y/contrast.test.ts` vérifie que ce fichier et `tokens.css`
 * restent identiques : `tokens.css` fait foi.
 */
export const palette = {
  'green-900': '#0f3a14',
  'green-800': '#164d1a',
  'green-700': '#1b5e20',
  'green-50': '#eef4ee',
  'gold-700': '#8b6914',
  'gold-500': '#d4af37',
  'gold-200': '#efdfa6',
  'sand-300': '#f1e0c5',
  'sand-100': '#faf4ea',
  paper: '#ffffff',
  ink: '#1c1c1c',
  'ink-muted': '#4a4a45',
  'ink-subtle': '#6b6b63',
  line: '#e4ddd0',
  'line-strong': '#8a8478',
  danger: '#b42318',
  'danger-50': '#fef3f2',
  warning: '#b54708',
  'warning-50': '#fffaeb',
  info: '#1e4e8c',
  'info-50': '#eff4fb',
} as const

export type ColorToken = keyof typeof palette

/** Groupes affichés dans /styleguide, avec la clé de message décrivant le rôle. */
export const paletteGroups = {
  brand: ['green-700', 'gold-500', 'sand-300', 'ink'],
  derived: [
    'green-900',
    'green-800',
    'green-50',
    'gold-700',
    'gold-200',
    'sand-100',
    'paper',
    'ink-muted',
    'ink-subtle',
    'line',
    'line-strong',
  ],
  system: ['danger', 'danger-50', 'warning', 'warning-50', 'info', 'info-50'],
} as const satisfies Record<string, readonly ColorToken[]>
