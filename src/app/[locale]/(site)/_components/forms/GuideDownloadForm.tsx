'use client'

import { Download } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState, useTransition, type FormEvent } from 'react'

import { Button, buttonVariants } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Choice'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { type FieldErrors, guideDownloadSchema, toFieldErrors } from '@/features/leads/schemas'
import type { SubmitError } from '@/features/leads/service'

import { requestGuideAction } from '../../_actions/leads'
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
 * Téléchargement d'un guide contre e-mail : consentement à la newsletter **non coché**
 * par défaut (SPEC §4.4). Le fichier est servi par une route protégée (jeton signé).
 */
export function GuideDownloadForm({
  guideId,
  askName,
  askOrganization,
  askPhone,
  sourcePage,
}: {
  guideId: number
  askName: boolean
  askOrganization: boolean
  askPhone: boolean
  sourcePage?: string
}) {
  const locale = useLocale()
  const t = useTranslations('forms')
  const tg = useTranslations('forms.guide')
  const errorText = useFieldErrorText()
  const turnstile = useTurnstile(locale)
  const formRef = useRef<HTMLFormElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<{
    error: SubmitError | 'not-found'
    retry?: number
  } | null>(null)
  const [download, setDownload] = useState<{ url: string; email: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    const data = new FormData(event.currentTarget)
    const input = {
      guideId,
      name: askName ? readText(data, 'name') : undefined,
      email: readText(data, 'email'),
      organization: askOrganization ? readText(data, 'organization') : undefined,
      phone: askPhone ? readText(data, 'phone') : undefined,
      newsletter: readChecked(data, 'newsletter'),
      sourcePage,
    }
    const local = guideDownloadSchema.omit({ turnstileToken: true }).safeParse(input)
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
      const response = await requestGuideAction(locale, { ...input, turnstileToken: token })
      turnstile.reset()
      if (response.ok) {
        setDownload({
          url: `/api/downloads/guide?token=${encodeURIComponent(response.token)}`,
          email: local.data.email,
        })
        requestAnimationFrame(() => linkRef.current?.focus())
        return
      }
      if (response.fieldErrors) setErrors(response.fieldErrors)
      setSubmitError({ error: response.error, retry: response.retryAfterSeconds })
    })
  }

  if (download) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="font-display text-h3">{tg('doneTitle')}</p>
        <p className="text-body text-ink-muted">{tg('doneText', { email: download.email })}</p>
        <div>
          <a ref={linkRef} href={download.url} className={buttonVariants({ variant: 'primary' })}>
            <Download aria-hidden="true" />
            <span>{tg('download')}</span>
          </a>
        </div>
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
      {askName ? (
        <Field id="guide-name" label={t('fields.name')} error={err('name')} optional>
          {(control) => <Input {...control} name="name" autoComplete="name" />}
        </Field>
      ) : null}
      <Field
        id="guide-email"
        label={t('fields.email')}
        hint={tg('emailHint')}
        error={err('email')}
        required
      >
        {(control) => <Input {...control} name="email" type="email" autoComplete="email" />}
      </Field>
      {askOrganization ? (
        <Field
          id="guide-organization"
          label={t('fields.organization')}
          error={err('organization')}
          optional
        >
          {(control) => <Input {...control} name="organization" autoComplete="organization" />}
        </Field>
      ) : null}
      {askPhone ? (
        <Field id="guide-phone" label={t('fields.phone')} error={err('phone')} optional>
          {(control) => <Input {...control} name="phone" type="tel" autoComplete="tel" dir="ltr" />}
        </Field>
      ) : null}
      <Checkbox
        id="guide-newsletter"
        name="newsletter"
        label={t('consent.newsletter')}
        hint={t('consent.newsletterHint')}
      />
      <p className="text-small text-ink-muted">{tg('privacy')}</p>
      <TurnstileSlot containerRef={turnstile.containerRef} failed={turnstile.state === 'error'} />
      <SubmitErrorAlert error={submitError?.error ?? null} retryAfterSeconds={submitError?.retry} />
      <div>
        <Button type="submit" loading={pending} icon={<Download aria-hidden="true" />}>
          {tg('submit')}
        </Button>
      </div>
    </form>
  )
}
