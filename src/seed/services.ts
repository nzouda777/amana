/**
 * Pages de service (gabarit commun DESIGN §9) : Audit et conformité, Conseil et
 * accompagnement, Takaful et finance. Textes de démonstration.
 * TODO(client) : valider le périmètre exact de chaque offre et les textes définitifs.
 */
import type { Service } from '@/payload-types'

import { type Block, ol, rt, ul } from './lib/richtext'
import { type IdMap, type Seeder, upsert } from './lib/upsert'

type Pillar = Service['pillar']
type LeadType = NonNullable<NonNullable<Service['cta']>['leadType']>

export type ServiceSeed = {
  slug: string
  pillar: Pillar
  title: string
  /** Libellé court pour le méga-menu. */
  navLabel: string
  summary: string
  problem: Array<Block | string>
  offer: Array<Block | string>
  method: Array<[title: string, description: string]>
  deliverables: string[]
  faq: Array<[question: string, answer: string]>
  cta: { label: string; leadType: LeadType }
  seo: { title: string; description: string }
}

/** Route publique (française) d'un service selon son pôle. */
export const pillarPath: Record<Pillar, string> = {
  audit: '/audit-conformite',
  conseil: '/conseil-accompagnement',
  takaful: '/takaful-finance',
  formation: '/formation',
}

export const servicePath = (service: Pick<ServiceSeed, 'pillar' | 'slug'>): string =>
  `${pillarPath[service.pillar]}/${service.slug}`

const auditCta = { label: "Demander un devis d'audit", leadType: 'audit' } as const
const conseilCta = { label: 'Demander un devis', leadType: 'conseil' } as const
const accompagnementCta = { label: 'Prendre rendez-vous', leadType: 'accompagnement' } as const
const takafulCta = { label: 'Être rappelé par un conseiller', leadType: 'takaful' } as const

