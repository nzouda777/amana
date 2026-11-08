'use client'

import { CircleCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useRef, useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Choice'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { responseDelayDays } from '@/features/leads/routing'
import {
  type ContactSubject,
  contactFormSchema,
  contactSubjects,
  type FieldErrors,
  toFieldErrors,
} from '@/features/leads/schemas'
import type { SubmitError } from '@/features/leads/service'

import { submitContactAction } from '../../_actions/leads'
import {
  focusFirstError,
  readChecked,
  readText,
  SubmitErrorAlert,
  TurnstileSlot,
  useFieldErrorText,
} from './shared'
import { useTurnstile } from './useTurnstile'

/**
 * Formulaire court : page Contact (sujet au choix) et bloc d'appel des pages de service
 * (sujet fixé par le pôle). Même chaîne serveur que le devis.
 */
export function ContactForm({
  subject,
  fixedSubject = false,
  sourcePage,
  compact = false,
}: {
  subject?: ContactSubject
  /** Sujet imposé (page de service) : la liste n'est pas affichée. */
  fixedSubject?: boolean
  sourcePage?: string
  /** Variante resserrée (colonne du bandeau d'appel). */
  compact?: boolean
}) {
  const locale = useLocale()
  const t = useTranslations('forms')
  const tc = useTranslations('forms.contact')
  const errorText = useFieldErrorText()
  const turnstile = useTurnstile(locale)
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${uid}-${name}`
  const formRef = useRef<HTMLFormElement>(null)
  const doneRef = useRef<HTMLParagraphElement>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<{ error: SubmitError; retry?: number } | null>(
    null,
  )
  const [done, setDone] = useState<{ subject: ContactSubject; email: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    const data = new FormData(event.currentTarget)
    const input = {
      subject: fixedSubject ? subject : readText(data, 'subject'),
      name: readText(data, 'name'),
      email: readText(data, 'email'),
      phone: readText(data, 'phone'),
      organization: readText(data, 'organization'),
      message: readText(data, 'message'),
      processingConsent: readChecked(data, 'processingConsent'),
      sourcePage,
    }
    const local = contactFormSchema.omit({ turnstileToken: true }).safeParse(input)
    if (!local.success) {
      setErrors(toFieldErrors(local.error))
      requestAnimationFrame(() => focusFirstError(formRef.current))
      return
    }
    setErrors({})
    startTransition(async () => {
      const token = await turnstile.getToken()
      if (!token) {
        setSubmitError({ error: 'captcha' })
        return
      }
      const response = await submitContactAction(locale, { ...input, turnstileToken: token })
      turnstile.reset()
      if (response.ok) {
        setDone({ subject: local.data.subject, email: local.data.email })
        requestAnimationFrame(() => doneRef.current?.focus())
        return
      }
      if (response.fieldErrors) setErrors(response.fieldErrors)
      setSubmitError({ error: response.error, retry: response.retryAfterSeconds })
    })
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <CircleCheck aria-hidden="true" className="size-8 text-green-700" />
        <p ref={doneRef} tabIndex={-1} className="font-display text-h3 outline-none">
          {tc('doneTitle')}
        </p>
        <p className="text-body text-ink-muted">
          {tc('doneText', { email: done.email, days: responseDelayDays[done.subject] })}
        </p>
      </div>
    )
  }

  const err = (name: string) => errorText(errors, name)
  const twoColumns = compact ? '' : 'md:grid-cols-2'

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      onFocusCapture={turnstile.activate}
      className="flex flex-col gap-6"
    >
      <div className={`grid gap-6 ${twoColumns}`}>
        {fixedSubject ? null : (
          <Field
            id={id('subject')}
            label={tc('subject')}
            error={err('subject')}
            required
            className={compact ? '' : 'md:col-span-2'}
          >
            {(control) => (
              <Select
                {...control}
                name="subject"
                defaultValue={subject ?? 'contact'}
                options={contactSubjects.map((value) => ({
                  value,
                  label: t(`types.${value}`),
                }))}
              />
            )}
          </Field>
        )}
        <Field id={id('name')} label={t('fields.name')} error={err('name')} required>
          {(control) => <Input {...control} name="name" autoComplete="name" />}
        </Field>
        <Field id={id('email')} label={t('fields.email')} error={err('email')} required>
          {(control) => <Input {...control} name="email" type="email" autoComplete="email" />}
        </Field>
        <Field id={id('phone')} label={t('fields.phone')} error={err('phone')} optional>
          {(control) => <Input {...control} name="phone" type="tel" autoComplete="tel" dir="ltr" />}
        </Field>
        <Field
          id={id('organization')}
          label={t('fields.organization')}
          error={err('organization')}
          optional
        >
          {(control) => <Input {...control} name="organization" autoComplete="organization" />}
        </Field>
        <Field
          id={id('message')}
          label={tc('message')}
          error={err('message')}
          required
          className={compact ? '' : 'md:col-span-2'}
        >
          {(control) => <Textarea {...control} name="message" rows={compact ? 4 : 6} />}
        </Field>
      </div>
      <div className="flex flex-col gap-1">
        <Checkbox
          id={id('processingConsent')}
          name="processingConsent"
          required
          aria-invalid={errors.processingConsent ? true : undefined}
          label={t('consent.processing')}
        />
        {err('processingConsent') ? (
          <p className="text-small font-semibold text-danger">{err('processingConsent')}</p>
        ) : null}
      </div>
      <TurnstileSlot containerRef={turnstile.containerRef} failed={turnstile.state === 'error'} />
      <SubmitErrorAlert error={submitError?.error ?? null} retryAfterSeconds={submitError?.retry} />
      <div>
        <Button type="submit" loading={pending} fullWidth={compact}>
          {tc('submit')}
        </Button>
      </div>
    </form>
  )
}
