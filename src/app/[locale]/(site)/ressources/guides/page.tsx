import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { EmptyState } from '@/components/ui/EmptyState'
import { Container, Section } from '@/components/ui/Layout'

import { PageHeader } from '../../_components/PageHeader'
import { getRecentResources, ResourceList } from '../../_components/ResourceList'
import { pageMetadata, localeParams, resolveLocale } from '../../_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.guides' })
  return pageMetadata({
    locale,
    route: '/ressources/guides',
    title: t('title'),
    description: t('lead'),
  })
}

/** Index des guides téléchargeables (ADR 009). */
export default async function GuidesPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const [t, tr, guides] = await Promise.all([
    getTranslations('site.guides'),
    getTranslations('site.resources'),
    getRecentResources(locale, ['guides'], 100),
  ])
  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tr('home'), href: '/' },
          { label: tr('title'), href: '/ressources' },
          { label: t('title') },
        ]}
        title={t('title')}
        lead={t('lead')}
      />
      <Section>
        <Container>
          {guides.length ? (
            <ResourceList items={guides} locale={locale} headingLevel={2} />
          ) : (
            <EmptyState title={t('empty')} />
          )}
        </Container>
      </Section>
    </>
  )
}
