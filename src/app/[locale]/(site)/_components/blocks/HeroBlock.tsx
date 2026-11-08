import { Trame } from '@/components/brand/Trame'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/components/ui/cn'
import { Container } from '@/components/ui/Layout'
import { typographyFr } from '@/lib/typography'

import { cmsHref } from '../../_lib/href'
import type { BlockContext, BlockOf } from './types'

/**
 * Héros (DESIGN §9) : aplat green-900. Sur l'accueil, titre `display` et Trame or tracée
 * une fois (seule animation automatique du site) sous un en-tête transparent ; sur les
 * autres pages, titre `h1` et Trame statique discrète.
 */
export function HeroBlock({ block, context }: { block: BlockOf<'hero'>; context: BlockContext }) {
  const home = context.pageSlug === 'accueil'
  const fr = (text: string) => (context.locale === 'fr' ? typographyFr(text) : text)
  const primary = block.cta?.label ? cmsHref(block.cta.href) : null
  const secondary = block.secondaryCta?.label ? cmsHref(block.secondaryCta.href) : null
  const Heading = context.index === 0 ? 'h1' : 'h2'

  return (
    <section
      className={cn(
        'on-dark relative isolate overflow-hidden bg-green-900',
        home ? 'pt-header' : '',
      )}
    >
      {home ? (
        <Trame
          density={5}
          rows={4}
          animate
          className="absolute end-0 top-header bottom-0 -z-10 w-full opacity-40 md:w-1/2 md:opacity-100 xl:w-5/12"
        />
      ) : (
        <Trame
          density={3}
          rows={2}
          className="absolute inset-y-0 end-0 -z-10 hidden w-1/3 opacity-50 lg:block"
        />
      )}
      <Container className={cn('flex flex-col gap-8', home ? 'py-24 lg:py-32' : 'py-16 lg:py-24')}>
        <Heading className={cn('text-paper', home ? 'max-w-lg text-display' : 'max-w-xl text-h1')}>
          {fr(block.title)}
        </Heading>
        {block.lead ? (
          <p className="max-w-md text-body-lg text-sand-300">{fr(block.lead)}</p>
        ) : null}
        {primary || secondary ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {primary && block.cta?.label ? (
              <ButtonLink href={primary} variant="gold">
                {block.cta.label}
              </ButtonLink>
            ) : null}
            {secondary && block.secondaryCta?.label ? (
              <ButtonLink href={secondary} variant="outline-light">
                {block.secondaryCta.label}
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
      </Container>
    </section>
  )
}
