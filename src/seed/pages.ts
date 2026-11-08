/**
 * Pages composées de blocs : accueil, À propos, hub Formation (gabarits DESIGN §9).
 * TODO(client) : textes définitifs.
 */
import type { Page } from '@/payload-types'

import { h2, rt, ul } from './lib/richtext'
import { type IdMap, idsOf, type Seeder, upsert } from './lib/upsert'

type Layout = NonNullable<Page['layout']>

export type PageRefs = {
  services: IdMap
  testimonials: IdMap
  caseStudies: IdMap
  partners: IdMap
  guides: IdMap
  generalFaqs: number[]
  /** Cours semés par `formation/` (slug → id). */
  courses: IdMap
}

/** Cours à la une de l'accueil et du hub Formation (cours pour particuliers, pas de capsule). */
const featuredCourseSlugs = [
  'bases-finance-islamique',
  'takaful-assurance-islamique',
  'banque-participative',
]

function requireId(ids: IdMap, key: string): number {
  const id = ids.get(key)
  if (id === undefined) throw new Error(`Seed pages : référence introuvable « ${key} ».`)
  return id
}

async function upsertPage(
  seeder: Seeder,
  slug: string,
  title: string,
  layout: Layout,
  seo: { title: string; description: string },
): Promise<number> {
  const doc = await upsert(
    seeder,
    'pages',
    { field: 'slug', value: slug },
    { title, slug, layout, seo, _status: 'published' },
  )
  return doc.id
}

function homeLayout(refs: PageRefs): Layout {
  return [
    {
      blockType: 'hero',
      title: 'La finance islamique, maîtrisée et conforme.',
      lead: 'Amana Conseil forme les professionnels, audite les établissements et accompagne les projets de finance et d’assurance islamiques, depuis Douala.',
      cta: { label: 'Voir les formations', href: '/formation/cours' },
      secondaryCta: { label: 'Demander un audit', href: '/devis' },
    },
    {
      blockType: 'partners',
      title: 'Ils nous font confiance',
      items: [...refs.partners.values()],
    },
    {
      blockType: 'pillarIndex',
      title: 'Nos expertises',
      services: idsOf(refs.services, [
        'audit-conformite-charia',
        'audit-fenetre-islamique',
        'audit-produits-financiers',
        'fenetre-islamique',
        'structuration-produits',
        'comite-conformite',
        'conception-produits-takaful',
        'takaful-entreprises',
        'financement-islamique-pme',
      ]),
    },
    {
      blockType: 'featuredCourses',
      title: 'Cours à la une',
      courses: idsOf(refs.courses, featuredCourseSlugs),
    },
    // TODO(client) : bloc `stats` retiré tant que le client n'a pas fourni ses chiffres réels
    // (les valeurs de site-settings.keyFigures sont des valeurs de démonstration, qui ne doivent
    // pas s'afficher comme des faits). À rétablir ici, après les cours à la une, avec les
    // chiffres réels :
    // { blockType: 'stats', sentence: 'Depuis sa création, le cabinet a formé plus de
    //   {{professionnels-formes}} professionnels, mené {{missions}} missions d’audit et de
    //   conseil, et intervient dans {{pays}} pays de la zone CEMAC.' }
    {
      blockType: 'method',
      title: 'Notre méthode',
      intro:
        'La même démarche, de l’audit à la formation, pour des résultats que vos équipes s’approprient.',
      steps: [
        {
          title: 'Comprendre',
          description:
            'Votre activité, vos produits, vos contraintes réglementaires et vos objectifs.',
        },
        {
          title: 'Analyser',
          description:
            'Les écarts au regard des normes de référence, documents et pratiques à l’appui.',
        },
        {
          title: 'Recommander',
          description:
            'Des actions concrètes, priorisées par gravité, avec un plan de mise en œuvre.',
        },
        {
          title: 'Transmettre',
          description: 'Former vos équipes pour qu’elles soient autonomes au quotidien.',
        },
      ],
    },
    {
      blockType: 'testimonials',
      title: 'Ce qu’en disent nos clients',
      items: idsOf(refs.testimonials, ['banque']),
    },
    {
      blockType: 'recentResources',
      title: 'Ressources récentes',
      limit: 3,
      types: ['articles', 'guides', 'webinars'],
    },
    {
      blockType: 'ctaSection',
      title: 'Parlons de votre projet',
      text: 'Un premier échange de trente minutes, gratuit et sans engagement, pour comprendre votre besoin.',
      cta: { label: 'Prendre rendez-vous', href: '/rendez-vous' },
    },
  ]
}

