import { z } from 'zod'

import type { LeadType } from '@/payload/shared'

import { hmacHex, safeEqualHex } from './signed-token'

/**
 * Webhook Cal.com → `leads` (SPEC §4.3). Signature : en-tête `x-cal-signature-256`,
 * HMAC-SHA256 hexadécimal du corps brut avec le secret du webhook.
 * https://cal.com/docs/developing/guides/automation/webhooks
 */

export const CALCOM_SIGNATURE_HEADER = 'x-cal-signature-256'

export function verifyCalcomSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false
  return safeEqualHex(hmacHex(secret, rawBody), signature)
}

const attendee = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  timeZone: z.string().optional(),
})

const responseValue = z.object({ value: z.unknown().optional() }).loose()

const bookingPayload = z
  .object({
    uid: z.string().min(1),
    type: z.string().optional(),
    title: z.string().optional(),
    startTime: z.string().optional(),
    attendees: z.array(attendee).optional(),
    responses: z.record(z.string(), responseValue).optional(),
    additionalNotes: z.string().nullish(),
  })
  .loose()

const webhookSchema = z
  .object({
    triggerEvent: z.string(),
    createdAt: z.string().optional(),
    payload: bookingPayload.optional(),
  })
  .loose()

export type CalcomEventKind = 'created' | 'rescheduled' | 'cancelled'

export type CalcomBooking = {
  kind: CalcomEventKind
  bookingId: string
  eventType: string
  leadType: LeadType
  name: string
  email: string
  phone?: string
  startsAt?: string
  notes?: string
}

const triggers: Record<string, CalcomEventKind> = {
  BOOKING_CREATED: 'created',
  BOOKING_RESCHEDULED: 'rescheduled',
  BOOKING_CANCELLED: 'cancelled',
}

/** Type de demande déduit du slug du type d'événement Cal.com (découverte, audit, conseil). */
export function leadTypeForEvent(eventType: string): LeadType {
  const slug = eventType.toLowerCase()
  if (slug.includes('audit')) return 'audit'
  if (slug.includes('conseil') || slug.includes('advisory')) return 'conseil'
  if (slug.includes('takaful')) return 'takaful'
  if (slug.includes('formation') || slug.includes('training')) return 'formation-entreprise'
  return 'contact'
}

function responseString(
  responses: Record<string, { value?: unknown }> | undefined,
  key: string,
): string | undefined {
  const value = responses?.[key]?.value
  if (typeof value === 'string' && value.trim() !== '') return value.trim()
  return undefined
}

/**
 * Interprète un webhook déjà authentifié. `null` : événement ignoré (autre déclencheur,
 * contenu incomplet).
 */
export function parseCalcomWebhook(body: unknown): CalcomBooking | null {
  const parsed = webhookSchema.safeParse(body)
  if (!parsed.success) return null
  const kind = triggers[parsed.data.triggerEvent]
  const booking = parsed.data.payload
  if (!kind || !booking) return null

  const first = booking.attendees?.[0]
  const email = (first?.email ?? responseString(booking.responses, 'email'))?.trim().toLowerCase()
  const name = (first?.name ?? responseString(booking.responses, 'name'))?.trim()
  if (!email || !name) return null

  const eventType = booking.type ?? 'decouverte'
  const notes =
    responseString(booking.responses, 'notes') ?? booking.additionalNotes?.trim() ?? undefined
  return {
    kind,
    bookingId: booking.uid,
    eventType,
    leadType: leadTypeForEvent(eventType),
    name,
    email,
    phone:
      responseString(booking.responses, 'attendeePhoneNumber') ??
      responseString(booking.responses, 'phone'),
    startsAt: booking.startTime,
    notes: notes || undefined,
  }
}
