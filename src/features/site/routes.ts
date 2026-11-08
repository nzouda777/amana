import type { AppPathname } from '@/lib/i18n/routing'

/**
 * Routes déclarées dans `pathnames` (next-intl) mais pas encore livrées (ADR 016).
 * Source unique : l'en-tête (Compte, Panier), l'index des pôles et `cmsHref()` (liens
 * saisis dans le CMS) n'affichent aucun lien vers ces routes. Le jalon qui livre une route
 * retire sa ligne ici, et les liens réapparaissent sans autre changement.
 */
export const unreleasedRoutes = [
  // M3 — LMS, groupe `(learn)`. Livrées en M3.4/M3.5/M3.11 : catalogue, fiche cours,
  // parcours, connexion, inscription, mot de passe.
  '/formation/presentiel',
  '/certificats/verifier',
  '/certificats/[code]',
  '/espace',
  '/espace/cours/[slug]/[lesson]',
  // M4 — commerce, groupe `(shop)`
  '/formation/abonnement',
  '/panier',
  '/commande',
  '/commande/[id]/confirmation',
  // M5 — espace entreprise, groupe `(org)`
  '/formation/entreprises',
  '/formation/entreprises/capsules',
  '/organisation',
] as const satisfies readonly AppPathname[]

const unreleased: ReadonlySet<string> = new Set(unreleasedRoutes)

/** La route (clé de `pathnames`, ex. `/formation/cours/[slug]`) est-elle servie ? */
export function isReleasedRoute(pathname: string): boolean {
  return !unreleased.has(pathname)
}

/** Sous-ensemble des chemins internes effectivement servis. */
export function releasedPathnames<P extends string>(pathnames: readonly P[]): P[] {
  return pathnames.filter(isReleasedRoute)
}

/** `pathname` s'il est livré, sinon `undefined` (prop optionnelle d'un composant). */
export function releasedRoute<P extends string>(pathname: P): P | undefined {
  return isReleasedRoute(pathname) ? pathname : undefined
}
