/**
 * `pnpm seed` — jeu de démonstration du site vitrine (M2).
 *
 * Règles : toujours `context: { disableRevalidate: true }` (pas de requête Next ici),
 * contenus fictifs signalés `TODO(client)` ou « démo », idempotent : chaque document est
 * repéré par une clé naturelle (slug, nom, question) et mis à jour s'il existe déjà.
 * Formation (M3) : `formation/` (cours, capsules, quiz, parcours, packs, produits).
 * Pages légales : `legal.ts` (modèles non indexés tant qu’un juriste ne les a pas validés).
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { seedCategories } from './categories'
import { seedFormation } from './formation'
import { seedFooter, seedLegalDisclaimer, seedNavigation, seedSiteSettings } from './globals'
import { seedGlossary } from './glossary'
import { seedLegalPages } from './legal'
import type { Seeder } from './lib/upsert'
import { seedPages } from './pages'
import { seedPosts } from './posts'
import { seedCaseStudies, seedPartners, seedTestimonials } from './references'
import { seedEvents, seedGuides } from './resources'
import { seedGeneralFaqs, seedServices } from './services'
import { seedAuthors, seedTeam } from './team'

async function main(): Promise<void> {
  const payload = await getPayload({ config })
  const seeder: Seeder = { payload, stats: new Map() }
  const started = Date.now()

  // Globals
  await seedSiteSettings(seeder)
  await seedNavigation(seeder)
  await seedFooter(seeder)
  await seedLegalDisclaimer(seeder)

  // Contenu institutionnel
  const team = await seedTeam(seeder)
  const generalFaqs = await seedGeneralFaqs(seeder)
  const services = await seedServices(seeder)
  const testimonials = await seedTestimonials(seeder)
  const caseStudies = await seedCaseStudies(seeder, services, testimonials)
  const partners = await seedPartners(seeder)

  // Ressources
  const categories = await seedCategories(seeder)
  const authors = await seedAuthors(seeder, team)
  await seedGlossary(seeder)
  await seedPosts(seeder, categories, authors)
  const guides = await seedGuides(seeder)
  await seedEvents(seeder, team)

  // Formation (M3) : formateurs, cours, capsules, quiz, parcours, packs, produits
  const formation = await seedFormation(seeder, categories)

  // Pages composées (références vers tout ce qui précède)
  await seedPages(seeder, {
    services,
    testimonials,
    caseStudies,
    partners,
    guides,
    generalFaqs,
    courses: formation.courses,
  })

  // Pages légales : modèles à valider par un juriste, non indexés (ADR 013)
  await seedLegalPages(seeder)

  console.log('Seed terminé en %ds.', Math.round((Date.now() - started) / 1000))
  console.table(
    Object.fromEntries(
      [...seeder.stats.entries()].map(([name, { created, updated, deleted }]) => [
        name,
        { créés: created, 'mis à jour': updated, supprimés: deleted },
      ]),
    ),
  )
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
