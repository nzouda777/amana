import type { MetadataRoute } from 'next'

import { locales } from '@/lib/i18n/config'
import { getSiteUrl } from '@/lib/seo/config'
import { localizedPath } from '@/lib/seo/paths'
import { disallowedRoutes } from '@/lib/seo/sitemap'

/** `robots.txt` : back-office, API, recherche, confirmation, guide de style et compte exclus. */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()
  const localized = locales.flatMap((locale) =>
    disallowedRoutes.map((route) => localizedPath(locale, route)),
  )
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', ...new Set(localized)],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
