/**
 * Guides téléchargeables et webinaires de démonstration.
 * TODO(client) : fichiers PDF définitifs des guides, dates et liens réels des webinaires.
 */
import { ensurePlaceholderDocument } from './lib/documents'
import { h2, rt, ul } from './lib/richtext'
import { type IdMap, idsOf, type Seeder, upsert } from './lib/upsert'

type GuideSeed = {
  slug: string
  title: string
  summary: string
  description: Parameters<typeof rt>
  pageCount: number
  interests: Array<'formation' | 'audit' | 'takaful' | 'reglementaire'>
  askOrganization: boolean
  seo: { title: string; description: string }
}

export const guidesSeed: GuideSeed[] = [
  {
    slug: 'guide-fenetre-islamique',
    title: 'Guide pratique : ouvrir une fenêtre islamique en zone CEMAC',
    summary:
      'Les étapes, les acteurs et les listes de contrôle pour préparer l’ouverture d’une fenêtre islamique dans une banque ou un établissement de microfinance.',
    description: [
      'Ce guide s’adresse aux directions générales, aux responsables de la conformité et aux chefs de projet.',
      h2('Ce que vous y trouverez'),
      ul(
        'une feuille de route en cinq étapes ;',
        'les exigences de gouvernance et de séparation des fonds ;',
        'une liste de contrôle des systèmes d’information ;',
        'un modèle de plan de formation des équipes.',
      ),
    ],
    pageCount: 24,
    interests: ['audit', 'reglementaire'],
    askOrganization: true,
    seo: {
      title: 'Guide : ouvrir une fenêtre islamique (CEMAC)',
      description:
        'Téléchargez le guide pratique : étapes, gouvernance, séparation des fonds et listes de contrôle pour ouvrir une fenêtre islamique.',
    },
  },
  {
    slug: 'guide-bases-finance-islamique',
    title: 'Les bases de la finance islamique en 20 pages',
    summary:
      'Principes, contrats et vocabulaire essentiels pour comprendre la finance islamique, avec des exemples tirés du contexte camerounais.',
    description: [
      'Un guide d’introduction pour les étudiants, les professionnels et les épargnants curieux.',
      h2('Au sommaire'),
      ul(
        'les cinq principes fondamentaux ;',
        'mourabaha, ijara, moucharaka et moudaraba expliqués par l’exemple ;',
        'le takaful en une page ;',
        'un lexique des termes essentiels.',
      ),
    ],
    pageCount: 20,
    interests: ['formation', 'takaful'],
    askOrganization: false,
    seo: {
      title: 'Guide gratuit : les bases de la finance islamique',
      description:
        'Principes, contrats et vocabulaire essentiels de la finance islamique en 20 pages, avec des exemples concrets. Téléchargement gratuit.',
    },
  },
]

/** Fichier privé du guide (collection `documents`), créé une seule fois. */
function ensureGuideFile(seeder: Seeder, guide: GuideSeed): Promise<number> {
  return ensurePlaceholderDocument(seeder, {
    title: `${guide.title} (PDF provisoire)`,
    kind: 'guide',
    fileName: guide.slug,
    lines: [
      'Amana Conseil',
      'Document provisoire de demonstration',
      `Guide : ${guide.slug}`,
      'TODO(client) : remplacer par le guide definitif.',
    ],
  })
}

export async function seedGuides(seeder: Seeder): Promise<IdMap> {
  const ids: IdMap = new Map()
  for (const guide of guidesSeed) {
    const file = await ensureGuideFile(seeder, guide)
    const doc = await upsert(
      seeder,
      'guides',
      { field: 'slug', value: guide.slug },
      {
        title: guide.title,
        slug: guide.slug,
        summary: guide.summary,
        description: rt(...guide.description),
        file,
        pageCount: guide.pageCount,
        interests: guide.interests,
        capture: { askName: true, askOrganization: guide.askOrganization, askPhone: false },
        seo: guide.seo,
        _status: 'published',
      },
    )
    ids.set(guide.slug, doc.id)
  }
  return ids
}

export async function seedEvents(seeder: Seeder, team: IdMap): Promise<IdMap> {
  const events = [
    {
      slug: 'webinaire-takaful-entreprises',
      title: 'Webinaire : le takaful pour les entreprises, mode d’emploi',
      startsAt: '2026-12-10T17:00:00.000Z',
      endsAt: '2026-12-10T18:15:00.000Z',
      summary:
        'Une heure pour comprendre le fonctionnement du takaful et les questions à poser avant de choisir une couverture pour vos salariés.',
      description: [
        'Ce webinaire s’adresse aux directions des ressources humaines, aux directions financières et aux dirigeants de PME.',
        h2('Programme'),
        ul(
          'le principe d’entraide et la séparation des fonds ;',
          'les modèles wakala et moudaraba ;',
          'lire une offre takaful : les points de vigilance ;',
          'questions-réponses.',
        ),
      ],
      speakers: ['takaful', 'comite-membre-1'],
      capacity: 200,
      replayVideoId: null,
      seo: {
        title: 'Webinaire : le takaful pour les entreprises',
        description:
          'Webinaire gratuit d’une heure : fonctionnement du takaful, modèles wakala et moudaraba, et points de vigilance pour les entreprises.',
      },
    },
    {
      slug: 'webinaire-audit-charia-preparer',
      title: 'Webinaire : préparer son premier audit de conformité charia',
      startsAt: '2026-10-08T15:00:00.000Z',
      endsAt: '2026-10-08T16:00:00.000Z',
      summary:
        'Le déroulé d’un audit charia, les constats les plus fréquents et la façon de s’y préparer. Replay disponible.',
      description: [
        'Webinaire destiné aux responsables de la conformité, aux auditeurs internes et aux directions des établissements proposant des produits conformes.',
        h2('Au programme'),
        ul(
          'les étapes d’un audit ;',
          'les cinq constats les plus fréquents ;',
          'la préparation des documents.',
        ),
      ],
      speakers: ['direction', 'audit'],
      capacity: 150,
      // TODO(client) : identifiant de la vidéo du replay sur Bunny Stream.
      replayVideoId: 'TODO-client-replay-id',
      seo: {
        title: 'Replay : préparer son premier audit charia',
        description:
          'Revoyez le webinaire : étapes d’un audit de conformité charia, constats les plus fréquents et préparation des documents.',
      },
    },
  ]

  const ids: IdMap = new Map()
  for (const event of events) {
    const doc = await upsert(
      seeder,
      'events',
      { field: 'slug', value: event.slug },
      {
        title: event.title,
        slug: event.slug,
        kind: 'webinar',
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        timezone: 'Africa/Douala',
        summary: event.summary,
        description: rt(...event.description),
        venue: 'En ligne',
        // TODO(client) : lien de connexion réel (communiqué aux inscrits uniquement).
        onlineUrl: 'https://example.com/TODO-client-lien-webinaire',
        capacity: event.capacity,
        speakers: idsOf(team, event.speakers),
        replayVideoId: event.replayVideoId,
        seo: event.seo,
        _status: 'published',
      },
    )
    ids.set(event.slug, doc.id)
  }
  return ids
}
