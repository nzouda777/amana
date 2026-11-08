/**
 * Contrats du domaine Commerce. Le paiement est détaillé dans `payments/contracts.ts`.
 */
export * from './payments/contracts'

export const orderStatuses = [
  'pending',
  'paid',
  'fulfilled',
  'failed',
  'cancelled',
  'refunded',
] as const
export type OrderStatus = (typeof orderStatuses)[number]

/** Transitions autorisées (SPEC §3) : pending → paid → fulfilled ; échecs et remboursements. */
export const orderTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ['paid', 'failed', 'cancelled'],
  paid: ['fulfilled', 'refunded'],
  fulfilled: ['refunded'],
  failed: ['pending'],
  cancelled: [],
  refunded: [],
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return orderTransitions[from].includes(to)
}

export const productKinds = [
  'course',
  'path',
  'capsule-pack',
  'business-license',
  'access-pass',
  'event-seat',
] as const
export type ProductKind = (typeof productKinds)[number]

/** Durées proposées pour le pass d'accès (ADR 003), en jours. */
export const passDurationsDays = [30, 90, 365] as const
