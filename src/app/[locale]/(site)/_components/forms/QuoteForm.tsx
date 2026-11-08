'use client'

import { CircleCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Checkbox, Radio, RadioGroup } from '@/components/ui/Choice'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Stepper } from '@/components/ui/Stepper'
import { ButtonLink } from '@/components/ui/Button'
import {
  auditScopes,
  contactStepSchema,
  contextSchemas,
  type FieldErrors,
  isOrganizationRequired,
  organizationKinds,
  partnerKinds,
  projectStages,
  type QuoteType,
  quoteTypes,
  takafulAudiences,
  timeframes,
  toFieldErrors,
  trainingFormats,
} from '@/features/leads/schemas'
import { responseDelayDays } from '@/features/leads/routing'
import type { SubmitError } from '@/features/leads/service'

import { submitQuoteAction } from '../../_actions/leads'
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
 * Devis en trois étapes (DESIGN §8) : type de demande → contexte → coordonnées.
 * Champs de contexte conditionnels selon le type ; validation zod à chaque étape (même
 * schéma que le serveur, qui revalide tout) ; Turnstile chargé à la première interaction.
 */

type Values = {
  type?: QuoteType
  context: Record<string, string>
  contact: Record<string, string | boolean>
}

type Done = { leadId: number; name: string; email: string; type: QuoteType }

const organizationTypes: ReadonlySet<QuoteType> = new Set([
  'audit',
  'conseil',
  'accompagnement',
  'formation-entreprise',
])

