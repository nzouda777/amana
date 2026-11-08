import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/patterns/SiteFooter'
import { releasedRoute } from '@/features/site/routes'
import { routing } from '@/lib/i18n/routing'
import { getSiteUrl, SITE_NAME } from '@/lib/seo/config'
import { siteGraphJsonLd } from '@/lib/seo/jsonld'
import { localizedPath } from '@/lib/seo/paths'
import { typographyFr } from '@/lib/typography'

import { NewsletterForm } from './_components/forms/NewsletterForm'
import { JsonLd } from './_components/JsonLd'
import { SiteHeaderBar, WhatsAppFloating } from './_components/SiteChrome'
import { getSiteGlobals } from './_data/queries'
import {
  footerColumnsFrom,
  footerContactFrom,
  legalLinksFrom,
  navItemsFrom,
  socialLinksFrom,
  whatsappNumber,
} from './_lib/chrome'

type Props = { children: ReactNode; params: Promise<{ locale: string }> }

/** Carte Twitter par défaut ; titre, description et images par page. */
export function generateMetadata(): Metadata {
  return {
    twitter: { card: 'summary_large_image' },
  }
}

/**
 * Gabarit du site vitrine : en-tête et pied de page alimentés par les globals Payload
 * (navigation, pied de page, réglages, avertissement), bouton WhatsApp contextuel.
 */
export default async function SiteLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const [{ settings, navigation, footer, disclaimer }, t, tm] = await Promise.all([
    getSiteGlobals(locale),
    getTranslations('site.chrome'),
    getTranslations('metadata'),
  ])
  const siteUrl = getSiteUrl()
  const homeUrl = `${siteUrl}${localizedPath(locale, '/')}`
  // Organization + ProfessionalService + WebSite (valeurs provisoires du seed exclues).
  const siteGraph = siteGraphJsonLd({
    siteUrl,
    homeUrl,
    name: settings.organizationName || SITE_NAME,
    legalName: settings.legal?.legalName,
    description: tm('defaultDescription'),
    logoUrl: `${siteUrl}/brand/icon-512.png`,
    email: settings.contact?.email,
    telephone: settings.contact?.phone,
    streetAddress: settings.contact?.address,
    city: settings.contact?.city,
    country: settings.contact?.country,
    sameAs: (settings.social ?? [])
      .map((item) => item.url)
      .filter((url) => url.startsWith('https://')),
    areaServed: ['Cameroun', 'CEMAC', 'Afrique centrale'],
    inLanguage: locale,
  })
  const fr = (text: string) => (locale === 'fr' ? typographyFr(text) : text)
  const items = navItemsFrom(
    navigation,
    {
      formation: t('summaries.formation'),
      audit: t('summaries.audit'),
      conseil: t('summaries.conseil'),
      takaful: t('summaries.takaful'),
      ressources: t('summaries.ressources'),
    },
    {
      formation: t('short.formation'),
      audit: t('short.audit'),
      conseil: t('short.conseil'),
      takaful: t('short.takaful'),
      ressources: t('short.ressources'),
      'a-propos': t('short.a-propos'),
    },
  )
  const whatsapp = whatsappNumber(settings)

  return (
    <>
      <JsonLd data={siteGraph} />
      <SiteHeaderBar
        items={items}
        appointmentHref="/rendez-vous"
        searchHref="/recherche"
        // Compte : la connexion tant que l'espace apprenant (M3.10) n'est pas livré ; panier
        // masqué jusqu'à M4 (ADR 016). Le gabarit est statique : il ne lit pas la session.
        accountHref={releasedRoute('/espace') ?? releasedRoute('/connexion')}
        cartHref={releasedRoute('/panier')}
      />
      <main id="contenu" tabIndex={-1} className="outline-none">
        {children}
      </main>
      {whatsapp ? (
        <WhatsAppFloating
          phone={whatsapp}
          messages={{
            default: t('whatsapp.default'),
            formation: t('whatsapp.formation'),
            audit: t('whatsapp.audit'),
            conseil: t('whatsapp.conseil'),
            takaful: t('whatsapp.takaful'),
            ressources: t('whatsapp.ressources'),
            devis: t('whatsapp.devis'),
          }}
        />
      ) : null}
      <SiteFooter
        columns={footerColumnsFrom(footer)}
        contact={footerContactFrom(settings, t('whatsappLabel'))}
        social={socialLinksFrom(settings, {
          linkedin: 'LinkedIn',
          facebook: 'Facebook',
          x: 'X',
          instagram: 'Instagram',
          youtube: 'YouTube',
          tiktok: 'TikTok',
        })}
        legalLinks={legalLinksFrom(footer)}
        newsletter={<NewsletterForm tone="dark" sourcePage="footer" />}
        newsletterText={footer.newsletterText ? fr(footer.newsletterText) : undefined}
        disclaimer={disclaimer.short ? fr(disclaimer.short) : undefined}
        year={new Date().getFullYear()}
      />
    </>
  )
}
