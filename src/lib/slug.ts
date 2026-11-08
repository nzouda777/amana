/**
 * Transforme un titre en slug d'URL ASCII : minuscules, sans accents ni ponctuation,
 * mots séparés par des tirets. Les écritures non latines (arabe) sont retirées :
 * l'éditeur doit alors saisir le slug à la main.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '-')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '')
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value)
}
