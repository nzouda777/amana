import path from 'node:path'

import type { CollectionConfig } from 'payload'

import { anyone, isCourseStaff } from '../access'
import { revalidateCollection } from '../hooks/revalidate'
import { groups, l } from '../shared'

/** Médias publics (images). Les fichiers protégés vont dans `documents`. */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: l('Média', 'Media'), plural: l('Médias', 'Media') },
  admin: { group: groups.site },
  access: { read: anyone, create: isCourseStaff, update: isCourseStaff, delete: isCourseStaff },
  hooks: revalidateCollection('media'),
  upload: {
    // Stockage local en développement ; adaptateur objet (S3/R2) en production (ADR 005).
    staticDir: path.resolve(process.cwd(), 'media'),
    // Pas de SVG : risque XSS. Le logo vectoriel est servi depuis `public/brand`.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 768 },
      { name: 'wide', width: 1600 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: l('Texte alternatif', 'Alt text'),
    },
    { name: 'caption', type: 'text', localized: true, label: l('Légende', 'Caption') },
    { name: 'credit', type: 'text', label: l('Crédit', 'Credit') },
  ],
}
