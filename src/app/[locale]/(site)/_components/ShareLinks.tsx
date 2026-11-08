import { getTranslations } from 'next-intl/server'

import { Link } from '@/components/ui/Link'
import type { Locale } from '@/lib/i18n/config'

/**
 * Partage sans SDK tiers (aucun script, aucun traceur) : simples liens vers les
 * intentions de partage de chaque réseau, ouverts dans un nouvel onglet.
 */
export async function ShareLinks({
  url,
  title,
  locale,
}: {
  url: string
  title: string
  locale: Locale
}) {
  const t = await getTranslations({ locale, namespace: 'site.share' })
  const u = encodeURIComponent(url)
  const text = encodeURIComponent(title)
  const networks = [
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { name: 'X', href: `https://x.com/intent/post?text=${text}&url=${u}` },
  ] as const

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-sans text-small font-semibold text-ink-muted">{t('title')}</h2>
      <ul className="flex flex-wrap gap-x-5">
        {networks.map((network) => (
          <li key={network.name}>
            <Link
              href={network.href as `https://${string}`}
              target="_blank"
              variant="standalone"
              aria-label={t('on', { network: network.name })}
            >
              {network.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
