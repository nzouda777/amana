'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Alert } from '@/components/ui/Feedback'
import { type FieldControlProps } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import type { AuthFieldErrors } from '@/features/auth/schemas'
import type { AuthError } from '@/features/auth/service'

export {
  readChecked,
  readText,
  focusFirstError,
  TurnstileSlot,
} from '../../../(site)/_components/forms/shared'
export { useTurnstile } from '../../../(site)/_components/forms/useTurnstile'

/** Traduction d'un code d'erreur de champ (`learn.auth.errors.<code>`). */
export function useAuthFieldError() {
  const t = useTranslations('learn.auth.errors')
  return (errors: AuthFieldErrors, name: string): string | undefined => {
    const code = errors[name]
    return code ? t(code) : undefined
  }
}

/** Erreur globale d'envoi : ce qui ne va pas et comment corriger (DESIGN §8). */
export function AuthErrorAlert({
  error,
  retryAfterSeconds,
}: {
  error: Exclude<AuthError, 'validation'> | null
  retryAfterSeconds?: number
}) {
  const t = useTranslations('learn.auth.submit')
  if (!error) return null
  const minutes = Math.max(1, Math.ceil((retryAfterSeconds ?? 60) / 60))
  return (
    <Alert tone="danger" role="alert" title={t(`${error}.title`)}>
      {t(`${error}.text`, { minutes })}
    </Alert>
  )
}

/** Mot de passe avec bouton « Afficher » (aria-pressed), sans JS tiers. */
export function PasswordInput({
  control,
  name,
  autoComplete,
}: {
  control: FieldControlProps
  name: string
  autoComplete: 'current-password' | 'new-password'
}) {
  const t = useTranslations('learn.auth')
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative block">
      <Input
        {...control}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        dir="ltr"
        className="pe-14"
      />
      <button
        type="button"
        aria-pressed={visible}
        aria-controls={control.id}
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 end-0 inline-grid w-12 cursor-pointer place-items-center rounded-e-control text-ink-muted is-hover:text-green-700"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-5" />
        ) : (
          <Eye aria-hidden="true" className="size-5" />
        )}
        <span className="sr-only">{t('showPassword')}</span>
      </button>
    </span>
  )
}
