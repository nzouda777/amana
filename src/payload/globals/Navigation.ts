import type { Field, GlobalConfig } from 'payload'

import { anyone, isEditorial } from '../access'
import { HREF_HELP, validateCmsHref } from '../fields/href'
import { revalidateGlobalHook } from '../hooks/revalidate'
import { groups, l } from '../shared'

export const linkFields = (required = true): Field[] => [
  { name: 'label', type: 'text', required, localized: true, label: l('Libellé', 'Label') },
  {
    name: 'href',
    type: 'text',
    required,
    label: l(
      'Chemin interne (route française, ex. /audit-conformite) ou URL',
      'Internal path or URL',
    ),
    admin: { description: HREF_HELP },
    validate: validateCmsHref,
  },
]

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: l('Navigation', 'Navigation'),
  admin: { group: groups.site },
  access: { read: anyone, update: isEditorial },
  hooks: { afterChange: [revalidateGlobalHook('navigation')] },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: l('Menu principal', 'Main menu'),
      fields: [
        ...linkFields(),
        {
          name: 'children',
          type: 'array',
          label: l('Sous-menu', 'Submenu'),
          fields: [...linkFields(), { name: 'description', type: 'text', localized: true }],
        },
      ],
    },
    {
      name: 'primaryCta',
      type: 'group',
      label: l('Bouton principal', 'Primary button'),
      fields: linkFields(false),
    },
  ],
}