export const servicesSeed: ServiceSeed[] = [
  // ——— Audit et conformité ———
  {
    slug: 'audit-conformite-charia',
    pillar: 'audit',
    title: 'Audit de conformité charia d’un établissement',
    navLabel: 'Audit de conformité charia',
    summary:
      'Un examen complet de vos produits, contrats et processus pour vérifier leur conformité aux principes de la finance islamique et aux normes de référence.',
    problem: [
      'Vous proposez des produits présentés comme conformes à la charia, mais personne n’a vérifié de façon indépendante que les contrats signés et les opérations réalisées respectent réellement ces principes.',
      'Un écart non détecté expose l’établissement à un risque de réputation, à la perte de confiance des clients et, de plus en plus, à des observations du régulateur.',
    ],
    offer: [
      'Nous auditons l’ensemble du cycle : documentation des produits, contrats types, dossiers clients, flux comptables et gouvernance. L’audit suit les normes de l’AAOIFI et le cadre réglementaire applicable en zone CEMAC.',
      ul(
        'revue des contrats et des fiches produits ;',
        'tests sur un échantillon de dossiers réels ;',
        'contrôle du traitement des revenus non conformes (purification) ;',
        'évaluation du fonctionnement du comité de conformité.',
      ),
    ],
    method: [
      [
        'Cadrage',
        'Nous définissons le périmètre, le calendrier et la liste des documents à fournir.',
      ],
      ['Revue documentaire', 'Nous analysons les contrats, politiques et procédures en vigueur.'],
      [
        'Tests sur dossiers',
        'Nous vérifions un échantillon d’opérations, de la signature à la comptabilisation.',
      ],
      ['Restitution', 'Nous présentons les constats, leur gravité et un plan d’action priorisé.'],
    ],
    deliverables: [
      'Rapport d’audit détaillé avec niveau de gravité de chaque constat',
      'Plan d’action priorisé et chiffré en jours-homme',
      'Note de synthèse pour le conseil d’administration',
      'Séance de restitution avec la direction',
    ],
    faq: [
      [
        'Combien de temps dure un audit de conformité charia ?',
        'Comptez quatre à huit semaines selon la taille de l’établissement et le nombre de produits. Le calendrier est fixé lors du cadrage.',
      ],
      [
        'L’audit remplace-t-il le comité de conformité de l’établissement ?',
        'Non. L’audit est une vérification indépendante. Il éclaire le comité et la direction ; il ne se substitue pas à leurs responsabilités.',
      ],
      [
        'Sur quelles normes vous appuyez-vous ?',
        'Sur les normes charia et de gouvernance de l’AAOIFI, les principes de l’IFSB et la réglementation applicable dans la zone CEMAC.',
      ],
    ],
    cta: auditCta,
    seo: {
      title: 'Audit de conformité charia | Amana Conseil',
      description:
        'Audit indépendant de vos produits, contrats et processus selon les normes AAOIFI et la réglementation CEMAC. Rapport, plan d’action, restitution.',
    },
  },
  {
    slug: 'audit-produits-financiers',
    pillar: 'audit',
    title: 'Revue de conformité d’un produit financier',
    navLabel: 'Revue de produit',
    summary:
      'Avant le lancement ou lors d’une refonte, nous vérifions qu’un produit précis (financement, épargne, investissement) respecte les principes de la finance islamique.',
    problem: [
      'Un nouveau produit est prêt à être commercialisé, mais sa structure contractuelle contient peut-être un intérêt déguisé, une incertitude excessive ou un ordre des opérations incorrect.',
      'Corriger un produit après son lancement coûte plus cher que de le vérifier avant.',
    ],
    offer: [
      'Nous examinons la fiche produit, le schéma des flux, les contrats et les documents remis au client. Nous vérifions notamment l’ordre des étapes (achat avant revente dans une mourabaha, par exemple) et le traitement des retards de paiement.',
    ],
    method: [
      ['Analyse du schéma', 'Nous reconstituons le parcours du produit et les flux financiers.'],
      ['Revue contractuelle', 'Nous lisons chaque clause au regard des principes applicables.'],
      [
        'Recommandations',
        'Nous proposons des corrections concrètes et des formulations alternatives.',
      ],
      ['Avis final', 'Nous émettons un avis de conformité motivé, soumis à votre comité.'],
    ],
    deliverables: [
      'Note d’analyse du produit',
      'Contrats annotés avec propositions de rédaction',
      'Avis de conformité motivé',
    ],
    faq: [
      [
        'Pouvez-vous revoir un produit déjà commercialisé ?',
        'Oui. Nous proposons alors un plan de mise en conformité qui tient compte des contrats déjà signés.',
      ],
      [
        'L’avis de conformité est-il une fatwa ?',
        'Non. C’est un avis technique sur un produit donné, fondé sur des normes publiées. Il ne constitue ni une fatwa ni un conseil personnalisé.',
      ],
    ],
    cta: auditCta,
    seo: {
      title: 'Revue de conformité d’un produit financier islamique',
      description:
        'Vérifiez un produit de financement, d’épargne ou d’investissement avant son lancement : schéma, contrats, avis de conformité motivé.',
    },
  },
  {
    slug: 'audit-fenetre-islamique',
    pillar: 'audit',
    title: 'Audit d’une fenêtre islamique',
    navLabel: 'Audit de fenêtre islamique',
    summary:
      'Nous vérifions que votre fenêtre islamique est réellement séparée de l’activité conventionnelle : fonds, comptabilité, systèmes et équipes.',
    problem: [
      'Une fenêtre islamique n’est crédible que si les fonds collectés ne se mélangent pas avec ceux de l’activité conventionnelle. Dans la pratique, les systèmes d’information et la trésorerie sont souvent partagés.',
    ],
    offer: [
      'Nous contrôlons la séparation des fonds et des comptes, l’affectation des charges, la gestion de la liquidité et la conformité des produits de la fenêtre.',
      ul(
        'cartographie des flux entre la fenêtre et la maison mère ;',
        'revue du paramétrage du système d’information ;',
        'contrôle de la gestion de trésorerie et des placements ;',
        'revue des produits commercialisés par la fenêtre.',
      ),
    ],
    method: [
      [
        'Cartographie',
        'Nous identifions tous les flux entre la fenêtre et le reste de l’établissement.',
      ],
      ['Contrôles', 'Nous testons la séparation comptable et la gestion de la liquidité.'],
      ['Entretiens', 'Nous rencontrons les équipes commerciales, comptables et informatiques.'],
      ['Rapport', 'Nous restituons les écarts et les mesures correctives.'],
    ],
    deliverables: [
      'Cartographie des flux',
      'Rapport d’audit et plan d’action',
      'Recommandations de paramétrage du système d’information',
    ],
    faq: [
      [
        'Notre fenêtre vient d’ouvrir. Est-ce trop tôt pour un audit ?',
        'Un premier audit six à douze mois après l’ouverture permet de corriger les écarts avant qu’ils ne s’installent.',
      ],
      [
        'Intervenez-vous dans toute la zone CEMAC ?',
        'Oui, depuis Douala, au Cameroun et dans les autres pays de la zone. TODO(client) : confirmer la zone d’intervention.',
      ],
    ],
    cta: auditCta,
    seo: {
      title: 'Audit de fenêtre islamique | Amana Conseil',
      description:
        'Contrôle de la séparation des fonds, de la comptabilité et des systèmes de votre fenêtre islamique. Rapport et plan d’action.',
    },
  },
  {
    slug: 'audit-takaful',
    pillar: 'audit',
    title: 'Audit d’un opérateur takaful',
    navLabel: 'Audit takaful',
    summary:
      'Un audit dédié aux opérateurs takaful et aux fenêtres takaful des assureurs : fonds des participants, rémunération de l’opérateur, gestion des excédents.',
    problem: [
      'Le takaful repose sur une séparation stricte entre le fonds des participants et celui de l’opérateur. Une erreur dans la répartition des excédents ou dans le calcul de la rémunération remet en cause tout le modèle.',
    ],
    offer: [
      'Nous vérifions la structure des fonds, les contrats de wakala ou de moudaraba, la politique de répartition des excédents, le prêt de l’opérateur au fonds en cas de déficit (qard hassan) et les placements.',
    ],
    method: [
      ['Revue du modèle', 'Nous analysons le modèle choisi et sa documentation.'],
      [
        'Contrôle des fonds',
        'Nous testons la séparation et l’affectation des charges et produits.',
      ],
      ['Placements', 'Nous vérifions la conformité des actifs détenus par les fonds.'],
      ['Restitution', 'Nous présentons nos constats à la direction et au comité.'],
    ],
    deliverables: [
      'Rapport d’audit takaful',
      'Revue de la politique de répartition des excédents',
      'Plan d’action',
    ],
    faq: [
      [
        'Auditez-vous aussi les produits de retakaful ?',
        'Oui, la revue peut inclure les traités de retakaful et leur conformité.',
      ],
    ],
    cta: auditCta,
    seo: {
      title: 'Audit d’un opérateur takaful | Amana Conseil',
      description:
        'Audit des fonds des participants, de la rémunération de l’opérateur et de la gestion des excédents d’un opérateur takaful.',
    },
  },

  // ——— Conseil et accompagnement ———
  {
    slug: 'structuration-produits',
    pillar: 'conseil',
    title: 'Structuration de produits financiers islamiques',
    navLabel: 'Structuration de produits',
    summary:
      'Nous concevons avec vos équipes des produits de financement, d’épargne ou d’investissement conformes, adaptés à votre marché et à vos systèmes.',
    problem: [
      'Copier un produit conçu pour un autre marché fonctionne rarement : la fiscalité, le droit OHADA et les habitudes des clients diffèrent. Il faut un produit pensé pour votre contexte.',
    ],
    offer: [
      'Nous partons de votre besoin commercial pour choisir le contrat adapté (mourabaha, ijara, moucharaka, moudaraba, salam, istisna) et construire un produit complet.',
      ul(
        'choix et justification de la structure contractuelle ;',
        'schéma des flux et des écritures comptables ;',
        'rédaction des contrats types et de la fiche produit ;',
        'préparation du dossier pour le comité de conformité.',
      ),
    ],
    method: [
      ['Besoin', 'Nous analysons la cible, le marché et les contraintes de vos systèmes.'],
      ['Conception', 'Nous proposons une ou deux structures et en comparons les effets.'],
      ['Documentation', 'Nous rédigeons les contrats, la fiche produit et les procédures.'],
      ['Validation', 'Nous présentons le produit à votre comité et intégrons ses remarques.'],
    ],
    deliverables: [
      'Fiche produit complète',
      'Contrats types',
      'Schéma des flux et des écritures',
      'Dossier de présentation au comité de conformité',
    ],
    faq: [
      [
        'Pouvez-vous adapter un produit conventionnel existant ?',
        'Oui, quand c’est possible. Certains produits doivent être repensés entièrement : nous vous le disons dès l’analyse du besoin.',
      ],
      [
        'Qui valide la conformité du produit final ?',
        'Votre comité de conformité charia. Nous préparons le dossier et répondons à ses questions.',
      ],
    ],
    cta: conseilCta,
    seo: {
      title: 'Structuration de produits financiers islamiques',
      description:
        'Conception de produits de financement, d’épargne et d’investissement conformes : structure, contrats, flux, dossier pour le comité.',
    },
  },
  {
    slug: 'fenetre-islamique',
    pillar: 'conseil',
    title: 'Mise en place d’une fenêtre islamique',
    navLabel: 'Fenêtre islamique',
    summary:
      'Nous accompagnons les banques et les établissements de microfinance dans l’ouverture d’une fenêtre islamique, de l’étude d’opportunité au lancement.',
    problem: [
      'Ouvrir une fenêtre islamique touche à tout l’établissement : agrément, gouvernance, systèmes, comptabilité, formation des équipes et communication. Sans feuille de route, le projet s’enlise.',
    ],
    offer: [
      'Nous pilotons ou appuyons le projet à chaque étape.',
      ol(
        'étude d’opportunité et de marché ;',
        'dossier réglementaire et dialogue avec le régulateur ;',
        'gouvernance : comité de conformité, fonction de contrôle ;',
        'gamme de produits de lancement ;',
        'séparation comptable et paramétrage des systèmes ;',
        'formation des équipes et lancement commercial.',
      ),
    ],
    method: [
      ['Diagnostic', 'Nous évaluons votre organisation et votre marché.'],
      ['Feuille de route', 'Nous établissons un plan de projet daté et chiffré.'],
      ['Mise en œuvre', 'Nous produisons les livrables et coordonnons les équipes.'],
      ['Lancement', 'Nous formons les équipes et suivons les premiers mois d’activité.'],
    ],
    deliverables: [
      'Étude d’opportunité',
      'Feuille de route du projet',
      'Dossier réglementaire',
      'Gamme de produits de lancement documentée',
      'Programme de formation des équipes',
    ],
    faq: [
      [
        'Combien de temps faut-il pour ouvrir une fenêtre islamique ?',
        'En général entre neuf et dix-huit mois, selon le délai d’agrément et l’état de vos systèmes. TODO(client) : confirmer les délais observés.',
      ],
      [
        'Faut-il recruter une équipe dédiée ?',
        'Un noyau dédié est recommandé, notamment pour la conformité. Le reste des équipes peut être formé.',
      ],
    ],
    cta: conseilCta,
    seo: {
      title: 'Ouvrir une fenêtre islamique | Amana Conseil',
      description:
        'Accompagnement des banques et EMF en zone CEMAC : opportunité, dossier réglementaire, gouvernance, produits, systèmes et formation.',
    },
  },
  {
    slug: 'politiques-procedures',
    pillar: 'conseil',
    title: 'Politiques et procédures de conformité',
    navLabel: 'Politiques et procédures',
    summary:
      'Nous rédigeons ou mettons à jour les politiques et procédures qui encadrent votre activité de finance islamique.',
    problem: [
      'Sans procédures écrites, la conformité dépend de quelques personnes. Le régulateur et les auditeurs attendent des règles formalisées, connues des équipes et appliquées.',
    ],
    offer: [
      'Nous produisons un corpus documentaire adapté à votre taille.',
      ul(
        'politique de conformité charia ;',
        'procédure de validation des nouveaux produits ;',
        'procédure de purification des revenus non conformes ;',
        'charte du comité de conformité ;',
        'procédures opérationnelles par produit.',
      ),
    ],
    method: [
      ['Inventaire', 'Nous recensons les documents existants et les pratiques réelles.'],
      ['Rédaction', 'Nous rédigeons des textes courts, applicables et cohérents entre eux.'],
      ['Relecture', 'Nous ajustons les textes avec vos équipes et votre comité.'],
      ['Diffusion', 'Nous formons les équipes concernées.'],
    ],
    deliverables: [
      'Politiques et procédures rédigées',
      'Tableau de correspondance avec les normes de référence',
      'Support de formation des équipes',
    ],
    faq: [
      [
        'Travaillez-vous à partir de nos documents existants ?',
        'Oui. Nous partons de vos textes et de vos pratiques ; nous ne livrons pas de modèles génériques.',
      ],
    ],
    cta: conseilCta,
    seo: {
      title: 'Politiques et procédures de conformité charia',
      description:
        'Rédaction et mise à jour de vos politiques et procédures : conformité charia, nouveaux produits, purification, charte du comité.',
    },
  },
  {
    slug: 'creation-activite',
    pillar: 'conseil',
    title: 'Création d’une activité de finance islamique',
    navLabel: 'Création d’activité',
    summary:
      'Porteurs de projet, coopératives, établissements de microfinance : nous vous aidons à créer une activité de finance islamique viable et conforme.',
    problem: [
      'Créer une structure de financement ou d’épargne conforme demande de concilier modèle économique, statut juridique, agrément et exigences de la charia. Les erreurs de départ sont difficiles à corriger.',
    ],
    offer: [
      'Nous vous accompagnons de l’idée au démarrage : choix du statut, modèle économique, gamme de produits, gouvernance et dossier d’agrément.',
    ],
    method: [
      ['Entretien de découverte', 'Nous comprenons votre projet, votre public et vos moyens.'],
      ['Étude de faisabilité', 'Nous testons le modèle économique et le cadre juridique.'],
      ['Construction', 'Nous préparons les statuts, les produits et la gouvernance.'],
      ['Démarrage', 'Nous restons à vos côtés pendant les premiers mois.'],
    ],
    deliverables: [
      'Étude de faisabilité',
      'Plan d’affaires',
      'Gamme de produits de démarrage',
      'Dossier d’agrément',
    ],
    faq: [
      [
        'Accompagnez-vous des projets de petite taille ?',
        'Oui. Nous adaptons l’accompagnement au projet, avec des formats courts pour les porteurs de projet.',
      ],
    ],
    cta: accompagnementCta,
    seo: {
      title: 'Créer une activité de finance islamique',
      description:
        'Accompagnement des porteurs de projet, coopératives et EMF : faisabilité, statut, produits, gouvernance et dossier d’agrément.',
    },
  },
  {
    slug: 'comite-conformite',
    pillar: 'conseil',
    title: 'Constitution et animation d’un comité de conformité charia',
    navLabel: 'Comité de conformité',
    summary:
      'Nous aidons les établissements à constituer leur comité de conformité charia, à en rédiger la charte et à en organiser le fonctionnement.',
    problem: [
      'Le comité de conformité est la pièce maîtresse de la gouvernance d’une activité islamique. Trouver des membres qualifiés et indépendants, puis organiser leur travail, prend du temps.',
    ],
    offer: [
      ul(
        'définition du profil des membres et appui à leur sélection ;',
        'rédaction de la charte et du règlement intérieur ;',
        'secrétariat technique : ordres du jour, dossiers, procès-verbaux ;',
        'suivi des décisions et des recommandations.',
      ),
    ],
    method: [
      ['Cadrage', 'Nous définissons le rôle et la composition du comité.'],
      ['Constitution', 'Nous appuyons la sélection et la nomination des membres.'],
      ['Organisation', 'Nous rédigeons la charte et préparons les premières séances.'],
      ['Secrétariat', 'Nous assurons, si vous le souhaitez, le secrétariat technique.'],
    ],
    deliverables: [
      'Charte du comité',
      'Règlement intérieur',
      'Modèles de dossiers de séance et de procès-verbaux',
    ],
    faq: [
      [
        'Les membres du comité d’Amana Conseil peuvent-ils siéger dans notre comité ?',
        'Non, afin de préserver l’indépendance de nos missions d’audit. Nous vous aidons à identifier des profils adaptés.',
      ],
    ],
    cta: accompagnementCta,
    seo: {
      title: 'Comité de conformité charia : constitution',
      description:
        'Constitution et organisation de votre comité de conformité charia : profils, charte, règlement intérieur, secrétariat technique.',
    },
  },
  {
    slug: 'suivi-conformite',
    pillar: 'conseil',
    title: 'Suivi de conformité et accompagnement continu',
    navLabel: 'Suivi de conformité',
    summary:
      'Un accompagnement dans la durée : revues périodiques, veille réglementaire et réponse à vos questions opérationnelles.',
    problem: [
      'La conformité n’est pas acquise une fois pour toutes. Nouveaux produits, rotation des équipes et évolutions réglementaires créent de nouveaux risques chaque année.',
    ],
    offer: [
      'Nous proposons un abonnement annuel de suivi.',
      ul(
        'revue trimestrielle d’un échantillon d’opérations ;',
        'note de veille réglementaire ;',
        'réponses écrites à vos questions opérationnelles ;',
        'session annuelle de formation de rappel.',
      ),
    ],
    method: [
      ['Plan annuel', 'Nous fixons ensemble les thèmes et le calendrier des revues.'],
      ['Revues', 'Nous réalisons les contrôles prévus et vous adressons nos constats.'],
      ['Échanges', 'Nous répondons à vos questions dans un délai convenu.'],
      ['Bilan', 'Nous dressons le bilan de l’année et ajustons le plan suivant.'],
    ],
    deliverables: [
      'Rapports de revue trimestriels',
      'Notes de veille réglementaire',
      'Bilan annuel',
    ],
    faq: [
      [
        'Quel est le délai de réponse à nos questions ?',
        'Il est fixé dans le contrat, en général cinq jours ouvrés. TODO(client) : confirmer le délai.',
      ],
    ],
    cta: accompagnementCta,
    seo: {
      title: 'Suivi de conformité charia | Amana Conseil',
      description:
        'Accompagnement continu : revues périodiques, veille réglementaire CEMAC, réponses à vos questions et formation de rappel.',
    },
  },

  // ——— Takaful et finance ———
  {
    slug: 'conception-produits-takaful',
    pillar: 'takaful',
    title: 'Conception de produits takaful',
    navLabel: 'Produits takaful',
    summary:
      'Nous accompagnons les assureurs dans la conception de produits takaful : choix du modèle, documentation, tarification et gouvernance.',
    problem: [
      'Un produit takaful n’est pas un contrat d’assurance renommé. Il suppose un fonds des participants distinct, une rémunération de l’opérateur transparente et une règle claire de partage des excédents.',
    ],
    offer: [
      ul(
        'choix du modèle (wakala, moudaraba ou mixte) ;',
        'règles de fonctionnement du fonds des participants ;',
        'documentation contractuelle et conditions générales ;',
        'appui à la tarification avec vos actuaires ;',
        'préparation du dossier pour le comité de conformité.',
      ),
    ],
    method: [
      ['Analyse', 'Nous étudions votre portefeuille, votre marché et votre réglementation.'],
      ['Modèle', 'Nous recommandons un modèle et en simulons les effets.'],
      ['Documentation', 'Nous rédigeons les documents contractuels.'],
      ['Validation', 'Nous accompagnons la validation interne et réglementaire.'],
    ],
    deliverables: [
      'Note de choix du modèle',
      'Règlement du fonds des participants',
      'Conditions générales et particulières',
      'Dossier pour le comité de conformité',
    ],
    faq: [
      [
        'Amana Conseil vend-il des contrats takaful ?',
        'Non. Le cabinet conseille et forme ; il n’est pas assureur. TODO(client) : confirmer l’absence d’activité d’intermédiation.',
      ],
      [
        'Quelle différence entre takaful et assurance conventionnelle ?',
        'Dans le takaful, les participants s’entraident au moyen d’un fonds commun ; l’opérateur gère ce fonds contre une rémunération définie à l’avance.',
      ],
    ],
    cta: takafulCta,
    seo: {
      title: 'Conception de produits takaful | Amana Conseil',
      description:
        'Accompagnement des assureurs : modèle wakala ou moudaraba, fonds des participants, documentation, tarification et gouvernance.',
    },
  },
  {
    slug: 'takaful-entreprises',
    pillar: 'takaful',
    title: 'Takaful pour les entreprises et les institutions',
    navLabel: 'Takaful pour les entreprises',
    summary:
      'Vous souhaitez couvrir vos salariés ou vos biens avec une solution conforme ? Nous analysons vos besoins et vous aidons à comparer les offres disponibles.',
    problem: [
      'Les entreprises et les institutions qui souhaitent une couverture conforme manquent souvent de repères pour évaluer les offres takaful disponibles sur leur marché.',
    ],
    offer: [
      'Nous analysons vos besoins de couverture, établissons un cahier des charges et vous aidons à comparer les réponses des opérateurs, en toute indépendance.',
    ],
    method: [
      ['Besoins', 'Nous recensons les risques à couvrir et vos contraintes.'],
      ['Cahier des charges', 'Nous rédigeons un cahier des charges conforme et clair.'],
      ['Comparaison', 'Nous analysons les offres reçues sur le fond et la conformité.'],
      ['Décision', 'Nous vous remettons une recommandation argumentée.'],
    ],
    deliverables: ['Analyse des besoins', 'Cahier des charges', 'Grille comparative des offres'],
    faq: [
      [
        'Êtes-vous rémunérés par les opérateurs takaful ?',
        'Non. Nos honoraires sont payés par le client, ce qui garantit l’indépendance de la recommandation. TODO(client) : confirmer.',
      ],
    ],
    cta: takafulCta,
    seo: {
      title: 'Takaful pour les entreprises | Amana Conseil',
      description:
        'Analyse de vos besoins de couverture, cahier des charges et comparaison indépendante des offres takaful disponibles.',
    },
  },
  {
    slug: 'financement-islamique-pme',
    pillar: 'takaful',
    title: 'Solutions de financement islamique pour les PME',
    navLabel: 'Financement des PME',
    summary:
      'Nous aidons les PME à comprendre les solutions de financement conformes et à préparer un dossier solide auprès des établissements qui les proposent.',
    problem: [
      'De nombreuses PME renoncent à se financer parce qu’elles refusent l’intérêt, sans savoir quelles alternatives existent ni comment présenter leur projet.',
    ],
    offer: [
      'Nous identifions le contrat le plus adapté à votre besoin (mourabaha pour un équipement, ijara pour un véhicule, moucharaka pour un projet de croissance) et préparons votre dossier.',
    ],
    method: [
      ['Diagnostic', 'Nous analysons votre besoin et votre situation financière.'],
      ['Orientation', 'Nous vous présentons les solutions adaptées et leurs implications.'],
      ['Dossier', 'Nous préparons le dossier de financement avec vous.'],
      [
        'Mise en relation',
        'Nous vous orientons vers les établissements qui proposent ces solutions.',
      ],
    ],
    deliverables: [
      'Diagnostic de financement',
      'Dossier de demande de financement',
      'Liste des établissements à contacter',
    ],
    faq: [
      [
        'Amana Conseil prête-t-il de l’argent ?',
        'Non. Le cabinet ne finance pas : il vous aide à préparer votre demande auprès des établissements qui proposent ces solutions.',
      ],
    ],
    cta: accompagnementCta,
    seo: {
      title: 'Financement islamique des PME | Amana Conseil',
      description:
        'Mourabaha, ijara, moucharaka : choisissez la solution de financement conforme adaptée à votre PME et préparez votre dossier.',
    },
  },
]

