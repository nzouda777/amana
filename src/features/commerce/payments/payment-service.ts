import { type Xaf, multiplyXaf, sumXaf, toXaf } from '@/lib/money'
import { generateReadableCode } from '@/lib/tokens'

import {
  type CheckoutSession,
  type Customer,
  finalPaymentStatuses,
  PaymentError,
  type PaymentMethod,
  type PaymentProvider,
  type PaymentProviderId,
  type PaymentStatus,
  type WebhookRequest,
} from './contracts'

// ---------------------------------------------------------------------------
// Ports (implémentés sur Payload en M4, en mémoire dans les tests)
// ---------------------------------------------------------------------------

export type PayableOrderLine = {
  /** Prix unitaire TTC en XAF. */
  unitPrice: Xaf
  quantity: number
  /** Remise sur la ligne (coupon ciblé), en XAF. */
  discount: Xaf
}

export type PayableOrder = {
  id: string
  status: 'pending' | 'paid' | 'fulfilled' | 'failed' | 'cancelled' | 'refunded'
  currency: 'XAF'
  lines: readonly PayableOrderLine[]
  /** Remise globale (coupon sur la commande), en XAF. */
  orderDiscount: Xaf
  customer: Customer
  description: string
}

export interface OrderReader {
  /** Relit la commande et ses lignes en base : seule source du montant à encaisser. */
  getPayableOrder(orderId: string): Promise<PayableOrder | null>
}

export type PaymentRecord = {
  reference: string
  orderId: string
  providerId: PaymentProviderId
  method: PaymentMethod
  externalReference: string | null
  status: PaymentStatus
  amount: Xaf
}

export interface PaymentStore {
  findByReference(reference: string): Promise<PaymentRecord | null>
  /** Paiement encore `pending` pour cette commande et ce fournisseur (reprise idempotente). */
  findPendingByOrder(orderId: string, providerId: PaymentProviderId): Promise<PaymentRecord | null>
  create(record: PaymentRecord): Promise<PaymentRecord>
  update(
    reference: string,
    patch: Partial<Pick<PaymentRecord, 'externalReference' | 'status'>>,
  ): Promise<PaymentRecord>
  /**
   * Enregistre atomiquement un événement traité (contrainte d'unicité en base).
   * Retourne `false` s'il l'avait déjà été : c'est la garantie d'idempotence des webhooks.
   */
  recordEvent(providerId: PaymentProviderId, eventId: string, reference: string): Promise<boolean>
}

// ---------------------------------------------------------------------------
// Calcul serveur du montant
// ---------------------------------------------------------------------------

