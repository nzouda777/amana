import { cva } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from './cn'

/** Style commun des champs : 48 px de haut, bordure contrastée (3,7:1), erreur en rouge. */
export const controlVariants = cva([
  'w-full rounded-control border border-line-strong bg-paper px-4 text-body text-ink',
  'placeholder:text-ink-subtle',
  'transition-colors duration-(--duration-hover) ease-standard',
  'is-hover:border-ink-muted',
  'is-focus:border-green-700',
  'aria-invalid:border-danger aria-invalid:is-hover:border-danger',
  'disabled:cursor-not-allowed disabled:border-line disabled:bg-sand-100 disabled:text-ink-subtle',
])

export type InputProps = Omit<ComponentProps<'input'>, 'className'> & { className?: string }

export function Input({ className, type = 'text', ...props }: InputProps) {
  return <input type={type} className={cn(controlVariants(), 'h-12', className)} {...props} />
}

export type TextareaProps = Omit<ComponentProps<'textarea'>, 'className'> & { className?: string }

export function Textarea({ className, rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(controlVariants(), 'min-h-32 resize-y py-3', className)}
      {...props}
    />
  )
}

export type SelectOption = { value: string; label: string; disabled?: boolean }

export type SelectProps = Omit<ComponentProps<'select'>, 'className' | 'children'> & {
  options: readonly SelectOption[]
  /** Première option vide, non sélectionnable une fois un choix fait. */
  placeholder?: string
  className?: string
}

/**
 * Liste déroulante native, stylée : sélecteur système sur mobile (Android), aucune
 * dépendance JS, compatible Server Actions sans hydratation (voir journal de design).
 */
export function Select({ options, placeholder, className, defaultValue, ...props }: SelectProps) {
  return (
    <span className={cn('relative block', className)}>
      <select
        className={cn(controlVariants(), 'h-12 cursor-pointer appearance-none pe-12')}
        defaultValue={defaultValue ?? (placeholder ? '' : undefined)}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-ink-muted"
      />
    </span>
  )
}
