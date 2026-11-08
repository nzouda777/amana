'use client'

import { useTranslations } from 'next-intl'
import type { RefObject } from 'react'

import { Alert } from '@/components/ui/Feedback'
import type { FieldErrors } from '@/features/leads/schemas'
import type { SubmitError } from '@/features/leads/service'

/** Lit un champ texte d'un FormData (chaîne vide si absent). */
export function readText(data: FormData, name: string): string {
  const value = data.get(name)
  return typeof value === 'string' ? value : ''
}

export function readChecked(data: FormData, name: string): boolean {
  return data.get(name) === 'on' || data.get(name) === 'true'
}

/** Traduction d'un code d'erreur de champ. */
export function useFieldErrorText() {
  const t = useTranslations('forms.errors')
  return (errors: FieldErrors, name: string): string | undefined => {
    const code = errors[name]
    return code ? t(code) : undefined
  }
}

/** Place le focus sur le premier champ en erreur (ordre du document). */
export function focusFirstError(form: HTMLFormElement | null): void {
  const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]')
  invalid?.focus()
}

/** Zone d'annonce de l'état d'envoi + message d'erreur global. */
export function SubmitErrorAlert({
  error,
  retryAfterSeconds,
}: {
  error: SubmitError | 'not-found' | null
  retryAfterSeconds?: number
}) {
  const t = useTranslations('forms.submit')
  if (!error) return null
  const minutes = Math.max(1, Math.ceil((retryAfterSeconds ?? 60) / 60))
  return (
    <Alert tone="danger" role="alert" title={t(`${error}.title`)}>
      {t(`${error}.text`, { minutes })}
    </Alert>
  )
}

/**
 * Conteneur du défi Turnstile : vide et invisible tant que Cloudflare ne demande pas
 * d'interaction. Message si le service est inaccessible.
 */
export function TurnstileSlot({
  containerRef,
  failed,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  failed: boolean
}) {
  const t = useTranslations('forms')
  return (
    <div>
      <div ref={containerRef} />
      {failed ? <p className="text-small text-danger">{t('turnstileError')}</p> : null}
    </div>
  )
}
