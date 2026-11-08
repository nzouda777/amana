import type { FieldHook, TextField } from 'payload'

import { isSuperAdmin } from '../access'

type PublicTokenOptions = {
  name: string
  label: { fr: string; en: string }
  generate: () => string
}

/**
 * Identifiant public non devinable (≥ 128 bits), généré côté serveur à la création,
 * jamais modifiable ensuite.
 */
export function publicTokenField({ name, label, generate }: PublicTokenOptions): TextField {
  const assignOnCreate: FieldHook = ({ operation, value, originalDoc }) => {
    if (operation === 'create')
      return typeof value === 'string' && value !== '' ? value : generate()
    const previous: unknown = originalDoc?.[name]
    return typeof previous === 'string' ? previous : value
  }

  return {
    name,
    type: 'text',
    label,
    unique: true,
    index: true,
    access: { update: isSuperAdmin },
    admin: { readOnly: true, position: 'sidebar' },
    hooks: { beforeChange: [assignOnCreate] },
  }
}
