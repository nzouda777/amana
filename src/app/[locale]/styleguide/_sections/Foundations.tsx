import { useLocale, useTranslations } from 'next-intl'

import { cn } from '@/components/ui/cn'
import { formatPrice } from '@/components/ui/Price'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/Table'
import { contrastRatio } from '@/styles/contrast'
import { minimumRatio, pairs } from '@/styles/pairs'
import { toXaf } from '@/lib/money'
import { palette, paletteGroups, type ColorToken } from '@/styles/palette'

import { GuideSection, Specimen } from '../_components/Specimen'

/* Classes écrites en toutes lettres pour que Tailwind les génère. */
const swatchClass: Record<ColorToken, string> = {
  'green-900': 'bg-green-900',
  'green-800': 'bg-green-800',
  'green-700': 'bg-green-700',
  'green-50': 'bg-green-50',
  'gold-700': 'bg-gold-700',
  'gold-500': 'bg-gold-500',
  'gold-200': 'bg-gold-200',
  'sand-300': 'bg-sand-300',
  'sand-100': 'bg-sand-100',
  paper: 'bg-paper',
  ink: 'bg-ink',
  'ink-muted': 'bg-ink-muted',
  'ink-subtle': 'bg-ink-subtle',
  line: 'bg-line',
  'line-strong': 'bg-line-strong',
  danger: 'bg-danger',
  'danger-50': 'bg-danger-50',
  warning: 'bg-warning',
  'warning-50': 'bg-warning-50',
  info: 'bg-info',
  'info-50': 'bg-info-50',
}

function Swatch({ token }: { token: ColorToken }) {
  const t = useTranslations('styleguide.colors.roles')
  return (
    <li className="flex flex-col gap-3">
      <span
        aria-hidden="true"
        className={cn('block h-20 rounded-panel border border-line', swatchClass[token])}
      />
      <span className="flex flex-col">
        <span className="text-small font-semibold text-ink">{token}</span>
        <span className="text-small text-ink-muted uppercase">
          <bdi dir="ltr">{palette[token]}</bdi>
        </span>
        <span className="text-small text-ink-muted">{t(token)}</span>
      </span>
    </li>
  )
}

export function ColorsSection() {
  const t = useTranslations('styleguide')
  const locale = useLocale()
  // Arrondi vers le bas (jamais un échec affiché en réussite), virgule décimale en français.
  const ratio = new Intl.NumberFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale, {
    maximumFractionDigits: 2,
  })
  const groups = [
    ['brand', paletteGroups.brand],
    ['derived', paletteGroups.derived],
    ['system', paletteGroups.system],
  ] as const
  return (
    <GuideSection id="couleurs" title={t('sections.colors.title')} lead={t('sections.colors.lead')}>
      {groups.map(([key, tokens]) => (
        <Specimen key={key} title={t(`colors.${key}`)}>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {tokens.map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </ul>
        </Specimen>
      ))}
      <Specimen title={t('colors.pairs')} note={t('colors.pairsCaption')}>
        <Table label={t('colors.pairs')}>
          <THead>
            <Tr>
              <Th sticky>{t('colors.fg')}</Th>
              <Th>{t('colors.bg')}</Th>
              <Th>{t('colors.use')}</Th>
              <Th numeric>{t('colors.ratio')}</Th>
              <Th numeric>{t('colors.minimum')}</Th>
            </Tr>
          </THead>
          <TBody>
            {pairs.map((pair) => (
              <Tr key={`${pair.fg}-${pair.bg}-${pair.use}`}>
                <Td sticky>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-4 rounded-media border border-line',
                        swatchClass[pair.fg],
                      )}
                    />
                    {pair.fg}
                  </span>
                </Td>
                <Td>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-4 rounded-media border border-line',
                        swatchClass[pair.bg],
                      )}
                    />
                    {pair.bg}
                  </span>
                </Td>
                <Td>{t(`colors.uses.${pair.use}`)}</Td>
                <Td numeric>
                  {ratio.format(
                    Math.floor(contrastRatio(palette[pair.fg], palette[pair.bg]) * 100) / 100,
                  )}
                  :1
                </Td>
                <Td numeric>{ratio.format(minimumRatio[pair.use])}:1</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Specimen>
    </GuideSection>
  )
}

const typeScale = [
  {
    token: 'display',
    className: 'font-display text-display',
    min: 44,
    max: 88,
    sample: 'headline',
  },
  { token: 'h1', className: 'font-display text-h1', min: 36, max: 60, sample: 'headline' },
  { token: 'h2', className: 'font-display text-h2', min: 28, max: 42, sample: 'headline' },
  { token: 'h3', className: 'font-display text-h3', min: 22, max: 28, sample: 'sentence' },
  { token: 'h4', className: 'text-h4 font-semibold', min: 18, max: 20, sample: 'sentence' },
  { token: 'body-lg', className: 'text-body-lg', min: 18, max: 20, sample: 'body' },
  { token: 'body', className: 'text-body', min: 17, max: 18, sample: 'body' },
  { token: 'small', className: 'text-small text-ink-subtle', min: 15, max: 15, sample: 'sentence' },
  {
    token: 'caption',
    className: 'text-caption text-ink-muted',
    min: 13,
    max: 13,
    sample: 'sentence',
  },
] as const

