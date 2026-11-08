import { FileText } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { ButtonLink } from '@/components/ui/Button'
import { Container, Section, SectionHeader } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { typographyFr } from '@/lib/typography'
import type { Guide } from '@/payload-types'

import { getRecentResources, ResourceList } from '../ResourceList'
import { type BlockContext, type BlockOf, populated } from './types'

export async function RecentResourcesBlock({
  block,
  context,
}: {
  block: BlockOf<'recentResources'>
  context: BlockContext
}) {
  const items = await getRecentResources(context.locale, block.types, block.limit)
  if (items.length === 0) return null
  const t = await getTranslations({ locale: context.locale, namespace: 'site.resources' })
  const id = `bloc-${context.index}`
  return (
    <Section aria-labelledby={id}>
      <Container>
        <SectionHeader
          id={id}
          title={block.title}
          action={
            <Link href="/ressources" variant="standalone">
              {t('allResources')}
            </Link>
          }
        />
        <ResourceList items={items} locale={context.locale} />
      </Container>
    </Section>
  )
}

/** Mise en avant d'un guide gratuit : encart sable, lien vers la page de téléchargement. */
export async function GuideCtaBlock({
  block,
  context,
}: {
  block: BlockOf<'guideCta'>
  context: BlockContext
}) {
  const guide = populated<Guide>(block.guide) ? block.guide : null
  if (!guide || guide._status !== 'published') return null
  const t = await getTranslations({ locale: context.locale, namespace: 'site.guides' })
  const fr = (text: string) => (context.locale === 'fr' ? typographyFr(text) : text)
  return (
    <Section spacing="compact">
      <Container>
        <div className="grid gap-6 rounded-panel bg-sand-100 p-6 md:p-10 lg:grid-cols-12 lg:items-center lg:gap-gutter">
          <FileText aria-hidden="true" className="size-10 text-green-700 lg:col-span-1" />
          <div className="flex flex-col gap-3 lg:col-span-8">
            <h2 className="text-h3">{fr(guide.title)}</h2>
            <p className="max-w-measure text-body text-ink-muted">{fr(block.text)}</p>
          </div>
          <div className="lg:col-span-3 lg:justify-self-end">
            <ButtonLink
              href={{ pathname: '/ressources/guides/[slug]', params: { slug: guide.slug } }}
              variant="primary"
            >
              {t('getGuide')}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  )
}
