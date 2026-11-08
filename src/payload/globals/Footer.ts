import type { GlobalConfig } from 'payload'

import { anyone, isEditorial } from '../access'
import { revalidateGlobalHook } from '../hooks/revalidate'
import { groups, l } from '../shared'
import { linkFields } from './Navigation'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: l('Pied de page', 'Footer'),
  admin: { group: groups.site },
  access: { read: anyone, update: isEditorial },
  hooks: { afterChange: [revalidateGlobalHook('footer')] },
  fields: [
    {
      name: 'columns',
      type: 'array',
      maxRows: 5,
      label: l('Colonnes', 'Columns'),
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'links', type: 'array', fields: linkFields() },
      ],
    },
    {
      name: 'legalLinks',
      type: 'array',
      label: l('Liens légaux', 'Legal links'),
      fields: linkFields(),
    },
    {
      name: 'newsletterText',
      type: 'textarea',
      localized: true,
      label: l('Texte newsletter', 'Newsletter text'),
    },
  ],
}
