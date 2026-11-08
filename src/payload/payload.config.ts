import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { getServerEnv } from '../env'
import { collections } from './collections'
import { Footer } from './globals/Footer'
import { LegalDisclaimer } from './globals/LegalDisclaimer'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const env = getServerEnv()

/**
 * Connexion Neon (ADR 005) :
 * - application : `DATABASE_URL`, point d'accès *pooled* (PgBouncer, mode transaction) ;
 * - migrations : `DATABASE_URL_UNPOOLED`, connexion directe, sélectionnée par
 *   `PAYLOAD_DB_DIRECT=1` (scripts `migrate*`). Le DDL et les verrous consultatifs de
 *   drizzle-kit n'ont pas leur place derrière un pooler en mode transaction.
 */
const useDirectConnection = process.env.PAYLOAD_DB_DIRECT === '1'
const connectionString =
  useDirectConnection && env.DATABASE_URL_UNPOOLED ? env.DATABASE_URL_UNPOOLED : env.DATABASE_URL

export default buildConfig({
  secret: env.PAYLOAD_SECRET,
  serverURL: env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: 'users',
    meta: { titleSuffix: ' · Amana Conseil' },
    importMap: { baseDir: path.resolve(dirname, '..') },
  },
  collections,
  globals: [SiteSettings, Navigation, Footer, LegalDisclaimer],
  editor: lexicalEditor(),
  localization: {
    locales: [
      { code: 'fr', label: 'Français' },
      { code: 'en', label: 'English' },
      { code: 'ar', label: 'العربية', rtl: true },
    ],
    defaultLocale: 'fr',
    fallback: true,
  },
  i18n: {
    supportedLanguages: { fr, en },
    fallbackLanguage: 'fr',
  },
  // Profondeur explicite (ADR 007) : sans `depth` précisé, une requête ne peuple rien.
  defaultDepth: 0,
  maxDepth: 4,
  db: postgresAdapter({
    pool: {
      connectionString,
      // Par processus Node. Ne pas descendre à 1 : les commandes de migration de Payload
      // tiennent une connexion (transaction) tout en en demandant une autre.
      max: env.DATABASE_POOL_MAX,
      idleTimeoutMillis: 30_000,
      // Laisse le temps au calcul Neon de sortir de veille (scale-to-zero).
      connectionTimeoutMillis: 15_000,
    },
    // Le schéma n'évolue que par migrations versionnées, en dev comme en prod (ADR 005).
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts'),
  },
  graphQL: { disable: true },
  telemetry: false,
})
