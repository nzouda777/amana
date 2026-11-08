import type { CollectionConfig, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { collections } from '@/payload/collections'

/** Garde-fou du modèle de données : SPEC §3 + ajouts documentés (documents, payment-events). */
const expectedSlugs = [
  // Contenu institutionnel
  'pages',
  'services',
  'case-studies',
  'team-members',
  'partners',
  'testimonials',
  'posts',
  'categories',
  'authors',
  'guides',
  'glossary-terms',
  'events',
  'faqs',
  'media',
  // Formation
  'courses',
  'modules',
  'lessons',
  'quizzes',
  'questions',
  'paths',
  'enrollments',
  'lesson-progress',
  'quiz-attempts',
  'certificates',
  'reviews',
  // Commerce
  'products',
  'coupons',
  'carts',
  'orders',
  'order-items',
  'payments',
  'invoices',
  'refunds',
  // Entreprise
  'organizations',
  'org-members',
  'licenses',
  'invitations',
  'assignments',
  'reminders',
  'quotes',
  // Contacts
  'leads',
  'newsletter-subscribers',
  'consents',
  // Utilisateurs
  'users',
  // Ajouts (ADR 006 et 008)
  'documents',
  'payment-events',
]

function topLevelFields(collection: CollectionConfig): Field[] {
  return collection.fields.flatMap((field) => (field.type === 'row' ? field.fields : [field]))
}

describe('modèle de données Payload', () => {
  it('contient exactement les collections attendues, une seule fois', () => {
    const slugs = collections.map((collection) => collection.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect([...slugs].sort()).toEqual([...expectedSlugs].sort())
  })

  it.each(collections.map((collection) => [collection.slug, collection] as const))(
    '%s déclare explicitement read/create/update/delete',
    (_slug, collection) => {
      expect(collection.access?.read).toBeTypeOf('function')
      expect(collection.access?.create).toBeTypeOf('function')
      expect(collection.access?.update).toBeTypeOf('function')
      expect(collection.access?.delete).toBeTypeOf('function')
    },
  )

  it('les contenus publics versionnés localisent leur titre et leur slug', () => {
    const publicCollections = [
      'pages',
      'services',
      'case-studies',
      'posts',
      'guides',
      'events',
      'courses',
      'paths',
    ]
    for (const slug of publicCollections) {
      const collection = collections.find((item) => item.slug === slug)
      expect(collection, slug).toBeDefined()
      const fields = topLevelFields(collection as CollectionConfig)
      for (const name of ['title', 'slug']) {
        const field = fields.find((item) => 'name' in item && item.name === name)
        expect(field && 'localized' in field ? field.localized : undefined, `${slug}.${name}`).toBe(
          true,
        )
      }
      expect(collection?.versions, slug).toMatchObject({ drafts: true })
    }
  })

  it('les journaux immuables refusent modification et suppression via l’API', () => {
    for (const slug of ['consents', 'payment-events']) {
      const collection = collections.find((item) => item.slug === slug)
      const ctx = { req: { user: { id: 1, roles: ['super-admin' as const] } } }
      const update = collection?.access?.update as (args: typeof ctx) => unknown
      const remove = collection?.access?.delete as (args: typeof ctx) => unknown
      expect(update(ctx), slug).toBe(false)
      expect(remove(ctx), slug).toBe(false)
    }
  })

  it('les factures ne sont jamais supprimées (numérotation continue)', () => {
    const invoices = collections.find((item) => item.slug === 'invoices')
    const remove = invoices?.access?.delete as (args: {
      req: { user: { id: number; roles: string[] } }
    }) => unknown
    expect(remove({ req: { user: { id: 1, roles: ['super-admin'] } } })).toBe(false)
  })
})
