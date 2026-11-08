/**
 * Rôles globaux (docs/SPEC.md §3). Les droits d'organisation B2B ne sont pas des rôles
 * globaux : ils sont portés par `org-members`.
 */
export const roles = ['super-admin', 'editor', 'instructor', 'sales', 'learner'] as const
export type Role = (typeof roles)[number]

export const roleLabels: Record<Role, { fr: string; en: string }> = {
  'super-admin': { fr: 'Super-administrateur', en: 'Super admin' },
  editor: { fr: 'Éditeur (contenus)', en: 'Editor' },
  instructor: { fr: 'Formateur', en: 'Instructor' },
  sales: { fr: 'Commercial', en: 'Sales' },
  learner: { fr: 'Apprenant', en: 'Learner' },
}

/** Rôles autorisés à ouvrir l'admin Payload. */
export const staffRoles: readonly Role[] = ['super-admin', 'editor', 'instructor', 'sales']

/** Forme minimale d'un utilisateur, compatible avec `req.user` de Payload. */
export type AccessUser = {
  id: number | string
  roles?: readonly Role[] | null
}

export function hasAnyRole(user: AccessUser | null | undefined, allowed: readonly Role[]): boolean {
  if (!user?.roles) return false
  return user.roles.some((role) => allowed.includes(role))
}

export function isStaffUser(user: AccessUser | null | undefined): boolean {
  return hasAnyRole(user, staffRoles)
}
