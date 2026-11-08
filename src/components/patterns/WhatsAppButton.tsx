import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/components/ui/cn'

export type WhatsAppButtonProps = {
  /**
   * Numéro international sans « + » ni espaces (ex. 2376XXXXXXXX).
   * TODO(client) : numéro WhatsApp officiel, via le global `site-settings`.
   */
  phone: string
  /** Message prérempli selon la page (SPEC §4.3). */
  message?: string
  /** Masqué dans le lecteur de leçon et pendant un quiz (DESIGN §8). */
  hidden?: boolean
  /** Remonte le bouton au-dessus d'une barre fixe (achat mobile). */
  raised?: boolean
}

export function whatsappHref(phone: string, message?: string): `https://${string}` {
  const digits = phone.replace(/\D/g, '')
  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${query}`
}

/** Bouton flottant WhatsApp, en bas côté fin de ligne (à gauche en arabe). */
export function WhatsAppButton({
  phone,
  message,
  hidden = false,
  raised = false,
}: WhatsAppButtonProps) {
  const t = useTranslations('ui.whatsapp')
  if (hidden) return null
  return (
    // Repère nommé : le bouton flottant est rendu hors de <main> et du pied de page.
    <aside aria-label={t('region')}>
      <a
        href={whatsappHref(phone, message)}
        rel="noopener noreferrer"
        target="_blank"
        className={cn(
          'fixed end-4 z-30 inline-flex h-14 items-center gap-2 rounded-pill bg-green-700 px-4 font-semibold text-paper shadow-float sm:end-6',
          'transition-colors duration-(--duration-hover) ease-standard is-hover:bg-green-800 is-active:bg-green-900',
          raised ? 'bottom-24 lg:bottom-6' : 'bottom-4 sm:bottom-6',
        )}
      >
        <MessageCircle aria-hidden="true" className="size-6" />
        <span className="max-sm:sr-only">{t('label')}</span>
        <span className="sr-only"> {t('newWindow')}</span>
      </a>
    </aside>
  )
}
