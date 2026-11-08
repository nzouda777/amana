import type { GlobalConfig } from 'payload'

import { findDuplicateFigureKeys, KEY_FIGURE_KEY_PATTERN } from '@/features/content/key-figures'

import { anyone, isEditorial } from '../access'
import { revalidateGlobalHook } from '../hooks/revalidate'
import { groups, l, leadTypeOptions } from '../shared'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: l('Réglages du site', 'Site settings'),
  admin: { group: groups.site },
  access: { read: anyone, update: isEditorial },
  hooks: { afterChange: [revalidateGlobalHook('site-settings')] },
  fields: [
    { name: 'organizationName', type: 'text', required: true, defaultValue: 'Amana Conseil' },
    {
      name: 'tagline',
      type: 'text',
      localized: true,
      defaultValue: 'Éthique, Conformité, Innovation',
      label: l('Signature', 'Tagline'),
    },
    {
      name: 'contact',
      type: 'group',
      label: l('Coordonnées', 'Contact details'),
      fields: [
        { name: 'email', type: 'email', admin: { description: 'TODO(client)' } },
        {
          name: 'phone',
          type: 'text',
          admin: { description: 'TODO(client) — format E.164 (+237…)' },
        },
        {
          name: 'whatsapp',
          type: 'text',
          admin: { description: 'TODO(client) — numéro E.164 sans espaces, pour les liens wa.me' },
        },
        {
          name: 'address',
          type: 'textarea',
          localized: true,
          admin: { description: 'TODO(client)' },
        },
        { name: 'city', type: 'text', defaultValue: 'Douala' },
        { name: 'country', type: 'text', defaultValue: 'Cameroun', localized: true },
        { name: 'mapUrl', type: 'text', label: l('Lien carte', 'Map link') },
        {
          name: 'openingHours',
          type: 'text',
          localized: true,
          label: l('Horaires', 'Opening hours'),
        },
      ],
    },
    {
      name: 'requestRouting',
      type: 'array',
      label: l('Adresse de l’équipe par type de demande', 'Team address per request type'),
      fields: [
        { name: 'leadType', type: 'select', required: true, options: leadTypeOptions },
        { name: 'email', type: 'email', required: true },
      ],
    },
    {
      name: 'social',
      type: 'array',
      label: l('Réseaux sociaux', 'Social networks'),
      admin: { description: 'TODO(client)' },
      fields: [
        {
          name: 'network',
          type: 'select',
          required: true,
          options: ['linkedin', 'facebook', 'x', 'instagram', 'youtube', 'tiktok'].map((value) => ({
            value,
            label: value,
          })),
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'keyFigures',
      type: 'array',
      label: l('Chiffres clés', 'Key figures'),
      admin: {
        description: l(
          'Cités dans les phrases des blocs « Chiffres clés » par leur clé : {{cle}}.',
          'Referenced in “Key figures” block sentences by key: {{key}}.',
        ),
      },
      // Unicité des clés : contrôlée ici plutôt que par un index (lignes d'un tableau).
      validate: (rows: unknown) => {
        if (!Array.isArray(rows)) return true
        const keys = rows.map((row: { key?: unknown }) => ({ key: String(row.key ?? '') }))
        const duplicates = findDuplicateFigureKeys(keys)
        return duplicates.length === 0 ? true : `Clé(s) en double : ${duplicates.join(', ')}.`
      },
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          label: l('Clé', 'Key'),
          admin: { description: l('ex. professionnels-formes', 'e.g. professionnels-formes') },
          validate: (value: string | null | undefined) =>
            value && KEY_FIGURE_KEY_PATTERN.test(value)
              ? true
              : 'Minuscules, chiffres et tirets, en commençant par une lettre.',
        },
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'legal',
      type: 'group',
      label: l('Identité légale', 'Legal identity'),
      fields: [
        {
          name: 'legalName',
          type: 'text',
          admin: { description: 'TODO(client) — raison sociale exacte' },
        },
        { name: 'legalForm', type: 'text', admin: { description: 'TODO(client)' } },
        { name: 'rccm', type: 'text', label: 'RCCM', admin: { description: 'TODO(client)' } },
        { name: 'niu', type: 'text', label: 'NIU', admin: { description: 'TODO(client)' } },
        { name: 'shareCapital', type: 'text', admin: { description: 'TODO(client)' } },
      ],
    },
  ],
}
