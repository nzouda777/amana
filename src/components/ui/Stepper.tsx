import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from './cn'

export type StepperProps = {
  /** Libellés courts des étapes (2 à 4 pour un devis). */
  steps: readonly string[]
  /** Index de l'étape en cours, à partir de 0. */
  current: number
  className?: string
}

/**
 * Indicateur de progression d'un formulaire en plusieurs étapes (DESIGN §8).
 * Mobile : « Étape 2 sur 3 » + libellé et barre. Desktop : toutes les étapes.
 * Les étapes ne sont pas cliquables : la navigation passe par les boutons du formulaire.
 */
export function Stepper({ steps, current, className }: StepperProps) {
  const t = useTranslations('ui.stepper')
  const total = steps.length
  const index = Math.min(Math.max(current, 0), total - 1)
  const currentLabel = steps[index] ?? ''

  return (
    <nav aria-label={t('label')} className={cn('w-full', className)}>
      <p className="text-small text-ink-muted md:sr-only">
        <span className="tabular">{t('progress', { current: index + 1, total })}</span>
        <span className="sr-only"> : </span>
        <span className="mt-1 block text-h4 font-semibold text-ink md:hidden">{currentLabel}</span>
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-pill bg-line md:hidden" aria-hidden="true">
        <div
          className={cn(
            'h-full rounded-pill bg-green-700 transition-[width] duration-(--duration-panel) ease-standard',
            stepWidth[Math.min(total, 4)]?.[index],
          )}
        />
      </div>

      <ol className="hidden md:flex md:items-start md:gap-4">
        {steps.map((label, i) => {
          const state = i < index ? 'complete' : i === index ? 'current' : 'upcoming'
          return (
            <li
              key={label}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex flex-1 flex-col gap-3"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-1 rounded-pill',
                  state === 'upcoming' ? 'bg-line' : 'bg-green-700',
                )}
              />
              <span className="flex items-center gap-2 text-small">
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-grid size-6 shrink-0 place-items-center rounded-pill border tabular text-caption font-semibold',
                    state === 'complete' && 'border-green-700 bg-green-700 text-paper',
                    state === 'current' && 'border-green-700 bg-paper text-green-700',
                    state === 'upcoming' && 'border-line-strong text-ink-muted',
                  )}
                >
                  {state === 'complete' ? <Check className="size-4" /> : i + 1}
                </span>
                <span
                  className={cn(state === 'current' ? 'font-semibold text-ink' : 'text-ink-muted')}
                >
                  {label}
                  <span className="sr-only"> ({t(state)})</span>
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* Largeurs de la barre mobile, écrites en toutes lettres pour que Tailwind les génère. */
const stepWidth: Record<number, readonly string[]> = {
  1: ['w-full'],
  2: ['w-1/2', 'w-full'],
  3: ['w-1/3', 'w-2/3', 'w-full'],
  4: ['w-1/4', 'w-2/4', 'w-3/4', 'w-full'],
}
