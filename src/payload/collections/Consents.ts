import type { CollectionConfig } from 'payload'

import { isSuperAdmin, nobody } from '../access'
import { contentLanguageOptions, groups, l } from '../shared'

/**
 * Journal des consentements, en ajout seul : jamais modifié ni supprimé via l'API.
 * Un retrait de consentement est un nouvel enregistrement `granted: false`.
 */
export const Consents: CollectionConfig = {
  slug: 'consents',
  labels: {
    singular: l('Consentement', 'Consent'),
    plural: l('Journal des consentements', 'Consent log'),
  },
  admin: {
    group: groups.contacts,
    useAsTitle: 'email',
    defaultColumns: ['email', 'purpose', 'granted', 'createdAt'],
  },
  access: { read: isSuperAdmin, create: nobody, update: nobody, delete: nobody },
  indexes: [{ fields: ['email', 'purpose'] }],
  fields: [
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    {
      name: 'purpose',
      type: 'select',
      required: true,
      options: [
        { value: 'newsletter', label: l('Newsletter', 'Newsletter') },
        { value: 'guide-download', label: l('Téléchargement de guide', 'Guide download') },
        { value: 'contact-processing', label: l('Traitement de la demande', 'Request processing') },
        { value: 'analytics', label: l('Mesure d’audience', 'Analytics') },
        { value: 'terms', label: l('CGV / CGU', 'Terms') },
      ],
    },
    { name: 'granted', type: 'checkbox', required: true },
    {
      name: 'wordingVersion',
      type: 'text',
      required: true,
      label: l('Version du texte présenté', 'Wording version'),
    },
    { name: 'locale', type: 'select', options: contentLanguageOptions },
    { name: 'sourcePage', type: 'text' },
    { name: 'ipHash', type: 'text', label: l('Empreinte IP (hachée)', 'IP hash') },
    { name: 'userAgent', type: 'text' },
  ],
}
