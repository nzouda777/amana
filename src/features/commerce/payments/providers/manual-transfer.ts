import {
  type CheckoutSession,
  type CreateCheckoutInput,
  PaymentError,
  type PaymentProvider,
  type ProviderStatus,
  type RefundResult,
  type VerifiedPaymentEvent,
} from '../contracts'

export type BankDetails = {
  accountHolder: string
  bankName: string
  accountNumber: string
  swift?: string
}

/**
 * Virement bancaire : la commande reste `pending` avec des instructions et une référence ;
 * la validation se fait à la main dans l'admin (`PaymentService.confirmManualPayment`).
 */
export class ManualTransferProvider implements PaymentProvider {
  readonly id = 'manual-transfer'
  readonly methods = ['bank-transfer'] as const

  constructor(private readonly bank: BankDetails) {}

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    return {
      providerId: this.id,
      reference: input.reference,
      externalReference: input.reference,
      status: 'pending',
      nextAction: {
        kind: 'bank-transfer',
        reference: input.reference,
        amount: input.amount,
        bank: this.bank,
      },
      expiresAt: null,
    }
  }

  async verifyWebhook(): Promise<VerifiedPaymentEvent> {
    throw new PaymentError(
      'operation-not-supported',
      'Le virement manuel n’émet pas de webhook.',
      this.id,
    )
  }

  async getStatus(): Promise<ProviderStatus> {
    throw new PaymentError(
      'operation-not-supported',
      'Le statut d’un virement est tenu dans l’admin, pas chez un fournisseur.',
      this.id,
    )
  }

  async refund(): Promise<RefundResult> {
    return { status: 'manual', externalRefundReference: null }
  }
}
