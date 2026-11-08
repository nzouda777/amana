/**
 * Témoignages, cas clients et partenaires — tous FICTIFS, signalés « démo ».
 * TODO(client) : remplacer par des références réelles avec accord écrit d'affichage
 * (`displayAuthorized`). Aucune vraie marque n'est citée.
 */
import { h3, rt, ul } from './lib/richtext'
import { type IdMap, idsOf, type Seeder, upsert } from './lib/upsert'

const testimonials = [
  {
    key: 'banque',
    authorName: 'Directrice de la conformité (démo)',
    authorRole: 'Banque commerciale, Douala (témoignage fictif)',
    organization: 'Établissement de démonstration',
    pillar: 'audit' as const,
    quote:
      'L’audit nous a donné une vision claire de nos écarts et un plan d’action réaliste. Les constats étaient précis et chaque recommandation était applicable.',
  },
  {
    key: 'microfinance',
    authorName: 'Directeur général (démo)',
    authorRole: 'Établissement de microfinance (témoignage fictif)',
    organization: 'Établissement de démonstration',
    pillar: 'conseil' as const,
    quote:
      'Nous avons ouvert notre fenêtre islamique avec une feuille de route tenue et des équipes formées dès le premier jour.',
  },
  {
    key: 'apprenant',
    authorName: 'Apprenante (démo)',
    authorRole: 'Analyste crédit (témoignage fictif)',
    organization: '',
    pillar: 'formation' as const,
    quote:
      'Les cours partent d’exemples concrets. J’ai enfin compris la différence entre une mourabaha et un prêt classique.',
  },
  {
    key: 'assureur',
    authorName: 'Responsable produits (démo)',
    authorRole: 'Compagnie d’assurance (témoignage fictif)',
    organization: 'Établissement de démonstration',
    pillar: 'takaful' as const,
    quote:
      'L’équipe nous a aidés à choisir un modèle takaful adapté à notre portefeuille et à documenter chaque règle de fonctionnement du fonds.',
  },
]

export async function seedTestimonials(seeder: Seeder): Promise<IdMap> {
  const ids: IdMap = new Map()
  for (const item of testimonials) {
    const doc = await upsert(
      seeder,
      'testimonials',
      { field: 'authorName', value: item.authorName },
      {
        authorName: item.authorName,
        authorRole: item.authorRole,
        organization: item.organization || null,
        pillar: item.pillar,
        quote: item.quote,
        // Visible pour la démonstration ; TODO(client) : décocher tant qu'aucun accord écrit.
        displayAuthorized: true,
      },
    )
    ids.set(item.key, doc.id)
  }
  return ids
}

