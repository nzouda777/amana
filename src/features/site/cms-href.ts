/**
 * Résolution des liens saisis dans le CMS (navigation, pied de page, blocs, texte riche).
 *
 * Les éditeurs saisissent la route **française** interne (`/audit-conformite/audit-x`,
 * `/devis?type=audit`) ou une URL externe. Le rendu a besoin d'une destination typée
 * next-intl (`{ pathname, params, query }`) pour produire l'URL localisée
 * (`/en/compliance-audit/audit-x`). Logique pure, sans dépendance à Next.
 */

export type CmsExternalHref =
  `https://${string}` | `http://${string}` | `mailto:${string}` | `tel:${string}` | `#${string}`

export type CmsInternalMatch<P extends string = string> = {
  pathname: P
  params?: Record<string, string>
  query?: Record<string, string>
}

const EXTERNAL = /^(https?:|mailto:|tel:|#)/

export function isExternalCmsHref(href: string): href is CmsExternalHref {
  return EXTERNAL.test(href)
}

type Pattern<P extends string> = { pathname: P; regex: RegExp; params: string[]; dynamic: number }

function compile<P extends string>(pathname: P): Pattern<P> {
  const params: string[] = []
  const source = pathname
    .split('/')
    .map((segment) => {
      const param = /^\[(\w+)\]$/.exec(segment)
      if (param?.[1]) {
        params.push(param[1])
        return '([^/]+)'
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return { pathname, regex: new RegExp(`^${source}$`), params, dynamic: params.length }
}

/** Valeurs décodées des paramètres ; `null` si un segment est mal encodé. */
function decodeParams(names: readonly string[], result: RegExpExecArray) {
  try {
    return Object.fromEntries(
      names.map((name, index) => [name, decodeURIComponent(result[index + 1] ?? '')]),
    )
  } catch {
    return null
  }
}

/**
 * Construit un résolveur pour une liste de chemins internes (clés de `pathnames`).
 * Les chemins statiques l'emportent sur les chemins à paramètres.
 */
export function createCmsPathMatcher<P extends string>(pathnames: readonly P[]) {
  const patterns = pathnames.map(compile).sort((a, b) => a.dynamic - b.dynamic)

  return function match(href: string): CmsInternalMatch<P> | null {
    const trimmed = href.trim()
    if (trimmed === '' || !trimmed.startsWith('/')) return null
    const [pathAndQuery = ''] = trimmed.split('#')
    const [rawPath = '', rawQuery] = pathAndQuery.split('?')
    const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath
    const query = rawQuery ? Object.fromEntries(new URLSearchParams(rawQuery)) : undefined

    for (const pattern of patterns) {
      const result = pattern.regex.exec(path)
      if (!result) continue
      const params = pattern.params.length ? decodeParams(pattern.params, result) : undefined
      // Segment mal encodé (`%E0%A4%A`) : lien ignoré comme une route inconnue (MAJ-3).
      if (params === null) return null
      return {
        pathname: pattern.pathname,
        ...(params ? { params } : {}),
        ...(query && Object.keys(query).length ? { query } : {}),
      }
    }
    return null
  }
}
