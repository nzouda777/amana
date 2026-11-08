import { headers } from 'next/headers'

import type { Locale } from '@/lib/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import type { User } from '@/payload-types'

import { EnrollmentAccessService } from '../access'
import type { AccessService, Viewer, ViewerRole } from '../contracts'
import { QuizService } from '../quiz-service'
import {
  createPayloadAccessCatalog,
  createPayloadEnrollmentStore,
  createPayloadQuizAttemptStore,
  createPayloadQuizRepository,
} from './payload-adapters'

/**
 * Câblage serveur du domaine Formation (Server Components, Server Actions, routes).
 * Jamais importé par un composant client.
 */

export async function getAccessService(): Promise<AccessService> {
  const payload = await getPayloadClient()
  return new EnrollmentAccessService({
    catalog: createPayloadAccessCatalog(payload),
    enrollments: createPayloadEnrollmentStore(payload),
  })
}

export async function getQuizService(locale: Locale): Promise<QuizService> {
  const payload = await getPayloadClient()
  return new QuizService({
    quizzes: createPayloadQuizRepository(payload, locale),
    attempts: createPayloadQuizAttemptStore(payload),
    access: await getAccessService(),
  })
}

const viewerRoles: readonly ViewerRole[] = [
  'super-admin',
  'editor',
  'instructor',
  'sales',
  'learner',
]

/** Utilisateur authentifié par le cookie de session (vérifié par Payload), sinon `null`. */
export async function getSessionUser(): Promise<User | null> {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  return user && user.collection === 'users' ? user : null
}

/** Spectateur du domaine : identifiant et rôles, tels que le serveur les a authentifiés. */
export function toViewer(user: Pick<User, 'id' | 'roles'> | null): Viewer {
  if (!user) return null
  return {
    id: user.id,
    roles: (user.roles ?? []).filter((role): role is ViewerRole => viewerRoles.includes(role)),
  }
}
