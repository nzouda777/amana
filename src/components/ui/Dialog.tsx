'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

import { cn } from './cn'
import { IconButton } from './IconButton'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const overlayClasses = cn(
  'fixed inset-0 z-50 bg-green-900/60',
  'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
)

export type DialogContentProps = {
  title: ReactNode
  /** Description lue à l'ouverture ; à fournir dès que le titre ne suffit pas. */
  description?: ReactNode
  children?: ReactNode
  /** Actions en pied de dialogue (confirmer, annuler). */
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const dialogWidths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' } as const

/** Dialogue modal centré (Radix : piège du focus, Échap, retour du focus). */
export function DialogContent({
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: DialogContentProps) {
  const t = useTranslations('ui.dialog')
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClasses} />
      <DialogPrimitive.Content
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(
          'fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col',
          'rounded-panel bg-paper text-ink shadow-float',
          'data-[state=open]:animate-panel-in data-[state=closed]:animate-panel-out',
          dialogWidths[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-0 md:p-8 md:pb-0">
          <div className="flex flex-col gap-2">
            <DialogPrimitive.Title className="font-display text-h3 text-ink">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-body text-ink-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton
              label={t('close')}
              icon={<X aria-hidden="true" />}
              className="-me-2 -mt-2"
            />
          </DialogPrimitive.Close>
        </div>
        {children ? <div className="overflow-y-auto px-6 py-6 md:px-8">{children}</div> : null}
        {footer ? (
          <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-4 sm:flex-row sm:justify-end md:px-8">
            {footer}
          </div>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/* -------------------------------------------------------------------- Sheet */

export const sheetVariants = cva(
  [
    'fixed z-50 flex flex-col bg-paper text-ink shadow-float',
    'data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out',
  ],
  {
    variants: {
      side: {
        start: [
          'inset-y-0 start-0 w-[calc(100%-3rem)] max-w-sm rounded-e-panel',
          '[--sheet-from-x:-100%] rtl-dir:[--sheet-from-x:100%]',
        ],
        end: [
          'inset-y-0 end-0 w-[calc(100%-3rem)] max-w-sm rounded-s-panel',
          '[--sheet-from-x:100%] rtl-dir:[--sheet-from-x:-100%]',
        ],
        bottom: 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-panel [--sheet-from-y:100%]',
        /** Plein écran (tiroir de navigation mobile). */
        full: 'inset-0 [--sheet-from-y:2%]',
      },
    },
    defaultVariants: { side: 'end' },
  },
)

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export type SheetContentProps = VariantProps<typeof sheetVariants> & {
  title: ReactNode
  /** Masque visuellement le titre (il reste annoncé). */
  hideTitle?: boolean
  description?: ReactNode
  /** Remplace l'en-tête par défaut (titre + fermer), ex. logo du tiroir mobile. */
  header?: ReactNode
  children: ReactNode
  /** Zone fixe en bas (CTA du tiroir mobile). */
  footer?: ReactNode
  className?: string
}

/** Panneau latéral ou inférieur (filtres du catalogue, sommaire, tiroir de navigation). */
export function SheetContent({
  side,
  title,
  hideTitle = false,
  description,
  header,
  children,
  footer,
  className,
}: SheetContentProps) {
  const t = useTranslations('ui.dialog')
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClasses} />
      <DialogPrimitive.Content
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(sheetVariants({ side }), className)}
      >
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-line px-5 py-2">
          {header}
          <DialogPrimitive.Title
            className={cn('font-display text-h3', hideTitle || header ? 'sr-only' : undefined)}
          >
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <IconButton label={t('close')} icon={<X aria-hidden="true" />} className="-me-2" />
          </DialogPrimitive.Close>
        </div>
        {description ? (
          <DialogPrimitive.Description className="px-5 pt-4 text-body text-ink-muted">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4">{footer}</div> : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
