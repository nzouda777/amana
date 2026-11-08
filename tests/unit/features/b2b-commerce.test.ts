import { describe, expect, it } from 'vitest'

import {
  canManageOrganization,
  INVITATION_TTL_DAYS,
  invitationExpiry,
  seatsAvailable,
} from '@/features/b2b/contracts'
import { canTransitionOrder, orderStatuses } from '@/features/commerce/contracts'

describe('B2B', () => {
  it('une invitation expire après 7 jours', () => {
    const issued = new Date('2026-11-02T10:00:00Z')
    expect(INVITATION_TTL_DAYS).toBe(7)
    expect(invitationExpiry(issued).toISOString()).toBe('2026-11-09T10:00:00.000Z')
  })

  it('seuls owner et admin administrent l’organisation', () => {
    expect(canManageOrganization('owner')).toBe(true)
    expect(canManageOrganization('admin')).toBe(true)
    expect(canManageOrganization('learner')).toBe(false)
    expect(canManageOrganization(null)).toBe(false)
  })

  it('sièges disponibles jamais négatifs', () => {
    expect(seatsAvailable({ seats: 50, used: 12 })).toBe(38)
    expect(seatsAvailable({ seats: 5, used: 7 })).toBe(0)
  })
})

describe('statuts de commande', () => {
  it('suit pending → paid → fulfilled', () => {
    expect(canTransitionOrder('pending', 'paid')).toBe(true)
    expect(canTransitionOrder('paid', 'fulfilled')).toBe(true)
    expect(canTransitionOrder('pending', 'fulfilled')).toBe(false)
  })

  it('les états terminaux n’évoluent plus', () => {
    for (const to of orderStatuses) {
      expect(canTransitionOrder('cancelled', to)).toBe(false)
      expect(canTransitionOrder('refunded', to)).toBe(false)
    }
  })
})