/** FAQ générales (page Contact, À propos, Ressources). */
const generalFaqs: Array<{ topic: 'general' | 'formation' | 'commerce'; q: string; a: string }> = [
  {
    topic: 'general',
    q: 'Amana Conseil délivre-t-il des fatwas ?',
    a: 'Non. Le cabinet informe, forme et conseille les organisations sur la conformité de leurs produits et processus. Il ne délivre ni fatwa ni conseil financier personnalisé aux particuliers.',
  },
  {
    topic: 'general',
    q: 'Où intervenez-vous ?',
    a: 'Le cabinet est basé à Douala. Il intervient au Cameroun et dans la zone CEMAC, sur site ou à distance. TODO(client) : confirmer la zone d’intervention.',
  },
  {
    topic: 'general',
    q: 'Comment se déroule un premier échange ?',
    a: 'Un rendez-vous de découverte de trente minutes, gratuit et sans engagement, nous permet de comprendre votre besoin et de vous proposer une démarche.',
  },
  {
    topic: 'formation',
    q: 'Les formations délivrent-elles un certificat ?',
    a: 'Oui. Un certificat vérifiable en ligne est délivré lorsque toutes les leçons sont terminées et les quiz requis réussis.',
  },
  {
    topic: 'formation',
    q: 'Faut-il des connaissances préalables pour suivre un cours ?',
    a: 'Les cours de niveau débutant ne demandent aucun prérequis. Les prérequis éventuels sont indiqués sur chaque fiche de cours.',
  },
  {
    topic: 'commerce',
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Mobile Money (MTN et Orange), carte bancaire et virement. Les entreprises peuvent payer sur facture. Le paiement en plusieurs fois, s’il est proposé, est toujours sans frais.',
  },
]

