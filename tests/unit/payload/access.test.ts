import { describe, expect, it } from 'vitest'

import {
  type AccessUser,
  anyone,
  authenticated,
  canAccessAdmin,
  courseEditors,
  hasAnyRole,
  isCourseStaff,
  isEditorial,
  isSales,
  isStaff,
  isStaffUser,
  isSuperAdmin,
  nobody,
  ownerOr,
  publishedOr,
  type Role,
  roleIn,
  selfOr,
  whereFieldOr,
} from '@/payload/access'

const as = (...roles: Role[]): { req: { user: AccessUser } } => ({
  req: { user: { id: 42, roles } },
})
const anonymous = { req: { user: null } }
const noRoles = { req: { user: { id: 7, roles: null } } }

describe('roles', () => {
  it('hasAnyRole tolère un utilisateur absent ou sans rôles', () => {
    expect(hasAnyRole(null, ['editor'])).toBe(false)
    expect(hasAnyRole(undefined, ['editor'])).toBe(false)
    expect(hasAnyRole({ id: 1, roles: null }, ['editor'])).toBe(false)
    expect(hasAnyRole({ id: 1, roles: ['editor', 'sales'] }, ['sales'])).toBe(true)
  })

  it('isStaffUser exclut les apprenants', () => {
    expect(isStaffUser({ id: 1, roles: ['learner'] })).toBe(false)
    for (const role of ['super-admin', 'editor', 'instructor', 'sales'] as const) {
      expect(isStaffUser({ id: 1, roles: [role] })).toBe(true)
    }
  })
})

describe('règles simples', () => {
  it('anyone / nobody', () => {
    expect(anyone(anonymous)).toBe(true)
    expect(nobody(as('super-admin'))).toBe(false)
  })

  it('authenticated', () => {
    expect(authenticated(anonymous)).toBe(false)
    expect(authenticated(as('learner'))).toBe(true)
  })

  it('roleIn ne retient que les rôles listés', () => {
    const rule = roleIn('sales')
    expect(rule(as('sales'))).toBe(true)
    expect(rule(as('editor'))).toBe(false)
    expect(rule(anonymous)).toBe(false)
    expect(rule(noRoles)).toBe(false)
  })

  it.each([
    ['isSuperAdmin', isSuperAdmin, ['super-admin']],
    ['isEditorial', isEditorial, ['super-admin', 'editor']],
    ['isCourseStaff', isCourseStaff, ['super-admin', 'editor', 'instructor']],
    ['isSales', isSales, ['super-admin', 'sales']],
    ['isStaff', isStaff, ['super-admin', 'editor', 'instructor', 'sales']],
    ['canAccessAdmin', canAccessAdmin, ['super-admin', 'editor', 'instructor', 'sales']],
  ] as const)('%s', (_name, rule, allowed) => {
    const all: Role[] = ['super-admin', 'editor', 'instructor', 'sales', 'learner']
    for (const role of all) expect(rule(as(role))).toBe((allowed as readonly Role[]).includes(role))
    expect(rule(anonymous)).toBe(false)
  })
})

describe('règles filtrantes', () => {
  it('publishedOr : le public ne lit que les versions publiées', () => {
    const rule = publishedOr('editor')
    expect(rule(as('editor'))).toBe(true)
    expect(rule(as('learner'))).toEqual({ _status: { equals: 'published' } })
    expect(rule(anonymous)).toEqual({ _status: { equals: 'published' } })
  })

  it('whereFieldOr : filtre public sur un champ', () => {
    const rule = whereFieldOr('active', true, 'sales')
    expect(rule(as('sales'))).toBe(true)
    expect(rule(anonymous)).toEqual({ active: { equals: true } })
  })

  it('ownerOr : propriétaire uniquement, rien pour un anonyme', () => {
    const rule = ownerOr('user', 'super-admin')
    expect(rule(as('super-admin'))).toBe(true)
    expect(rule(as('learner'))).toEqual({ user: { equals: 42 } })
    expect(rule(anonymous)).toBe(false)
  })

  it('selfOr : son propre compte uniquement', () => {
    const rule = selfOr('super-admin', 'sales')
    expect(rule(as('sales'))).toBe(true)
    expect(rule(as('learner'))).toEqual({ id: { equals: 42 } })
    expect(rule(anonymous)).toBe(false)
  })

  it('courseEditors : un formateur ne modifie que ses cours', () => {
    expect(courseEditors(as('super-admin'))).toBe(true)
    expect(courseEditors(as('editor'))).toBe(true)
    expect(courseEditors(as('instructor'))).toEqual({ instructors: { in: [42] } })
    expect(courseEditors(as('sales'))).toBe(false)
    expect(courseEditors(as('learner'))).toBe(false)
    expect(courseEditors(anonymous)).toBe(false)
  })
})
