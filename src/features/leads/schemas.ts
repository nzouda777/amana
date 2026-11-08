import { z } from 'zod'

/**
 * Schémas des formulaires publics (devis, contact, guide, newsletter), partagés entre le
 * client (validation par étape, messages immédiats) et le serveur (validation finale,
 * seule qui fait foi). Les messages d'erreur sont des **codes** traduits à l'affichage
 * (`forms.errors.<code>`), jamais du texte en dur.
 */

export type ErrorCode =
  'required' | 'email' | 'tooShort' | 'tooLong' | 'phone' | 'choice' | 'consent' | 'number'

const required = { error: 'required' satisfies ErrorCode }

const text = (max: number) =>
  z
    .string(required)
    .trim()
    .max(max, { error: 'tooLong' satisfies ErrorCode })

const requiredText = (max: number, min = 1) =>
  text(max).min(min, { error: (min > 1 ? 'tooShort' : 'required') satisfies ErrorCode })

const optionalText = (max: number) =>
  text(max)
    .optional()
    .transform((value) => (value ? value : undefined))

export const emailField = z
  .string(required)
  .trim()
  .min(1, { error: 'required' satisfies ErrorCode })
  .max(254, { error: 'tooLong' satisfies ErrorCode })
  .pipe(z.email({ error: 'email' satisfies ErrorCode }))
  .transform((value) => value.toLowerCase())

/** Téléphone international souple : chiffres, espaces, +, tirets, parenthèses ; 8 à 15 chiffres. */
export const phoneField = z
  .string()
  .trim()
  .max(32, { error: 'tooLong' satisfies ErrorCode })
  .refine((value) => value === '' || /^\+?[\d\s().-]+$/.test(value), { error: 'phone' })
  .refine(
    (value) => {
      if (value === '') return true
      const digits = value.replace(/\D/g, '').length
      return digits >= 8 && digits <= 15
    },
    { error: 'phone' },
  )
  .optional()
  .transform((value) => (value ? value : undefined))

const choice = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values, { error: 'choice' satisfies ErrorCode })

const acceptance = z.literal(true, { error: 'consent' satisfies ErrorCode })

/* ------------------------------------------------------------------ Devis */

export const quoteTypes = [
  'audit',
  'conseil',
  'accompagnement',
  'formation-entreprise',
  'takaful',
  'partenariat',
] as const
export type QuoteType = (typeof quoteTypes)[number]

export function isQuoteType(value: unknown): value is QuoteType {
  return typeof value === 'string' && (quoteTypes as readonly string[]).includes(value)
}

export const organizationKinds = [
  'banque',
  'microfinance',
  'assurance',
  'entreprise',
  'institution',
  'association',
  'particulier',
] as const

export const auditScopes = ['etablissement', 'produit', 'fenetre', 'processus'] as const
export const projectStages = ['idee', 'conception', 'lancement', 'existant'] as const
export const trainingFormats = ['en-ligne', 'presentiel', 'mixte'] as const
export const takafulAudiences = ['particulier', 'entreprise'] as const
export const partnerKinds = ['institution', 'ecole', 'media', 'entreprise', 'autre'] as const
export const timeframes = ['urgent', 'trimestre', 'semestre', 'indefini'] as const

export const typeStepSchema = z.object({ type: choice(quoteTypes) })

const learners = z.coerce
  .number({ error: 'number' satisfies ErrorCode })
  .int({ error: 'number' satisfies ErrorCode })
  .min(1, { error: 'number' satisfies ErrorCode })
  .max(100_000, { error: 'number' satisfies ErrorCode })

/** Champs de contexte communs à tous les types. */
const contextBase = {
  message: requiredText(4000, 20),
  timeframe: choice(timeframes).optional(),
}

/** Champs de contexte conditionnels, selon le type de demande. */
export const contextSchemas = {
  audit: z.object({
    ...contextBase,
    organizationKind: choice(organizationKinds),
    auditScope: choice(auditScopes),
  }),
  conseil: z.object({
    ...contextBase,
    organizationKind: choice(organizationKinds),
    projectStage: choice(projectStages),
  }),
  accompagnement: z.object({
    ...contextBase,
    organizationKind: choice(organizationKinds),
    projectStage: choice(projectStages),
  }),
  'formation-entreprise': z.object({
    ...contextBase,
    organizationKind: choice(organizationKinds),
    learners,
    trainingFormat: choice(trainingFormats),
  }),
  takaful: z.object({ ...contextBase, takafulAudience: choice(takafulAudiences) }),
  partenariat: z.object({ ...contextBase, partnerKind: choice(partnerKinds) }),
} satisfies Record<QuoteType, z.ZodType>

/** Types pour lesquels l'organisation est obligatoire. */
const organizationRequired: ReadonlySet<QuoteType> = new Set([
  'audit',
  'conseil',
  'accompagnement',
  'formation-entreprise',
  'partenariat',
])

