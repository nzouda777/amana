import { FileCheck2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { ButtonLink } from '@/components/ui/Button'
import { Container, Section, SectionHeader } from '@/components/ui/Layout'
import { Link, type Href } from '@/components/ui/Link'

import { CTASection, type CTAAction } from './Editorial'
import { FAQ, type FaqItem } from './FAQ'

/* Gabarit commun des pages de service (DESIGN §9) :
   fil d'Ariane, H1 + chapeau, CTA du pôle ; problème ; offre (ancres) ; méthode
   numérotée ; livrables ; cas clients ; FAQ ; bloc CTA + formulaire. Chaque section est
   exportée seule ; `ServiceTemplate` les assemble dans l'ordre. */

export type ServiceHeroProps = {
  breadcrumb: readonly BreadcrumbItem[]
  title: string
  lead: string
  primaryAction: CTAAction
  /** 1 sur une page de service ; 2 si le gabarit est montré dans une autre page. */
  headingLevel?: 1 | 2
}

export function ServiceHero({
  breadcrumb,
  title,
  lead,
  primaryAction,
  headingLevel = 1,
}: ServiceHeroProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <section className="border-b border-line pt-6 pb-16 lg:pb-24">
      <Container className="flex flex-col gap-10">
        <Breadcrumb items={breadcrumb} />
        <div className="flex max-w-xl flex-col gap-6">
          <Heading className="text-h1">{title}</Heading>
          <p className="max-w-measure text-body-lg text-ink-muted">{lead}</p>
          <div>
            <ButtonLink href={primaryAction.href}>{primaryAction.label}</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}

export type ServiceProblemProps = {
  title?: string
  /** Paragraphes : la situation du client, dans ses mots. */
  paragraphs?: readonly string[]
  /** Texte riche (CMS) à la place des paragraphes. */
  content?: ReactNode
}

export function ServiceProblem({ title, paragraphs = [], content }: ServiceProblemProps) {
  const t = useTranslations('ui.service')
  return (
    <Section aria-labelledby="probleme">
      <Container className="grid gap-8 lg:grid-cols-12 lg:gap-gutter">
        <h2 id="probleme" className="text-h2 lg:col-span-4">
          {title ?? t('problem')}
        </h2>
        <div className="flex max-w-measure flex-col gap-5 text-body-lg text-ink lg:col-span-7 lg:col-start-6">
          {content ?? paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </Container>
    </Section>
  )
}

export type ServiceOffer = { id: string; title: string; description: string; href?: Href }

export function ServiceOffers({
  title,
  offers,
  content,
}: {
  title?: string
  offers: readonly ServiceOffer[]
  /** Présentation de l'offre en texte riche (CMS), avant la liste éventuelle. */
  content?: ReactNode
}) {
  const t = useTranslations('ui.service')
  return (
    <Section tone="sand" aria-labelledby="offre">
      <Container>
        <SectionHeader id="offre" title={title ?? t('offers')} />
        {content ? <div className="mb-12">{content}</div> : null}
        {offers.length === 0 ? null : (
          <>
            <nav aria-label={t('offersNav')} className="mb-12">
              <ul className="flex flex-wrap gap-x-6">
                {offers.map((offer) => (
                  <li key={offer.id}>
                    <Link
                      href={`#${offer.id}`}
                      variant="standalone"
                      className="inline-flex min-h-11 items-center"
                    >
                      {offer.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-b border-line">
              {offers.map((offer) => (
                <article
                  key={offer.id}
                  id={offer.id}
                  className="grid scroll-mt-24 gap-4 border-t border-line py-8 lg:grid-cols-12 lg:gap-gutter"
                >
                  <h3 className="text-h3 lg:col-span-5">{offer.title}</h3>
                  <div className="flex flex-col gap-3 lg:col-span-7">
                    <p className="max-w-measure text-body text-ink-muted">{offer.description}</p>
                    {offer.href ? (
                      <Link href={offer.href} variant="standalone" className="self-start">
                        {t('offerDetails', { offer: offer.title })}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </Container>
    </Section>
  )
}

export type MethodStep = { title: string; description: string }

/** Méthode : vraie séquence, la numérotation est légitime (DESIGN §9). */
export function ServiceMethod({
  title,
  intro,
  steps,
}: {
  title?: string
  /** Chapeau facultatif sous le titre. */
  intro?: string
  steps: readonly MethodStep[]
}) {
  const t = useTranslations('ui.service')
  return (
    <Section aria-labelledby="methode">
      <Container>
        <SectionHeader id="methode" title={title ?? t('method')} lead={intro} />
        <ol className="grid gap-x-gutter gap-y-10 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 border-t border-line pt-6">
              <span aria-hidden="true" className="font-display text-h2 text-gold-700 tabular">
                {index + 1}
              </span>
              <h3 className="font-sans text-h4">
                <span className="sr-only">{t('step', { number: index + 1 })} </span>
                {step.title}
              </h3>
              <p className="text-body text-ink-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}

export function ServiceDeliverables({
  title,
  items,
}: {
  title?: string
  items: readonly string[]
}) {
  const t = useTranslations('ui.service')
  return (
    <Section tone="sand" spacing="compact" aria-labelledby="livrables">
      <Container className="grid gap-8 lg:grid-cols-12 lg:gap-gutter">
        <h2 id="livrables" className="text-h2 lg:col-span-4">
          {title ?? t('deliverables')}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-body">
              <FileCheck2 aria-hidden="true" className="mt-0.5 size-5 text-green-700" />
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

export type ServiceCase = { title: string; client: string; summary: string; href: Href }

export function ServiceCases({
  title,
  cases,
  limit = 3,
}: {
  title?: string
  cases: readonly ServiceCase[]
  /** Nombre affiché (1 à 3 sur une page de service ; tous sur l'index des cas clients). */
  limit?: number
}) {
  const t = useTranslations('ui.service')
  if (cases.length === 0) return null
  return (
    <Section aria-labelledby="cas-clients">
      <Container>
        <SectionHeader id="cas-clients" title={title ?? t('cases')} />
        <ul className="grid gap-x-gutter gap-y-10 lg:grid-cols-3">
          {cases.slice(0, limit).map((item) => (
            <li
              key={item.title}
              className="group relative flex flex-col gap-3 border-t border-green-700 pt-6"
            >
              <p className="text-small text-ink-muted">{item.client}</p>
              <h3 className="text-h3">
                <Link
                  href={item.href}
                  variant="quiet"
                  tone="ink"
                  className="after:absolute after:inset-0 after:content-[''] group-is-hover:underline"
                >
                  {item.title}
                </Link>
              </h3>
              <p className="text-body text-ink-muted">{item.summary}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

export type ServiceTemplateProps = {
  hero: ServiceHeroProps
  problem: ServiceProblemProps
  offers: readonly ServiceOffer[]
  /** Présentation de l'offre en texte riche (fiche de service). */
  offerContent?: ReactNode
  /** Étapes ; section masquée si vide (hub de pôle). */
  method?: readonly MethodStep[]
  /** Livrables ; section masquée si vide. */
  deliverables?: readonly string[]
  cases?: readonly ServiceCase[]
  /** Encart affiché sous le héros (avertissement Takaful). */
  notice?: ReactNode
  faq: readonly FaqItem[]
  cta: { title: string; text?: string; primaryAction: CTAAction; secondaryAction?: CTAAction }
  /** Formulaire de demande en ligne (fourni par le site, M2). */
  form?: ReactNode
}

/** Page de service complète, dans l'ordre du gabarit commun. */
export function ServiceTemplate({
  hero,
  problem,
  offers,
  offerContent,
  method = [],
  deliverables = [],
  cases = [],
  faq,
  cta,
  form,
  notice,
}: ServiceTemplateProps) {
  return (
    <>
      <ServiceHero {...hero} />
      {notice}
      <ServiceProblem {...problem} />
      {offers.length > 0 || offerContent ? (
        <ServiceOffers offers={offers} content={offerContent} />
      ) : null}
      {method.length > 0 ? <ServiceMethod steps={method} /> : null}
      {deliverables.length > 0 ? <ServiceDeliverables items={deliverables} /> : null}
      <ServiceCases cases={cases} />
      {faq.length > 0 ? (
        <Section aria-labelledby="faq">
          <Container>
            <FAQ id="faq" items={faq} structuredData />
          </Container>
        </Section>
      ) : null}
      <CTASection id="contact-pole" {...cta} form={form} />
    </>
  )
}
