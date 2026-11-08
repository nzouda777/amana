import type { Xaf } from '@/lib/money'

/**
 * Contrat d'un agrégateur de paiement (ADR 006). Le choix de l'agrégateur (NotchPay,
 * CinetPay…) appartient au client : chaque implémentation vit dans son propre fichier
 * et s'enregistre auprès de `PaymentService`. Montants en XAF entiers, statuts normalisés.
 */

/** Identifiant stable d'un fournisseur (`manual-transfer`, `sandbox`, `notchpay`…). */
export type PaymentProviderId = string

export const paymentMethods = [
  'mobile-money-mtn',
  'mobile-money-orange',
  'card',
  'bank-transfer',
  'invoice',
] as const
export type PaymentMethod = (typeof paymentMethods)[number]

/** Statuts normalisés, indépendants du vocabulaire de chaque agrégateur. */
export const paymentStatuses = [
  'pending',
  'succeeded',
  'failed',
  'cancelled',
  'expired',
  'refunded',
  'partially-refunded',
] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

/** Statuts définitifs : un événement ultérieur contradictoire est ignoré (sauf remboursement). */
export const finalPaymentStatuses: ReadonlySet<PaymentStatus> = new Set([
  'succeeded',
  'failed',
  'cancelled',
  'expired',
  'refunded',
])

export type Customer = {
  email: string
  name: string
  /** E.164, requis pour le Mobile Money. */
  phone?: string
}

export type CreateCheckoutInput = {
  /** Notre référence de paiement, unique : clé d'idempotence côté fournisseur. */
  reference: string
  orderId: string
  /** Montant recalculé côté serveur par `PaymentService`, jamais fourni par le client. */
  amount: Xaf
  currency: 'XAF'
  method: PaymentMethod
  customer: Customer
  description: string
  /** Page de retour (information uniquement : l'accès n'est accordé que par webhook). */
  returnUrl: string
  locale: 'fr' | 'en' | 'ar'
}

export type CheckoutNextAction =
  | { kind: 'redirect'; url: string }
  | { kind: 'ussd-push'; message: string }
  | {
      kind: 'bank-transfer'
      reference: string
      amount: Xaf
      bank: { accountHolder: string; bankName: string; accountNumber: string; swift?: string }
    }
  | { kind: 'none' }

export type CheckoutSession = {
  providerId: PaymentProviderId
  reference: string
  externalReference: string
  status: PaymentStatus
  nextAction: CheckoutNextAction
  expiresAt: Date | null
}

export type WebhookRequest = {
  headers: Readonly<Record<string, string>>
  /** Corps brut, nécessaire à la vérification de signature. */
  rawBody: string
}

export type VerifiedPaymentEvent = {
  providerId: PaymentProviderId
  /** Identifiant unique de l'événement chez le fournisseur (idempotence des webhooks). */
  eventId: string
  externalReference: string
  reference: string
  status: PaymentStatus
  amount: Xaf
  currency: 'XAF'
  occurredAt: Date
}

export type ProviderStatus = {
  externalReference: string
  status: PaymentStatus
  amount: Xaf
}

export type RefundInput = {
  externalReference: string
  amount: Xaf
  reason: string
}

export type RefundResult = {
  status: 'pending' | 'succeeded' | 'failed' | 'manual'
  externalRefundReference: string | null
}

export const paymentErrorCodes = [
  'provider-not-configured',
  'provider-unavailable',
  'method-not-supported',
  'invalid-signature',
  'unknown-reference',
  'amount-mismatch',
  'order-not-payable',
  'operation-not-supported',
  'duplicate-reference',
  'invalid-request',
] as const
export type PaymentErrorCode = (typeof paymentErrorCodes)[number]

export class PaymentError extends Error {
  constructor(
    public readonly code: PaymentErrorCode,
    message: string,
    public readonly providerId?: PaymentProviderId,
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

export interface PaymentProvider {
  readonly id: PaymentProviderId
  readonly methods: readonly PaymentMethod[]
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>
  /** Vérifie la signature et traduit l'événement ; lève `PaymentError('invalid-signature')`. */
  verifyWebhook(request: WebhookRequest): Promise<VerifiedPaymentEvent>
  getStatus(externalReference: string): Promise<ProviderStatus>
  refund(input: RefundInput): Promise<RefundResult>
}
