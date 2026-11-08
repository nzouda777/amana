import type { Block, Field } from 'payload'

import { findUnknownFigureKeys } from '@/features/content/key-figures'

import { editorialEditor } from '../fields/editors'
import { HREF_HELP, validateCmsHref } from '../fields/href'

/**
 * Blocs de mise en page de la collection `pages` (gabarits DESIGN §9).
 * Structure partagée entre locales ; seuls les textes sont localisés.
 */

const cta: Field = {
  name: 'cta',
  type: 'group',
  label: { fr: 'Appel à l’action', en: 'Call to action' },
  fields: [
    { name: 'label', type: 'text', localized: true, label: { fr: 'Libellé', en: 'Label' } },
    {
      name: 'href',
      type: 'text',
      label: { fr: 'Lien (chemin interne ou URL)', en: 'Link (internal path or URL)' },
      admin: { description: HREF_HELP },
      validate: validateCmsHref,
    },
  ],
}

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: { fr: 'Héros', en: 'Hero' }, plural: { fr: 'Héros', en: 'Heroes' } },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Titre', en: 'Title' },
    },
    { name: 'lead', type: 'textarea', localized: true, label: { fr: 'Chapeau', en: 'Lead' } },
    { name: 'image', type: 'upload', relationTo: 'media' },
    cta,
    { ...cta, name: 'secondaryCta', label: { fr: 'Action secondaire', en: 'Secondary action' } },
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: { fr: 'Texte', en: 'Text' }, plural: { fr: 'Textes', en: 'Texts' } },
  fields: [
    {
      name: 'content',
      type: 'richText',
      editor: editorialEditor,
      required: true,
      localized: true,
    },
  ],
}

export const PillarIndexBlock: Block = {
  slug: 'pillarIndex',
  labels: {
    singular: { fr: 'Index des pôles', en: 'Pillar index' },
    plural: { fr: 'Index des pôles', en: 'Pillar indexes' },
  },
  fields: [
    { name: 'title', type: 'text', localized: true, label: { fr: 'Titre', en: 'Title' } },
    { name: 'services', type: 'relationship', relationTo: 'services', hasMany: true },
  ],
}

export const StatsBlock: Block = {
  slug: 'stats',
  labels: {
    singular: { fr: 'Chiffres clés', en: 'Key figures' },
    plural: { fr: 'Chiffres clés', en: 'Key figures' },
  },
  fields: [
    {
      name: 'sentence',
      type: 'textarea',
      required: true,
      localized: true,
      label: {
        fr: 'Phrase (chiffres depuis les réglages du site)',
        en: 'Sentence (figures from site settings)',
      },
      admin: {
        description: {
          fr: 'Citez un chiffre par sa clé entre doubles accolades, ex. « plus de {{professionnels-formes}} professionnels ». Les clés se définissent dans Réglages du site › Chiffres clés.',
          en: 'Reference a figure by its key in double braces, e.g. “over {{professionnels-formes}} professionals”. Keys are defined in Site settings › Key figures.',
        },
      },
      // ADR 010 : une phrase ne peut citer qu'une clé existante au moment de l'enregistrement.
      validate: async (value: string | null | undefined, { req }) => {
        if (!value) return 'Phrase requise.'
        const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, req })
        const unknown = findUnknownFigureKeys(value, settings.keyFigures ?? [])
        if (unknown.length === 0) return true
        return `Clé(s) inconnue(s) dans les chiffres clés : ${unknown.join(', ')}.`
      },
    },
  ],
}

export const FeaturedCoursesBlock: Block = {
  slug: 'featuredCourses',
  labels: {
    singular: { fr: 'Cours à la une', en: 'Featured courses' },
    plural: { fr: 'Cours à la une', en: 'Featured courses' },
  },
  fields: [
    { name: 'title', type: 'text', localized: true, label: { fr: 'Titre', en: 'Title' } },
    { name: 'courses', type: 'relationship', relationTo: 'courses', hasMany: true, maxRows: 6 },
  ],
}

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  labels: {
    singular: { fr: 'Témoignages', en: 'Testimonials' },
    plural: { fr: 'Témoignages', en: 'Testimonials' },
  },
  fields: [
    { name: 'title', type: 'text', localized: true, label: { fr: 'Titre', en: 'Title' } },
    { name: 'items', type: 'relationship', relationTo: 'testimonials', hasMany: true },
  ],
}

export const CaseStudiesBlock: Block = {
  slug: 'caseStudies',
  labels: {
    singular: { fr: 'Cas clients', en: 'Case studies' },
    plural: { fr: 'Cas clients', en: 'Case studies' },
  },
  fields: [
    { name: 'title', type: 'text', localized: true, label: { fr: 'Titre', en: 'Title' } },
    { name: 'items', type: 'relationship', relationTo: 'case-studies', hasMany: true },
  ],
}

export const PartnersBlock: Block = {
  slug: 'partners',
  labels: {
    singular: { fr: 'Partenaires', en: 'Partners' },
    plural: { fr: 'Partenaires', en: 'Partners' },
  },
  fields: [
    { name: 'title', type: 'text', localized: true, label: { fr: 'Titre', en: 'Title' } },
    { name: 'items', type: 'relationship', relationTo: 'partners', hasMany: true },
  ],
}

