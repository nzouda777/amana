import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Logo } from '@/components/brand/Logo'
import { Link, type ExternalHref, type Href } from '@/components/ui/Link'

export type FooterLink = { label: string; href: Href }
export type FooterColumn = { title: string; links: readonly FooterLink[] }

export type FooterContact = {
  /** Adresse postale, une ligne par entrée. TODO(client) : adresse exacte. */
  address?: readonly string[]
  phone?: { label: string; href: `tel:${string}` }
  email?: { label: string; href: `mailto:${string}` }
  whatsapp?: { label: string; href: `https://${string}` }
}

export type SiteFooterProps = {
  /** Plan du site, trois ou quatre colonnes. */
  columns: readonly FooterColumn[]
  contact: FooterContact
  social?: readonly { label: string; href: ExternalHref }[]
  legalLinks: readonly FooterLink[]
  /** Formulaire d'inscription à la lettre d'information (fourni par le site, M2). */
  newsletter?: ReactNode
  /** Texte d'accroche de la lettre (global `footer`) ; message par défaut sinon. */
  newsletterText?: string
  /** Avertissement (global `legal-disclaimer`) ; message par défaut sinon. */
  disclaimer?: string
  year: number
}

/**
 * Pied de page (DESIGN §9) : plan, coordonnées, lettre d'information, avertissement
 * « ni fatwa ni conseil financier personnalisé » (CLAUDE.md, garde-fous métier).
 */
export function SiteFooter({
  columns,
  contact,
  social,
  legalLinks,
  newsletter,
  newsletterText,
  disclaimer,
  year,
}: SiteFooterProps) {
  const t = useTranslations('footer')
  return (
    <footer className="on-dark bg-green-700 text-paper">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-12 lg:gap-gutter lg:py-24">
        <div className="flex flex-col gap-6 lg:col-span-4 lg:pe-12">
          <Logo variant="inverse" size="lg" className="self-start" />
          <p className="text-body text-sand-300">{t('tagline')}</p>
          {newsletter ? (
            // Masqué quand la page propose déjà sa propre inscription (`data-page-newsletter`) :
            // un seul formulaire de lettre par page (article, hub Formation).
            <div className="flex flex-col gap-3 pt-2 [body:has([data-page-newsletter])_&]:hidden">
              <h2 className="font-sans text-h4">{t('newsletterTitle')}</h2>
              <p className="text-small text-green-50">{newsletterText ?? t('newsletterText')}</p>
              {newsletter}
            </div>
          ) : null}
        </div>

        <nav aria-label={t('siteMap')} className="grid gap-10 sm:grid-cols-3 lg:col-span-5">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h2 className="font-sans text-small font-semibold text-sand-300">{column.title}</h2>
              <ul className="flex flex-col">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      variant="quiet"
                      tone="light"
                      className="inline-flex min-h-11 items-center text-small"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-3 lg:col-span-3">
          <h2 className="font-sans text-small font-semibold text-sand-300">{t('contactTitle')}</h2>
          <address className="flex flex-col gap-1 text-small not-italic">
            {contact.address?.length ? (
              <p className="flex gap-3 py-2.5">
                <MapPin aria-hidden="true" className="size-5 text-gold-500" />
                <span>
                  {contact.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </p>
            ) : null}
            {contact.phone ? (
              <ContactLink href={contact.phone.href} icon={<Phone aria-hidden="true" />} ltr>
                {contact.phone.label}
              </ContactLink>
            ) : null}
            {contact.email ? (
              <ContactLink href={contact.email.href} icon={<Mail aria-hidden="true" />} ltr>
                {contact.email.label}
              </ContactLink>
            ) : null}
            {contact.whatsapp ? (
              <ContactLink href={contact.whatsapp.href} icon={<MessageCircle aria-hidden="true" />}>
                {contact.whatsapp.label}
              </ContactLink>
            ) : null}
          </address>
          {social?.length ? (
            <ul aria-label={t('social')} className="mt-2 flex flex-wrap gap-x-5">
              {social.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    variant="quiet"
                    tone="light"
                    className="inline-flex min-h-11 items-center text-small"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="border-t border-paper/20">
        <div className="container-page flex flex-col gap-6 py-8 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <p className="max-w-measure text-small text-sand-300">{disclaimer ?? t('disclaimer')}</p>
          <div className="flex flex-col gap-2 lg:items-end">
            <ul className="flex flex-wrap gap-x-5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    variant="quiet"
                    tone="light"
                    className="inline-flex min-h-11 items-center text-small"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-small text-green-50">{t('copyright', { year })}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function ContactLink({
  href,
  icon,
  ltr = false,
  children,
}: {
  href: ExternalHref
  icon: ReactNode
  /** Numéros et adresses e-mail : toujours de gauche à droite, même en arabe. */
  ltr?: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      variant="quiet"
      tone="light"
      className="inline-flex min-h-11 items-center gap-3 [&_svg.lucide]:size-5 [&_svg.lucide]:text-gold-500"
    >
      {icon}
      <span dir={ltr ? 'ltr' : undefined}>{children}</span>
    </Link>
  )
}
