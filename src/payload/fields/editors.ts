import {
  BlocksFeature,
  BoldFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

import { l } from '../shared'

/**
 * Éditeurs Lexical. L'éditeur global (`payload.config.ts`) reste celui par défaut ;
 * les textes éditoriaux longs (articles, services, blocs texte des pages) utilisent
 * `editorialEditor`, qui ajoute les blocs Lexical maison.
 */

/** Contenu d'un encadré : texte courant, gras, italique, liens, listes. Pas de bloc imbriqué. */
const calloutContentEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    InlineToolbarFeature(),
  ],
})

/**
 * Encadré dans un texte long. Le champ `richText` parent est localisé en entier :
 * les sous-champs ne portent donc pas `localized`.
 */
export const CalloutBlock: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: l('Encadré', 'Callout'), plural: l('Encadrés', 'Callouts') },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'retenir',
      label: l('Type', 'Variant'),
      options: [
        { value: 'retenir', label: l('À retenir', 'Key point') },
        { value: 'avertissement', label: l('Avertissement', 'Warning') },
      ],
    },
    { name: 'title', type: 'text', label: l('Titre (facultatif)', 'Title (optional)') },
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: calloutContentEditor,
      label: l('Contenu', 'Content'),
    },
  ],
}

export const editorialEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({ blocks: [CalloutBlock] }),
  ],
})
