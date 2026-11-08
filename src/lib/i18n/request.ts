import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { fallbackLocale, type Locale } from './config'
import { mergeMessages, type Messages } from './merge-messages'
import { routing } from './routing'

async function loadMessages(locale: Locale): Promise<Messages> {
  const messages = (await import(`../../../messages/${locale}.json`)) as { default: Messages }
  return messages.default
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  const messages =
    locale === fallbackLocale
      ? await loadMessages(locale)
      : mergeMessages(await loadMessages(fallbackLocale), await loadMessages(locale))

  return {
    locale,
    messages,
    timeZone: 'Africa/Douala',
  }
})
