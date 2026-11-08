import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

import { UIProvider } from '@/components/ui/UIProvider'
import { getDirection } from '@/lib/i18n/config'
import { routing } from '@/lib/i18n/routing'
import { getSiteUrl } from '@/lib/seo/config'
import { fontVariables } from '@/styles/fonts'

import '@/styles/globals.css'

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    // Base des URL absolues (images Open Graph de `[locale]/opengraph-image`).
    metadataBase: new URL(getSiteUrl()),
    title: { default: t('defaultTitle'), template: `%s · ${t('siteName')}` },
    description: t('defaultDescription'),
  }
}

/**
 * Espaces de noms de messages envoyés au navigateur : seulement ceux des composants clients
 * (en-tête, primitives, formulaires, page d'erreur). Les textes des pages restent côté
 * serveur, ce qui allège la charge utile de chaque page.
 */
const clientNamespaces = ['common', 'header', 'ui', 'forms', 'recovery'] as const

/** Layout racine des routes publiques : `lang`, `dir` et polices dépendent de la locale. */
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const dir = getDirection(locale)
  const messages = await getMessages()
  const clientMessages = Object.fromEntries(
    clientNamespaces.flatMap((namespace) =>
      messages[namespace] ? [[namespace, messages[namespace]]] : [],
    ),
  )

  return (
    <html lang={locale} dir={dir} className={fontVariables}>
      <body>
        <NextIntlClientProvider messages={clientMessages}>
          <UIProvider dir={dir}>{children}</UIProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
