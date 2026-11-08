import { CircleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { cn } from './cn'

/** Propriétés à transmettre au contrôle : liaison libellé, aide et erreur. */
export type FieldControlProps = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  required?: boolean
}

export type FieldProps = {
  /** Identifiant du contrôle ; sert à dériver ceux de l'aide et de l'erreur. */
  id: string
  label: ReactNode
  /** Aide affichée sous le champ (format attendu, exemple). */
  hint?: ReactNode
  /** Message d'erreur : dit ce qui ne va pas et comment corriger (DESIGN §8). */
  error?: ReactNode
  required?: boolean
  /** Affiche « (facultatif) » après le libellé. */
  optional?: boolean
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

/**
 * Champ de formulaire : libellé au-dessus, contrôle, aide puis erreur dessous.
 * `<Field id="email" label="E-mail">{(control) => <Input {...control} name="email" />}</Field>`
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: FieldProps) {
  const t = useTranslations('ui.field')
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-small font-semibold text-ink">
        {label}
        {optional ? <span className="font-regular text-ink-muted"> ({t('optional')})</span> : null}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required,
      })}
      {hint ? (
        <p id={hintId} className="text-small text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-2 text-small font-semibold text-danger">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4" />
      <span>{children}</span>
    </p>
  )
}