function aboutLayout(refs: PageRefs): Layout {
  return [
    {
      blockType: 'hero',
      title: 'Un cabinet au service d’une finance éthique et conforme',
      lead: 'Amana Conseil accompagne les établissements financiers, les entreprises et les particuliers d’Afrique centrale dans la compréhension et la mise en œuvre de la finance islamique.',
      cta: { label: 'Prendre rendez-vous', href: '/rendez-vous' },
    },
    {
      blockType: 'richText',
      content: rt(
        h2('Notre histoire'),
        'Amana Conseil est né d’un constat : la demande de produits financiers conformes progresse au Cameroun et dans la zone CEMAC, mais les compétences pour les concevoir, les contrôler et les expliquer restent rares.',
        'Le cabinet réunit des spécialistes de la banque, de l’assurance, de l’audit et du droit des transactions. TODO(client) : date de création, fondateurs et étapes clés.',
        h2('Notre vision'),
        'Une finance au service de l’économie réelle, comprise par ceux qui la proposent comme par ceux qui l’utilisent.',
        h2('Nos valeurs'),
        ul(
          '**Éthique** : nous refusons les montages qui respectent la forme et contournent le fond.',
          '**Conformité** : nos avis reposent sur des normes publiées et une méthode documentée.',
          '**Innovation** : nous adaptons les solutions au contexte local et aux outils numériques.',
        ),
        h2('Le nom Amana'),
        'En arabe, _amana_ désigne le dépôt confié et la confiance qui l’accompagne. C’est l’exigence que nous nous fixons envers nos clients.',
      ),
    },
    {
      blockType: 'team',
      title: 'L’équipe',
      intro:
        'Des spécialistes de la banque, de l’assurance, de l’audit et du droit des transactions. TODO(client) : photos et biographies réelles.',
      group: 'team',
    },
    {
      blockType: 'team',
      title: 'Notre comité de conformité charia',
      intro:
        'Le comité valide la méthode d’audit du cabinet et les avis de conformité émis lors des missions. Ses membres sont indépendants des équipes commerciales. Il ne délivre pas de fatwa individuelle. TODO(client) : composition réelle et accord de publication de chaque membre.',
      group: 'committee',
    },
    {
      blockType: 'partners',
      title: 'Partenaires et références',
      items: [...refs.partners.values()],
    },
    { blockType: 'faq', title: 'Questions fréquentes', items: refs.generalFaqs.slice(0, 3) },
    {
      blockType: 'ctaSection',
      title: 'Travaillons ensemble',
      text: 'Parlez-nous de votre projet : audit, conseil, formation de vos équipes.',
      cta: { label: 'Demander un devis', href: '/devis' },
    },
  ]
}

function formationLayout(refs: PageRefs): Layout {
  return [
    {
      blockType: 'hero',
      title: 'Se former à la finance islamique',
      lead: 'Des cours en ligne pour les particuliers et des capsules courtes pour les équipes des entreprises, avec certificat vérifiable.',
      // TODO(M5) : « Découvrir l’offre entreprises » (/formation/entreprises) à la place du devis.
      cta: { label: 'Voir les cours', href: '/formation/cours' },
      secondaryCta: { label: 'Former vos équipes', href: '/devis?type=formation-entreprise' },
    },
    {
      blockType: 'richText',
      content: rt(
        h2('Deux offres, une même exigence'),
        ul(
          '**Particuliers** : des cours complets, à suivre à votre rythme sur mobile, avec quiz et certificat.',
          '**Entreprises** : des capsules de 3 à 10 minutes par métier, des licences par siège et un tableau de bord de suivi.',
        ),
        h2('Des certificats vérifiables'),
        'Chaque certificat porte un code unique et un QR code. Un employeur peut vérifier son authenticité en ligne.',
      ),
    },
    {
      blockType: 'featuredCourses',
      title: 'Cours à la une',
      courses: idsOf(refs.courses, featuredCourseSlugs),
    },
    {
      blockType: 'guideCta',
      guide: requireId(refs.guides, 'guide-bases-finance-islamique'),
      text: 'Pas encore prêt à suivre un cours ? Commencez par notre guide gratuit des bases de la finance islamique.',
    },
    {
      blockType: 'faq',
      title: 'Questions fréquentes',
      items: refs.generalFaqs.slice(3),
    },
    {
      blockType: 'ctaSection',
      title: 'Former vos équipes ?',
      text: 'Nous construisons avec vous un parcours adapté aux métiers de votre organisation.',
      cta: { label: 'Demander une démonstration', href: '/devis?type=formation-entreprise' },
    },
  ]
}

export async function seedPages(seeder: Seeder, refs: PageRefs): Promise<IdMap> {
  const ids: IdMap = new Map()
  ids.set(
    'accueil',
    await upsertPage(seeder, 'accueil', 'Accueil', homeLayout(refs), {
      title: 'Amana Conseil, finance islamique et takaful à Douala',
      description:
        'Formation, audit de conformité charia et conseil en finance islamique et takaful au Cameroun et en zone CEMAC.',
    }),
  )
  ids.set(
    'a-propos',
    await upsertPage(seeder, 'a-propos', 'À propos', aboutLayout(refs), {
      title: 'À propos du cabinet | Amana Conseil',
      description:
        'Histoire, vision, valeurs, équipe et comité de conformité charia d’Amana Conseil, cabinet de finance islamique basé à Douala.',
    }),
  )
  ids.set(
    'formation',
    await upsertPage(seeder, 'formation', 'Formation', formationLayout(refs), {
      title: 'Formation en finance islamique | Amana Conseil',
      description:
        'Cours en ligne avec certificat pour les particuliers, capsules métiers pour les entreprises : formez-vous à la finance islamique.',
    }),
  )
  return ids
}
