'use client'

import { Popover as PopoverPrimitive, Tooltip as TooltipPrimitive } from 'radix-ui'
import type { ReactElement, ReactNode } from 'react'

import { cn } from './cn'

/* ------------------------------------------------------------------- Popover */

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverClose = PopoverPrimitive.Close

export type PopoverContentProps = {
  children: ReactNode
  /** Nom accessible du panneau (sinon le premier titre qu'il contient). */
  label?: string
  side?: 'top' | 'bottom'
  align?: 'start' | 'center' | 'end'
  className?: string
}

/** Panneau flottant non modal (aide contextuelle riche, sélecteur de langue). */
export function PopoverContent({
  children,
  label,
  side = 'bottom',
  align = 'start',
  className,
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        side={side}
        align={align}
        sideOffset={8}
        collisionPadding={16}
        aria-label={label}
        className={cn(
          'z-50 w-[calc(100vw-2rem)] max-w-xs rounded-panel border border-line bg-paper p-4 text-small text-ink shadow-float',
          'data-[state=open]:animate-panel-in data-[state=closed]:animate-panel-out',
          className,
        )}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
}

/* ------------------------------------------------------------------- Tooltip */

export type TooltipProps = {
  /** Texte court, complément d'un libellé déjà accessible (jamais la seule information). */
  content: string
  /** Élément déclencheur focalisable (bouton, lien). */
  children: ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
}

/** Infobulle (Radix) : au survol et au focus, fermée par Échap. */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            'z-50 max-w-xs rounded-control bg-ink px-3 py-1.5 text-small text-paper',
            'data-[state=delayed-open]:animate-fade-in data-[state=instant-open]:animate-fade-in',
            'data-[state=closed]:animate-fade-out',
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
