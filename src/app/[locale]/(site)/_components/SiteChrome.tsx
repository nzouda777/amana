'use client'

import { useEffect } from 'react'

import { SiteHeader, type NavItem } from '@/components/patterns/SiteHeader'
import { WhatsAppButton } from '@/components/patterns/WhatsAppButton'
import { usePathname, useRouter } from '@/lib/i18n/navigation'

import { SEARCH_INPUT_ID } from '../_lib/search-id'

/**
 * Îlots clients du gabarit : l'en-tête (méga-menu, tiroir) et le bouton WhatsApp ont
 * besoin de la route courante pour le pôle actif, la transparence sur le héros de
 * l'accueil et le message prérempli. Aucun texte ici : tout arrive en props.
 */

/** Pôle ou rubrique d'une route interne (template next-intl, ex. `/audit-conformite/[slug]`). */
export function sectionOf(pathname: string): string | undefined {
  const first = pathname.split('/')[1] ?? ''
  const sections: Record<string, string> = {
    formation: 'formation',
    certificats: 'formation',
    'audit-conformite': 'audit',
    'conseil-accompagnement': 'conseil',
    'takaful-finance': 'takaful',
    ressources: 'ressources',
    'cas-clients': 'ressources',
    'a-propos': 'a-propos',
    devis: 'devis',
    contact: 'devis',
    'rendez-vous': 'devis',
  }
  return sections[first]
}

export function SiteHeaderBar(
  props: Omit<Parameters<typeof SiteHeader>[0], 'currentId' | 'variant' | 'items'> & {
    items: readonly NavItem[]
  },
) {
  const pathname = usePathname()
  const router = useRouter()

  // Raccourci « / » : ouvre la recherche (ou y place le focus), sauf pendant une saisie.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      const input = document.getElementById(SEARCH_INPUT_ID)
      if (input instanceof HTMLInputElement) {
        input.focus()
        input.select()
      } else {
        router.push('/recherche')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [router])

  return (
    <SiteHeader
      {...props}
      currentId={sectionOf(pathname)}
      variant={pathname === '/' ? 'overlay' : 'solid'}
    />
  )
}

export function WhatsAppFloating({
  phone,
  messages,
}: {
  phone: string
  /** Message prérempli par rubrique ; `default` sinon. */
  messages: Record<string, string> & { default: string }
}) {
  const pathname = usePathname()
  const section = sectionOf(pathname)
  const message = (section && messages[section]) || messages.default
  return <WhatsAppButton phone={phone} message={message} />
}
