/**
 * Locales du produit. `fr` est la langue par défaut et la langue de repli
 * (contenus Payload et messages d'interface).
 */
export const locales = ['fr', 'en', 'ar'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fr'
export const fallbackLocale: Locale = 'fr'

export type Direction = 'ltr' | 'rtl'

const rtlLocales: ReadonlySet<Locale> = new Set<Locale>(['ar'])

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

export function getDirection(locale: Locale): Direction {
  return rtlLocales.has(locale) ? 'rtl' : 'ltr'
}

/** Libellés natifs, utilisés par le sélecteur de langue et l'admin Payload. */
export const localeLabels: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
}
