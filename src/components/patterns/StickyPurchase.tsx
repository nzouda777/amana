import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { cn } from '@/components/ui/cn'
import { Price } from '@/components/ui/Price'
import type { Xaf } from '@/lib/money'

export type StickyPurchaseProps = {
  /** Titre du produit, rappelé dans la barre mobile. */
  title: string
  /** Absent : pas de vente à l'unité ; `priceNote` s'affiche à la place du prix. */
  price?: Xaf
  compareAt?: Xaf
  priceNote?: string
  /** Ce qui est inclus (« 12 leçons vidéo », « Certificat vérifiable »). */
  includes: readonly string[]
  /** Action principale (formulaire « Acheter » fourni par le commerce, M4). */
  primaryAction: ReactNode
  /** Action secondaire (« Ajouter au panier »). */
  secondaryAction?: ReactNode
  /** Visuel ou extrait vidéo en tête du panneau. */
  media?: ReactNode
  /** Mention sous les actions (paiement Mobile Money, virement, facture). */
  note?: string
  /**
   * `sticky` : panneau collant (≥ 1024 px) + barre fixe en bas (mobile).
   * `static` : rendu dans le flux, pour /styleguide.
   */
  placement?: 'sticky' | 'static'
  className?: string
}

/**
 * Panneau d'achat de la fiche cours (DESIGN §8 et §9) : collant à droite sur desktop,
 * barre fixe en bas sur mobile. Flotte, donc porte l'ombre `float`. Sur mobile, la
 * page doit réserver l'espace de la barre (`pb-24` sur le `<main>`).
 */
export function StickyPurchase({
  title,
  price,
  compareAt,
  priceNote,
  includes,
  primaryAction,
  secondaryAction,
  media,
  note,
  placement = 'sticky',
  className,
}: StickyPurchaseProps) {
  const t = useTranslations('ui.purchase')
  const isSticky = placement === 'sticky'

  return (
    <>
      <aside
        aria-label={t('label')}
        className={cn(
          'flex flex-col gap-5 rounded-panel border border-line bg-paper p-6',
          isSticky && 'lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)] lg:shadow-float',
          !isSticky && 'shadow-float',
          className,
        )}
      >
        {media ? <div className="-mx-6 -mt-6 overflow-hidden rounded-t-panel">{media}</div> : null}
        {price === undefined ? (
          <p className="font-display text-h3 text-ink">{priceNote}</p>
        ) : (
          <Price amount={price} compareAt={compareAt} size="lg" />
        )}
        <div className="flex flex-col gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
        {note ? <p className="text-small text-ink-muted">{note}</p> : null}
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <h2 className="font-sans text-small font-semibold text-ink">{t('includes')}</h2>
          <ul className="flex flex-col gap-2 text-small text-ink">
            {includes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check aria-hidden="true" className="mt-0.5 size-4 text-green-700" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Barre mobile : prix + action principale, toujours à portée du pouce. */}
      <div
        className={cn(
          'z-30 flex items-center justify-between gap-4 border-t border-line bg-paper px-margin py-3 shadow-float lg:hidden',
          isSticky
            ? 'fixed inset-x-0 bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
            : 'relative mt-6 rounded-panel border',
        )}
      >
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-caption text-ink-muted">{title}</p>
          {price === undefined ? (
            <p className="truncate text-small font-semibold text-ink">{priceNote}</p>
          ) : (
            <Price amount={price} compareAt={compareAt} size="sm" />
          )}
        </div>
        <div className="shrink-0">{primaryAction}</div>
      </div>
    </>
  )
}
