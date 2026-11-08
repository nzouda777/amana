/**
 * Coupe un texte à `max` caractères au plus, sur une limite de mot, avec « … ».
 * Garde-fou pour les titres et descriptions issus du CMS (résumés trop longs).
 */
export function clampText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${base.replace(/[\s,;:.–—-]+$/, '')}…`
}
