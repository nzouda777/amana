import type { Where } from 'payload'

import { type AccessUser, hasAnyRole, isStaffUser, type Role } from './roles'

/**
 * Règles d'accès réutilisables. Signature volontairement réduite à `{ req: { user } }`
 * pour être testable sans instance Payload, tout en restant assignable à `Access`
 * et `FieldAccess` de Payload.
 *
 * Convention : `true` = tout, `false` = rien, `Where` = filtre appliqué à la requête.
 */
export type AccessContext = { req: { user?: AccessUser | null } }
export type RuleResult = boolean | Where
export type Rule = (args: AccessContext) => RuleResult
export type BooleanRule = (args: AccessContext) => boolean

export const anyone: BooleanRule = () => true

/** Réservé aux services serveur (Local API avec `overrideAccess`). */
export const nobody: BooleanRule = () => false

export const authenticated: BooleanRule = ({ req }) => Boolean(req.user)

export function roleIn(...allowed: Role[]): BooleanRule {
  return ({ req }) => hasAnyRole(req.user, allowed)
}

export const isSuperAdmin = roleIn('super-admin')
/** Contenus éditoriaux (vitrine, ressources, médias). */
export const isEditorial = roleIn('super-admin', 'editor')
/** Contenus pédagogiques. */
export const isCourseStaff = roleIn('super-admin', 'editor', 'instructor')
/** Leads, commandes, devis, organisations. */
export const isSales = roleIn('super-admin', 'sales')
export const isStaff: BooleanRule = ({ req }) => isStaffUser(req.user)

/** Accès à l'interface `/admin` : personnel uniquement, jamais les apprenants. */
export const canAccessAdmin = isStaff

/** Documents versionnés (`drafts`) : le public ne voit que les versions publiées. */
export function publishedOr(...allowed: Role[]): Rule {
  return ({ req }) => {
    if (hasAnyRole(req.user, allowed)) return true
    return { _status: { equals: 'published' } }
  }
}

/** Le public ne voit que les documents dont `field` vaut `value` (ex. `active: true`). */
export function whereFieldOr(field: string, value: string | boolean, ...allowed: Role[]): Rule {
  return ({ req }) => {
    if (hasAnyRole(req.user, allowed)) return true
    return { [field]: { equals: value } }
  }
}

/** Propriétaire du document (champ relation vers `users`) ou rôle autorisé. */
export function ownerOr(field: string, ...allowed: Role[]): Rule {
  return ({ req }) => {
    if (hasAnyRole(req.user, allowed)) return true
    if (!req.user) return false
    return { [field]: { equals: req.user.id } }
  }
}

/** Collection `users` : chacun son propre compte, ou rôle autorisé. */
export function selfOr(...allowed: Role[]): Rule {
  return ({ req }) => {
    if (hasAnyRole(req.user, allowed)) return true
    if (!req.user) return false
    return { id: { equals: req.user.id } }
  }
}

/**
 * Cours : super-admin et éditeurs modifient tout ; un formateur uniquement les cours
 * dont il fait partie des `instructors`.
 */
export const courseEditors: Rule = ({ req }) => {
  if (hasAnyRole(req.user, ['super-admin', 'editor'])) return true
  if (req.user && hasAnyRole(req.user, ['instructor']))
    return { instructors: { in: [req.user.id] } }
  return false
}
