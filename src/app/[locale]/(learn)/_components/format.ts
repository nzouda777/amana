import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/lib/i18n/config'

/** Durée lisible côté serveur (« 45 min », « 3 h », « 3 h 20 »), mêmes messages que `CourseCard`. */
export async function getDurationFormatter(locale: Locale): Promise<(minutes: number) => string> {
  const t = await getTranslations({ locale, namespace: 'ui.duration' })
  return (minutes) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return t('minutes', { minutes: m })
    if (m === 0) return t('hours', { hours: h })
    return t('hoursMinutes', { hours: h, minutes: String(m).padStart(2, '0') })
  }
}

/** Date courte localisée (avis). */
export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'Africa/Douala' }).format(
    new Date(value),
  )
}
