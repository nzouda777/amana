import { CalendarClock, Clock, FileText, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { FAQ } from '@/components/patterns/FAQ'
import { whatsappHref } from '@/components/patterns/WhatsAppButton'
import { Container, Section } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { contactSubjects, type ContactSubject } from '@/features/leads/schemas'
import { richTextToParagraphs } from '@/features/site/rich-text'
import { typographyFr } from '@/lib/typography'

import { ContactForm } from '../_components/forms/ContactForm'
import { PageHeader } from '../_components/PageHeader'
import { StaticMap } from '../_components/StaticMap'
import { getFaqsByTopic, getSiteGlobals } from '../_data/queries'
import { formatPhone, whatsappNumber } from '../_lib/chrome'
import { pageMetadata, resolveLocale } from '../_lib/page'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ sujet?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.contact' })
  return pageMetadata({ locale, route: '/contact', title: t('title'), description: t('lead') })
}

function ContactLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-3 [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-green-700">
      {icon}
      <div className="flex flex-col">{children}</div>
    </li>
  )
}

/** Contact : formulaire, coordonnées, WhatsApp, rendez-vous, carte légère, FAQ. */
export default async function ContactPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const query = await searchParams
  const requested = Array.isArray(query.sujet) ? query.sujet[0] : query.sujet
  const subject = (contactSubjects as readonly string[]).includes(requested ?? '')
    ? (requested as ContactSubject)
    : 'contact'

  const [t, { settings }, faqs] = await Promise.all([
    getTranslations('site.contact'),
    getSiteGlobals(locale),
    getFaqsByTopic('general', locale),
  ])
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)
  const contact = settings.contact
  const phone = contact?.phone?.replace(/[^\d+]/g, '')
  const whatsapp = whatsappNumber(settings)
  const place = [settings.organizationName, contact?.city, contact?.country]
    .filter(Boolean)
    .join(' ')
  const mapHref = (
    contact?.mapUrl?.startsWith('https://')
      ? contact.mapUrl
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
  ) as `https://${string}`

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('home'), href: '/' }, { label: t('title') }]}
        title={t('title')}
        lead={t('lead')}
      />
      <Section>
        <Container className="grid gap-16 lg:grid-cols-12 lg:gap-gutter">
          <div className="flex flex-col gap-8 lg:col-span-7">
            <h2 className="text-h2">{t('formTitle')}</h2>
            <ContactForm subject={subject} sourcePage="/contact" />
          </div>
          <aside
            aria-labelledby="coordonnees"
            className="flex flex-col gap-10 lg:col-span-4 lg:col-start-9"
          >
            <div className="flex flex-col gap-6">
              <h2 id="coordonnees" className="text-h3">
                {t('detailsTitle')}
              </h2>
              <ul className="flex flex-col gap-5 text-body">
                {contact?.address ? (
                  <ContactLine icon={<MapPin aria-hidden="true" />}>
                    {[
                      ...contact.address.split('\n'),
                      [contact.city, contact.country].filter(Boolean).join(', '),
                    ].map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </ContactLine>
                ) : null}
                {phone ? (
                  <ContactLine icon={<Phone aria-hidden="true" />}>
                    <Link
                      href={`tel:${phone}`}
                      variant="quiet"
                      tone="ink"
                      dir="ltr"
                      className="self-start"
                    >
                      {formatPhone(phone)}
                    </Link>
                  </ContactLine>
                ) : null}
                {contact?.email ? (
                  <ContactLine icon={<Mail aria-hidden="true" />}>
                    <Link
                      href={`mailto:${contact.email}`}
                      variant="quiet"
                      tone="ink"
                      dir="ltr"
                      className="self-start"
                    >
                      {contact.email}
                    </Link>
                  </ContactLine>
                ) : null}
                {whatsapp ? (
                  <ContactLine icon={<MessageCircle aria-hidden="true" />}>
                    <Link
                      href={whatsappHref(whatsapp, t('whatsappMessage'))}
                      variant="quiet"
                      tone="ink"
                      target="_blank"
                      className="self-start"
                    >
                      {t('whatsapp')}
                    </Link>
                  </ContactLine>
                ) : null}
                {contact?.openingHours ? (
                  <ContactLine icon={<Clock aria-hidden="true" />}>
                    <span>{fr(contact.openingHours)}</span>
                  </ContactLine>
                ) : null}
              </ul>
            </div>
            <div className="flex flex-col gap-3 border-t border-line pt-8">
              <Link href="/rendez-vous" variant="standalone" className="gap-2">
                <CalendarClock aria-hidden="true" className="size-5" />
                {t('appointment')}
              </Link>
              <Link href="/devis" variant="standalone" className="gap-2">
                <FileText aria-hidden="true" className="size-5" />
                {t('quote')}
              </Link>
            </div>
            <StaticMap href={mapHref} label={t('map')} caption={t('mapCaption')} />
          </aside>
        </Container>
      </Section>
      {faqs.length ? (
        <Section tone="sand" aria-labelledby="faq-contact">
          <Container>
            <FAQ
              id="faq-contact"
              structuredData
              items={faqs.map((faq) => ({
                id: String(faq.id),
                question: fr(faq.question),
                answer: fr(richTextToParagraphs(faq.answer)),
              }))}
            />
          </Container>
        </Section>
      ) : null}
    </>
  )
}