/** Total à encaisser = Σ(prix × quantité − remise de ligne) − remise globale. */
export function computeOrderTotal(order: Pick<PayableOrder, 'lines' | 'orderDiscount'>): Xaf {
  const lines = order.lines.map((line) => {
    const lineTotal = multiplyXaf(line.unitPrice, line.quantity) - line.discount
    if (lineTotal < 0)
      throw new PaymentError('invalid-request', 'Remise supérieure au montant de la ligne.')
    return toXaf(lineTotal)
  })
  const total = sumXaf(lines) - order.orderDiscount
  if (total < 0)
    throw new PaymentError('invalid-request', 'Remise supérieure au total de la commande.')
  return toXaf(total)
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export type PaymentServiceOptions = {
  providers: readonly PaymentProvider[]
  orders: OrderReader
  store: PaymentStore
  /** Appelé une seule fois par paiement réussi : attribution des accès (AccessService.grant). */
  onPaymentSucceeded: (payment: PaymentRecord) => Promise<void>
  generateReference?: () => string
}

export type StartCheckoutInput = {
  orderId: string
  providerId: PaymentProviderId
  method: PaymentMethod
  returnUrl: string
  locale: 'fr' | 'en' | 'ar'
}

export type WebhookOutcome =
  | { outcome: 'applied'; payment: PaymentRecord }
  | { outcome: 'duplicate'; reference: string }
  | { outcome: 'ignored'; payment: PaymentRecord }

/**
 * Orchestration des paiements, indépendante de l'agrégateur.
 *
 * Contrat transactionnel pour l'implémentation Payload (M4) : `recordEvent`, `update` et
 * `onPaymentSucceeded` d'un même webhook s'exécutent dans une seule transaction Postgres.
 * Sinon un échec d'attribution après enregistrement de l'événement serait ensuite
 * considéré comme un doublon et l'accès ne serait jamais accordé.
 */
export class PaymentService {
  private readonly providers: ReadonlyMap<PaymentProviderId, PaymentProvider>
  private readonly generateReference: () => string

  constructor(private readonly options: PaymentServiceOptions) {
    const registry = new Map<PaymentProviderId, PaymentProvider>()
    for (const provider of options.providers) {
      if (registry.has(provider.id)) {
        throw new PaymentError(
          'invalid-request',
          `Fournisseur enregistré deux fois : ${provider.id}`,
        )
      }
      registry.set(provider.id, provider)
    }
    this.providers = registry
    this.generateReference = options.generateReference ?? (() => generateReadableCode('PAY'))
  }

  listProviders(): PaymentProvider[] {
    return [...this.providers.values()]
  }

  getProvider(providerId: PaymentProviderId): PaymentProvider {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new PaymentError(
        'provider-not-configured',
        `Fournisseur non activé : ${providerId}`,
        providerId,
      )
    }
    return provider
  }

  /**
   * Démarre (ou reprend) le paiement d'une commande. Le montant est toujours recalculé
   * depuis la commande en base ; une tentative `pending` existante réutilise sa référence,
   * ce qui rend l'appel idempotent côté fournisseur.
   */
  async startCheckout(input: StartCheckoutInput): Promise<CheckoutSession> {
    const provider = this.getProvider(input.providerId)
    if (!provider.methods.includes(input.method)) {
      throw new PaymentError(
        'method-not-supported',
        `Moyen non pris en charge : ${input.method}`,
        provider.id,
      )
    }

    const order = await this.options.orders.getPayableOrder(input.orderId)
    if (!order || order.status !== 'pending') {
      throw new PaymentError(
        'order-not-payable',
        `Commande non payable : ${input.orderId}`,
        provider.id,
      )
    }
    const amount = computeOrderTotal(order)

    const pending = await this.options.store.findPendingByOrder(order.id, provider.id)
    const record =
      pending && pending.amount === amount && pending.method === input.method
        ? pending
        : await this.options.store.create({
            reference: this.generateReference(),
            orderId: order.id,
            providerId: provider.id,
            method: input.method,
            externalReference: null,
            status: 'pending',
            amount,
          })

    const session = await provider.createCheckout({
      reference: record.reference,
      orderId: order.id,
      amount,
      currency: 'XAF',
      method: input.method,
      customer: order.customer,
      description: order.description,
      returnUrl: input.returnUrl,
      locale: input.locale,
    })

    await this.options.store.update(record.reference, {
      externalReference: session.externalReference,
      status: session.status,
    })
    return session
  }

  /** Traite un webhook : signature vérifiée, idempotent, montant contrôlé. */
  async handleWebhook(
    providerId: PaymentProviderId,
    request: WebhookRequest,
  ): Promise<WebhookOutcome> {
    const provider = this.getProvider(providerId)
    const event = await provider.verifyWebhook(request)

    const payment = await this.options.store.findByReference(event.reference)
    if (!payment || payment.providerId !== provider.id) {
      throw new PaymentError(
        'unknown-reference',
        `Référence inconnue : ${event.reference}`,
        provider.id,
      )
    }
    if (event.status === 'succeeded' && event.amount !== payment.amount) {
      // Ne jamais accorder d'accès sur un montant différent : revue manuelle.
      throw new PaymentError(
        'amount-mismatch',
        `Montant reçu ${event.amount} ≠ attendu ${payment.amount} (${payment.reference})`,
        provider.id,
      )
    }

    const firstTime = await this.options.store.recordEvent(
      provider.id,
      event.eventId,
      payment.reference,
    )
    if (!firstTime) return { outcome: 'duplicate', reference: payment.reference }

    return this.applyStatus(payment, event.status, event.externalReference)
  }

  /** Validation manuelle d'un virement depuis l'admin (rôle vérifié par l'appelant). */
  async confirmManualPayment(reference: string): Promise<WebhookOutcome> {
    const payment = await this.options.store.findByReference(reference)
    if (!payment || payment.method !== 'bank-transfer') {
      throw new PaymentError('unknown-reference', `Virement inconnu : ${reference}`)
    }
    const firstTime = await this.options.store.recordEvent(
      payment.providerId,
      `manual-confirmation:${reference}`,
      reference,
    )
    if (!firstTime) return { outcome: 'duplicate', reference }
    return this.applyStatus(payment, 'succeeded', payment.externalReference)
  }

  private async applyStatus(
    payment: PaymentRecord,
    status: PaymentStatus,
    externalReference: string | null,
  ): Promise<WebhookOutcome> {
    const isRefund = status === 'refunded' || status === 'partially-refunded'
    if (finalPaymentStatuses.has(payment.status) && !(isRefund && payment.status === 'succeeded')) {
      return { outcome: 'ignored', payment }
    }
    const updated = await this.options.store.update(payment.reference, {
      status,
      externalReference: externalReference ?? payment.externalReference,
    })
    if (status === 'succeeded') await this.options.onPaymentSucceeded(updated)
    return { outcome: 'applied', payment: updated }
  }
}
