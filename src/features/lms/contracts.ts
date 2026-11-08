/**
 * Contrats du domaine Formation. Aucun composant ne parle directement à un fournisseur
 * externe (Bunny, moteur PDF) : il passe par ces interfaces, injectées côté serveur.
 */

export type Id = number | string

// ---------------------------------------------------------------------------
// Accès aux contenus (ADR 002) : `enrollments` est la source unique de vérité.
// ---------------------------------------------------------------------------

export const enrollmentSources = ['purchase', 'pass', 'license', 'gift', 'admin'] as const
export type EnrollmentSource = (typeof enrollmentSources)[number]

/** `course` : un cours précis ; `catalog` : tous les cours `includedInPass` (pass d'accès). */
export const enrollmentScopes = ['course', 'catalog'] as const
export type EnrollmentScope = (typeof enrollmentScopes)[number]

/** L'expiration n'est pas un statut stocké : elle se déduit de `endsAt`. */
export const enrollmentStatuses = ['active', 'suspended', 'revoked'] as const
export type EnrollmentStatus = (typeof enrollmentStatuses)[number]

export type EnrollmentRecord = {
  id: Id
  scope: EnrollmentScope
  courseId: Id | null
  source: EnrollmentSource
  status: EnrollmentStatus
  startsAt: Date
  endsAt: Date | null
}

export type AccessGrantReason = 'enrollment' | 'preview' | 'staff'
/**
 * `not-found` : le cours ou la leçon n'existe pas, ou la leçon n'appartient pas au cours
 * demandé (URL forgée). Indistinguable d'un contenu inexistant, pour ne rien révéler.
 */
export type AccessDenialReason =
  | 'not-authenticated'
  | 'not-found'
  | 'no-enrollment'
  | 'not-started'
  | 'expired'
  | 'suspended'
  | 'revoked'

/** Décision expliquée : qui a accès, pourquoi, jusqu'à quand. */
export type AccessDecision =
  | {
      allowed: true
      reason: AccessGrantReason
      enrollmentId?: Id
      source?: EnrollmentSource
      /**
       * Fin de l'accès, renouvellements consécutifs compris (un pass renouvelé avant son
       * terme prolonge l'échéance affichée). `null` : accès illimité.
       */
      expiresAt: Date | null
    }
  | { allowed: false; reason: AccessDenialReason }

/** Rôles globaux (miroir de `src/payload/access/roles.ts`, sans dépendance à Payload). */
export type ViewerRole = 'super-admin' | 'editor' | 'instructor' | 'sales' | 'learner'

/**
 * Utilisateur connecté, tel que le serveur l'a authentifié (jamais une donnée du client).
 * Personnel pédagogique : `super-admin` et `editor` sur tous les cours, `instructor` sur
 * les cours dont il est formateur. `sales` n'a pas d'accès pédagogique implicite.
 */
export type Viewer = { id: Id; roles: readonly ViewerRole[] } | null

export type GrantInput = {
  userId: Id
  scope: EnrollmentScope
  courseId: Id | null
  source: EnrollmentSource
  /** Origine du droit, pour l'idempotence et la révocation (une commande, une licence…). */
  origin: { orderId?: Id; licenseId?: Id; productId?: Id; grantedBy?: Id }
  startsAt: Date
  endsAt: Date | null
}

export type GrantResult = { enrollmentId: Id; created: boolean }

export interface AccessService {
  /** Le spectateur peut-il suivre ce cours maintenant ? */
  canAccessCourse(viewer: Viewer, courseId: Id, at?: Date): Promise<AccessDecision>
  /**
   * Comme `canAccessCourse`, plus les extraits gratuits (`isPreview`, cours publié).
   * `expectedCourseId` : cours de l'URL ; une leçon d'un autre cours renvoie `not-found`.
   */
  canAccessLesson(
    viewer: Viewer,
    lessonId: Id,
    options?: { at?: Date; expectedCourseId?: Id },
  ): Promise<AccessDecision>
  /** Idempotent : même (utilisateur, cours/portée, origine) → même inscription. */
  grant(input: GrantInput): Promise<GrantResult>
  /** Révoque toutes les inscriptions issues d'une origine (remboursement, licence retirée). */
  revokeByOrigin(origin: { orderId?: Id; licenseId?: Id }, reason: string): Promise<number>
  /** Cours accessibles (pour l'espace apprenant), avec la raison de chaque accès. */
  listAccessibleCourses(
    userId: Id,
    at?: Date,
  ): Promise<{ courseId: Id; decision: AccessDecision }[]>
}

// ---------------------------------------------------------------------------
// Vidéo (Bunny Stream en production, implémentation factice en dev/tests).
// ---------------------------------------------------------------------------

export type VideoRef = { provider: string; videoId: string }

export type PlaybackSource = {
  /** Manifeste HLS signé, durée de validité courte. */
  hlsUrl: string
  expiresAt: Date
  posterUrl?: string
  captions?: { locale: string; url: string; label: string }[]
  /** Texte du filigrane dynamique discret (e-mail de l'apprenant). */
  watermark?: string
}

export const videoStatuses = ['processing', 'ready', 'failed'] as const
export type VideoStatus = (typeof videoStatuses)[number]

export interface VideoProvider {
  readonly id: string
  getPlaybackSource(input: {
    video: VideoRef
    viewer: { userId: Id; email: string } | null
    /** Durée de validité de l'URL ; voir `playbackTtlSeconds` (ADR 017). */
    ttlSeconds: number
    /** Économie de données : rendu le plus bas forcé. */
    dataSaver?: boolean
    /** Pistes de sous-titres disponibles (langues déclarées dans le CMS ou chez le fournisseur). */
    captions?: readonly { locale: string; label: string }[]
  }): Promise<PlaybackSource>
  getVideoInfo(video: VideoRef): Promise<{ status: VideoStatus; durationSeconds: number | null }>
  /**
   * Webhook d'encodage ; lève `VideoProviderError('invalid-signature')` si la signature est
   * invalide. `status: null` : événement sans effet sur la lecture (sous-titres générés…).
   * `eventId` : stable entre deux livraisons du même événement (idempotence).
   */
  verifyWebhook(request: { headers: Record<string, string>; rawBody: string }): Promise<{
    videoId: string
    status: VideoStatus | null
    eventId: string | null
  }>
}

export type VideoProviderErrorCode =
  'not-configured' | 'invalid-video-id' | 'invalid-signature' | 'invalid-payload' | 'upstream-error'

export class VideoProviderError extends Error {
  constructor(
    public readonly code: VideoProviderErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'VideoProviderError'
  }
}

// ---------------------------------------------------------------------------
// Certificats PDF (@react-pdf/renderer en M3).
// ---------------------------------------------------------------------------

export type CertificateData = {
  code: string
  recipientName: string
  title: string
  issuedAt: Date
  durationMinutes: number | null
  /** URL publique de vérification encodée dans le QR code. */
  verificationUrl: string
  signatory: { name: string; role: string } | null
  locale: 'fr' | 'en' | 'ar'
}

export interface CertificateRenderer {
  render(
    data: CertificateData,
  ): Promise<{ pdf: Uint8Array; contentType: 'application/pdf'; fileName: string }>
}