export function isOrganizationRequired(type: QuoteType): boolean {
  return organizationRequired.has(type)
}

const contactBase = {
  name: requiredText(120, 2),
  email: emailField,
  phone: phoneField,
  jobTitle: optionalText(120),
  city: optionalText(80),
  /** Traitement de la demande : obligatoire, sinon on ne peut pas répondre. */
  processingConsent: acceptance,
  /** Newsletter : facultative, décochée par défaut (SPEC §4.4). */
  newsletter: z.boolean().optional().default(false),
}

export function contactStepSchema(type: QuoteType) {
  return z.object({
    ...contactBase,
    organization: isOrganizationRequired(type) ? requiredText(160) : optionalText(160),
  })
}

/** Jeton anti-robot et page d'origine, ajoutés par le formulaire. */
const envelope = {
  turnstileToken: z.string().trim().min(1, { error: 'required' }).max(4096),
  sourcePage: z.string().trim().max(300).optional(),
}

export type QuoteInput = {
  type: QuoteType
  context: z.output<(typeof contextSchemas)[QuoteType]>
  contact: z.output<ReturnType<typeof contactStepSchema>>
  turnstileToken: string
  sourcePage?: string
}

const quoteEnvelopeSchema = z.object({
  type: choice(quoteTypes),
  context: z.record(z.string(), z.unknown()),
  contact: z.record(z.string(), z.unknown()),
  ...envelope,
})

export type FieldErrors = Record<string, ErrorCode>

/** Convertit les erreurs zod en `{ chemin: code }` (première erreur par champ). */
export function toFieldErrors(error: z.ZodError, prefix = ''): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of error.issues) {
    const key = prefix + issue.path.map(String).join('.')
    if (errors[key]) continue
    errors[key] = isErrorCode(issue.message) ? issue.message : 'required'
  }
  return errors
}

const errorCodes: ReadonlySet<string> = new Set<ErrorCode>([
  'required',
  'email',
  'tooShort',
  'tooLong',
  'phone',
  'choice',
  'consent',
  'number',
])

function isErrorCode(value: string): value is ErrorCode {
  return errorCodes.has(value)
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; fieldErrors: FieldErrors }

/** Validation complète d'une demande de devis (serveur), étape par étape. */
export function parseQuote(input: unknown): ParseResult<QuoteInput> {
  const envelopeResult = quoteEnvelopeSchema.safeParse(input)
  if (!envelopeResult.success)
    return { ok: false, fieldErrors: toFieldErrors(envelopeResult.error) }
  const { type, context, contact, turnstileToken, sourcePage } = envelopeResult.data

  const contextResult = contextSchemas[type].safeParse(context)
  const contactResult = contactStepSchema(type).safeParse(contact)
  const fieldErrors: FieldErrors = {
    ...(contextResult.success ? {} : toFieldErrors(contextResult.error, 'context.')),
    ...(contactResult.success ? {} : toFieldErrors(contactResult.error, 'contact.')),
  }
  if (!contextResult.success || !contactResult.success) return { ok: false, fieldErrors }
  return {
    ok: true,
    data: {
      type,
      context: contextResult.data,
      contact: contactResult.data,
      turnstileToken,
      sourcePage,
    },
  }
}

/* --------------------------------------------- Formulaire court (contact, pages de service) */

export const contactSubjects = ['contact', ...quoteTypes] as const
export type ContactSubject = (typeof contactSubjects)[number]

export const contactFormSchema = z.object({
  subject: choice(contactSubjects),
  name: requiredText(120, 2),
  email: emailField,
  phone: phoneField,
  organization: optionalText(160),
  message: requiredText(4000, 10),
  processingConsent: acceptance,
  ...envelope,
})
export type ContactFormInput = z.output<typeof contactFormSchema>

/* --------------------------------------------------------------- Guides */

export const newsletterInterests = ['formation', 'audit', 'takaful', 'reglementaire'] as const
export type NewsletterInterestValue = (typeof newsletterInterests)[number]

export const guideDownloadSchema = z.object({
  guideId: z.coerce.number().int().positive(),
  name: optionalText(120),
  email: emailField,
  organization: optionalText(160),
  phone: phoneField,
  /** Case non cochée par défaut (SPEC §4.4) : consentement explicite. */
  newsletter: z.boolean().optional().default(false),
  ...envelope,
})
export type GuideDownloadInput = z.output<typeof guideDownloadSchema>

/* ----------------------------------------------------------- Newsletter */

export const newsletterSchema = z.object({
  email: emailField,
  firstName: optionalText(80),
  interests: z.array(choice(newsletterInterests)).max(4).optional().default([]),
  ...envelope,
})
export type NewsletterInput = z.output<typeof newsletterSchema>