export const FaqBlock: Block = {
  slug: 'faq',
  labels: { singular: { fr: 'FAQ', en: 'FAQ' }, plural: { fr: 'FAQ', en: 'FAQ' } },
  fields: [
    { name: 'title', type: 'text', localized: true, label: { fr: 'Titre', en: 'Title' } },
    { name: 'items', type: 'relationship', relationTo: 'faqs', hasMany: true },
  ],
}

export const CtaBlock: Block = {
  slug: 'ctaSection',
  labels: {
    singular: { fr: 'Section d’appel', en: 'CTA section' },
    plural: { fr: 'Sections d’appel', en: 'CTA sections' },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Titre', en: 'Title' },
    },
    { name: 'text', type: 'textarea', localized: true, label: { fr: 'Texte', en: 'Text' } },
    cta,
  ],
}

export const MediaBlock: Block = {
  slug: 'media',
  labels: { singular: { fr: 'Média', en: 'Media' }, plural: { fr: 'Médias', en: 'Media' } },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text', localized: true, label: { fr: 'Légende', en: 'Caption' } },
  ],
}

/** Méthode : vraie séquence, donc numérotation légitime (DESIGN §9). Mêmes noms que `services.method`. */
export const MethodBlock: Block = {
  slug: 'method',
  labels: {
    singular: { fr: 'Méthode', en: 'Method' },
    plural: { fr: 'Méthodes', en: 'Methods' },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Titre', en: 'Title' },
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      label: { fr: 'Introduction', en: 'Intro' },
    },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 6,
      label: { fr: 'Étapes (dans l’ordre)', en: 'Steps (in order)' },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: { fr: 'Étape', en: 'Step' },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          localized: true,
          label: { fr: 'Texte', en: 'Text' },
        },
      ],
    },
  ],
}

/**
 * Équipe ou comité de conformité. Par défaut, le rendu interroge `team-members` selon le
 * drapeau `isComplianceCommittee` (`features/content/team.ts`) ; `members` permet une
 * sélection manuelle, dans l'ordre choisi.
 */
export const TeamBlock: Block = {
  slug: 'team',
  labels: { singular: { fr: 'Équipe', en: 'Team' }, plural: { fr: 'Équipes', en: 'Teams' } },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Titre', en: 'Title' },
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      label: { fr: 'Introduction', en: 'Intro' },
    },
    {
      name: 'group',
      type: 'select',
      required: true,
      defaultValue: 'team',
      label: { fr: 'Groupe', en: 'Group' },
      options: [
        { value: 'team', label: { fr: 'Équipe (hors comité)', en: 'Team (excluding committee)' } },
        {
          value: 'committee',
          label: { fr: 'Comité de conformité charia', en: 'Sharia compliance committee' },
        },
      ],
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'team-members',
      hasMany: true,
      label: { fr: 'Sélection manuelle (facultatif)', en: 'Manual selection (optional)' },
      admin: {
        description: {
          fr: 'Laisser vide pour afficher automatiquement tous les membres du groupe.',
          en: 'Leave empty to list every member of the group automatically.',
        },
      },
    },
  ],
}

/** Ressources récentes, rendu dynamique (les plus récentes publiées des types cochés). */
export const RecentResourcesBlock: Block = {
  slug: 'recentResources',
  labels: {
    singular: { fr: 'Ressources récentes', en: 'Recent resources' },
    plural: { fr: 'Ressources récentes', en: 'Recent resources' },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Titre', en: 'Title' },
    },
    {
      name: 'limit',
      type: 'number',
      required: true,
      defaultValue: 3,
      min: 1,
      max: 6,
      label: { fr: 'Nombre', en: 'Count' },
    },
    {
      name: 'types',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['articles', 'guides', 'webinars'],
      label: { fr: 'Types inclus', en: 'Included types' },
      options: [
        { value: 'articles', label: { fr: 'Articles', en: 'Articles' } },
        { value: 'guides', label: { fr: 'Guides', en: 'Guides' } },
        { value: 'webinars', label: { fr: 'Webinaires', en: 'Webinars' } },
      ],
    },
  ],
}

/** Mise en avant d'un guide téléchargeable (formulaire de capture au rendu). */
export const GuideCtaBlock: Block = {
  slug: 'guideCta',
  labels: {
    singular: { fr: 'Appel guide', en: 'Guide CTA' },
    plural: { fr: 'Appels guide', en: 'Guide CTAs' },
  },
  fields: [
    { name: 'guide', type: 'relationship', relationTo: 'guides', required: true },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      localized: true,
      label: { fr: 'Accroche', en: 'Hook' },
    },
  ],
}

export const pageBlocks: Block[] = [
  HeroBlock,
  RichTextBlock,
  PillarIndexBlock,
  StatsBlock,
  FeaturedCoursesBlock,
  TestimonialsBlock,
  CaseStudiesBlock,
  PartnersBlock,
  FaqBlock,
  CtaBlock,
  MediaBlock,
  MethodBlock,
  TeamBlock,
  RecentResourcesBlock,
  GuideCtaBlock,
]
