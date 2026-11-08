import { OG_SIZE, SITE_NAME } from '@/lib/seo/config'

import { homeOgImage } from './(site)/_lib/og'

export const alt = SITE_NAME
export const size = OG_SIZE
export const contentType = 'image/png'

/**
 * Image de partage par défaut (accueil et pages sans image propre). Hors du groupe (site) :
 * Next suffixe les routes de métadonnées situées dans un groupe ; ici l'URL reste stable,
 * `/<locale>/opengraph-image`, et peut être citée par les métadonnées et le JSON-LD.
 */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  return homeOgImage(await params)
}
