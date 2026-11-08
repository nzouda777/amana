import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

import { z } from 'zod'

import { type Xaf, toXaf } from '@/lib/money'
import { generatePublicToken } from '@/lib/tokens'

import {
  type CheckoutSession,
  type CreateCheckoutInput,
  PaymentError,
  type PaymentProvider,
  type PaymentStatus,
  paymentStatuses,
  type ProviderStatus,
  type RefundInput,
  type RefundResult,
  type VerifiedPaymentEvent,
  type WebhookRequest,
} from '../contracts'

export const SANDBOX_SIGNATURE_HEADER = 'x-sandbox-signature'

const eventSchema = z.object({
  eventId: z.string().min(1),
  reference: z.string().min(1),
  externalReference: z.string().min(1),
  status: z.enum(paymentStatuses),
  amount: z.number().int().nonnegative(),
  occurredAt: z.iso.datetime(),
})

type SandboxPayment = { reference: string; amount: Xaf; status: PaymentStatus }

/**
 * Simulateur local d'agrégateur pour le développement et les tests. Il signe ses
 * webhooks (HMAC-SHA256) exactement comme le ferait un vrai fournisseur, ce qui
 * exerce tout le chemin de vérification. Interdit en production (voir `createPaymentService`).
 */
export class SandboxProvider implements PaymentProvider {
  readonly id = 'sandbox'
  readonly methods = ['mobile-money-mtn', 'mobile-money-orange', 'card'] as const
  private readonly payments = new Map<string, SandboxPayment>()

  constructor(private readonly options: { secret: string; checkoutBaseUrl: string }) {
    if (options.secret.length < 16)
      throw new Error('Secret du simulateur trop court (16 caractères minimum).')
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const externalReference = `sbx_${generatePublicToken(16)}`
    this.payments.set(externalReference, {
      reference: input.reference,
      amount: input.amount,
      status: 'pending',
    })
    const isMobileMoney =
      input.method === 'mobile-money-mtn' || input.method === 'mobile-money-orange'
    return {
      providerId: this.id,
      reference: input.reference,
      externalReference,
      status: 'pending',
      nextAction: isMobileMoney
        ? {
            kind: 'ussd-push',
            message: 'Simulateur : validez le paiement sur le téléphone fictif.',
          }
        : {
            kind: 'redirect',
            url: `${this.options.checkoutBaseUrl}/${encodeURIComponent(externalReference)}`,
          },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }
  }

  /** Simule une notification du fournisseur : renvoie la requête webhook signée. */
  simulate(
    externalReference: string,
    status: PaymentStatus,
    overrides: { amount?: number; eventId?: string } = {},
  ): WebhookRequest {
    const payment = this.require(externalReference)
    payment.status = status
    const rawBody = JSON.stringify({
      eventId: overrides.eventId ?? randomUUID(),
      reference: payment.reference,
      externalReference,
      status,
      amount: overrides.amount ?? payment.amount,
      occurredAt: new Date().toISOString(),
    })
    return { headers: { [SANDBOX_SIGNATURE_HEADER]: this.sign(rawBody) }, rawBody }
  }

  async verifyWebhook(request: WebhookRequest): Promise<VerifiedPaymentEvent> {
    const received = request.headers[SANDBOX_SIGNATURE_HEADER] ?? ''
    const expected = this.sign(request.rawBody)
    const valid =
      received.length === expected.length &&
      timingSafeEqual(Buffer.from(received), Buffer.from(expected))
    if (!valid)
      throw new PaymentError('invalid-signature', 'Signature du simulateur invalide.', this.id)

    let parsed: z.infer<typeof eventSchema>
    try {
      parsed = eventSchema.parse(JSON.parse(request.rawBody))
    } catch {
      throw new PaymentError('invalid-request', 'Corps de webhook invalide.', this.id)
    }
    return {
      providerId: this.id,
      eventId: parsed.eventId,
      reference: parsed.reference,
      externalReference: parsed.externalReference,
      status: parsed.status,
      amount: toXaf(parsed.amount),
      currency: 'XAF',
      occurredAt: new Date(parsed.occurredAt),
    }
  }

  async getStatus(externalReference: string): Promise<ProviderStatus> {
    const payment = this.require(externalReference)
    return { externalReference, status: payment.status, amount: payment.amount }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const payment = this.require(input.externalReference)
    if (payment.status !== 'succeeded') {
      throw new PaymentError(
        'invalid-request',
        'Seul un paiement réussi peut être remboursé.',
        this.id,
      )
    }
    payment.status = input.amount >= payment.amount ? 'refunded' : 'partially-refunded'
    return { status: 'succeeded', externalRefundReference: `sbx_refund_${generatePublicToken(16)}` }
  }

  private sign(rawBody: string): string {
    return createHmac('sha256', this.options.secret).update(rawBody).digest('hex')
  }

  private require(externalReference: string): SandboxPayment {
    const payment = this.payments.get(externalReference)
    if (!payment)
      throw new PaymentError(
        'unknown-reference',
        `Paiement simulé inconnu : ${externalReference}`,
        this.id,
      )
    return payment
  }
}