export function QuoteForm({
  initialType,
  sourcePage,
}: {
  initialType?: QuoteType
  sourcePage?: string
}) {
  const locale = useLocale()
  const t = useTranslations('forms')
  const tq = useTranslations('forms.quote')
  const errorText = useFieldErrorText()
  const turnstile = useTurnstile(locale)
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Values>({ type: initialType, context: {}, contact: {} })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<{ error: SubmitError; retry?: number } | null>(
    null,
  )
  const [done, setDone] = useState<Done | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  const steps = [tq('steps.type'), tq('steps.context'), tq('steps.contact')]
  const type = values.type

  // Après un changement d'étape, le focus va au titre de l'étape (lecteurs d'écran, clavier).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [step, done])

  type FormKey = Parameters<typeof t>[0]
  const options = (field: string, list: readonly string[]) =>
    list.map((value) => ({ value, label: t(`options.${field}.${value}` as FormKey) }))
  const headings = ['headings.0', 'headings.1', 'headings.2'] as const

  function fail(next: FieldErrors) {
    setErrors(next)
    requestAnimationFrame(() => focusFirstError(formRef.current))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSubmitError(null)

    if (step === 0) {
      const selected = readText(data, 'type')
      if (!(quoteTypes as readonly string[]).includes(selected)) return fail({ type: 'choice' })
      setErrors({})
      setValues((current) => ({ ...current, type: selected as QuoteType }))
      setStep(1)
      return
    }

    if (!type) return setStep(0)

    if (step === 1) {
      const context: Record<string, string> = {}
      for (const [key, value] of data.entries()) if (typeof value === 'string') context[key] = value
      const cleaned = Object.fromEntries(
        Object.entries(context).filter(([, value]) => value !== ''),
      )
      const result = contextSchemas[type].safeParse(cleaned)
      if (!result.success) return fail(toFieldErrors(result.error))
      setErrors({})
      setValues((current) => ({ ...current, context }))
      setStep(2)
      return
    }

    const contact = {
      name: readText(data, 'name'),
      email: readText(data, 'email'),
      phone: readText(data, 'phone'),
      organization: readText(data, 'organization'),
      jobTitle: readText(data, 'jobTitle'),
      city: readText(data, 'city'),
      processingConsent: readChecked(data, 'processingConsent'),
      newsletter: readChecked(data, 'newsletter'),
    }
    setValues((current) => ({ ...current, contact }))
    const result = contactStepSchema(type).safeParse(contact)
    if (!result.success) return fail(toFieldErrors(result.error))
    setErrors({})

    startTransition(async () => {
      const token = await turnstile.getToken()
      if (!token) {
        setSubmitError({ error: 'captcha' })
        return
      }
      const context = Object.fromEntries(
        Object.entries(values.context).filter(([, value]) => value !== ''),
      )
      const response = await submitQuoteAction(locale, {
        type,
        context,
        contact,
        turnstileToken: token,
        sourcePage,
      })
      turnstile.reset()
      if (response.ok) {
        setDone({ leadId: response.leadId, name: result.data.name, email: result.data.email, type })
        return
      }
      if (response.fieldErrors) {
        const contextErrors = Object.keys(response.fieldErrors).some((key) =>
          key.startsWith('context.'),
        )
        if (contextErrors) setStep(1)
        setErrors(
          Object.fromEntries(
            Object.entries(response.fieldErrors).map(([key, code]) => [
              key.replace(/^(context|contact)\./, ''),
              code,
            ]),
          ),
        )
      }
      setSubmitError({ error: response.error, retry: response.retryAfterSeconds })
    })
  }

  if (done) {
    const days = responseDelayDays[done.type]
    return (
      <section aria-labelledby="devis-confirmation" className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <CircleCheck aria-hidden="true" className="size-10 text-green-700" />
          <h2
            id="devis-confirmation"
            ref={headingRef}
            tabIndex={-1}
            className="text-h2 outline-none"
          >
            {tq('done.title', { name: done.name.split(' ')[0] ?? done.name })}
          </h2>
          <p className="max-w-measure text-body-lg text-ink-muted">
            {tq('done.lead', { type: t(`types.${done.type}`), reference: done.leadId })}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="font-sans text-h4">{tq('done.nextTitle')}</h3>
          <ol className="flex max-w-measure flex-col gap-4">
            {[
              tq('done.next1', { email: done.email }),
              tq('done.next2', { days }),
              tq('done.next3'),
            ].map((text, index) => (
              <li key={text} className="flex gap-4 border-t border-line pt-4">
                <span aria-hidden="true" className="font-display text-h3 text-gold-700 tabular">
                  {index + 1}
                </span>
                <span className="text-body">{text}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/ressources" variant="secondary">
            {tq('done.resources')}
          </ButtonLink>
          <ButtonLink href="/" variant="ghost">
            {tq('done.home')}
          </ButtonLink>
        </div>
      </section>
    )
  }

  const err = (name: string) => errorText(errors, name)
  const ctx = values.context
  const contact = values.contact
  const text = (key: string) => (typeof contact[key] === 'string' ? (contact[key] as string) : '')

  return (
    <div className="flex flex-col gap-10">
      <Stepper steps={steps} current={step} />
      <form
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        onFocusCapture={turnstile.activate}
        className="flex flex-col gap-8"
        aria-labelledby="devis-etape"
      >
        <h2 id="devis-etape" ref={headingRef} tabIndex={-1} className="text-h3 outline-none">
          {tq(headings[step] ?? 'headings.0')}
        </h2>

        {step === 0 ? (
          <RadioGroup id="type" legend={tq('typeLegend')} error={err('type')} className="gap-2">
            {quoteTypes.map((value) => (
              <Radio
                key={value}
                id={`type-${value}`}
                name="type"
                value={value}
                defaultChecked={type === value}
                aria-invalid={errors.type ? true : undefined}
                label={t(`types.${value}`)}
                hint={tq(`typeHints.${value}`)}
                className="rounded-control border border-line px-4 py-3 has-checked:border-green-700 has-checked:bg-green-50"
              />
            ))}
          </RadioGroup>
        ) : null}

        {step === 1 && type ? (
          <div key={type} className="grid gap-6 md:grid-cols-2">
            {organizationTypes.has(type) ? (
              <Field
                id="organizationKind"
                label={tq('fields.organizationKind')}
                error={err('organizationKind')}
                required
              >
                {(control) => (
                  <Select
                    {...control}
                    name="organizationKind"
                    placeholder={t('choose')}
                    defaultValue={ctx.organizationKind ?? ''}
                    options={options('organizationKind', organizationKinds)}
                  />
                )}
              </Field>
            ) : null}
            {type === 'audit' ? (
              <Field
                id="auditScope"
                label={tq('fields.auditScope')}
                error={err('auditScope')}
                required
              >
                {(control) => (
                  <Select
                    {...control}
                    name="auditScope"
                    placeholder={t('choose')}
                    defaultValue={ctx.auditScope ?? ''}
                    options={options('auditScope', auditScopes)}
                  />
                )}
              </Field>
            ) : null}
            {type === 'conseil' || type === 'accompagnement' ? (
              <Field
                id="projectStage"
                label={tq('fields.projectStage')}
                error={err('projectStage')}
                required
              >
                {(control) => (
                  <Select
                    {...control}
                    name="projectStage"
                    placeholder={t('choose')}
                    defaultValue={ctx.projectStage ?? ''}
                    options={options('projectStage', projectStages)}
                  />
                )}
              </Field>
            ) : null}
            {type === 'formation-entreprise' ? (
              <>
                <Field
                  id="learners"
                  label={tq('fields.learners')}
                  hint={tq('fields.learnersHint')}
                  error={err('learners')}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="learners"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      defaultValue={ctx.learners ?? ''}
                    />
                  )}
                </Field>
                <Field
                  id="trainingFormat"
                  label={tq('fields.trainingFormat')}
                  error={err('trainingFormat')}
                  required
                >
                  {(control) => (
                    <Select
                      {...control}
                      name="trainingFormat"
                      placeholder={t('choose')}
                      defaultValue={ctx.trainingFormat ?? ''}
                      options={options('trainingFormat', trainingFormats)}
                    />
                  )}
                </Field>
              </>
            ) : null}
            {type === 'takaful' ? (
              <Field
                id="takafulAudience"
                label={tq('fields.takafulAudience')}
                error={err('takafulAudience')}
                required
              >
                {(control) => (
                  <Select
                    {...control}
                    name="takafulAudience"
                    placeholder={t('choose')}
                    defaultValue={ctx.takafulAudience ?? ''}
                    options={options('takafulAudience', takafulAudiences)}
                  />
                )}
              </Field>
            ) : null}
            {type === 'partenariat' ? (
              <Field
                id="partnerKind"
                label={tq('fields.partnerKind')}
                error={err('partnerKind')}
                required
              >
                {(control) => (
                  <Select
                    {...control}
                    name="partnerKind"
                    placeholder={t('choose')}
                    defaultValue={ctx.partnerKind ?? ''}
                    options={options('partnerKind', partnerKinds)}
                  />
                )}
              </Field>
            ) : null}
            <Field id="timeframe" label={tq('fields.timeframe')} error={err('timeframe')} optional>
              {(control) => (
                <Select
                  {...control}
                  name="timeframe"
                  placeholder={t('choose')}
                  defaultValue={ctx.timeframe ?? ''}
                  options={options('timeframe', timeframes)}
                />
              )}
            </Field>
            <Field
              id="message"
              label={tq(`fields.message.${type}`)}
              hint={tq('fields.messageHint')}
              error={err('message')}
              required
              className="md:col-span-2"
            >
              {(control) => (
                <Textarea {...control} name="message" rows={6} defaultValue={ctx.message ?? ''} />
              )}
            </Field>
          </div>
        ) : null}

        {step === 2 && type ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Field id="name" label={t('fields.name')} error={err('name')} required>
              {(control) => (
                <Input {...control} name="name" autoComplete="name" defaultValue={text('name')} />
              )}
            </Field>
            <Field
              id="email"
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
                  defaultValue={text('email')}
                />
              )}
            </Field>
            <Field
              id="phone"
              label={t('fields.phone')}
              hint={t('fields.phoneHint')}
              error={err('phone')}
              optional
            >
              {(control) => (
                <Input
                  {...control}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  dir="ltr"
                  defaultValue={text('phone')}
                />
              )}
            </Field>
            <Field
              id="organization"
              label={t('fields.organization')}
              error={err('organization')}
              required={isOrganizationRequired(type)}
              optional={!isOrganizationRequired(type)}
            >
              {(control) => (
                <Input
                  {...control}
                  name="organization"
                  autoComplete="organization"
                  defaultValue={text('organization')}
                />
              )}
            </Field>
            <Field id="jobTitle" label={t('fields.jobTitle')} error={err('jobTitle')} optional>
              {(control) => (
                <Input
                  {...control}
                  name="jobTitle"
                  autoComplete="organization-title"
                  defaultValue={text('jobTitle')}
                />
              )}
            </Field>
            <Field id="city" label={t('fields.city')} error={err('city')} optional>
              {(control) => (
                <Input
                  {...control}
                  name="city"
                  autoComplete="address-level2"
                  defaultValue={text('city')}
                />
              )}
            </Field>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Checkbox
                id="processingConsent"
                name="processingConsent"
                required
                defaultChecked={contact.processingConsent === true}
                aria-invalid={errors.processingConsent ? true : undefined}
                label={t('consent.processing')}
                hint={t('consent.processingHint')}
              />
              {err('processingConsent') ? (
                <p className="text-small font-semibold text-danger">{err('processingConsent')}</p>
              ) : null}
              <Checkbox
                id="newsletter"
                name="newsletter"
                defaultChecked={contact.newsletter === true}
                label={t('consent.newsletter')}
                hint={t('consent.newsletterHint')}
              />
            </div>
          </div>
        ) : null}

        <TurnstileSlot containerRef={turnstile.containerRef} failed={turnstile.state === 'error'} />
        <SubmitErrorAlert
          error={submitError?.error ?? null}
          retryAfterSeconds={submitError?.retry}
        />

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => {
                setErrors({})
                setSubmitError(null)
                setStep(step - 1)
              }}
            >
              {t('previous')}
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" loading={pending}>
            {step < 2 ? t('next') : tq('submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
