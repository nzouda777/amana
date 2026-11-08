import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Trame } from '@/components/brand/Trame'
import { SiteFooter } from '@/components/patterns/SiteFooter'
import { SiteHeader } from '@/components/patterns/SiteHeader'
import { WhatsAppButton } from '@/components/patterns/WhatsAppButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Container } from '@/components/ui/Layout'
import { cn } from '@/components/ui/cn'
import { Link, linkVariants } from '@/components/ui/Link'
import { getPathname } from '@/lib/i18n/navigation'
import { routing } from '@/lib/i18n/routing'

import { BrandSection, ButtonsSection, FormsSection } from './_sections/Controls'
import {
  DisplaySection,
  NavigationSection,
  OverlaysSection,
  ProseSection,
} from './_sections/Components'
import { demoFooter, demoNavigation } from './_sections/demo-data'
import { ColorsSection, SpacingSection, TypographySection } from './_sections/Foundations'
import { PatternsSection } from './_sections/Patterns'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'styleguide' })
  return {
    title: t('metaTitle'),
    // Page interne : jamais indexée (SPEC §2). La protection en production relève du proxy.
    robots: { index: false, follow: false, nocache: true },
  }
}

const toc = [
  ['couleurs', 'colors'],
  ['typographie', 'typography'],
  ['espacements', 'spacing'],
  ['marque', 'brand'],
  ['boutons', 'buttons'],
  ['formulaires', 'forms'],
  ['superpositions', 'overlays'],
  ['navigation', 'navigation'],
  ['affichage', 'display'],
  ['article', 'prose'],
  ['motifs', 'patterns'],
] as const

export default async function StyleguidePage({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const t = await getTranslations('styleguide')
  const td = await getTranslations('styleguide.demo')

  // Démonstrations interactives : tous les messages, y compris ceux du styleguide
  // (le layout racine n'envoie au client que les espaces de noms du site).
  return (
    <NextIntlClientProvider>
      <SiteHeader
        variant="overlay"
        items={demoNavigation(td)}
        currentId="formation"
        appointmentHref="/rendez-vous"
        searchHref="/recherche"
        accountHref="/espace"
        cartHref="/panier"
        cartCount={2}
      />
      <main id="contenu" tabIndex={-1} className="outline-none">
        {/* Héros : seule animation automatique de la page (tracé de la Trame). */}
        <section className="on-dark relative isolate overflow-hidden bg-green-900 pt-header">
          <Trame
            density={5}
            rows={4}
            animate
            className="absolute end-0 top-header bottom-0 -z-10 w-full opacity-40 md:w-1/2 md:opacity-100"
          />
          <Container className="flex flex-col gap-8 py-24 lg:py-32">
            <h1 className="max-w-lg text-display text-paper">{t('title')}</h1>
            <p className="max-w-md text-body-lg text-sand-300">{t('lead')}</p>
            {/* Route hors `pathnames` (identique dans toutes les locales) : lien construit ici. */}
            <a
              href={`${getPathname({ locale, href: '/styleguide' })}/comparer`}
              className={cn(linkVariants({ variant: 'standalone', tone: 'light' }), 'self-start')}
            >
              {t('compareLink')}
            </a>
          </Container>
        </section>

        <nav aria-label={t('tocLabel')} className="border-b border-line bg-paper">
          <Container>
            <ul className="flex gap-x-6 overflow-x-auto py-2 [scrollbar-width:thin]">
              {toc.map(([anchor, key]) => (
                <li key={anchor} className="shrink-0">
                  <Link
                    href={`#${anchor}`}
                    variant="quiet"
                    tone="ink"
                    className="inline-flex min-h-11 items-center text-small font-semibold"
                  >
                    {t(`sections.${key}.title`)}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </nav>

        <ColorsSection />
        <TypographySection />
        <SpacingSection />
        <BrandSection />
        <ButtonsSection />
        <FormsSection />
        <OverlaysSection />
        <NavigationSection />
        <DisplaySection />
        <ProseSection />
        <PatternsSection />
      </main>
      <SiteFooter
        {...demoFooter(td)}
        year={2026}
        newsletter={
          <form className="flex flex-col gap-2 sm:flex-row" action="#">
            <label htmlFor="sg-newsletter-email" className="sr-only">
              {td('footer.newsletterEmail')}
            </label>
            <Input
              id="sg-newsletter-email"
              type="email"
              autoComplete="email"
              placeholder={td('footer.newsletterEmail')}
              className="sm:flex-1"
            />
            <Button variant="gold" type="submit">
              {td('footer.newsletterSubmit')}
            </Button>
          </form>
        }
      />
      {/* TODO(client) : numéro WhatsApp officiel (global site-settings). */}
      <WhatsAppButton phone="237600000000" />
    </NextIntlClientProvider>
  )
}
