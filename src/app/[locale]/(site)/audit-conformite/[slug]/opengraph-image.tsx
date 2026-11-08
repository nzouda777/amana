import { OG_SIZE, SITE_NAME } from '@/lib/seo/config'

import { serviceOgImage } from '../../_lib/og'

export const alt = SITE_NAME
export const size = OG_SIZE
export const contentType = 'image/png'

/** Image de partage d'une fiche de service. */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  return serviceOgImage('audit', await params)
}
