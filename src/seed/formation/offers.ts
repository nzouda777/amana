/**
 * Offres de démonstration : 2 parcours, 3 packs de capsules et les produits vendables
 * (un par cours, un par parcours, un par pack).
 *
 * Prix : placeholders en XAF entiers, ronds et visiblement démonstratifs.
 * TODO(client) : grille tarifaire définitive, taux de TVA (ADR 004), conditions des packs.
 * Garde-fous (CLAUDE.md) : aucun prix barré (pas de fausse remise), aucune durée limitée,
 * aucun paiement fractionné.
 */
import { h2, ul } from '../lib/richtext'
import type { RichSource } from './types'

/** Mention ajoutée à la description de chaque produit de démonstration. */
export const DEMO_PRICE_NOTICE = 'Prix de démonstration. TODO(client) : tarif définitif.'

/** Prix des cours, par slug de cours. */
export const coursePricesXaf: Record<string, number> = {
  'bases-finance-islamique': 25_000,
  'ethique-des-affaires': 25_000,
  'takaful-assurance-islamique': 30_000,
  'banque-participative': 45_000,
  'audit-conformite-charia': 60_000,
  'sukuk-marches-capitaux': 60_000,
}

export type PathSeed = {
  slug: string
  title: string
  summary: string
  description: RichSource
  /** Slugs des cours, dans l'ordre. */
  courses: string[]
  priceXaf: number
  seo: { title: string; description: string }
}

export const pathsSeed: PathSeed[] = [
  {
    slug: 'decouvrir-finance-islamique',
    title: 'Parcours : découvrir la finance islamique',
    summary:
      'Trois cours pour comprendre les principes, l’assurance takaful et l’éthique des affaires. Idéal pour débuter.',
    description: [
      'Ce parcours s’adresse aux étudiants, aux épargnants et aux professionnels qui découvrent la finance islamique.',
      h2('Les cours du parcours'),
      ul(
        'Les bases de la finance islamique ;',
        'Takaful : comprendre l’assurance islamique ;',
        'Éthique des affaires et finance islamique.',
      ),
      'Un certificat de parcours est délivré quand les trois cours sont terminés.',
    ],
    courses: ['bases-finance-islamique', 'takaful-assurance-islamique', 'ethique-des-affaires'],
    priceXaf: 65_000,
    seo: {
      title: 'Parcours en ligne : découvrir la finance islamique',
      description:
        'Trois cours en ligne pour débuter : principes de la finance islamique, takaful et éthique des affaires. Certificat de parcours.',
    },
  },
  {
    slug: 'conformite-bancaire',
    title: 'Parcours : conformité bancaire et audit charia',
    summary:
      'Des bases à l’audit : trois cours pour les professionnels de la banque, de la microfinance et de la conformité.',
    description: [
      'Ce parcours s’adresse aux collaborateurs des banques, des fenêtres islamiques et des établissements de microfinance, ainsi qu’aux auditeurs.',
      h2('Les cours du parcours'),
      ul(
        'Les bases de la finance islamique ;',
        'Banque participative : produits et fonctionnement ;',
        'Audit de conformité charia : méthode et pratique.',
      ),
      'Un certificat de parcours est délivré quand les trois cours sont terminés.',
    ],
    courses: ['bases-finance-islamique', 'banque-participative', 'audit-conformite-charia'],
    priceXaf: 105_000,
    seo: {
      title: 'Parcours : conformité bancaire et audit charia',
      description:
        'Trois cours en ligne, des bases de la finance islamique à l’audit charia, pour les professionnels de la banque et de la conformité.',
    },
  },
]

export type PackSeed = {
  slug: string
  title: string
  description: string
  /** Slugs des capsules incluses. */
  capsules: string[]
  priceXaf: number
}

export const packsSeed: PackSeed[] = [
  {
    slug: 'pack-essentiels-relation-client',
    title: 'Pack Essentiels de la relation client',
    description:
      'Quatre capsules pour les équipes au contact des clients : repérer le riba, expliquer une mourabaha et une ijara, présenter une offre takaful.',
    capsules: [
      'reperer-le-riba',
      'expliquer-mourabaha-client',
      'ijara-questions-clients',
      'presenter-offre-takaful',
    ],
    priceXaf: 200_000,
  },
  {
    slug: 'pack-conformite-controle',
    title: 'Pack Conformité et contrôle',
    description:
      'Quatre capsules pour les équipes de conformité et de contrôle : riba, gharar, signalement et purification des revenus.',
    capsules: [
      'reperer-le-riba',
      'gharar-clauses-contrat',
      'signaler-non-conformite',
      'purifier-revenus',
    ],
    priceXaf: 250_000,
  },
  {
    slug: 'pack-direction-gouvernance',
    title: 'Pack Direction et gouvernance',
    description:
      'Quatre capsules pour les dirigeants : comité de conformité, pilotage des risques, séparation des fonds et conflits d’intérêts.',
    capsules: [
      'gouvernance-comite-charia',
      'piloter-risques-fenetre',
      'separer-fonds-fenetre',
      'decider-conflit-interets',
    ],
    priceXaf: 250_000,
  },
]

/** Slug du produit d'un cours ou d'un parcours (les packs ont déjà leur slug). */
export const courseProductSlug = (courseSlug: string): string => `cours-${courseSlug}`
export const pathProductSlug = (pathSlug: string): string => `parcours-${pathSlug}`
