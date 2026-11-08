'use client'

import { Check, Minus } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from './cn'

type ChoiceBaseProps = {
  id: string
  label: ReactNode
  /** Précision sous le libellé. */
  hint?: ReactNode
  className?: string
}

/* Toute la ligne est cliquable : hauteur minimale 44 px. */
const rowClasses =
  'group flex min-h-11 cursor-pointer items-start gap-3 py-2.5 has-disabled:cursor-not-allowed'

const boxBase = [
  'peer size-5 shrink-0 cursor-pointer appearance-none border border-line-strong bg-paper',
  'transition-colors duration-(--duration-hover) ease-standard',
  'group-is-hover:border-green-700',
  'checked:border-green-700 checked:bg-green-700',
  'aria-invalid:border-danger',
  'disabled:cursor-not-allowed disabled:border-line disabled:bg-sand-100',
  'disabled:checked:border-line-strong disabled:checked:bg-line-strong',
]

function ChoiceText({ id, label, hint }: { id: string; label: ReactNode; hint?: ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-body text-ink group-has-disabled:text-ink-subtle">{label}</span>
      {hint ? (
        <span id={`${id}-hint`} className="text-small text-ink-muted">
          {hint}
        </span>
      ) : null}
    </span>
  )
}

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'className' | 'id'> &
  ChoiceBaseProps & {
    /** État mixte (sélection partielle d'une liste). */
    indeterminate?: boolean
  }

/**
 * Case à cocher native stylée : fonctionne sans JavaScript, dans un formulaire serveur.
 * Seul l'état mixte demande l'hydratation (propriété DOM `indeterminate`).
 */
export function Checkbox({ id, label, hint, className, indeterminate, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className={cn(rowClasses, className)}>
      <span className="relative mt-0.5 inline-grid place-items-center">
        <input
          id={id}
          type="checkbox"
          aria-describedby={hint ? `${id}-hint` : undefined}
          // État mixte : propriété DOM, pas d'attribut HTML ni d'aria-checked sur un contrôle natif.
          ref={(node) => {
            if (node) node.indeterminate = Boolean(indeterminate)
          }}
          data-indeterminate={indeterminate || undefined}
          className={cn(
            boxBase,
            'rounded-media data-indeterminate:border-green-700 data-indeterminate:bg-green-700',
          )}
          {...props}
        />
        <Check
          aria-hidden="true"
          className="pointer-events-none invisible absolute size-4 text-paper peer-checked:visible peer-data-indeterminate:invisible"
        />
        <Minus
          aria-hidden="true"
          className="pointer-events-none invisible absolute size-4 text-paper peer-data-indeterminate:visible"
        />
      </span>
      <ChoiceText id={id} label={label} hint={hint} />
    </label>
  )
}

export type RadioProps = Omit<ComponentProps<'input'>, 'type' | 'className' | 'id'> &
  ChoiceBaseProps

/** Bouton radio natif ; à regrouper dans un `RadioGroup` (fieldset + légende). */
export function Radio({ id, label, hint, className, ...props }: RadioProps) {
  return (
    <label htmlFor={id} className={cn(rowClasses, className)}>
      <span className="relative mt-0.5 inline-grid place-items-center">
        <input
          id={id}
          type="radio"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(boxBase, 'rounded-pill checked:border-[6px] checked:bg-paper')}
          {...props}
        />
      </span>
      <ChoiceText id={id} label={label} hint={hint} />
    </label>
  )
}

export type RadioGroupProps = {
  legend: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** Identifiant de base pour l'aide et l'erreur. */
  id: string
  children: ReactNode
  className?: string
}

export function RadioGroup({ legend, hint, error, id, children, className }: RadioGroupProps) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')
  return (
    <fieldset
      aria-describedby={describedBy || undefined}
      className={cn('flex flex-col gap-1', className)}
    >
      <legend className="mb-1 text-small font-semibold text-ink">{legend}</legend>
      {hint ? (
        <p id={`${id}-hint`} className="mb-1 text-small text-ink-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-small font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

export type SwitchProps = Omit<ComponentProps<'input'>, 'type' | 'className' | 'id' | 'role'> &
  ChoiceBaseProps

/** Interrupteur : case native avec `role="switch"` ; effet immédiat, pas de validation. */
export function Switch({ id, label, hint, className, ...props }: SwitchProps) {
  return (
    <label htmlFor={id} className={cn(rowClasses, 'items-center', className)}>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            'peer absolute inset-0 cursor-pointer appearance-none rounded-pill bg-line-strong',
            'transition-colors duration-(--duration-menu) ease-standard',
            'group-is-hover:bg-ink-muted',
            'checked:bg-green-700 group-is-hover:checked:bg-green-800',
            'disabled:cursor-not-allowed disabled:bg-line disabled:checked:bg-line-strong',
          )}
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute start-0.5 size-5 rounded-pill bg-paper',
            'transition-[inset-inline-start] duration-(--duration-menu) ease-standard',
            'peer-checked:start-5.5',
          )}
        />
      </span>
      <ChoiceText id={id} label={label} hint={hint} />
    </label>
  )
}
