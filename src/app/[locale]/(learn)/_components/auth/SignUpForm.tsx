'use client'

import { MailCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { type FormEvent, useId, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Choice'
import { Field, FieldError } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Link } from '@/components/ui/Link'
import {
  type AuthFieldErrors,
  PASSWORD_MIN_LENGTH,
  signUpSchema,
  toAuthFieldErrors,
} from '@/features/auth/schemas'
import type { AuthError } from '@/features/auth/service'

import { signUpAction } from '../../_actions/auth'
import {
  AuthErrorAlert,
  focusFirstError,
  PasswordInput,
  readChecked,
  readText,
  TurnstileSlot,
  useAuthFieldError,
  useTurnstile,
} from './shared'

/**
 * Inscription d'un apprenant. Réponse identique que l'adresse soit nouvelle ou déjà
 * connue (aucune énumération) : « consultez votre messagerie ».
 */
export function SignUpForm({ next }: { next?: string }) {
  const locale = useLocale()
  const t = useTranslations('learn.auth')
  const errorText = useAuthFieldError()
  const turnstile = useTurnstile(locale)
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${uid}-${name}`
  const formRef = useRef<HTMLFormElement>(null)
  const doneRef = useRef<HTMLParagraphElement>(null)
  const [errors, setErrors] = useState<AuthFieldErrors>({})
  const [failure, setFailure] = useState<{
    error: Exclude<AuthError, 'validation'>
    retry?: number
  } | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFailure(null)
    const data = new FormData(event.currentTarget)
    const input = {
      firstName: readText(data, 'firstName'),
      lastName: readText(data, 'lastName'),
      email: readText(data, 'email'),
      password: readText(data, 'password'),
      terms: readChecked(data, 'terms'),
      next,
    }
    const local = signUpSchema.omit({ turnstileToken: true }).safeParse(input)
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
      const result = await signUpAction(locale, { ...input, turnstileToken: token })
      turnstile.reset()
      if (result.ok) {
        setDone(local.data.email)
        requestAnimationFrame(() => doneRef.current?.focus())
        return
      }
      if (result.error === 'validation') {
        setErrors(result.fieldErrors ?? {})
        requestAnimationFrame(() => focusFirstError(formRef.current))
        return
      }
      setFailure({ error: result.error, retry: result.retryAfterSeconds })
    })
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <MailCheck aria-hidden="true" className="size-8 text-green-700" />
        <p ref={doneRef} tabIndex={-1} className="font-display text-h3 outline-none">
          {t('signUp.doneTitle')}
        </p>
        <p className="text-body text-ink-muted">{t('signUp.doneText', { email: done })}</p>
      </div>
    )
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
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={id('firstName')} label={t('fields.firstName')} error={err('firstName')} required>
          {(control) => <Input {...control} name="firstName" autoComplete="given-name" />}
        </Field>
        <Field id={id('lastName')} label={t('fields.lastName')} error={err('lastName')} required>
          {(control) => <Input {...control} name="lastName" autoComplete="family-name" />}
        </Field>
      </div>
      <Field
        id={id('email')}
        label={t('fields.email')}
        hint={t('fields.emailHint')}
        error={err('email')}
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
      <Field
        id={id('password')}
        label={t('fields.newPassword')}
        hint={t('fields.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        error={err('password')}
        required
      >
        {(control) => (
          <PasswordInput control={control} name="password" autoComplete="new-password" />
        )}
      </Field>
      <div className="flex flex-col gap-1">
        <Checkbox
          id={id('terms')}
          name="terms"
          required
          aria-invalid={errors.terms ? true : undefined}
          aria-describedby={errors.terms ? `${id('terms')}-error` : undefined}
          label={t.rich('signUp.terms', {
            cgu: (chunks) => (
              <Link href={{ pathname: '/legal/[slug]', params: { slug: 'cgu' } }}>{chunks}</Link>
            ),
            privacy: (chunks) => (
              <Link href={{ pathname: '/legal/[slug]', params: { slug: 'confidentialite' } }}>
                {chunks}
              </Link>
            ),
          })}
        />
        {err('terms') ? <FieldError id={`${id('terms')}-error`}>{err('terms')}</FieldError> : null}
      </div>
      <TurnstileSlot containerRef={turnstile.containerRef} failed={turnstile.state === 'error'} />
      <AuthErrorAlert error={failure?.error ?? null} retryAfterSeconds={failure?.retry} />
      <Button type="submit" loading={pending} fullWidth>
        {t('signUp.submit')}
      </Button>
    </form>
  )
}
