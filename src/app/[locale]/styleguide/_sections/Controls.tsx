import { Download, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Logo } from '@/components/brand/Logo'
import { Trame } from '@/components/brand/Trame'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Checkbox, Radio, RadioGroup, Switch } from '@/components/ui/Choice'
import { Field } from '@/components/ui/Field'
import { IconButton } from '@/components/ui/IconButton'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Link } from '@/components/ui/Link'
import { Stepper } from '@/components/ui/Stepper'

import { GuideSection, Specimen, StateGrid } from '../_components/Specimen'

export function BrandSection() {
  const t = useTranslations('styleguide')
  return (
    <GuideSection id="marque" title={t('sections.brand.title')} lead={t('sections.brand.lead')}>
      <Specimen title={t('brand.logoColor')} note={t('brand.logoTodo')}>
        <div className="grid gap-6 md:grid-cols-3">
          <figure className="flex flex-col gap-3">
            <div className="grid h-40 place-items-center rounded-panel border border-line bg-paper">
              <Logo variant="color" size="lg" />
            </div>
            <figcaption className="text-small text-ink-muted">{t('brand.logoColor')}</figcaption>
          </figure>
          <figure className="flex flex-col gap-3">
            <div className="grid h-40 place-items-center rounded-panel bg-green-700">
              <Logo variant="inverse" size="lg" />
            </div>
            <figcaption className="text-small text-ink-muted">{t('brand.logoInverse')}</figcaption>
          </figure>
          <figure className="flex flex-col gap-3">
            <div className="grid h-40 place-items-center rounded-panel border border-line bg-sand-100">
              <Logo variant="symbol" size="lg" />
            </div>
            <figcaption className="text-small text-ink-muted">{t('brand.logoSymbol')}</figcaption>
          </figure>
        </div>
      </Specimen>
      <div className="grid gap-6 md:grid-cols-3">
        <figure className="flex flex-col gap-3">
          <div className="relative h-56 overflow-hidden rounded-panel bg-green-900">
            <Trame density={4} className="absolute inset-0 size-full" />
          </div>
          <figcaption className="text-small text-ink-muted">{t('brand.trameHero')}</figcaption>
        </figure>
        <figure className="flex flex-col gap-3">
          <div className="relative h-56 overflow-hidden rounded-panel bg-sand-100">
            <Trame density={4} opacity={0.12} className="absolute inset-0 size-full" />
          </div>
          <figcaption className="text-small text-ink-muted">{t('brand.trameLight')}</figcaption>
        </figure>
        <figure className="flex flex-col gap-3">
          <div className="grid h-56 place-items-center rounded-panel border border-line bg-paper">
            <span className="relative block size-24 overflow-hidden rounded-media bg-green-900">
              <Trame density={2} align="center" className="absolute inset-0 size-full" />
            </span>
          </div>
          <figcaption className="text-small text-ink-muted">{t('brand.trameFragment')}</figcaption>
        </figure>
      </div>
    </GuideSection>
  )
}

