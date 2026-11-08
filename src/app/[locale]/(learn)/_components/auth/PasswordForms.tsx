'use client'

import { MailCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { type FormEvent, useId, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Link } from '@/components/ui/Link'
import {
  type AuthFieldErrors,
  emailRequestSchema,
  newPasswordField,
  PASSWORD_MIN_LENGTH,
  toAuthFieldErrors,
} from '@/features/auth/schemas'
import type { AuthError } from '@/features/auth/service'

import { requestPasswordResetAction, resetPasswordAction } from '../../_actions/auth'
import {
  AuthErrorAlert,
  focusFirstError,
  PasswordInput,
  readText,
  TurnstileSlot,
  useAuthFieldError,
  useTurnstile,
} from './shared'

type Failure = { error: Exclude<AuthError, 'validation'>; retry?: number }

/** Demande de lien : même réponse que l'adresse ait un compte ou non. */
export function ForgotPasswordForm() {
  const locale = useLocale()
  const t = useTranslations('learn.auth')
  const errorText = useAuthFieldError()
  const turnstile = useTurnstile(locale)
  const uid = useId().replace(/:/g, '')
  const formRef = useRef<HTMLFormElement>(null)
  const doneRef = useRef<HTMLParagraphElement>(null)
  const [errors, setErrors] = useState<AuthFieldErrors>({})
  const [failure, setFailure] = useState<Failure | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFailure(null)
    const email = readText(new FormData(event.currentTarget), 'email')
    const local = emailRequestSchema.omit({ turnstileToken: true }).safeParse({ email })
    if (!local.success) {
      setErrors(toAuthFieldErrors(local.error))
      requestAnimationFrame(() => focusFirstError(formRef.current))
      return
    }
    setErrors({})
    startTransition(async () => {
      const token = await turnstile.getToken()
      if (!token) {
        setFailure({ error: 'captcha' })
        return
      }
      const result = await requestPasswordResetAction(locale, { email, turnstileToken: token })
      turnstile.reset()
      if (result.ok) {
        setDone(local.data.email)
        requestAnimationFrame(() => doneRef.current?.focus())
        return
      }
      if (result.error === 'validation') setErrors(result.fieldErrors ?? {})
      else setFailure({ error: result.error, retry: result.retryAfterSeconds })
    })
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <MailCheck aria-hidden="true" className="size-8 text-green-700" />
        <p ref={doneRef} tabIndex={-1} className="font-display text-h3 outline-none">
          {t('forgot.doneTitle')}
        </p>
        <p className="text-body text-ink-muted">{t('forgot.doneText', { email: done })}</p>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      onFocusCapture={turnstile.activate}
      className="flex flex-col gap-6"
    >
      <Field
        id={`${uid}-email`}
        label={t('fields.email')}
        error={errorText(errors, 'email')}
        required
      >
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
      <TurnstileSlot containerRef={turnstile.containerRef} failed={turnstile.state === 'error'} />
      <AuthErrorAlert error={failure?.error ?? null} retryAfterSeconds={failure?.retry} />
      <Button type="submit" loading={pending} fullWidth>
        {t('forgot.submit')}
      </Button>
    </form>
  )
}

/** Nouveau mot de passe à partir du lien reçu ; la session s'ouvre en cas de succès. */
export function ResetPasswordForm({ token }: { token: string }) {
  const locale = useLocale()
  const t = useTranslations('learn.auth')
  const errorText = useAuthFieldError()
  const turnstile = useTurnstile(locale)
  const uid = useId().replace(/:/g, '')
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<AuthFieldErrors>({})
  const [failure, setFailure] = useState<Failure | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFailure(null)
    const password = readText(new FormData(event.currentTarget), 'password')
    const local = newPasswordField.safeParse(password)
    if (!local.success) {
      setErrors({ password: toAuthFieldErrors(local.error)[''] ?? 'passwordLength' })
      requestAnimationFrame(() => focusFirstError(formRef.current))
      return
    }
    setErrors({})
    startTransition(async () => {
      const turnstileToken = await turnstile.getToken()
      if (!turnstileToken) {
        setFailure({ error: 'captcha' })
        return
      }
      const result = await resetPasswordAction(locale, { token, password, turnstileToken })
      turnstile.reset()
      if (result.ok) return
      if (result.error === 'validation') setErrors(result.fieldErrors ?? {})
      else setFailure({ error: result.error, retry: result.retryAfterSeconds })
    })
  }

  if (failure?.error === 'invalid-token') {
    return (
      <Alert tone="warning" role="alert" title={t('submit.invalid-token.title')}>
        <span className="flex flex-col items-start gap-3">
          <span>{t('submit.invalid-token.text')}</span>
          <Link href="/mot-de-passe" variant="standalone">
            {t('reset.requestAgain')}
          </Link>
        </span>
      </Alert>
    )
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      onFocusCapture={turnstile.activate}
      className="flex flex-col gap-6"
    >
      <Field
        id={`${uid}-password`}
        label={t('fields.newPassword')}
        hint={t('fields.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        error={errorText(errors, 'password')}
        required
      >
        {(control) => (
          <PasswordInput control={control} name="password" autoComplete="new-password" />
        )}
      </Field>
      <TurnstileSlot containerRef={turnstile.containerRef} failed={turnstile.state === 'error'} />
      <AuthErrorAlert error={failure?.error ?? null} retryAfterSeconds={failure?.retry} />
      <Button type="submit" loading={pending} fullWidth>
        {t('reset.submit')}
      </Button>
    </form>
  )
}
