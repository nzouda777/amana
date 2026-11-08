import { getTranslations } from 'next-intl/server'

import { Alert } from '@/components/ui/Feedback'
import { Container } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'

import type { Locale } from '../_data/cache'

/**
 * Avertissement visible (garde-fou métier, CLAUDE.md) : information générale, ni conseil
 * financier personnalisé ni avis religieux. Pages Takaful et Ressources.
 */
export async function Disclaimer({ locale, inline = false }: { locale: Locale; inline?: boolean }) {
  const t = await getTranslations({ locale, namespace: 'site.disclaimer' })
  const alert = (
    <Alert tone="info" title={t('title')}>
      {t('text')}{' '}
      <Link href={{ pathname: '/legal/[slug]', params: { slug: 'avertissement' } }}>
        {t('more')}
      </Link>
    </Alert>
  )
  if (inline) return alert
  return <Container className="pt-8">{alert}</Container>
}