export function ButtonsSection() {
  const t = useTranslations('styleguide')
  const s = (key: 'rest' | 'hover' | 'focus' | 'active' | 'disabled' | 'loading') =>
    t(`states.${key}`)

  const lightVariants = [
    { variant: 'primary', title: t('buttons.primary'), label: t('buttons.primaryLabel') },
    { variant: 'secondary', title: t('buttons.secondary'), label: t('buttons.secondaryLabel') },
    { variant: 'ghost', title: t('buttons.ghost'), label: t('buttons.ghostLabel') },
  ] as const
  const darkVariants = [
    { variant: 'gold', title: t('buttons.gold'), label: t('buttons.goldLabel') },
    {
      variant: 'outline-light',
      title: t('buttons.outlineLight'),
      label: t('buttons.secondaryLabel'),
    },
  ] as const

  return (
    <GuideSection
      id="boutons"
      title={t('sections.buttons.title')}
      lead={t('sections.buttons.lead')}
    >
      {lightVariants.map(({ variant, title, label }) => (
        <Specimen key={variant} title={title}>
          <StateGrid
            items={[
              { label: s('rest'), node: <Button variant={variant}>{label}</Button> },
              {
                label: s('hover'),
                node: (
                  <Button variant={variant} data-force="hover">
                    {label}
                  </Button>
                ),
              },
              {
                label: s('focus'),
                node: (
                  <Button variant={variant} data-force="focus">
                    {label}
                  </Button>
                ),
              },
              {
                label: s('active'),
                node: (
                  <Button variant={variant} data-force="active">
                    {label}
                  </Button>
                ),
              },
              {
                label: s('disabled'),
                node: (
                  <Button variant={variant} disabled>
                    {label}
                  </Button>
                ),
              },
              {
                label: s('loading'),
                node: (
                  <Button variant={variant} loading>
                    {label}
                  </Button>
                ),
              },
            ]}
          />
        </Specimen>
      ))}
      {darkVariants.map(({ variant, title, label }) => (
        <Specimen key={variant} title={title}>
          <StateGrid
            surface="night"
            items={[
              { label: s('rest'), node: <Button variant={variant}>{label}</Button> },
              {
                label: s('hover'),
                node: (
                  <Button variant={variant} data-force="hover">
                    {label}
                  </Button>
                ),
              },
              {
                label: s('focus'),
                node: (
                  <Button variant={variant} data-force="focus">
                    {label}
                  </Button>
                ),
              },
              {
                label: s('active'),
                node: (
                  <Button variant={variant} data-force="active">
                    {label}
                  </Button>
                ),
              },
              {
                label: s('disabled'),
                node: (
                  <Button variant={variant} disabled>
                    {label}
                  </Button>
                ),
              },
            ]}
          />
        </Specimen>
      ))}
      <div className="grid gap-12 lg:grid-cols-2">
        <Specimen title={t('buttons.sizes')}>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="md">{t('buttons.sizeMd')}</Button>
            <Button size="lg">{t('buttons.sizeLg')}</Button>
            <ButtonLink
              href="/formation/cours"
              variant="secondary"
              icon={<Download aria-hidden="true" />}
            >
              {t('buttons.withIcon')}
            </ButtonLink>
          </div>
        </Specimen>
        <Specimen title={t('buttons.iconButtons')}>
          <StateGrid
            items={[
              {
                label: s('rest'),
                node: (
                  <IconButton
                    variant="outline"
                    label={t('buttons.iconLabel')}
                    icon={<Share2 aria-hidden="true" />}
                  />
                ),
              },
              {
                label: s('hover'),
                node: (
                  <IconButton
                    variant="outline"
                    label={t('buttons.iconLabel')}
                    icon={<Share2 aria-hidden="true" />}
                    data-force="hover"
                  />
                ),
              },
              {
                label: s('focus'),
                node: (
                  <IconButton
                    variant="outline"
                    label={t('buttons.iconLabel')}
                    icon={<Share2 aria-hidden="true" />}
                    data-force="focus"
                  />
                ),
              },
              {
                label: s('disabled'),
                node: (
                  <IconButton
                    variant="outline"
                    label={t('buttons.iconLabel')}
                    icon={<Share2 aria-hidden="true" />}
                    disabled
                  />
                ),
              },
            ]}
          />
        </Specimen>
      </div>
      <Specimen title={t('buttons.links')}>
        <p className="text-body">
          {t.rich('buttons.inlineLink', {
            link: (chunks) => <Link href="/formation/cours">{chunks}</Link>,
          })}
        </p>
        <StateGrid
          items={(['rest', 'hover', 'focus', 'active'] as const).map((state) => ({
            label: s(state),
            node: (
              <Link
                href="/formation/cours"
                variant="standalone"
                data-force={state === 'rest' ? undefined : state}
              >
                {t('buttons.standaloneLink')}
              </Link>
            ),
          }))}
        />
      </Specimen>
    </GuideSection>
  )
}

