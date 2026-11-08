'use client'

import { CalendarClock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Radio, RadioGroup } from '@/components/ui/Choice'
import { Alert } from '@/components/ui/Feedback'

/**
 * Réservation Cal.com chargée à la demande : aucun script tiers avant le clic sur
 * « Afficher l'agenda ». Couleur de marque transmise à l'agenda (vert Amana).
 * Types d'entretien (SPEC §4.3) : découverte 30 min, audit, conseil.
 */

const EMBED_SCRIPT = 'https://app.cal.com/embed/embed.js'
const BRAND = '#1B5E20' // green-700 (DESIGN §2)

export const appointmentKinds = ['decouverte', 'audit', 'conseil'] as const
type AppointmentKind = (typeof appointmentKinds)[number]

type CalQueue = ((...args: unknown[]) => void) & {
  q?: unknown[][]
  loaded?: boolean
  ns?: Record<string, unknown>
}

declare global {
  interface Window {
    Cal?: CalQueue
  }
}

/** File d'attente officielle de l'embed Cal.com (les appels sont rejoués au chargement). */
function ensureCal(): CalQueue {
  if (window.Cal) return window.Cal
  const cal: CalQueue = Object.assign(
    (...args: unknown[]) => {
      if (!cal.loaded) {
        cal.ns = {}
        cal.q = cal.q ?? []
        const script = document.createElement('script')
        script.src = EMBED_SCRIPT
        script.async = true
        document.head.appendChild(script)
        cal.loaded = true
      }
      ;(cal.q ??= []).push(args)
    },
    { q: [] as unknown[][] },
  )
  window.Cal = cal
  return cal
}

export function CalBooking({ username }: { username?: string }) {
  const locale = useLocale()
  const t = useTranslations('forms.appointment')
  const [kind, setKind] = useState<AppointmentKind>('decouverte')
  const [opened, setOpened] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  if (!username) {
    return (
      <Alert tone="info" title={t('unavailableTitle')}>
        {t('unavailableText')}
      </Alert>
    )
  }

  function open() {
    if (!containerRef.current) return
    const cal = ensureCal()
    cal('init', { origin: 'https://app.cal.com' })
    cal('inline', {
      elementOrSelector: containerRef.current,
      calLink: `${username}/${kind}`,
      config: { layout: 'month_view', theme: 'light', locale },
    })
    cal('ui', {
      theme: 'light',
      cssVarsPerTheme: { light: { 'cal-brand': BRAND } },
      hideEventTypeDetails: false,
      layout: 'month_view',
    })
    setOpened(true)
  }

  return (
    <div className="flex flex-col gap-8">
      {opened ? null : (
        <div className="flex flex-col gap-6">
          <RadioGroup id="rdv-type" legend={t('kindLegend')} className="gap-2">
            {appointmentKinds.map((value) => (
              <Radio
                key={value}
                id={`rdv-${value}`}
                name="rdv-type"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                label={t(`kinds.${value}.label`)}
                hint={t(`kinds.${value}.hint`)}
                className="rounded-control border border-line px-4 py-3 has-checked:border-green-700 has-checked:bg-green-50"
              />
            ))}
          </RadioGroup>
          <div className="flex flex-col gap-2">
            <div>
              <Button onClick={open} icon={<CalendarClock aria-hidden="true" />}>
                {t('open')}
              </Button>
            </div>
            <p className="text-small text-ink-muted">{t('privacy')}</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        role={opened ? 'region' : undefined}
        aria-label={opened ? t('calendarLabel') : undefined}
        className={
          opened ? 'min-h-[600px] w-full overflow-auto rounded-panel border border-line' : 'hidden'
        }
      />
    </div>
  )
}
