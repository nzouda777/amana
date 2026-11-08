import { randomBytes } from 'node:crypto'
import { z } from 'zod'

/**
 * Validation des variables d'environnement serveur, au démarrage.
 *
 * - Importé par `payload.config.ts` : toute commande Payload (dev, build, migrate)
 *   échoue immédiatement avec un message lisible si la configuration est incomplète.
 * - `SKIP_ENV_VALIDATION=1` n'est destiné qu'aux tâches qui n'ouvrent jamais de connexion
 *   (tests unitaires, `generate:types`, `generate:importmap`). Dans ce mode, les valeurs
 *   manquantes sont remplacées par des valeurs inertes (URL vide, secret aléatoire par
 *   processus) : rien ne peut fonctionner contre une vraie base avec elles.
 */

const required = {
  error: (issue: { input: unknown }) =>
    issue.input === undefined ? 'variable absente' : 'chaîne de caractères attendue',
}

const postgresUrl = z
  .string(required)
  .trim()
  .min(1)
  .refine((value) => /^postgres(ql)?:\/\//.test(value), {
    message: 'doit commencer par postgres:// ou postgresql://',
  })
  .refine(
    (value) => !value.includes('.neon.tech') || /[?&]sslmode=(require|verify-full)/.test(value),
    {
      message: 'une URL Neon doit inclure sslmode=require (ou verify-full)',
    },
  )

const csv = z
  .string()
  .trim()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )

const optionalString = z.string().trim().min(1).optional()

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Base de données (Neon). Voir docs/adr/005-hebergement-neon.md
    DATABASE_URL: postgresUrl,
    DATABASE_URL_UNPOOLED: postgresUrl.optional(),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),

    // Payload
    PAYLOAD_SECRET: z
      .string(required)
      .min(32, 'doit contenir au moins 32 caractères (openssl rand -hex 32)'),

    // URL publique du site (canonical, liens d'e-mail, retours de paiement)
    NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),

    // Paiement (ADR 006) : liste des fournisseurs actifs, dans l'ordre de préférence
    PAYMENT_PROVIDERS: csv.default(['manual-transfer']),
    PAYMENT_SANDBOX_SECRET: optionalString,
    BANK_TRANSFER_ACCOUNT_HOLDER: optionalString,
    BANK_TRANSFER_BANK_NAME: optionalString,
    BANK_TRANSFER_ACCOUNT_NUMBER: optionalString,
    BANK_TRANSFER_SWIFT: optionalString,

    // Services tiers (branchés aux jalons suivants, facultatifs en M0)
    RESEND_API_KEY: optionalString,
    EMAIL_FROM: optionalString,
    BREVO_API_KEY: optionalString,
    // Liste Brevo des abonnés confirmés (TODO(client)).
    BREVO_LIST_ID: z.coerce.number().int().positive().optional(),
    // Dossier des e-mails écrits par l'adaptateur de développement (ignoré par git).
    DEV_EMAIL_DIR: z.string().trim().min(1).default('.dev-emails'),
    // Vidéo (ADR 017) : `local` (fichiers de développement) ou `bunny` (Bunny Stream).
    VIDEO_PROVIDER: z.enum(['local', 'bunny']).default('local'),
    LOCAL_VIDEO_FORMAT: z.enum(['hls', 'mp4']).default('mp4'),
    // Dossier des vidéos de développement (ignoré par git), servi par /api/dev-video.
    LOCAL_VIDEO_DIR: z.string().trim().min(1).default('.dev-media'),
    BUNNY_STREAM_LIBRARY_ID: z
      .string()
      .trim()
      .regex(/^\d+$/, 'identifiant numérique de bibliothèque attendu')
      .optional(),
    BUNNY_STREAM_API_KEY: optionalString,
    BUNNY_STREAM_TOKEN_KEY: optionalString,
    BUNNY_STREAM_CDN_HOSTNAME: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i,
        'nom d’hôte seul attendu, sans https:// (ex. vz-abc123.b-cdn.net)',
      )
      .optional(),
    // Secret des webhooks Bunny Stream = clé d'API en lecture seule de la bibliothèque.
    BUNNY_STREAM_WEBHOOK_SECRET: optionalString,
    BUNNY_STREAM_DATA_SAVER_RENDITION: z
      .string()
      .trim()
      .regex(/^\d{3,4}p$/, 'rendu attendu, ex. 240p')
      .default('240p'),
    CALCOM_WEBHOOK_SECRET: optionalString,
    NEXT_PUBLIC_CALCOM_LINK: optionalString,
    // Anti-robot Turnstile désactivé par défaut (ADR 020) ; `1` pour le réactiver partout.
    NEXT_PUBLIC_TURNSTILE_ENABLED: z
      .enum(['0', '1', 'true', 'false'])
      .default('0')
      .transform((value) => value === '1' || value === 'true'),
    TURNSTILE_SECRET_KEY: optionalString,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
    // Build de production local / CI : autorise les adaptateurs de développement
    // (clés Turnstile de test, e-mails écrits en fichier). Jamais en production réelle.
    // Phase Next.js (`phase-production-build` pendant `next build`).
    NEXT_PHASE: z.string().optional(),
    ALLOW_DEV_SERVICES: z
      .enum(['0', '1', 'true', 'false'])
      .default('0')
      .transform((value) => value === '1' || value === 'true'),
  })
  .superRefine((env, ctx) => {
    // Bunny choisi : sa configuration de lecture est complète, quel que soit l'environnement.
    if (env.VIDEO_PROVIDER === 'bunny') {
      const bunny = [
        'BUNNY_STREAM_LIBRARY_ID',
        'BUNNY_STREAM_API_KEY',
        'BUNNY_STREAM_TOKEN_KEY',
        'BUNNY_STREAM_CDN_HOSTNAME',
      ] as const
      for (const key of bunny) {
        if (!env[key])
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'obligatoire avec VIDEO_PROVIDER=bunny',
          })
      }
    }
    // En production (à l'exécution, pas pendant `next build`). Resend n'est pas exigé au
    // démarrage : sans lui, le site et la connexion fonctionnent, seuls les envois d'e-mails
    // sont refusés (`isEmailConfigured`, ADR 021). Une clé Resend impose un expéditeur.
    if (env.NODE_ENV !== 'production' || env.ALLOW_DEV_SERVICES) return
    if (env.NEXT_PHASE === 'phase-production-build') return
    const needed = [
      ...(env.NEXT_PUBLIC_TURNSTILE_ENABLED
        ? (['TURNSTILE_SECRET_KEY', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY'] as const)
        : []),
      ...(env.RESEND_API_KEY ? (['EMAIL_FROM'] as const) : []),
    ] as const
    for (const key of needed) {
      if (!env[key])
        ctx.addIssue({ code: 'custom', path: [key], message: 'obligatoire en production' })
    }
  })

