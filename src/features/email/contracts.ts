import type { ReactElement } from 'react'

/**
 * Envoi d'e-mails transactionnels (Resend en production, implémentation console en dev).
 * La newsletter (Brevo) est un autre contrat : `NewsletterGateway`.
 */

export type EmailAddress = string | { email: string; name?: string }

export type EmailMessage = {
  to: EmailAddress | EmailAddress[]
  subject: string
  /** Gabarit React Email ; `text` reste obligatoire (clients texte, filtres anti-spam). */
  react?: ReactElement
  text: string
  replyTo?: EmailAddress
  /** Étiquettes d'analyse côté fournisseur (ex. `lead:audit`, `order:paid`). */
  tags?: Record<string, string>
  /** Empêche un double envoi si l'appel est rejoué (webhook, relance). */
  idempotencyKey?: string
}

export type EmailSendResult = { id: string }

export class EmailError extends Error {
  constructor(
    public readonly code: 'invalid-recipient' | 'provider-unavailable' | 'rejected',
    message: string,
  ) {
    super(message)
    this.name = 'EmailError'
  }
}

export interface EmailSender {
  send(message: EmailMessage): Promise<EmailSendResult>
}

export type NewsletterInterest = 'formation' | 'audit' | 'takaful' | 'reglementaire'

/** Synchronisation des abonnés confirmés (double opt-in) avec l'outil de newsletter. */
export interface NewsletterGateway {
  upsertContact(input: {
    email: string
    firstName?: string
    interests: NewsletterInterest[]
    locale: 'fr' | 'en' | 'ar'
  }): Promise<{ contactId: string }>
  unsubscribe(email: string): Promise<void>
}
