import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, Section } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { isQuoteType } from '@/features/leads/schemas'

import { QuoteForm } from '../_components/forms/QuoteForm'
import { PageHeader } from '../_components/PageHeader'
import { pageMetadata, resolveLocale } from '../_lib/page'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.quote' })
  return pageMetadata({ locale, route: '/devis', title: t('title'), description: t('lead') })
}

/** Demande de devis en trois étapes ; `?type=audit` pré-sélectionne le type de demande. */
export default async function QuotePage({ params, searchParams }: Props) {
  await resolveLocale(params)
  const query = await searchParams
  const requested = Array.isArray(query.type) ? query.type[0] : query.type
  const t = await getTranslations('site.quote')

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('home'), href: '/' }, { label: t('title') }]}
        title={t('title')}
        lead={t('lead')}
      />
      <Section>
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-gutter">
          <div className="lg:col-span-8">
            <QuoteForm
              initialType={isQuoteType(requested) ? requested : undefined}
              sourcePage="/devis"
            />
          </div>
          <aside
            aria-labelledby="devis-aide"
            className="flex flex-col gap-4 lg:col-span-3 lg:col-start-10"
          >
            <h2 id="devis-aide" className="font-sans text-h4">
              {t('asideTitle')}
            </h2>
            <p className="text-body text-ink-muted">{t('asideText')}</p>
            <Link href="/rendez-vous" variant="standalone">
              {t('asideAppointment')}
            </Link>
            <Link href="/contact" variant="standalone">
              {t('asideContact')}
            </Link>
          </aside>
        </Container>
      </Section>
    </>
  )
}
