/**
 * Contrats du domaine Entreprises. Les droits d'organisation sont portés par
 * `org-members`, jamais par le rôle global de l'utilisateur.
 */

export type Id = number | string

export const orgMemberRoles = ['owner', 'admin', 'learner'] as const
export type OrgMemberRole = (typeof orgMemberRoles)[number]

export const invitationStatuses = ['pending', 'accepted', 'expired', 'revoked'] as const
export type InvitationStatus = (typeof invitationStatuses)[number]

export const INVITATION_TTL_DAYS = 7

/** Échéance d'une invitation à usage unique (7 jours, SPEC §3). */
export function invitationExpiry(issuedAt: Date, ttlDays = INVITATION_TTL_DAYS): Date {
  return new Date(issuedAt.getTime() + ttlDays * 24 * 60 * 60 * 1000)
}

export function canManageOrganization(role: OrgMemberRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin'
}

/** Isolation par organisation : tout accès aux données B2B depuis le front passe par ici (M5). */
export interface OrganizationAccess {
  /** Rôle de l'utilisateur dans l'organisation, ou `null` s'il n'en est pas membre actif. */
  roleOf(userId: Id, organizationId: Id): Promise<OrgMemberRole | null>
  /** Lève une erreur si l'utilisateur ne peut pas administrer l'organisation. */
  assertCanManage(userId: Id, organizationId: Id): Promise<void>
}

export type SeatUsage = { seats: number; used: number }

export function seatsAvailable(usage: SeatUsage): number {
  return Math.max(0, usage.seats - usage.used)
}
