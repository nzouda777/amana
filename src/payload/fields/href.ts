import { createCmsPathMatcher, isExternalCmsHref } from '@/features/site/cms-href'
import { pathnames } from '@/lib/i18n/routing'

// Toutes les routes déclarées, livrées ou non : un lien vers une route à venir (catalogue,
// panier) peut être préparé dans le back-office ; il reste masqué au rendu jusqu'à la
// livraison de la route (`cmsHref`, ADR 016). Seuls les liens qu'aucune version du site ne
// saurait résoudre sont refusés.
const matchDeclared = createCmsPathMatcher(Object.keys(pathnames))

export const HREF_HELP = {
  fr: 'Chemin interne en français (ex. /audit-conformite ou /devis?type=audit) ou URL commençant par https://, mailto:, tel: ou #. Un lien vers une page pas encore ouverte (cours, panier, compte) est masqué jusqu’à son ouverture.',
  en: 'Internal French path (e.g. /audit-conformite or /devis?type=audit) or a URL starting with https://, mailto:, tel: or #. A link to a page not yet open (courses, cart, account) stays hidden until it opens.',
}

/**
 * `validate` des champs `href` saisis dans le CMS (navigation, pied de page, blocs).
 * Remplace la validation par défaut du champ texte : gère donc aussi `required`.
 * Aucun effet sur le schéma de la base.
 */
export function validateCmsHref(
  value: string | null | undefined,
  { required }: { required?: boolean | undefined } = {},
): true | string {
  const href = value?.trim() ?? ''
  if (href === '') return required ? 'Lien requis.' : true
  if (isExternalCmsHref(href)) return true
  if (!href.startsWith('/'))
    return 'Lien invalide : commencez par / (page du site) ou par https://, mailto:, tel: ou #.'
  if (!matchDeclared(href))
    return 'Lien invalide : cette page n’existe pas ou l’adresse est mal encodée. Utilisez la route française (ex. /audit-conformite/mon-service).'
  return true
}
