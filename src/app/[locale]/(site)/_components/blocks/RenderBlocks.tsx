import { Fragment, type ReactNode } from 'react'

import type { Locale } from '../../_data/cache'
import {
  CaseStudiesBlock,
  CtaBlock,
  FaqBlock,
  FeaturedCoursesBlock,
  MediaBlock,
  MethodBlock,
  PartnersBlock,
  RichTextBlock,
  StatsBlock,
  TestimonialsBlock,
} from './EditorialBlocks'
import { HeroBlock } from './HeroBlock'
import { PillarIndexBlock } from './PillarIndexBlock'
import { GuideCtaBlock, RecentResourcesBlock } from './ResourceBlocks'
import { TeamBlock } from './TeamBlock'
import type { BlockContext, LayoutBlock } from './types'

/**
 * Rendu de `pages.layout` : un composant par type de bloc. L'ordre des blocs est celui
 * choisi dans l'admin (le client réorganise sans développeur).
 */
function renderBlock(block: LayoutBlock, context: BlockContext): ReactNode {
  switch (block.blockType) {
    case 'hero':
      return <HeroBlock block={block} context={context} />
    case 'richText':
      return <RichTextBlock block={block} context={context} />
    case 'pillarIndex':
      return <PillarIndexBlock block={block} context={context} />
    case 'stats':
      return <StatsBlock block={block} context={context} />
    case 'featuredCourses':
      return <FeaturedCoursesBlock block={block} context={context} />
    case 'testimonials':
      return <TestimonialsBlock block={block} context={context} />
    case 'caseStudies':
      return <CaseStudiesBlock block={block} context={context} />
    case 'partners':
      return <PartnersBlock block={block} context={context} />
    case 'faq':
      return <FaqBlock block={block} context={context} structuredData={context.firstFaq} />
    case 'ctaSection':
      return <CtaBlock block={block} context={context} />
    case 'media':
      return <MediaBlock block={block} />
    case 'method':
      return <MethodBlock block={block} context={context} />
    case 'team':
      return <TeamBlock block={block} context={context} />
    case 'recentResources':
      return <RecentResourcesBlock block={block} context={context} />
    case 'guideCta':
      return <GuideCtaBlock block={block} context={context} />
  }
}

export function RenderBlocks({
  blocks,
  locale,
  pageSlug,
  startIndex = 0,
}: {
  blocks: readonly LayoutBlock[] | null | undefined
  locale: Locale
  pageSlug: string
  /** Rang du premier bloc quand la page est rendue en plusieurs morceaux. */
  startIndex?: number
}) {
  // Une seule FAQ balisée FAQPage par page : la première du morceau rendu.
  const firstFaq = (blocks ?? []).findIndex((block) => block.blockType === 'faq')
  return (
    <>
      {(blocks ?? []).map((block, index) => (
        <Fragment key={block.id ?? index}>
          {renderBlock(block, {
            locale,
            pageSlug,
            index: startIndex + index,
            firstFaq: index === firstFaq,
          })}
        </Fragment>
      ))}
    </>
  )
}
