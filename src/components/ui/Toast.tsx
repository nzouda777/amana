'use client'

import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Direction, Toast as ToastPrimitive } from 'radix-ui'
import { useSyncExternalStore } from 'react'

import { cn } from './cn'

export type ToastTone = 'success' | 'info' | 'danger'

export type ToastInput = {
  /** Reprend le verbe du bouton : « Ajouter au panier » → « Ajouté au panier » (DESIGN §8). */
  title: string
  description?: string
  tone?: ToastTone
  /** Durée d'affichage en ms (5 s par défaut ; les erreurs restent 8 s). */
  duration?: number
}

type ToastItem = ToastInput & { id: number; open: boolean }

/* Petit magasin hors React : `toast()` est appelable depuis n'importe quel gestionnaire. */
let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const EMPTY: ToastItem[] = []

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Affiche une notification éphémère. Nécessite un `<Toaster />` monté dans la page. */
export function toast(input: ToastInput): number {
  const id = nextId++
  items = [...items, { ...input, id, open: true }]
  emit()
  return id
}

function close(id: number) {
  items = items.map((item) => (item.id === id ? { ...item, open: false } : item))
  emit()
  // Laisse l'animation de sortie se terminer avant de retirer l'élément.
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id)
    emit()
  }, 300)
}

const icons = { success: CircleCheck, info: Info, danger: CircleAlert } as const
const iconTone = { success: 'text-green-700', info: 'text-info', danger: 'text-danger' } as const

/** Zone des notifications (Radix Toast : région annoncée, F8 pour y accéder). */
export function Toaster() {
  const t = useTranslations('ui.toast')
  const dir = Direction.useDirection()
  const toasts = useSyncExternalStore(
    subscribe,
    () => items,
    () => EMPTY,
  )

  return (
    <ToastPrimitive.Provider swipeDirection={dir === 'rtl' ? 'left' : 'right'} label={t('region')}>
      {toasts.map((item) => {
        const tone = item.tone ?? 'success'
        const Icon = icons[tone]
        return (
          <ToastPrimitive.Root
            key={item.id}
            open={item.open}
            onOpenChange={(open) => (open ? undefined : close(item.id))}
            duration={item.duration ?? (tone === 'danger' ? 8000 : 5000)}
            type={tone === 'danger' ? 'foreground' : 'background'}
            className={cn(
              'flex items-start gap-3 rounded-panel border border-line bg-paper p-4 text-ink shadow-float',
              'data-[state=open]:animate-panel-in data-[state=closed]:animate-fade-out',
              'data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=end]:animate-fade-out',
            )}
          >
            <Icon aria-hidden="true" className={cn('mt-0.5 size-5', iconTone[tone])} />
            <div className="flex flex-1 flex-col gap-1">
              <ToastPrimitive.Title className="text-body font-semibold">
                {item.title}
              </ToastPrimitive.Title>
              {item.description ? (
                <ToastPrimitive.Description className="text-small text-ink-muted">
                  {item.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close
              aria-label={t('close')}
              className="hit-area -me-1 -mt-1 inline-grid size-8 cursor-pointer place-items-center rounded-control text-ink-muted is-hover:bg-green-50 is-hover:text-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )
      })}
      <ToastPrimitive.Viewport
        label={t('viewport', { hotkey: '{hotkey}' })}
        className="fixed inset-x-4 top-4 z-60 flex flex-col gap-3 outline-none sm:inset-x-auto sm:start-6 sm:top-auto sm:bottom-6 sm:w-full sm:max-w-sm"
      />
    </ToastPrimitive.Provider>
  )
}
