/** Regroupement alphabétique du glossaire (lettre initiale sans accent, `#` pour le reste). */

export type LetterGroup<T> = { letter: string; items: T[] }

export function initialLetter(value: string): string {
  const first = value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase()
  return /^[A-Z]$/.test(first) ? first : '#'
}

export function groupByLetter<T>(
  items: readonly T[],
  label: (item: T) => string,
  locale = 'fr',
): LetterGroup<T>[] {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' })
  const sorted = [...items].sort((a, b) => collator.compare(label(a), label(b)))
  const groups = new Map<string, T[]>()
  for (const item of sorted) {
    const letter = initialLetter(label(item))
    const group = groups.get(letter) ?? []
    group.push(item)
    groups.set(letter, group)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
    .map(([letter, list]) => ({ letter, items: list }))
}
