import type { Href } from '@/components/ui/Link'
import type { LeadType, Pillar } from '@/payload/shared'

import { quoteHref } from './href'

/**
 * Appel à l'action propre à chaque pôle (brief client) :
 * formation → s'abonner (nouveautés du catalogue), audit → devis d'audit,
 * conseil → rendez-vous, takaful → être rappelé par un conseiller.
 */
export const pillarActionHref: Record<Pillar, Href> = {
  formation: { pathname: '/formation', hash: 'newsletter' } as unknown as Href,
  audit: quoteHref('audit'),
  conseil: '/rendez-vous',
  takaful: { pathname: '/contact', query: { sujet: 'takaful' } },
}

/** Type de demande par défaut du formulaire en ligne d'un pôle. */
export const pillarLeadType: Record<Exclude<Pillar, 'formation'>, LeadType> = {
  audit: 'audit',
  conseil: 'conseil',
  takaful: 'takaful',
}
