import { PaymentError, type PaymentProvider } from './contracts'
import { ManualTransferProvider } from './providers/manual-transfer'
import { SandboxProvider } from './providers/sandbox'

export type PaymentConfig = {
  nodeEnv: 'development' | 'test' | 'production'
  /** `PAYMENT_PROVIDERS`, dans l'ordre de préférence. */
  enabled: readonly string[]
  siteUrl: string
  sandboxSecret?: string
  bank: {
    accountHolder?: string
    bankName?: string
    accountNumber?: string
    swift?: string
  }
}

/**
 * Construit la liste des fournisseurs actifs à partir de la configuration. Ajouter
 * l'agrégateur choisi par le client = une nouvelle branche ici + son fichier dans
 * `providers/` (ADR 006).
 */
export function buildPaymentProviders(config: PaymentConfig): PaymentProvider[] {
  return config.enabled.map((id) => {
    switch (id) {
      case 'manual-transfer': {
        const { accountHolder, bankName, accountNumber, swift } = config.bank
        if (!accountHolder || !bankName || !accountNumber) {
          throw new PaymentError(
            'provider-not-configured',
            'Virement : BANK_TRANSFER_ACCOUNT_HOLDER, BANK_TRANSFER_BANK_NAME et BANK_TRANSFER_ACCOUNT_NUMBER sont requis.',
            id,
          )
        }
        return new ManualTransferProvider({ accountHolder, bankName, accountNumber, swift })
      }
      case 'sandbox': {
        if (config.nodeEnv === 'production') {
          throw new PaymentError(
            'provider-not-configured',
            'Le simulateur de paiement est interdit en production.',
            id,
          )
        }
        if (!config.sandboxSecret) {
          throw new PaymentError(
            'provider-not-configured',
            'PAYMENT_SANDBOX_SECRET est requis pour le simulateur.',
            id,
          )
        }
        return new SandboxProvider({
          secret: config.sandboxSecret,
          checkoutBaseUrl: new URL('/api/payments/sandbox', config.siteUrl).toString(),
        })
      }
      default:
        throw new PaymentError(
          'provider-not-configured',
          `Fournisseur de paiement inconnu : ${id}`,
          id,
        )
    }
  })
}
