import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, Section } from '@/components/ui/Layout'

import { NewsletterConfirm } from '../../_components/forms/NewsletterConfirm'
import { PageHeader } from '../../_components/PageHeader'
import { pageMetadata, resolveLocale } from '../../_lib/page'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.newsletter' })
  return pageMetadata({
    locale,
    route: '/newsletter/confirmation',
    title: t('title'),
    noIndex: true,
  })
}

/** Double opt-in : page ouverte depuis l'e-mail de confirmation (ADR 011). */
export default async function NewsletterConfirmationPage({ params, searchParams }: Props) {
  await resolveLocale(params)
  const query = await searchParams
  const token = (Array.isArray(query.token) ? query.token[0] : query.token) ?? ''
  const t = await getTranslations('site.newsletter')
  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('home'), href: '/' }, { label: t('title') }]}
        title={t('title')}
        lead={t('lead')}
      />
      <Section>
        <Container>
          <div className="max-w-xl">
            <NewsletterConfirm token={token} />
          </div>
        </Container>
      </Section>
    </>
  )
}
