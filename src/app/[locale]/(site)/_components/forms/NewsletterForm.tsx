'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useId, useRef, useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Choice'
import { cn } from '@/components/ui/cn'
import { FieldError } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import {
  type FieldErrors,
  newsletterInterests,
  type NewsletterInterestValue,
  newsletterSchema,
  toFieldErrors,
} from '@/features/leads/schemas'
import type { SubmitError } from '@/features/leads/service'

import { subscribeNewsletterAction } from '../../_actions/leads'
import { readText, SubmitErrorAlert, TurnstileSlot, useFieldErrorText } from './shared'
import { useTurnstile } from './useTurnstile'

/**
 * Inscription à la lettre (double opt-in) : pied de page (`tone="dark"`), fin d'article,
 * hub Formation. Le succès dit qu'un e-mail de confirmation arrive : rien n'est actif
 * avant le clic de confirmation.
 *
 * Aucune case n'est précochée : avec `chooseInterests`, la personne coche elle-même ses
 * centres d'intérêt ; sans, `interests` (contexte de la page) est envoyé tel quel.
 */
export function NewsletterForm({
  tone = 'light',
  interests,
  chooseInterests = false,
  sourcePage,
}: {
  tone?: 'light' | 'dark'
  /** Centres d'intérêt implicites (contexte de la page), quand les cases ne sont pas affichées. */
  interests?: NewsletterInterestValue[]
  /** Affiche les cases de centres d'intérêt. */
  chooseInterests?: boolean
  sourcePage?: string
}) {
  const locale = useLocale()
  const t = useTranslations('forms')
  const tn = useTranslations('forms.newsletter')
  const errorText = useFieldErrorText()
  const turnstile = useTurnstile(locale)
  const uid = useId().replace(/:/g, '')
  const statusRef = useRef<HTMLParagraphElement>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<{ error: SubmitError; retry?: number } | null>(
    null,
  )
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()
  const dark = tone === 'dark'

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    const data = new FormData(event.currentTarget)
    const selected = chooseInterests
      ? data.getAll('interests').filter((value): value is string => typeof value === 'string')
      : (interests ?? [])
    const input = { email: readText(data, 'email'), interests: selected, sourcePage }
    const local = newsletterSchema.omit({ turnstileToken: true }).safeParse(input)
    if (!local.success) {
      setErrors(toFieldErrors(local.error))
      return
    }
    setErrors({})
    startTransition(async () => {
      const token = await turnstile.getToken()
      if (!token) {
        setSubmitError({ error: 'captcha' })
        return
      }
      const response = await subscribeNewsletterAction(locale, { ...input, turnstileToken: token })
      turnstile.reset()
      if (response.ok) {
        setDone(true)
        requestAnimationFrame(() => statusRef.current?.focus())
        return
      }
      if (response.fieldErrors) setErrors(response.fieldErrors)
      setSubmitError({ error: response.error, retry: response.retryAfterSeconds })
    })
  }

  if (done) {
    return (
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className={cn('text-body outline-none', dark ? 'text-paper' : 'text-ink')}
      >
        {tn('done')}
      </p>
    )
  }

  const emailError = errorText(errors, 'email')
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onFocusCapture={turnstile.activate}
      className="flex flex-col gap-3"
    >
      <label
        htmlFor={`${uid}-email`}
        className={cn('text-small font-semibold', dark ? 'text-paper' : 'text-ink')}
      >
        {t('fields.email')}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id={`${uid}-email`}
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? `${uid}-email-error` : undefined}
          className="sm:flex-1"
        />
        <Button type="submit" loading={pending} variant={dark ? 'gold' : 'primary'}>
          {tn('submit')}
        </Button>
      </div>
      {emailError ? (
        dark ? (
          <p id={`${uid}-email-error`} className="text-small font-semibold text-paper">
            {emailError}
          </p>
        ) : (
          <FieldError id={`${uid}-email-error`}>{emailError}</FieldError>
        )
      ) : null}
      {chooseInterests ? (
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-small font-semibold">{tn('interestsLegend')}</legend>
          <div className="grid sm:grid-cols-2">
            {newsletterInterests.map((value) => (
              <Checkbox
                key={value}
                id={`${uid}-interest-${value}`}
                name="interests"
                value={value}
                label={t(`interests.${value}`)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
      <p className={cn('text-small', dark ? 'text-green-50' : 'text-ink-muted')}>{tn('note')}</p>
      <TurnstileSlot containerRef={turnstile.containerRef} failed={turnstile.state === 'error'} />
      <SubmitErrorAlert error={submitError?.error ?? null} retryAfterSeconds={submitError?.retry} />
    </form>
  )
}
