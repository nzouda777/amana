'use client'

import { MailCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { type FormEvent, useId, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { type AuthFieldErrors, signInSchema, toAuthFieldErrors } from '@/features/auth/schemas'
import type { AuthError } from '@/features/auth/service'

import { resendVerificationAction, signInAction } from '../../_actions/auth'
import {
  AuthErrorAlert,
  focusFirstError,
  PasswordInput,
  readText,
  TurnstileSlot,
  useAuthFieldError,
  useTurnstile,
} from './shared'

/**
 * Connexion : e-mail et mot de passe, Turnstile chargé à la première interaction. Une
 * adresse non confirmée (après mot de passe correct) propose un nouvel envoi du lien.
 */
export function SignInForm({ next }: { next?: string }) {
  const locale = useLocale()
  const t = useTranslations('learn.auth')
  const errorText = useAuthFieldError()
  const turnstile = useTurnstile(locale)
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${uid}-${name}`
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<AuthFieldErrors>({})
  const [failure, setFailure] = useState<{
    error: Exclude<AuthError, 'validation'>
    retry?: number
  } | null>(null)
  const [email, setEmail] = useState('')
  const [resent, setResent] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFailure(null)
    setResent(false)
    const data = new FormData(event.currentTarget)
    const input = { email: readText(data, 'email'), password: readText(data, 'password'), next }
    const local = signInSchema.omit({ turnstileToken: true }).safeParse(input)
    if (!local.success) {
      setErrors(toAuthFieldErrors(local.error))
      requestAnimationFrame(() => focusFirstError(formRef.current))
      return
    }
    setErrors({})
    setEmail(local.data.email)
    startTransition(async () => {
      const token = await turnstile.getToken()
      if (!token) {
        setFailure({ error: 'captcha' })
        return
      }
      // En cas de succès, l'action redirige (cookie de session posé côté serveur).
      const result = await signInAction(locale, { ...input, turnstileToken: token })
      turnstile.reset()
      if (result.ok) return
      if (result.error === 'validation') {
        setErrors(result.fieldErrors ?? {})
        requestAnimationFrame(() => focusFirstError(formRef.current))
        return
      }
      setFailure({ error: result.error, retry: result.retryAfterSeconds })
    })
  }

  function resend() {
    startTransition(async () => {
      const token = await turnstile.getToken()
      if (!token) {
        setFailure({ error: 'captcha' })
        return
      }
      const result = await resendVerificationAction(locale, { email, turnstileToken: token })
      turnstile.reset()
      if (result.ok) {
        setFailure(null)
        setResent(true)
      } else if (result.error !== 'validation') {
        setFailure({ error: result.error, retry: result.retryAfterSeconds })
      }
    })
  }

  const err = (name: string) => errorText(errors, name)

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      onFocusCapture={turnstile.activate}
      className="flex flex-col gap-6"
    >
      <Field id={id('email')} label={t('fields.email')} error={err('email')} required>
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            dir="ltr"
          />
        )}
      </Field>
      <Field id={id('password')} label={t('fields.password')} error={err('password')} required>
        {(control) => (
          <PasswordInput control={control} name="password" autoComplete="current-password" />
        )}
      </Field>
      <TurnstileSlot containerRef={turnstile.containerRef} failed={turnstile.state === 'error'} />
      {failure?.error === 'unverified' ? (
        <Alert tone="warning" role="alert" title={t('submit.unverified.title')}>
          <span className="flex flex-col items-start gap-3">
            <span>{t('submit.unverified.text')}</span>
            <Button type="button" variant="secondary" size="md" onClick={resend} loading={pending}>
              {t('resend')}
            </Button>
          </span>
        </Alert>
      ) : (
        <AuthErrorAlert error={failure?.error ?? null} retryAfterSeconds={failure?.retry} />
      )}
      {resent ? (
        <Alert tone="success" role="status" title={t('resent.title')}>
          <span className="inline-flex items-center gap-2">
            <MailCheck aria-hidden="true" className="size-4" />
            {t('resent.text', { email })}
          </span>
        </Alert>
      ) : null}
      <Button type="submit" loading={pending} fullWidth>
        {t('signIn.submit')}
      </Button>
    </form>
  )
}
