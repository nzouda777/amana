import type { NewsletterGateway, NewsletterInterest } from '@/features/email/contracts'

/**
 * Synchronisation newsletter avec Brevo (API v3 « contacts »). Les centres d'intérêt
 * sont envoyés comme attribut `INTERETS` (texte) ; la langue comme `LANGUE`.
 * TODO(client) : identifiant de la liste Brevo (`BREVO_LIST_ID`) et attributs créés côté Brevo.
 */
export class BrevoNewsletterGateway implements NewsletterGateway {
  constructor(
    private readonly apiKey: string,
    private readonly listId?: number,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request(pathname: string, init: RequestInit): Promise<Response> {
    const response = await this.fetchImpl(`https://api.brevo.com/v3${pathname}`, {
      ...init,
      headers: {
        'api-key': this.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok && response.status !== 204)
      throw new Error(`Brevo ${pathname} : HTTP ${response.status}`)
    return response
  }

  async upsertContact(input: {
    email: string
    firstName?: string
    interests: NewsletterInterest[]
    locale: 'fr' | 'en' | 'ar'
  }): Promise<{ contactId: string }> {
    const response = await this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        updateEnabled: true,
        attributes: {
          ...(input.firstName ? { PRENOM: input.firstName } : {}),
          INTERETS: input.interests.join(','),
          LANGUE: input.locale,
        },
        ...(this.listId ? { listIds: [this.listId] } : {}),
      }),
    })
    const body = response.status === 204 ? null : ((await response.json()) as { id?: number })
    return { contactId: body?.id ? String(body.id) : input.email }
  }

  async unsubscribe(email: string): Promise<void> {
    await this.request(`/contacts/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify({ emailBlacklisted: true }),
    })
  }
}

/** Sans clé Brevo (développement) : aucune synchronisation. */
export class NoopNewsletterGateway implements NewsletterGateway {
  async upsertContact(): Promise<{ contactId: string }> {
    return { contactId: '' }
  }

  async unsubscribe(): Promise<void> {}
}
