import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/components/ui/Link'

import { getPathname } from '@/lib/i18n/navigation'
import { routing } from '@/lib/i18n/routing'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'styleguide' })
  return { title: t('compareTitle'), robots: { index: false, follow: false, nocache: true } }
}

/**
 * Français et arabe côte à côte : chaque colonne est un vrai document (lang, dir,
 * polices, portails Radix), ce qu'un simple conteneur `dir="rtl"` ne garantit pas.
 */
export default async function StyleguideComparePage({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const t = await getTranslations('styleguide')
  const frames = [
    { lang: 'fr', title: t('compareFrameFr') },
    { lang: 'ar', title: t('compareFrameAr') },
  ] as const

  return (
    <main className="flex min-h-dvh flex-col bg-sand-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-paper px-margin py-3">
        <h1 className="font-sans text-h4">{t('compareTitle')}</h1>
        <Link href="/styleguide" variant="standalone" className="inline-flex min-h-11 items-center">
          {t('backLink')}
        </Link>
      </header>
      <div className="grid flex-1 gap-px bg-line lg:grid-cols-2">
        {frames.map((frame) => (
          <iframe
            key={frame.lang}
            title={frame.title}
            src={getPathname({ locale: frame.lang, href: '/styleguide' })}
            className="h-[80dvh] w-full bg-paper lg:h-full"
          />
        ))}
      </div>
    </main>
  )
}
