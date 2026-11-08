import type { NavItem } from '@/components/patterns/SiteHeader'
import type { FooterColumn, FooterContact, FooterLink } from '@/components/patterns/SiteFooter'
import type { ExternalHref } from '@/components/ui/Link'
import type { Footer, Navigation, SiteSetting } from '@/payload-types'

import { cmsHref } from './href'

/** Identifiant de rubrique d'une entrée de menu (pôle actif, méga-menu). */
const navIds: Record<string, string> = {
  '/formation': 'formation',
  '/audit-conformite': 'audit',
  '/conseil-accompagnement': 'conseil',
  '/takaful-finance': 'takaful',
  '/ressources': 'ressources',
  '/a-propos': 'a-propos',
}

/** Menu principal depuis le global `navigation` (liens invalides ignorés). */
export function navItemsFrom(
  navigation: Navigation,
  summaries: Partial<Record<string, string>>,
  /** Libellés courts de la barre (« Audit ») ; le nom complet du CMS titre le méga-menu. */
  shortLabels: Partial<Record<string, string>> = {},
): NavItem[] {
  return (navigation.items ?? []).flatMap((item, index) => {
    const href = cmsHref(item.href)
    if (!href) return []
    const id = navIds[item.href.trim()] ?? `nav-${index}`
    const offers = (item.children ?? []).flatMap((child) => {
      const childHref = cmsHref(child.href)
      return childHref
        ? [{ label: child.label, href: childHref, description: child.description ?? undefined }]
        : []
    })
    return [
      {
        id,
        label: shortLabels[id] ?? item.label,
        href,
        title: item.label,
        summary: summaries[id],
        offers: offers.length > 0 ? offers : undefined,
      },
    ]
  })
}

function linksFrom(links: ReadonlyArray<{ label: string; href: string }> | null | undefined) {
  return (links ?? []).flatMap((link): FooterLink[] => {
    const href = cmsHref(link.href)
    return href ? [{ label: link.label, href }] : []
  })
}

export function footerColumnsFrom(footer: Footer): FooterColumn[] {
  // Une colonne dont tous les liens sont filtrés (routes non livrées) n'est pas rendue.
  return (footer.columns ?? []).flatMap((column): FooterColumn[] => {
    const links = linksFrom(column.links)
    return links.length > 0 ? [{ title: column.title, links }] : []
  })
}

export function legalLinksFrom(footer: Footer): FooterLink[] {
  return linksFrom(footer.legalLinks)
}

/** Numéro E.164 → chiffres seuls (wa.me) ; `null` si absent. */
export function whatsappNumber(settings: SiteSetting): string | null {
  const digits = settings.contact?.whatsapp?.replace(/\D/g, '') ?? ''
  return digits.length >= 8 ? digits : null
}

/** Numéro affiché : `+237 6 00 00 00 00` (groupes lisibles, toujours LTR). */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('237') && digits.length === 12)
    return `+237 ${digits.slice(3, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`
  return phone.startsWith('+') ? phone : `+${digits}`
}

export function footerContactFrom(settings: SiteSetting, whatsappLabel: string): FooterContact {
  const contact = settings.contact
  const address = [
    ...(contact?.address
      ?.split('\n')
      .map((line) => line.trim())
      .filter(Boolean) ?? []),
    [contact?.city, contact?.country].filter(Boolean).join(', '),
  ].filter(Boolean)
  const phone = contact?.phone?.replace(/[^\d+]/g, '')
  const whatsapp = whatsappNumber(settings)
  return {
    address,
    ...(phone ? { phone: { label: formatPhone(phone), href: `tel:${phone}` } } : {}),
    ...(contact?.email ? { email: { label: contact.email, href: `mailto:${contact.email}` } } : {}),
    ...(whatsapp ? { whatsapp: { label: whatsappLabel, href: `https://wa.me/${whatsapp}` } } : {}),
  }
}

export function socialLinksFrom(
  settings: SiteSetting,
  labels: Record<string, string>,
): { label: string; href: ExternalHref }[] {
  return (settings.social ?? []).flatMap((item) => {
    const href = cmsHref(item.url)
    if (!href || typeof href !== 'string' || !href.startsWith('https://')) return []
    return [{ label: labels[item.network] ?? item.network, href: href as ExternalHref }]
  })
}