export async function seedCaseStudies(
  seeder: Seeder,
  services: IdMap,
  testimonialIds: IdMap,
): Promise<IdMap> {
  const cases = [
    {
      slug: 'audit-conformite-banque-commerciale',
      title: 'Audit de conformité charia d’une banque commerciale',
      seoTitle: 'Cas client : audit charia d’une banque commerciale',
      clientName: 'Banque commerciale (cas fictif)',
      sector: 'Banque',
      pillar: 'audit' as const,
      services: ['audit-conformite-charia', 'politiques-procedures'],
      testimonial: 'banque',
      summary:
        'Une banque proposant des produits de financement conformes voulait vérifier leur conformité avant une inspection du régulateur.',
      challenge: [
        'La banque commercialisait trois produits de financement depuis deux ans sans revue indépendante. La direction souhaitait connaître ses écarts avant une inspection annoncée.',
      ],
      approach: [
        'Nous avons revu les contrats types, testé quarante dossiers et rencontré les équipes commerciales et comptables.',
        ul(
          'revue documentaire en deux semaines ;',
          'tests sur dossiers en agence ;',
          'restitution à la direction puis au conseil.',
        ),
      ],
      results: [
        'Onze constats, dont deux majeurs liés à l’ordre des opérations dans la mourabaha. Les deux écarts majeurs ont été corrigés avant l’inspection.',
      ],
      keyFigures: [
        { value: '40', label: 'dossiers testés' },
        { value: '6 semaines', label: 'de mission' },
        { value: '11', label: 'constats, dont 2 majeurs' },
      ],
    },
    {
      slug: 'ouverture-fenetre-islamique-microfinance',
      title: 'Ouverture d’une fenêtre islamique dans un établissement de microfinance',
      seoTitle: 'Cas client : fenêtre islamique en microfinance',
      clientName: 'Établissement de microfinance (cas fictif)',
      sector: 'Microfinance',
      pillar: 'conseil' as const,
      services: ['fenetre-islamique', 'comite-conformite'],
      testimonial: 'microfinance',
      summary:
        'Un établissement de microfinance souhaitait proposer une offre conforme à une clientèle de commerçants qui refusait le crédit à intérêt.',
      challenge: [
        'L’établissement perdait des clients commerçants qui refusaient le crédit à intérêt. Il ne disposait ni de produits adaptés ni de gouvernance charia.',
      ],
      approach: [
        h3('Une feuille de route en quatre étapes'),
        'Étude de marché auprès de 120 commerçants, conception de deux produits (mourabaha et ijara), constitution du comité de conformité, séparation comptable et formation de 25 agents.',
      ],
      results: [
        'La fenêtre a ouvert dans les délais. Les deux produits ont été validés par le comité de conformité avant leur lancement.',
      ],
      keyFigures: [
        { value: '12 mois', label: 'du diagnostic au lancement' },
        { value: '25', label: 'agents formés' },
        { value: '2', label: 'produits lancés' },
      ],
    },
    {
      slug: 'conception-produit-takaful-assureur',
      title: 'Conception d’un produit takaful pour un assureur',
      seoTitle: 'Cas client : produit takaful pour un assureur',
      clientName: 'Compagnie d’assurance (cas fictif)',
      sector: 'Assurance',
      pillar: 'takaful' as const,
      services: ['conception-produits-takaful'],
      testimonial: 'assureur',
      summary:
        'Un assureur voulait lancer une offre takaful santé pour les salariés d’entreprises clientes.',
      challenge: [
        'L’assureur disposait d’un produit santé conventionnel et souhaitait une version takaful sans dupliquer toute son organisation.',
      ],
      approach: [
        'Nous avons recommandé un modèle wakala, rédigé le règlement du fonds des participants et défini la règle de répartition des excédents avec les actuaires.',
      ],
      results: [
        'Le produit a été validé par le comité de conformité et présenté au régulateur. TODO(client) : remplacer par un cas réel.',
      ],
      keyFigures: [
        { value: 'Wakala', label: 'modèle retenu' },
        { value: '4 mois', label: 'de conception' },
      ],
    },
  ]

  const ids: IdMap = new Map()
  for (const [index, item] of cases.entries()) {
    const doc = await upsert(
      seeder,
      'case-studies',
      { field: 'slug', value: item.slug },
      {
        title: item.title,
        slug: item.slug,
        clientName: item.clientName,
        clientIsAnonymous: true,
        sector: item.sector,
        pillar: item.pillar,
        services: idsOf(services, item.services),
        summary: item.summary,
        challenge: rt(...item.challenge),
        approach: rt(...item.approach),
        results: rt(...item.results),
        keyFigures: item.keyFigures,
        testimonial: testimonialIds.get(item.testimonial) ?? null,
        publishedAt: new Date(Date.UTC(2026, 5 + index, 15)).toISOString(),
        seo: { title: item.seoTitle, description: item.summary },
        _status: 'published',
      },
    )
    ids.set(item.slug, doc.id)
  }
  return ids
}

export async function seedPartners(seeder: Seeder): Promise<IdMap> {
  const partners = [
    {
      name: 'Référence client A (démo)',
      kind: 'client' as const,
      description: 'Banque commerciale.',
    },
    {
      name: 'Référence client B (démo)',
      kind: 'client' as const,
      description: 'Établissement de microfinance.',
    },
    {
      name: 'Référence client C (démo)',
      kind: 'client' as const,
      description: 'Compagnie d’assurance.',
    },
    {
      name: 'Partenaire académique (démo)',
      kind: 'partner' as const,
      description: 'Université partenaire pour la formation.',
    },
    {
      name: 'Institution partenaire (démo)',
      kind: 'institution' as const,
      description: 'Association professionnelle.',
    },
  ]
  const ids: IdMap = new Map()
  for (const [index, partner] of partners.entries()) {
    const doc = await upsert(
      seeder,
      'partners',
      { field: 'name', value: partner.name },
      {
        ...partner,
        description: `${partner.description} TODO(client) : remplacer par une référence réelle.`,
        // Aucun accord d'affichage : ne pas montrer publiquement (le rendu doit filtrer).
        displayAuthorized: false,
        order: index + 1,
      },
    )
    ids.set(partner.name, doc.id)
  }
  return ids
}
