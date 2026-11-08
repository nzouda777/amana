import { defineRouting } from 'next-intl/routing'

import { defaultLocale, locales } from './config'

/**
 * Chemins internes = routes françaises de docs/SPEC.md §2 (noms des dossiers sous
 * `src/app/[locale]`). Chaque entrée donne le chemin public par locale.
 * L'arabe reprend les slugs français tant que les traductions ne sont pas validées.
 * Les noms de paramètres dynamiques sont identiques dans toutes les locales.
 */
const fr = <T extends string>(path: T) => ({ fr: path, ar: path })

export const pathnames = {
  '/': '/',
  '/a-propos': { ...fr('/a-propos'), en: '/about' },

  '/formation': { ...fr('/formation'), en: '/training' },
  '/formation/cours': { ...fr('/formation/cours'), en: '/training/courses' },
  '/formation/cours/[slug]': { ...fr('/formation/cours/[slug]'), en: '/training/courses/[slug]' },
  '/formation/parcours/[slug]': {
    ...fr('/formation/parcours/[slug]'),
    en: '/training/paths/[slug]',
  },
  '/formation/entreprises': { ...fr('/formation/entreprises'), en: '/training/business' },
  '/formation/entreprises/capsules': {
    ...fr('/formation/entreprises/capsules'),
    en: '/training/business/capsules',
  },
  '/formation/presentiel': { ...fr('/formation/presentiel'), en: '/training/in-person' },
  '/formation/abonnement': { ...fr('/formation/abonnement'), en: '/training/pass' },

  '/certificats/verifier': { ...fr('/certificats/verifier'), en: '/certificates/verify' },
  '/certificats/[code]': { ...fr('/certificats/[code]'), en: '/certificates/[code]' },

  '/audit-conformite': { ...fr('/audit-conformite'), en: '/compliance-audit' },
  '/audit-conformite/[slug]': {
    ...fr('/audit-conformite/[slug]'),
    en: '/compliance-audit/[slug]',
  },
  '/conseil-accompagnement': { ...fr('/conseil-accompagnement'), en: '/advisory' },
  '/conseil-accompagnement/[slug]': {
    ...fr('/conseil-accompagnement/[slug]'),
    en: '/advisory/[slug]',
  },
  '/takaful-finance': { ...fr('/takaful-finance'), en: '/takaful-finance' },
  '/takaful-finance/[slug]': { ...fr('/takaful-finance/[slug]'), en: '/takaful-finance/[slug]' },
  // Index ajoutés hors SPEC §2 : `/cas-clients` et `/ressources/guides` (ADR 009).
  '/cas-clients': { ...fr('/cas-clients'), en: '/case-studies' },
  '/cas-clients/[slug]': { ...fr('/cas-clients/[slug]'), en: '/case-studies/[slug]' },

  '/ressources': { ...fr('/ressources'), en: '/resources' },
  '/ressources/articles': { ...fr('/ressources/articles'), en: '/resources/articles' },
  '/ressources/articles/[slug]': {
    ...fr('/ressources/articles/[slug]'),
    en: '/resources/articles/[slug]',
  },
  '/ressources/guides': { ...fr('/ressources/guides'), en: '/resources/guides' },
  '/ressources/guides/[slug]': {
    ...fr('/ressources/guides/[slug]'),
    en: '/resources/guides/[slug]',
  },
  '/ressources/glossaire': { ...fr('/ressources/glossaire'), en: '/resources/glossary' },
  '/ressources/glossaire/[term]': {
    ...fr('/ressources/glossaire/[term]'),
    en: '/resources/glossary/[term]',
  },
  '/ressources/webinaires': { ...fr('/ressources/webinaires'), en: '/resources/webinars' },

  '/contact': '/contact',
  '/devis': { ...fr('/devis'), en: '/quote' },
  '/rendez-vous': { ...fr('/rendez-vous'), en: '/appointment' },
  '/recherche': { ...fr('/recherche'), en: '/search' },
  // Confirmation du double opt-in de la newsletter (ADR 011).
  '/newsletter/confirmation': '/newsletter/confirmation',

  '/panier': { ...fr('/panier'), en: '/cart' },
  '/commande': { ...fr('/commande'), en: '/checkout' },
  '/commande/[id]/confirmation': {
    ...fr('/commande/[id]/confirmation'),
    en: '/checkout/[id]/confirmation',
  },

  '/connexion': { ...fr('/connexion'), en: '/sign-in' },
  '/inscription': { ...fr('/inscription'), en: '/sign-up' },
  '/mot-de-passe': { ...fr('/mot-de-passe'), en: '/password' },

  '/espace': { ...fr('/espace'), en: '/account' },
  '/espace/cours/[slug]/[lesson]': {
    ...fr('/espace/cours/[slug]/[lesson]'),
    en: '/account/courses/[slug]/[lesson]',
  },
  '/organisation': { ...fr('/organisation'), en: '/organization' },

  '/legal/[slug]': '/legal/[slug]',
  '/styleguide': '/styleguide',
} as const

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Préfixe toujours présent : URLs explicites, hreflang simple, `/` redirige vers `/fr`.
  localePrefix: 'always',
  // Le français est servi par défaut ; pas de redirection selon Accept-Language
  // tant que `en` et `ar` ne sont pas ouverts au public (TODO(client) : question 14 du PLAN).
  localeDetection: false,
  pathnames,
})

export type AppPathname = keyof typeof pathnames
