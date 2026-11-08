import type { Locale } from '@/lib/i18n/config'
import { type AppPathname, pathnames } from '@/lib/i18n/routing'

/** Route interne (clé de `pathnames`) et ses paramètres. */
export type RouteRef = AppPathname | { pathname: AppPathname; params?: Record<string, string> }

/**
 * Chemin public d'une route dans une locale (`/fr/audit-conformite/…`, `/en/compliance-audit/…`).
 * Équivalent pur de `getPathname` de next-intl (préfixe toujours présent), utilisable dans
 * les tests, le sitemap et `robots.ts`.
 */
export function localizedPath(locale: Locale, route: RouteRef): string {
  const { pathname, params } = typeof route === 'string' ? { pathname: route, params: {} } : route
  const entry: string | Record<Locale, string> = pathnames[pathname]
  const template = typeof entry === 'string' ? entry : entry[locale]
  const filled = template.replace(/\[([^\]]+)\]/g, (_match, name: string) => {
    const value = params?.[name]
    if (!value) throw new Error(`Paramètre « ${name} » manquant pour ${pathname}`)
    return encodeURIComponent(value)
  })
  return filled === '/' ? `/${locale}` : `/${locale}${filled}`
}

/** URL absolue d'une route. */
export function absoluteUrl(siteUrl: string, locale: Locale, route: RouteRef): string {
  return `${siteUrl}${localizedPath(locale, route)}`
}