export function TypographySection() {
  const t = useTranslations('styleguide')
  const locale = useLocale()
  return (
    <GuideSection
      id="typographie"
      title={t('sections.typography.title')}
      lead={t('sections.typography.lead')}
    >
      <dl className="flex flex-col">
        {typeScale.map((step) => (
          <div
            key={step.token}
            className="grid gap-3 border-t border-line py-8 lg:grid-cols-12 lg:gap-gutter"
          >
            <dt className="flex flex-col gap-1 text-small lg:col-span-3">
              <span className="font-semibold text-ink">{step.token}</span>
              <span className="text-ink-muted">{t(`typography.scale.${step.token}`)}</span>
              <span className="text-ink-muted tabular">
                {step.min === step.max
                  ? t('typography.fixed', { size: step.min })
                  : t('typography.range', { min: step.min, max: step.max })}
              </span>
            </dt>
            <dd className={cn('lg:col-span-9', step.className)}>
              {t(`typography.${step.sample}`)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-8 md:grid-cols-2">
        <Specimen title={t('typography.numerals')}>
          <p className="flex flex-col text-h3 tabular">
            <span>{formatPrice(toXaf(1_250_000), locale)}</span>
            <span>{formatPrice(toXaf(87_500), locale)}</span>
          </p>
        </Specimen>
        <Specimen title={t('typography.italic')}>
          <p className="font-display text-h3 italic">{t('typography.headline')}</p>
        </Specimen>
      </div>
    </GuideSection>
  )
}

const spacingSteps = [
  { step: 1, className: 'w-1' },
  { step: 2, className: 'w-2' },
  { step: 3, className: 'w-3' },
  { step: 4, className: 'w-4' },
  { step: 6, className: 'w-6' },
  { step: 8, className: 'w-8' },
  { step: 12, className: 'w-12' },
  { step: 16, className: 'w-16' },
  { step: 24, className: 'w-24' },
  { step: 32, className: 'w-32' },
] as const

const radii = [
  { key: 'media', className: 'rounded-media', px: '2' },
  { key: 'control', className: 'rounded-control', px: '6' },
  { key: 'panel', className: 'rounded-panel', px: '10' },
  { key: 'pill', className: 'rounded-pill', px: '999' },
] as const

const durations = [
  { key: 'hover', ms: 120, className: 'duration-(--duration-hover)' },
  { key: 'menu', ms: 200, className: 'duration-(--duration-menu)' },
  { key: 'panel', ms: 280, className: 'duration-(--duration-panel)' },
  { key: 'trame', ms: 1400, className: 'duration-(--duration-trame)' },
] as const

export function SpacingSection() {
  const t = useTranslations('styleguide')
  return (
    <GuideSection
      id="espacements"
      title={t('sections.spacing.title')}
      lead={t('sections.spacing.lead')}
      tone="sand"
    >
      <Specimen title={t('spacing.scale')}>
        <ul className="flex flex-col gap-2">
          {spacingSteps.map((item) => (
            <li key={item.step} className="flex items-center gap-4 text-small">
              <span className="w-16 text-ink-muted tabular">{item.step * 4} px</span>
              <span aria-hidden="true" className={cn('block h-3 bg-green-700', item.className)} />
            </li>
          ))}
        </ul>
      </Specimen>
      <div className="grid gap-12 lg:grid-cols-2">
        <Specimen title={t('spacing.radii')}>
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {radii.map((radius) => (
              <li key={radius.key} className="flex flex-col gap-3 text-small">
                <span
                  aria-hidden="true"
                  className={cn('block h-16 border border-green-700 bg-paper', radius.className)}
                />
                <span className="font-semibold">{t(`spacing.radius.${radius.key}`)}</span>
                <span className="text-ink-muted tabular">{radius.px} px</span>
              </li>
            ))}
          </ul>
        </Specimen>
        <Specimen title={t('spacing.shadow')}>
          <div className="rounded-panel bg-paper p-6 text-small text-ink-muted shadow-float">
            {t('spacing.shadowSample')}
          </div>
        </Specimen>
      </div>
      <Specimen title={t('spacing.motion')} note={t('spacing.hoverMe')}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {durations.map((duration) => (
            <li
              key={duration.key}
              className="group flex flex-col gap-3 rounded-panel border border-line bg-paper p-4 text-small"
            >
              <span className="relative block h-2 overflow-hidden rounded-pill bg-line">
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-y-0 start-0 w-1/5 rounded-pill bg-green-700 ease-standard group-is-hover:w-full',
                    'transition-[width]',
                    duration.className,
                  )}
                />
              </span>
              <span className="font-semibold">{t(`spacing.durations.${duration.key}`)}</span>
              <span className="text-ink-muted tabular">{duration.ms} ms</span>
            </li>
          ))}
        </ul>
        <p className="text-small text-ink-muted">
          {t('spacing.easing')} <span dir="ltr">cubic-bezier(0.2, 0.7, 0.2, 1)</span>
        </p>
      </Specimen>
    </GuideSection>
  )
}
