import { getTranslations } from 'next-intl/server'

import { PillarIndex, type Pillar } from '@/components/patterns/PillarIndex'
import { Container, Section, SectionHeader } from '@/components/ui/Layout'
import type { Href } from '@/components/ui/Link'
import { releasedRoute } from '@/features/site/routes'
import type { Service } from '@/payload-types'

import { pillarHubPath, quoteHref, serviceHref } from '../../_lib/href'
import { pillarActionHref } from '../../_lib/pillars'
import { type BlockContext, type BlockOf, populated } from './types'

const order = ['formation', 'audit', 'conseil', 'takaful'] as const

/**
 * Offres du pôle Formation : route cible et repli tant qu'elle n'est pas livrée (ADR 016).
 * Sans repli, l'offre est retirée de l'index jusqu'à la livraison de sa route.
 */
const formationOffers: ReadonlyArray<{
  key: 'courses' | 'business' | 'inPerson'
  route: '/formation/cours' | '/formation/entreprises' | '/formation/presentiel'
  fallback: Href | null
}> = [
  { key: 'courses', route: '/formation/cours', fallback: '/formation' },
  { key: 'business', route: '/formation/entreprises', fallback: quoteHref('formation-entreprise') },
  { key: 'inPerson', route: '/formation/presentiel', fallback: null },
]

/**
 * Index éditorial des pôles (DESIGN §8) : un pôle par ligne, trois offres en liens et
 * l'appel à l'action propre au pôle (s'abonner, devis d'audit, rendez-vous, être rappelé).
 * La formation n'a pas de fiches de service : ses offres pointent vers le catalogue, ou
 * vers leur repli tant que le catalogue n'est pas livré (`formationOffers`).
 */
export async function PillarIndexBlock({
  block,
  context,
}: {
  block: BlockOf<'pillarIndex'>
  context: BlockContext
}) {
  const t = await getTranslations({ locale: context.locale, namespace: 'site.pillars' })
  const services = (block.services ?? []).filter(populated<Service>)

  const pillars: Pillar[] = order.flatMap((id): Pillar[] => {
    const offers =
      id === 'formation'
        ? formationOffers.flatMap(({ key, route, fallback }) => {
            const href = releasedRoute(route) ?? fallback
            return href ? [{ label: t(`formation.offers.${key}`), href }] : []
          })
        : services
            .filter((service) => service.pillar === id)
            .slice(0, 3)
            .map((service) => ({ label: service.title, href: serviceHref(id, service.slug) }))
    if (offers.length === 0) return []
    return [
      {
        id,
        title: t(`${id}.title`),
        summary: t(`${id}.summary`),
        href: pillarHubPath[id],
        offers,
        action: { label: t(`${id}.action`), href: pillarActionHref[id] },
      },
    ]
  })

  if (pillars.length === 0) return null
  return (
    <Section aria-labelledby={`bloc-${context.index}`}>
      <Container>
        <SectionHeader id={`bloc-${context.index}`} title={block.title ?? t('title')} />
        <PillarIndex pillars={pillars} headingLevel={3} />
      </Container>
    </Section>
  )
}
