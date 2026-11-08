import type { CollectionConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import type { Role } from '@/payload/access'
import { collections } from '@/payload/collections'

/** Règles d'accès propres à une collection, testées sur la configuration réelle. */

type ReadRule = (args: { req: { user: { id: number; roles: Role[] } | null } }) => unknown

function readRule(slug: string): ReadRule {
  const collection = collections.find((item) => item.slug === slug) as CollectionConfig
  return collection.access?.read as ReadRule
}

const as = (...roles: Role[]) => ({ req: { user: { id: 1, roles } } })

describe.each(['partners', 'testimonials'])('%s : affichage autorisé par écrit', (slug) => {
  const read = readRule(slug)
  const publicFilter = { displayAuthorized: { equals: true } }

  it('le public et les apprenants ne lisent que les fiches autorisées', () => {
    expect(read({ req: { user: null } })).toEqual(publicFilter)
    expect(read(as('learner'))).toEqual(publicFilter)
  })

  it('le personnel lit tout (contrôle complet en back-office)', () => {
    for (const role of ['super-admin', 'editor', 'instructor', 'sales'] as const)
      expect(read(as(role)), role).toBe(true)
  })
})
