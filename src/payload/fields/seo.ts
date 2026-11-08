import type { GroupField } from 'payload'

/** Métadonnées SEO localisées, communes à tous les contenus publics. */
export const seoField: GroupField = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: { position: 'sidebar' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      maxLength: 70,
      label: { fr: 'Titre SEO', en: 'SEO title' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      maxLength: 170,
      label: { fr: 'Méta-description', en: 'Meta description' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Image de partage', en: 'Share image' },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
      label: { fr: 'Ne pas indexer', en: 'No index' },
    },
  ],
}
