import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PaymentError } from '@/features/commerce/payments/contracts'
import {
  computeOrderTotal,
  type OrderReader,
  type PayableOrder,
  type PaymentRecord,
  PaymentService,
  type PaymentStore,
} from '@/features/commerce/payments/payment-service'
import { ManualTransferProvider } from '@/features/commerce/payments/providers/manual-transfer'
import {
  SANDBOX_SIGNATURE_HEADER,
  SandboxProvider,
} from '@/features/commerce/payments/providers/sandbox'
import { buildPaymentProviders, type PaymentConfig } from '@/features/commerce/payments/registry'
import { toXaf } from '@/lib/money'

class MemoryStore implements PaymentStore {
  readonly records = new Map<string, PaymentRecord>()
  readonly events = new Set<string>()

  async findByReference(reference: string) {
    return this.records.get(reference) ?? null
  }
  async findPendingByOrder(orderId: string, providerId: string) {
    return (
      [...this.records.values()].find(
        (r) => r.orderId === orderId && r.providerId === providerId && r.status === 'pending',
      ) ?? null
    )
  }
  async create(record: PaymentRecord) {
    this.records.set(record.reference, { ...record })
    return record
  }
  async update(reference: string, patch: Partial<PaymentRecord>) {
    const current = this.records.get(reference)
    if (!current) throw new Error('absent')
    const next = { ...current, ...patch }
    this.records.set(reference, next)
    return next
  }
  async recordEvent(providerId: string, eventId: string) {
    const key = `${providerId}:${eventId}`
    if (this.events.has(key)) return false
    this.events.add(key)
    return true
  }
}

const order: PayableOrder = {
  id: 'order-1',
  status: 'pending',
  currency: 'XAF',
  lines: [
    { unitPrice: toXaf(25000), quantity: 1, discount: toXaf(0) },
    { unitPrice: toXaf(10000), quantity: 2, discount: toXaf(2000) },
  ],
  orderDiscount: toXaf(3000),
  customer: { email: 'apprenant@example.cm', name: 'Apprenant Démo', phone: '+237600000000' },
  description: 'Commande de démonstration',
}

const bank = {
  accountHolder: 'Amana Conseil',
  bankName: 'TODO(client)',
  accountNumber: 'TODO(client)',
}

describe('computeOrderTotal', () => {
  it('recalcule le total en entiers, remises comprises', () => {
    expect(computeOrderTotal(order)).toBe(25000 + 20000 - 2000 - 3000)
  })

  it('refuse une remise supérieure au montant', () => {
    expect(() =>
      computeOrderTotal({
        lines: [{ unitPrice: toXaf(100), quantity: 1, discount: toXaf(200) }],
        orderDiscount: toXaf(0),
      }),
    ).toThrow(PaymentError)
    expect(() =>
      computeOrderTotal({
        lines: [{ unitPrice: toXaf(100), quantity: 1, discount: toXaf(0) }],
        orderDiscount: toXaf(500),
      }),
    ).toThrow(PaymentError)
  })
})

