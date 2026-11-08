import type { GlobalConfig } from 'payload'

import { anyone, isEditorial } from '../access'
import { revalidateGlobalHook } from '../hooks/revalidate'
import { groups, l } from '../shared'

/**
 * Avertissement : le site informe et forme, il ne délivre ni fatwa ni conseil financier
 * personnalisé. Affiché en pied de page, sur Takaful, Ressources et dans les CGV.
 */
export const LegalDisclaimer: GlobalConfig = {
  slug: 'legal-disclaimer',
  label: l('Avertissement', 'Disclaimer'),
  admin: { group: groups.site },
  access: { read: anyone, update: isEditorial },
  hooks: { afterChange: [revalidateGlobalHook('legal-disclaimer')] },
  fields: [
    {
      name: 'short',
      type: 'textarea',
      required: true,
      localized: true,
      label: l('Version courte (pied de page)', 'Short version (footer)'),
      defaultValue:
        'Les contenus de ce site ont une vocation d’information et de formation. Ils ne constituent ni une fatwa ni un conseil financier personnalisé.',
    },
    {
      name: 'full',
      type: 'richText',
      localized: true,
      label: l('Version complète', 'Full version'),
    },
  ],
}
