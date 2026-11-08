import { CalendarDays } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Container, Section, SectionHeader } from '@/components/ui/Layout'
import { splitEvents } from '@/features/site/events'
import { getSiteUrl } from '@/lib/seo/config'
import { eventJsonLd } from '@/lib/seo/jsonld'
import { defaultOgImageUrl } from '@/lib/seo/metadata'
import { localizedPath } from '@/lib/seo/paths'
import { typographyFr } from '@/lib/typography'
import type { Event, TeamMember } from '@/payload-types'

import { populated } from '../../_components/blocks/types'
import { JsonLd } from '../../_components/JsonLd'
import { PageHeader } from '../../_components/PageHeader'
import { getWebinars } from '../../_data/queries'
import { pageMetadata, localeParams, resolveLocale } from '../../_lib/page'

type Props = { params: Promise<{ locale: string }> }

export const generateStaticParams = localeParams
/** Bascule « à venir » → « replays » sans publication : régénération horaire. */
export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'site.webinars' })
  return pageMetadata({
    locale,
    route: '/ressources/webinaires',
    title: t('title'),
    description: t('lead'),
  })
}

/** Webinaires : prochains rendez-vous et replays. */
export default async function WebinarsPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const [t, tr, events] = await Promise.all([
    getTranslations('site.webinars'),
    getTranslations('site.resources'),
    getWebinars(locale),
  ])
  const { upcoming, past } = splitEvents(events)
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)
  const when = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Douala',
  })

  const renderEvent = (event: Event, kind: 'upcoming' | 'past') => {
    const speakers = (event.speakers ?? []).filter(populated<TeamMember>)
    return (
      <li
        key={event.id}
        className="grid gap-4 border-t border-line py-8 lg:grid-cols-12 lg:gap-gutter"
      >
        <p className="flex items-start gap-2 text-small font-semibold text-green-700 lg:col-span-3">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <time dateTime={event.startsAt}>{when.format(new Date(event.startsAt))}</time>
        </p>
        <div className="flex flex-col gap-3 lg:col-span-6">
          <h3 className="text-h3">{fr(event.title)}</h3>
          {event.summary ? <p className="text-body text-ink-muted">{fr(event.summary)}</p> : null}
          {speakers.length ? (
            <p className="text-small text-ink-muted">
              {t('speakers', { names: speakers.map((speaker) => speaker.name).join(', ') })}
            </p>
          ) : null}
        </div>
        <div className="lg:col-span-3 lg:justify-self-end">
          <ButtonLink
            href={{ pathname: '/contact', query: { sujet: 'contact' } }}
            variant={kind === 'upcoming' ? 'primary' : 'secondary'}
            size="md"
          >
            {kind === 'upcoming' ? t('register') : t('askReplay')}
          </ButtonLink>
        </div>
      </li>
    )
  }

  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}${localizedPath(locale, '/ressources/webinaires')}`

  return (
    <>
      {/* Données structurées Event : webinaires à venir seulement (les replays sont passés). */}
      {upcoming.map((event) => (
        <JsonLd
          key={event.id}
          data={eventJsonLd({
            siteUrl,
            name: event.title,
            description: event.summary,
            startDate: event.startsAt,
            endDate: event.endsAt,
            url: pageUrl,
            imageUrl: defaultOgImageUrl(siteUrl, locale),
            performers: (event.speakers ?? [])
              .filter(populated<TeamMember>)
              .map((speaker) => speaker.name),
            inLanguage: locale,
            free: !event.product,
          })}
        />
      ))}
      <PageHeader
        breadcrumb={[
          { label: tr('home'), href: '/' },
          { label: tr('title'), href: '/ressources' },
          { label: t('title') },
        ]}
        title={t('title')}
        lead={t('lead')}
      />
      <Section aria-labelledby="a-venir">
        <Container>
          <SectionHeader id="a-venir" title={t('upcoming')} />
          {upcoming.length ? (
            <ul className="border-b border-line">
              {upcoming.map((event) => renderEvent(event, 'upcoming'))}
            </ul>
          ) : (
            <EmptyState title={t('noUpcoming')} description={t('noUpcomingText')} />
          )}
        </Container>
      </Section>
      {past.length ? (
        <Section tone="sand" aria-labelledby="replays">
          <Container>
            <SectionHeader id="replays" title={t('replays')} lead={t('replaysLead')} />
            <ul className="border-b border-line">
              {past.map((event) => renderEvent(event, 'past'))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </>
  )
}