export type ServerEnv = z.infer<typeof serverEnvSchema>

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(
      [
        'Configuration invalide : variables d’environnement manquantes ou incorrectes.',
        ...issues.map((issue) => `  - ${issue}`),
        'Copiez .env.example vers .env et complétez les valeurs (voir docs/adr/005-hebergement-neon.md).',
      ].join('\n'),
    )
    this.name = 'EnvValidationError'
  }
}

type EnvSource = Record<string, string | undefined>

function isSkipRequested(source: EnvSource): boolean {
  return source.SKIP_ENV_VALIDATION === '1' || source.SKIP_ENV_VALIDATION === 'true'
}

/** Analyse pure, testable : ne lit jamais `process.env` directement. */
export function parseServerEnv(source: EnvSource): ServerEnv {
  const input: EnvSource = { ...source }

  if (isSkipRequested(source)) {
    input.DATABASE_URL ||= 'postgres://skip-env-validation.invalid/none'
    input.PAYLOAD_SECRET ||= randomBytes(32).toString('hex')
  }

  // Une variable vide dans .env équivaut à une variable absente.
  for (const [key, value] of Object.entries(input)) {
    if (value === '') delete input[key]
  }

  const result = serverEnvSchema.safeParse(input)
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map(
        (issue) => `${issue.path.join('.') || '(racine)'} : ${issue.message}`,
      ),
    )
  }
  return result.data
}

let cached: ServerEnv | undefined

/** Variables serveur validées (mémorisées après le premier appel). */
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env)
  return cached
}

/**
 * Envoi d'e-mails disponible : Resend configuré, ou adaptateur de développement autorisé
 * (hors production, ou `ALLOW_DEV_SERVICES=1`). Faux en production sans Resend (ADR 021).
 */
export function isEmailConfigured(env: ServerEnv = getServerEnv()): boolean {
  return Boolean(env.RESEND_API_KEY) || env.NODE_ENV !== 'production' || env.ALLOW_DEV_SERVICES
}
