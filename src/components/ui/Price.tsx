import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/lib/i18n/config'
import { formatXaf, type Xaf } from '@/lib/money'

import { cn } from './cn'

/**
 * Locale de formatage par langue d'interface. Le XAF s'affiche toujours en chiffres
 * latins (usage camerounais, y compris dans l'interface arabe).
 */
const numberLocale: Record<Locale, string> = {
  fr: 'fr-CM',
  en: 'en-CM',
  ar: 'ar-u-nu-latn',
}

export function formatPrice(amount: Xaf, locale: Locale): string {
  return formatXaf(amount, numberLocale[locale])
}

export type PriceProps = {
  /** Montant en francs CFA entiers ; `0` affiche « Gratuit ». */
  amount: Xaf
  /** Prix initial barré (promotion réelle uniquement, jamais fictive). */
  compareAt?: Xaf
  size?: 'sm' | 'md' | 'lg'
  tone?: 'default' | 'light'
  className?: string
}

const sizes = {
  sm: 'text-body font-semibold',
  md: 'text-h4 font-semibold',
  lg: 'font-display text-h2',
} as const

/** Prix en XAF, chiffres tabulaires, avec prix initial barré facultatif. */
export function Price({ amount, compareAt, size = 'md', tone = 'default', className }: PriceProps) {
  const locale = useLocale()
  const t = useTranslations('ui.price')
  const isFree = amount === 0
  const showCompare = compareAt !== undefined && compareAt > amount

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular', className)}>
      <span className={cn(sizes[size], tone === 'light' ? 'text-paper' : 'text-ink')}>
        {showCompare ? <span className="sr-only">{t('current')} </span> : null}
        {isFree ? t('free') : formatPrice(amount, locale)}
      </span>
      {showCompare ? (
        <span className={cn('text-small', tone === 'light' ? 'text-sand-300' : 'text-ink-subtle')}>
          <span className="sr-only">{t('compareAt')} </span>
          <s>{formatPrice(compareAt, locale)}</s>
        </span>
      ) : null}
    </span>
  )
}
