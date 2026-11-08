import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { render } from '@react-email/render'
import { Resend } from 'resend'

import {
  type EmailAddress,
  EmailError,
  type EmailMessage,
  type EmailSender,
  type EmailSendResult,
} from '@/features/email/contracts'

function formatAddress(address: EmailAddress): string {
  if (typeof address === 'string') return address
  return address.name ? `${address.name.replace(/[<>"]/g, '')} <${address.email}>` : address.email
}

function formatList(addresses: EmailAddress | EmailAddress[]): string[] {
  return (Array.isArray(addresses) ? addresses : [addresses]).map(formatAddress)
}

/** Envoi réel via Resend (production). */
export class ResendEmailSender implements EmailSender {
  private readonly client: Resend

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey)
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const to = formatList(message.to)
    if (to.length === 0) throw new EmailError('invalid-recipient', 'Aucun destinataire.')
    const html = message.react ? await render(message.react) : undefined
    const { data, error } = await this.client.emails.send(
      {
        from: this.from,
        to,
        subject: message.subject,
        text: message.text,
        ...(html ? { html } : {}),
        ...(message.replyTo ? { replyTo: formatAddress(message.replyTo) } : {}),
        ...(message.tags
          ? {
              tags: Object.entries(message.tags).map(([name, value]) => ({
                name,
                value: value.replace(/[^\w-]/g, '_'),
              })),
            }
          : {}),
      },
      message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined,
    )
    if (error || !data) throw new EmailError('provider-unavailable', error?.message ?? 'Resend')
    return { id: data.id }
  }
}

/**
 * Adaptateur de développement : écrit chaque e-mail rendu (HTML + texte + en-têtes)
 * dans un dossier ignoré par git, au lieu de l'envoyer. Aucun `console.log`.
 */
export class FileEmailSender implements EmailSender {
  constructor(
    private readonly directory: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const to = formatList(message.to)
    if (to.length === 0) throw new EmailError('invalid-recipient', 'Aucun destinataire.')
    await mkdir(this.directory, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const slug = message.subject
      .normalize('NFKD')
      .replace(/[^\w]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)
      .toLowerCase()
    const id = `${stamp}-${Math.random().toString(36).slice(2, 8)}-${slug}`
    const html = message.react ? await render(message.react) : null
    const meta = {
      id,
      from: this.from,
      to,
      subject: message.subject,
      replyTo: message.replyTo ? formatAddress(message.replyTo) : undefined,
      tags: message.tags,
      idempotencyKey: message.idempotencyKey,
      text: message.text,
    }
    await writeFile(path.join(this.directory, `${id}.json`), JSON.stringify(meta, null, 2), 'utf8')
    if (html) await writeFile(path.join(this.directory, `${id}.html`), html, 'utf8')
    return { id }
  }
}
