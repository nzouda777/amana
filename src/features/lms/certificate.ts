import type { AccessDecision, Id } from './contracts'
import type { CourseProgress } from './progress'

/**
 * Éligibilité au certificat (SPEC §4.1) : toutes les leçons terminées et tous les quiz
 * requis réussis, sur un cours (ou parcours) qui délivre un certificat, par un apprenant
 * inscrit. Le job de génération (déclenché à la complétion) appelle cette règle avant
 * chaque émission : elle est idempotente (un certificat valide existant n'est pas dupliqué).
 */

export type CertificateIneligibility =
  | 'certificate-disabled'
  | 'no-access'
  | 'incomplete'
  | 'quiz-pending'
  | 'already-issued'
  | 'revoked-certificate'

export type CertificateEligibility =
  { eligible: true } | { eligible: false; reason: CertificateIneligibility; certificateId?: Id }

export type ExistingCertificate = { id: Id; revoked: boolean }

/**
 * L'inscription doit exister : accès en cours, ou accès arrivé à échéance (la formation
 * a été suivie pendant la période d'accès). Un accès révoqué (remboursement), suspendu,
 * l'aperçu d'un extrait ou l'accès « personnel pédagogique » ne donnent pas de certificat.
 */
export function accessQualifiesForCertificate(access: AccessDecision): boolean {
  return access.allowed ? access.reason === 'enrollment' : access.reason === 'expired'
}

function checkExisting(existing: readonly ExistingCertificate[]): CertificateEligibility | null {
  const valid = existing.find((certificate) => !certificate.revoked)
  if (valid) return { eligible: false, reason: 'already-issued', certificateId: valid.id }
  // Un certificat révoqué (fraude, erreur) n'est jamais réémis automatiquement.
  const revoked = existing.find((certificate) => certificate.revoked)
  if (revoked) return { eligible: false, reason: 'revoked-certificate', certificateId: revoked.id }
  return null
}

function checkProgress(progress: CourseProgress): CertificateEligibility | null {
  if (progress.totalLessons === 0) return { eligible: false, reason: 'incomplete' }
  if (progress.completedLessons < progress.totalLessons)
    return { eligible: false, reason: 'incomplete' }
  if (progress.pendingQuizIds.length > 0) return { eligible: false, reason: 'quiz-pending' }
  return progress.isComplete ? null : { eligible: false, reason: 'incomplete' }
}

export function evaluateCertificateEligibility(input: {
  certificateEnabled: boolean
  access: AccessDecision
  progress: CourseProgress
  existing: readonly ExistingCertificate[]
}): CertificateEligibility {
  if (!input.certificateEnabled) return { eligible: false, reason: 'certificate-disabled' }
  const existing = checkExisting(input.existing)
  if (existing) return existing
  if (!accessQualifiesForCertificate(input.access)) return { eligible: false, reason: 'no-access' }
  return checkProgress(input.progress) ?? { eligible: true }
}

/** Certificat de parcours : chaque cours du parcours est terminé par un inscrit. */
export function evaluatePathCertificateEligibility(input: {
  certificateEnabled: boolean
  courses: readonly { access: AccessDecision; progress: CourseProgress }[]
  existing: readonly ExistingCertificate[]
}): CertificateEligibility {
  if (!input.certificateEnabled) return { eligible: false, reason: 'certificate-disabled' }
  const existing = checkExisting(input.existing)
  if (existing) return existing
  if (input.courses.length === 0) return { eligible: false, reason: 'incomplete' }
  if (input.courses.some((course) => !accessQualifiesForCertificate(course.access)))
    return { eligible: false, reason: 'no-access' }
  for (const course of input.courses) {
    const blocked = checkProgress(course.progress)
    if (blocked) return blocked
  }
  return { eligible: true }
}

/**
 * Nom imprimé : prénom + nom du profil. `null` si absent : l'apprenant complète son
 * profil avant l'émission (l'e-mail n'est jamais imprimé ni affiché publiquement).
 */
export function certificateRecipientName(user: {
  firstName?: string | null
  lastName?: string | null
}): string | null {
  const name = [user.firstName, user.lastName]
    .map((part) => part?.trim().replace(/\s+/g, ' ') ?? '')
    .filter(Boolean)
    .join(' ')
  return name === '' ? null : name
}