async function upsertFaq(
  seeder: Seeder,
  topic: 'general' | 'formation' | 'audit' | 'conseil' | 'takaful' | 'commerce',
  question: string,
  answer: string,
  order: number,
): Promise<number> {
  const doc = await upsert(
    seeder,
    'faqs',
    { field: 'question', value: question },
    { question, answer: rt(answer), topic, order },
  )
  return doc.id
}

export async function seedGeneralFaqs(seeder: Seeder): Promise<number[]> {
  const ids: number[] = []
  for (const [index, faq] of generalFaqs.entries())
    ids.push(await upsertFaq(seeder, faq.topic, faq.q, faq.a, index + 1))
  return ids
}

export async function seedServices(seeder: Seeder): Promise<IdMap> {
  const ids: IdMap = new Map()
  let faqOrder = 100
  for (const [index, service] of servicesSeed.entries()) {
    const faqIds: number[] = []
    const topic = service.pillar === 'formation' ? 'formation' : service.pillar
    for (const [question, answer] of service.faq)
      faqIds.push(await upsertFaq(seeder, topic, question, answer, (faqOrder += 1)))

    const doc = await upsert(
      seeder,
      'services',
      { field: 'slug', value: service.slug },
      {
        title: service.title,
        slug: service.slug,
        pillar: service.pillar,
        order: index + 1,
        summary: service.summary,
        problem: rt(...service.problem),
        offer: rt(...service.offer),
        method: service.method.map(([title, description]) => ({ title, description })),
        deliverables: service.deliverables.map((label) => ({ label })),
        faq: faqIds,
        cta: service.cta,
        seo: service.seo,
        _status: 'published',
      },
    )
    ids.set(service.slug, doc.id)
  }
  return ids
}
