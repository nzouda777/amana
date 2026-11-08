import type { MetadataRoute } from 'next'
import { getTranslations } from 'next-intl/server'

import { defaultLocale } from '@/lib/i18n/config'
import { palette } from '@/styles/palette'

/**
 * Manifeste web (installation, couleur de l'interface mobile). Textes de la locale par
 * défaut ; icônes générées depuis le symbole provisoire `public/brand/symbol.svg`
 * (TODO(client) : régénérer depuis le logo définitif, voir docs/CLIENT-INPUTS.md).
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: defaultLocale, namespace: 'metadata' })
  return {
    name: t('siteName'),
    short_name: t('siteName'),
    description: t('defaultDescription'),
    lang: defaultLocale,
    start_url: `/${defaultLocale}`,
    display: 'browser',
    background_color: palette['sand-100'],
    theme_color: palette['green-700'],
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/brand/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }
}
