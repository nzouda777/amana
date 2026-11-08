import { useLocale } from 'next-intl'

import type { BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { isExternalHref } from '@/components/ui/Link'
import { getPathname } from '@/lib/i18n/navigation'
import { getSiteUrl } from '@/lib/seo/config'
import { breadcrumbJsonLd, type JsonLdDocument, serializeJsonLd } from '@/lib/seo/jsonld'

/** Href interne du Link (objet d'URL élargi) ramené au type attendu par `getPathname`. */
type PathnameHref = Parameters<typeof getPathname>[0]['href']

/** Données structurées sérialisées sans risque (`<` échappé). */
export function JsonLd({ data }: { data: JsonLdDocument }) {
  return (
    <script
      type="application/ld+json"
      // Contenu sérialisé et échappé par `serializeJsonLd` : aucune donnée HTML brute.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}

/** `BreadcrumbList` à partir des étapes du fil d'Ariane affiché. */
export function BreadcrumbJsonLd({ items }: { items: readonly BreadcrumbItem[] }) {
  const locale = useLocale()
  const siteUrl = getSiteUrl()
  const entries = items.map((item) => ({
    name: item.label,
    url:
      item.href === undefined
        ? undefined
        : isExternalHref(item.href)
          ? String(item.href)
          : `${siteUrl}${getPathname({ locale, href: item.href as PathnameHref })}`,
  }))
  return <JsonLd data={breadcrumbJsonLd(entries)} />
}
