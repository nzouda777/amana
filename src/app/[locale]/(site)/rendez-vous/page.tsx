import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, Section } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { getServerEnv } from '@/env'

import { CalBooking } from '../_components/CalBooking'
import { PageHeader } from '../_components/PageHeader'
import { pageMetadata, localeParams, resolveLocale } from '../_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.appointment' })
  return pageMetadata({ locale, route: '/rendez-vous', title: t('title'), description: t('lead') })
}

/** Rendez-vous : agenda Cal.com chargé au clic (TODO(client) : compte et types d'événements). */
export default async function AppointmentPage({ params }: Props) {
  await resolveLocale(params)
  const t = await getTranslations('site.appointment')
  const steps = [t('step1'), t('step2'), t('step3')]

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
            <CalBooking username={getServerEnv().NEXT_PUBLIC_CALCOM_LINK} />
          </div>
          <aside
            aria-labelledby="rdv-deroule"
            className="flex flex-col gap-6 lg:col-span-3 lg:col-start-10"
          >
            <h2 id="rdv-deroule" className="font-sans text-h4">
              {t('howTitle')}
            </h2>
            <ol className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-body">
                  <span aria-hidden="true" className="font-display text-h4 text-gold-700 tabular">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col border-t border-line pt-6">
              <Link href="/devis" variant="standalone">
                {t('quote')}
              </Link>
              <Link href="/contact" variant="standalone">
                {t('contact')}
              </Link>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  )
}
