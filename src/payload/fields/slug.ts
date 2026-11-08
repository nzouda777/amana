import type { FieldHook, TextField } from 'payload'

import { isValidSlug, slugify } from '@/lib/slug'

type SlugOptions = {
  /** Champ source (même niveau) utilisé si le slug est vide. */
  from?: string
  name?: string
  /** Slug traduit par locale (URL localisée). Vrai par défaut. */
  localized?: boolean
}

export function slugField({
  from = 'title',
  name = 'slug',
  localized = true,
}: SlugOptions = {}): TextField {
  const fillFromSource: FieldHook = ({ value, siblingData }) => {
    if (typeof value === 'string' && value.trim() !== '') return slugify(value)
    const source: unknown = siblingData?.[from]
    return typeof source === 'string' && source.trim() !== '' ? slugify(source) : value
  }

  return {
    name,
    type: 'text',
    label: { fr: 'Slug (URL)', en: 'Slug (URL)' },
    required: true,
    unique: true,
    index: true,
    localized,
    admin: {
      position: 'sidebar',
      description: {
        fr: 'Généré depuis le titre si vide. Minuscules, chiffres et tirets.',
        en: 'Generated from the title when empty. Lowercase, digits and dashes.',
      },
    },
    hooks: { beforeValidate: [fillFromSource] },
    validate: (value: string | null | undefined) =>
      !value || isValidSlug(value) || 'Slug invalide : minuscules, chiffres et tirets uniquement.',
  }
}
