'use client'

import { Direction, Tooltip } from 'radix-ui'
import type { ReactNode } from 'react'

export type UIProviderProps = {
  dir: 'ltr' | 'rtl'
  children: ReactNode
}

/**
 * Contexte commun des primitives Radix : sens de lecture (navigation clavier des
 * onglets, menus et accordéons inversée en arabe) et délai partagé des infobulles.
 * Posé une fois dans `src/app/[locale]/layout.tsx`.
 */
export function UIProvider({ dir, children }: UIProviderProps) {
  return (
    <Direction.Provider dir={dir}>
      <Tooltip.Provider delayDuration={300} skipDelayDuration={200}>
        {children}
      </Tooltip.Provider>
    </Direction.Provider>
  )
}