export function FormsSection() {
  const tg = useTranslations('styleguide')
  const t = useTranslations('styleguide.forms')
  const ts = useTranslations('styleguide.states')
  const needs = (['audit', 'advisory', 'training', 'partnership'] as const).map((value) => ({
    value,
    label: t(`needs.${value}`),
  }))

  return (
    <GuideSection
      id="formulaires"
      title={tg('sections.forms.title')}
      lead={tg('sections.forms.lead')}
      tone="sand"
    >
      <Specimen title={t('steps.organization')} note={t('stepperAt')}>
        <div className="rounded-panel border border-line bg-paper p-6">
          <Stepper
            steps={[t('steps.need'), t('steps.organization'), t('steps.contact')]}
            current={1}
          />
        </div>
      </Specimen>
      <div className="grid gap-x-gutter gap-y-10 rounded-panel border border-line bg-paper p-6 md:grid-cols-2 md:p-8">
        <Field id="sg-name" label={`${t('name')} (${ts('rest')})`}>
          {(control) => (
            <Input {...control} placeholder={t('namePlaceholder')} autoComplete="name" />
          )}
        </Field>
        <Field id="sg-name-hover" label={`${t('name')} (${ts('hover')})`}>
          {(control) => (
            <Input {...control} defaultValue={t('namePlaceholder')} data-force="hover" />
          )}
        </Field>
        <Field id="sg-email-focus" label={`${t('email')} (${ts('focus')})`} hint={t('emailHint')}>
          {(control) => <Input {...control} type="email" data-force="focus" />}
        </Field>
        <Field
          id="sg-email-error"
          label={`${t('email')} (${ts('error')})`}
          error={t('emailError')}
          required
        >
          {(control) => <Input {...control} type="email" defaultValue="aminatou@" />}
        </Field>
        <Field id="sg-org" label={`${t('organization')} (${ts('disabled')})`} optional>
          {(control) => <Input {...control} disabled defaultValue="Amana Conseil" />}
        </Field>
        <Field id="sg-need" label={t('need')}>
          {(control) => <Select {...control} options={needs} placeholder={t('needPlaceholder')} />}
        </Field>
        <Field
          id="sg-message"
          label={t('message')}
          hint={t('messageHint')}
          className="md:col-span-2"
        >
          {(control) => <Textarea {...control} rows={4} />}
        </Field>
      </div>
      <div className="grid gap-x-gutter gap-y-10 rounded-panel border border-line bg-paper p-6 md:grid-cols-3 md:p-8">
        <div className="flex flex-col">
          <Checkbox id="sg-consent" label={t('consent')} hint={t('consentHint')} />
          <Checkbox
            id="sg-newsletter"
            label={`${t('newsletter')} (${ts('checked')})`}
            defaultChecked
          />
          <Checkbox
            id="sg-themes"
            label={`${t('themes')} (${ts('indeterminate')})`}
            indeterminate
          />
          <div data-force="hover">
            <Checkbox id="sg-hover" label={`${t('newsletter')} (${ts('hover')})`} />
          </div>
          <Checkbox
            id="sg-focus"
            label={`${t('newsletter')} (${ts('focus')})`}
            data-force="focus"
          />
          <Checkbox
            id="sg-check-disabled"
            label={`${t('newsletter')} (${ts('disabled')})`}
            disabled
            defaultChecked
          />
          <Checkbox id="sg-check-error" label={`${t('consent')} (${ts('error')})`} aria-invalid />
        </div>
        <RadioGroup id="sg-channel" legend={t('channel')}>
          <Radio
            id="sg-channel-phone"
            name="sg-channel"
            value="phone"
            label={t('channels.phone')}
          />
          <Radio
            id="sg-channel-email"
            name="sg-channel"
            value="email"
            label={t('channels.email')}
            defaultChecked
          />
          <Radio
            id="sg-channel-whatsapp"
            name="sg-channel"
            value="whatsapp"
            label={`${t('channels.whatsapp')} (${ts('disabled')})`}
            disabled
          />
        </RadioGroup>
        <div className="flex flex-col">
          <Switch id="sg-saver" label={t('dataSaver')} hint={t('dataSaverHint')} />
          <Switch id="sg-saver-on" label={`${t('dataSaver')} (${ts('on')})`} defaultChecked />
          <Switch
            id="sg-saver-focus"
            label={`${t('dataSaver')} (${ts('focus')})`}
            data-force="focus"
          />
          <Switch id="sg-saver-disabled" label={`${t('dataSaver')} (${ts('disabled')})`} disabled />
        </div>
      </div>
    </GuideSection>
  )
}