describe('PaymentService avec le simulateur', () => {
  let store: MemoryStore
  let sandbox: SandboxProvider
  let granted: PaymentRecord[]
  let service: PaymentService
  let currentOrder: PayableOrder

  beforeEach(() => {
    store = new MemoryStore()
    sandbox = new SandboxProvider({
      secret: 'secret-de-test-assez-long',
      checkoutBaseUrl: 'http://localhost:3000/api/payments/sandbox',
    })
    granted = []
    currentOrder = { ...order }
    const orders: OrderReader = {
      getPayableOrder: async (id) => (id === currentOrder.id ? currentOrder : null),
    }
    let counter = 0
    service = new PaymentService({
      providers: [sandbox, new ManualTransferProvider(bank)],
      orders,
      store,
      onPaymentSucceeded: async (payment) => {
        granted.push(payment)
      },
      generateReference: () => `PAY-${++counter}`,
    })
  })

  it('crée un paiement au montant recalculé côté serveur', async () => {
    const session = await service.startCheckout({
      orderId: 'order-1',
      providerId: 'sandbox',
      method: 'mobile-money-mtn',
      returnUrl: 'http://localhost:3000/fr/commande',
      locale: 'fr',
    })
    expect(session.nextAction.kind).toBe('ussd-push')
    expect(store.records.get('PAY-1')).toMatchObject({
      amount: 40000,
      status: 'pending',
      externalReference: session.externalReference,
    })
  })

  it('reprend la même référence si un paiement est déjà en attente (idempotence)', async () => {
    const input = {
      orderId: 'order-1',
      providerId: 'sandbox',
      method: 'card' as const,
      returnUrl: 'http://x',
      locale: 'fr' as const,
    }
    const first = await service.startCheckout(input)
    const second = await service.startCheckout(input)
    expect(second.reference).toBe(first.reference)
    expect(store.records.size).toBe(1)
  })

  it('refuse un fournisseur non activé, un moyen non pris en charge, une commande non payable', async () => {
    const base = { orderId: 'order-1', returnUrl: 'http://x', locale: 'fr' as const }
    await expect(
      service.startCheckout({ ...base, providerId: 'notchpay', method: 'card' }),
    ).rejects.toMatchObject({ code: 'provider-not-configured' })
    await expect(
      service.startCheckout({ ...base, providerId: 'sandbox', method: 'bank-transfer' }),
    ).rejects.toMatchObject({ code: 'method-not-supported' })
    currentOrder = { ...order, status: 'paid' }
    await expect(
      service.startCheckout({ ...base, providerId: 'sandbox', method: 'card' }),
    ).rejects.toMatchObject({ code: 'order-not-payable' })
  })

  it('accorde l’accès une seule fois sur webhook signé, même rejoué', async () => {
    const session = await service.startCheckout({
      orderId: 'order-1',
      providerId: 'sandbox',
      method: 'card',
      returnUrl: 'http://x',
      locale: 'fr',
    })
    const webhook = sandbox.simulate(session.externalReference, 'succeeded', { eventId: 'evt-1' })

    await expect(service.handleWebhook('sandbox', webhook)).resolves.toMatchObject({
      outcome: 'applied',
    })
    await expect(service.handleWebhook('sandbox', webhook)).resolves.toMatchObject({
      outcome: 'duplicate',
    })
    expect(granted).toHaveLength(1)
    expect(store.records.get(session.reference)?.status).toBe('succeeded')
  })

  it('ignore un événement contradictoire après un statut définitif', async () => {
    const session = await service.startCheckout({
      orderId: 'order-1',
      providerId: 'sandbox',
      method: 'card',
      returnUrl: 'http://x',
      locale: 'fr',
    })
    await service.handleWebhook('sandbox', sandbox.simulate(session.externalReference, 'succeeded'))
    const late = await service.handleWebhook(
      'sandbox',
      sandbox.simulate(session.externalReference, 'failed'),
    )
    expect(late.outcome).toBe('ignored')
    expect(granted).toHaveLength(1)
  })

  it('accepte un remboursement après succès', async () => {
    const session = await service.startCheckout({
      orderId: 'order-1',
      providerId: 'sandbox',
      method: 'card',
      returnUrl: 'http://x',
      locale: 'fr',
    })
    await service.handleWebhook('sandbox', sandbox.simulate(session.externalReference, 'succeeded'))
    const refund = await service.handleWebhook(
      'sandbox',
      sandbox.simulate(session.externalReference, 'refunded'),
    )
    expect(refund.outcome).toBe('applied')
    expect(store.records.get(session.reference)?.status).toBe('refunded')
  })

  it('rejette une signature falsifiée et un montant différent', async () => {
    const session = await service.startCheckout({
      orderId: 'order-1',
      providerId: 'sandbox',
      method: 'card',
      returnUrl: 'http://x',
      locale: 'fr',
    })
    const genuine = sandbox.simulate(session.externalReference, 'succeeded')
    const forged = { ...genuine, rawBody: genuine.rawBody.replace('"succeeded"', '"succeeded" ') }
    await expect(service.handleWebhook('sandbox', forged)).rejects.toMatchObject({
      code: 'invalid-signature',
    })
    await expect(
      service.handleWebhook('sandbox', {
        headers: { [SANDBOX_SIGNATURE_HEADER]: '' },
        rawBody: '{}',
      }),
    ).rejects.toMatchObject({ code: 'invalid-signature' })

    const underpaid = sandbox.simulate(session.externalReference, 'succeeded', { amount: 100 })
    await expect(service.handleWebhook('sandbox', underpaid)).rejects.toMatchObject({
      code: 'amount-mismatch',
    })
    expect(granted).toHaveLength(0)
  })

  it('virement : instructions puis validation manuelle idempotente', async () => {
    const session = await service.startCheckout({
      orderId: 'order-1',
      providerId: 'manual-transfer',
      method: 'bank-transfer',
      returnUrl: 'http://x',
      locale: 'fr',
    })
    expect(session.nextAction).toMatchObject({
      kind: 'bank-transfer',
      amount: 40000,
      reference: session.reference,
    })
    await expect(service.confirmManualPayment(session.reference)).resolves.toMatchObject({
      outcome: 'applied',
    })
    await expect(service.confirmManualPayment(session.reference)).resolves.toMatchObject({
      outcome: 'duplicate',
    })
    expect(granted).toHaveLength(1)
  })

  it('refuse d’enregistrer deux fois le même fournisseur', () => {
    const orders: OrderReader = { getPayableOrder: vi.fn() }
    expect(
      () =>
        new PaymentService({
          providers: [sandbox, sandbox],
          orders,
          store,
          onPaymentSucceeded: vi.fn(),
        }),
    ).toThrow(PaymentError)
  })
})

describe('ManualTransferProvider', () => {
  it('n’émet pas de webhook et délègue le remboursement à l’admin', async () => {
    const provider = new ManualTransferProvider(bank)
    await expect(provider.verifyWebhook()).rejects.toMatchObject({
      code: 'operation-not-supported',
    })
    await expect(provider.getStatus()).rejects.toMatchObject({ code: 'operation-not-supported' })
    await expect(provider.refund()).resolves.toEqual({
      status: 'manual',
      externalRefundReference: null,
    })
  })
})

describe('registre des fournisseurs', () => {
  const base: PaymentConfig = {
    nodeEnv: 'development',
    enabled: [],
    siteUrl: 'http://localhost:3000',
    sandboxSecret: 'secret-de-test-assez-long',
    bank,
  }

  it('construit les fournisseurs activés, dans l’ordre', () => {
    const providers = buildPaymentProviders({ ...base, enabled: ['sandbox', 'manual-transfer'] })
    expect(providers.map((provider) => provider.id)).toEqual(['sandbox', 'manual-transfer'])
  })

  it('interdit le simulateur en production', () => {
    expect(() =>
      buildPaymentProviders({ ...base, nodeEnv: 'production', enabled: ['sandbox'] }),
    ).toThrow(/production/)
  })

  it('exige les coordonnées bancaires pour le virement et refuse un fournisseur inconnu', () => {
    expect(() =>
      buildPaymentProviders({ ...base, enabled: ['manual-transfer'], bank: {} }),
    ).toThrow(PaymentError)
    expect(() => buildPaymentProviders({ ...base, enabled: ['cinetpay'] })).toThrow(/inconnu/)
  })
})
