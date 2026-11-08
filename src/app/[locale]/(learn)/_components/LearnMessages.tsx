import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import type { ReactNode } from 'react'

type Messages = Awaited<ReturnType<typeof getMessages>>

/** Espaces `learn.*` lus par les composants clients de la formation. */
export type LearnClientNamespace = 'auth' | 'preview'

/**
 * Messages des îlots clients de la formation (formulaires d'authentification, extraits),
 * fournis seulement aux pages qui en ont besoin : le reste du site n'en paie pas le poids.
 * Le fournisseur imbriqué remplace celui du gabarit : on y recopie les espaces communs.
 */
export async function LearnMessages({
  namespaces,
  children,
}: {
  namespaces: readonly LearnClientNamespace[]
  children: ReactNode
}) {
  const messages: Messages = await getMessages()
  const learn = (messages.learn ?? {}) as Record<string, unknown>
  const picked = {
    common: messages.common,
    header: messages.header,
    ui: messages.ui,
    forms: messages.forms,
    recovery: messages.recovery,
    learn: Object.fromEntries(namespaces.map((namespace) => [namespace, learn[namespace]])),
  }
  return <NextIntlClientProvider messages={picked as Messages}>{children}</NextIntlClientProvider>
}
