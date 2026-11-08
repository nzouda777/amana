/**
 * Formateurs FICTIFS (comptes `users`, rôle `instructor`), reprenant les profils de
 * démonstration de l'équipe (`team.ts`). Noms suffixés « (démo) », e-mails sur le domaine
 * réservé `.example` (non routable).
 *
 * Comptes inertes : mot de passe aléatoire jamais affiché, adresse non vérifiée, aucun
 * e-mail envoyé. Ils servent uniquement à renseigner `courses.instructors`.
 * TODO(client) : formateurs réels (nom, fonction, photo), puis comptes activés par un
 * super-admin (invitation ou réinitialisation du mot de passe).
 */
import { randomBytes } from 'node:crypto'

import { count, type IdMap, SEED_LOCALE, type Seeder, seedContext } from '../lib/upsert'

export type InstructorSeed = { key: string; firstName: string; lastName: string; email: string }

export const instructorsSeed: InstructorSeed[] = [
  {
    key: 'ibrahim',
    firstName: 'Ibrahim',
    lastName: 'Abdoulaye (démo)',
    email: 'formateur.ibrahim.abdoulaye@amana-conseil.example',
  },
  {
    key: 'clarisse',
    firstName: 'Clarisse',
    lastName: 'Fotso (démo)',
    email: 'formatrice.clarisse.fotso@amana-conseil.example',
  },
  {
    key: 'hamadou',
    firstName: 'Hamadou',
    lastName: 'Bouba (démo)',
    email: 'formateur.hamadou.bouba@amana-conseil.example',
  },
  {
    key: 'mariam',
    firstName: 'Mariam',
    lastName: 'Ndjock (démo)',
    email: 'formatrice.mariam.ndjock@amana-conseil.example',
  },
]

export async function seedInstructors(seeder: Seeder): Promise<IdMap> {
  const ids: IdMap = new Map()
  for (const instructor of instructorsSeed) {
    const existing = await seeder.payload.find({
      collection: 'users',
      where: { email: { equals: instructor.email } },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    const found = existing.docs[0]
    const profile = {
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      roles: ['instructor' as const],
      preferredLocale: 'fr' as const,
    }
    if (found) {
      // Le mot de passe et l'état de vérification ne sont jamais modifiés au rejeu.
      await seeder.payload.update({
        collection: 'users',
        id: found.id,
        data: profile,
        depth: 0,
        locale: SEED_LOCALE,
        overrideAccess: true,
        context: seedContext,
      })
      count(seeder, 'users', 'updated')
      ids.set(instructor.key, found.id)
      continue
    }
    const doc = await seeder.payload.create({
      collection: 'users',
      data: {
        ...profile,
        email: instructor.email,
        password: randomBytes(32).toString('base64url'),
      },
      disableVerificationEmail: true,
      depth: 0,
      locale: SEED_LOCALE,
      overrideAccess: true,
      context: seedContext,
    })
    count(seeder, 'users', 'created')
    ids.set(instructor.key, doc.id)
  }
  return ids
}
