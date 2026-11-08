import type { LeadType } from '@/payload/shared'

/**
 * Adresse de l'équipe destinataire d'une demande selon son type
 * (`site-settings.requestRouting`), avec repli sur l'adresse de contact générale.
 */
export function teamRecipient(
  type: LeadType,
  routing: ReadonlyArray<{ leadType?: string | null; email?: string | null }> | null | undefined,
  fallback: string | null | undefined,
): string | null {
  const match = routing?.find((entry) => entry.leadType === type && entry.email)
  const contact = routing?.find((entry) => entry.leadType === 'contact' && entry.email)
  return match?.email ?? contact?.email ?? fallback ?? null
}

/** Délai de réponse annoncé, en jours ouvrés, par type. TODO(client) : délais à confirmer. */
export const responseDelayDays: Record<LeadType, number> = {
  audit: 2,
  conseil: 2,
  accompagnement: 2,
  'formation-entreprise': 2,
  takaful: 1,
  partenariat: 5,
  contact: 2,
}
