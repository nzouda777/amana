import { getServerEnv } from '@/env'
import {
  CALCOM_SIGNATURE_HEADER,
  parseCalcomWebhook,
  verifyCalcomSignature,
} from '@/features/leads/calcom'
import { getPayloadClient } from '@/lib/payload'

/**
 * Webhook Cal.com → `leads` (SPEC §4.3). Signature HMAC vérifiée sur le corps brut ;
 * idempotent : un rendez-vous (uid Cal.com) ne crée qu'une demande, les replanifications
 * et annulations mettent à jour la demande existante.
 */
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 256 * 1024

function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } })
}

export async function POST(request: Request): Promise<Response> {
  const secret = getServerEnv().CALCOM_WEBHOOK_SECRET
  if (!secret) return json(503, { error: 'webhook non configuré' })

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'corps trop volumineux' })
  if (!verifyCalcomSignature(raw, request.headers.get(CALCOM_SIGNATURE_HEADER), secret))
    return json(401, { error: 'signature invalide' })

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { error: 'JSON invalide' })
  }
  const booking = parseCalcomWebhook(body)
  if (!booking) return json(202, { ignored: true })

  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'leads',
    where: { 'appointment.bookingId': { equals: booking.bookingId } },
    depth: 0,
    limit: 1,
  })
  const lead = existing.docs[0]
  const now = new Date().toISOString()

  if (lead) {
    const note =
      booking.kind === 'cancelled'
        ? 'Rendez-vous annulé sur Cal.com.'
        : booking.kind === 'rescheduled'
          ? `Rendez-vous replanifié : ${booking.startsAt ?? 'date inconnue'}.`
          : null
    await payload.update({
      collection: 'leads',
      id: lead.id,
      depth: 0,
      data: {
        appointment: {
          ...lead.appointment,
          startsAt: booking.startsAt ?? lead.appointment?.startsAt,
        },
        ...(note ? { notes: [...(lead.notes ?? []), { text: note, at: now }] } : {}),
      },
    })
    return json(200, { updated: lead.id })
  }

  if (booking.kind === 'cancelled') return json(202, { ignored: true })

  const created = await payload.create({
    collection: 'leads',
    depth: 0,
    data: {
      type: booking.leadType,
      status: 'new',
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      message: booking.notes,
      source: 'calcom',
      locale: 'fr',
      appointment: {
        bookingId: booking.bookingId,
        eventType: booking.eventType,
        startsAt: booking.startsAt,
      },
    },
  })
  return json(201, { created: created.id })
}
