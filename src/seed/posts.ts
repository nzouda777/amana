/**
 * Articles de démonstration (Ressources). Contenu pédagogique, sans conseil personnalisé.
 * Les termes du glossaire sont liés automatiquement au rendu (première occurrence).
 * TODO(client) : relecture par l'équipe et le comité ; vérifier les références réglementaires.
 */
import { callout, h2, h3, ol, p, rt, type RichText, ul } from './lib/richtext'
import { type IdMap, idsOf, type Seeder, upsert } from './lib/upsert'

type PostSeed = {
  slug: string
  title: string
  excerpt: string
  categories: string[]
  authors: string[]
  publishedAt: string
  related: string[]
  seo: { title: string; description: string }
  content: RichText
}

export const postsSeed: PostSeed[] = [
  {
    slug: 'principes-finance-islamique',
    title: 'Finance islamique : les cinq principes à connaître avant de commencer',
    excerpt:
      'Interdiction de l’intérêt, de l’incertitude excessive et de la spéculation, adossement à l’économie réelle, partage des risques : les bases expliquées simplement.',
    categories: ['fondamentaux'],
    authors: ['ibrahim-abdoulaye'],
    publishedAt: '2026-06-03T08:00:00.000Z',
    related: [
      'contrats-mourabaha-ijara-moucharaka',
      'takaful-difference-assurance-conventionnelle',
    ],
    seo: {
      title: 'Finance islamique : les 5 principes essentiels',
      description:
        'Riba, gharar, maysir, actifs réels, partage des risques : les cinq principes de la finance islamique expliqués simplement.',
    },
    content: rt(
      'La finance islamique n’est pas une finance « sans profit ». Elle repose sur un ensemble de règles qui encadrent la manière de gagner de l’argent. Voici les cinq principes à connaître avant d’aller plus loin.',
      h2('1. Pas d’intérêt sur un prêt d’argent'),
      'Le riba, dont l’intérêt est la forme la plus connue, est interdit. L’argent n’est pas considéré comme une marchandise qui produit de l’argent par le simple passage du temps. Un établissement ne peut donc pas prêter 1 000 000 FCFA et exiger 1 100 000 FCFA en retour.',
      'Il peut en revanche **acheter un bien et le revendre avec une marge**, le louer, ou s’associer à un projet. Le gain rémunère alors un risque pris sur un actif ou une activité.',
      h2('2. Pas d’incertitude excessive'),
      'Le gharar désigne l’incertitude excessive sur un élément essentiel du contrat : l’objet vendu, son prix, sa date de livraison. Un contrat dont l’objet n’existe pas ou n’est pas défini est non conforme.',
      callout(
        'retenir',
        'Une incertitude mineure, inévitable dans la vie des affaires, est tolérée. C’est l’incertitude excessive qui pose problème.',
        'À retenir',
      ),
      h2('3. Pas de spéculation pure'),
      'Le maysir vise les opérations où le gain de l’un dépend uniquement de la perte de l’autre, comme un pari. En finance, cela concerne la spéculation sans activité économique sous-jacente.',
      h2('4. Des opérations adossées à l’économie réelle'),
      'Chaque financement doit correspondre à un bien ou à une activité identifiable : un équipement, un stock, un bâtiment, un projet. C’est ce lien avec l’économie réelle qui justifie le profit.',
      h2('5. Le partage des risques'),
      'Dans les contrats de partenariat comme la moucharaka et la moudaraba, le financeur partage les profits et les pertes. Ce principe rapproche le financeur de l’entrepreneur.',
      h3('Et les secteurs exclus ?'),
      'Au-delà des mécanismes, certains secteurs sont exclus : alcool, jeux de hasard, armement, entre autres. Un investissement conforme vérifie donc à la fois **comment** on gagne de l’argent et **dans quoi** on l’investit.',
      h2('Pour aller plus loin'),
      ul(
        'Consultez notre [glossaire](/ressources/glossaire) pour les termes clés.',
        'Suivez notre cours en ligne [Les bases de la finance islamique](/formation/cours/bases-finance-islamique) et téléchargez notre [guide des bases de la finance islamique](/ressources/guides/guide-bases-finance-islamique).',
      ),
      p(
        '_Cet article a une vocation pédagogique. Il ne constitue ni une fatwa ni un conseil financier personnalisé._',
      ),
    ),
  },
  {
    slug: 'contrats-mourabaha-ijara-moucharaka',
    title: 'Mourabaha, ijara, moucharaka : comment fonctionnent les contrats les plus utilisés',
    excerpt:
      'Vente avec marge, location, partenariat : trois contrats couvrent l’essentiel des financements islamiques. Fonctionnement, usages et points de vigilance.',
    categories: ['fondamentaux', 'banque-participative'],
    authors: ['ibrahim-abdoulaye'],
    publishedAt: '2026-06-24T08:00:00.000Z',
    related: ['principes-finance-islamique', 'audit-conformite-charia-etapes'],
    seo: {
      title: 'Mourabaha, ijara, moucharaka : le guide des contrats',
      description:
        'Fonctionnement, usages et points de vigilance des trois contrats de financement islamique les plus utilisés : mourabaha, ijara, moucharaka.',
    },
    content: rt(
      'La plupart des financements islamiques reposent sur trois contrats. Les connaître permet de comprendre l’offre d’une banque participative et de poser les bonnes questions.',
      h2('La mourabaha : acheter puis revendre avec une marge'),
      'Un commerçant a besoin d’un réfrigérateur professionnel. Avec une mourabaha, l’établissement achète le réfrigérateur, en devient propriétaire, puis le revend au commerçant avec une marge annoncée. Le commerçant paie en plusieurs échéances.',
      ol(
        'Le client exprime son besoin et s’engage à acheter.',
        'L’établissement achète le bien au fournisseur.',
        'L’établissement revend le bien au client, prix et marge connus.',
        'Le client paie selon l’échéancier convenu.',
      ),
      callout(
        'avertissement',
        'Le prix est fixé une fois pour toutes. Un retard de paiement ne peut pas augmenter la dette de l’établissement.',
        'Point de vigilance',
      ),
      h2('L’ijara : louer plutôt que prêter'),
      'Pour un véhicule ou un équipement, l’établissement peut acheter le bien et le louer au client. Il reste propriétaire et assume les risques liés à la propriété, comme une destruction sans faute du client.',
      'Avec l’ijara wa iqtina, un transfert de propriété est prévu en fin de contrat, par un acte distinct.',
      h2('La moucharaka : s’associer'),
      'Pour un projet de croissance, l’établissement et l’entrepreneur apportent chacun des fonds. Les profits sont partagés selon une clé convenue ; les pertes, selon les apports.',
      h3('La moucharaka dégressive'),
      'Utilisée pour l’immobilier, elle permet au client de racheter progressivement la part de l’établissement tout en lui versant un loyer pour la part qu’il ne possède pas encore.',
      h2('Quel contrat pour quel besoin ?'),
      ul(
        '**Équipement, stock** : mourabaha.',
        '**Véhicule, matériel** : ijara.',
        '**Projet, croissance** : moucharaka ou moudaraba.',
        '**Logement** : moucharaka dégressive ou ijara wa iqtina.',
      ),
      p(
        '_Ces exemples sont simplifiés. Chaque produit doit être validé par le comité de conformité de l’établissement qui le propose._',
      ),
    ),
  },
  {
    slug: 'takaful-difference-assurance-conventionnelle',
    title: 'Takaful : en quoi l’assurance islamique diffère de l’assurance conventionnelle',
    excerpt:
      'Entraide entre participants, séparation des fonds, rôle de l’opérateur, partage des excédents : les quatre différences qui font le takaful.',
    categories: ['takaful'],
    authors: ['clarisse-fotso'],
    publishedAt: '2026-07-15T08:00:00.000Z',
    related: ['principes-finance-islamique'],
    seo: {
      title: 'Takaful ou assurance classique : les différences',
      description:
        'Entraide, séparation des fonds, rôle de l’opérateur, excédents : comprendre ce qui distingue le takaful de l’assurance conventionnelle.',
    },
    content: rt(
      'L’assurance conventionnelle pose deux questions au regard de la finance islamique : l’incertitude du contrat (gharar) et le placement des primes dans des produits à intérêt. Le takaful y répond en changeant la logique de l’assurance.',
      h2('1. Une logique d’entraide'),
      'Les participants versent une contribution, le tabarru, à un fonds commun. Ce fonds indemnise ceux d’entre eux qui subissent un sinistre. On ne « achète » plus une garantie à un assureur : on s’engage dans un mécanisme d’entraide.',
      h2('2. Deux fonds séparés'),
      'Le fonds des participants appartient aux participants. Le fonds de l’opérateur appartient à la société qui gère le dispositif. Les deux ne doivent jamais se confondre.',
      h2('3. Un opérateur rémunéré de façon transparente'),
      ul(
        '**Modèle wakala** : l’opérateur perçoit des frais de gestion fixés à l’avance.',
        '**Modèle moudaraba** : l’opérateur perçoit une part des profits de placement.',
        '**Modèle mixte** : il combine les deux, le plus courant aujourd’hui.',
      ),
      h2('4. Le sort des excédents'),
      'Si les contributions dépassent les sinistres et les frais, l’excédent appartient au fonds. Il peut être redistribué aux participants, mis en réserve ou affecté selon les règles du fonds. En cas de déficit, l’opérateur peut accorder un qard hassan, un prêt sans intérêt, au fonds.',
      callout(
        'retenir',
        'Le takaful ne se résume pas à un nouveau nom. Un produit takaful se vérifie dans ses documents : règlement du fonds, contrat de gestion, politique de placement et de répartition des excédents.',
      ),
      p(
        '_Amana Conseil n’est pas assureur. Cet article ne constitue ni une fatwa ni un conseil personnalisé._',
      ),
    ),
  },
  {
    slug: 'ouvrir-fenetre-islamique-cemac',
    title: 'Ouvrir une fenêtre islamique en zone CEMAC : les grandes étapes',
    excerpt:
      'Étude d’opportunité, cadre réglementaire, gouvernance, systèmes, formation : la feuille de route d’une banque ou d’un établissement de microfinance.',
    categories: ['banque-participative', 'reglementation'],
    authors: ['mariam-ndjock'],
    publishedAt: '2026-08-05T08:00:00.000Z',
    related: ['audit-conformite-charia-etapes', 'contrats-mourabaha-ijara-moucharaka'],
    seo: {
      title: 'Ouvrir une fenêtre islamique en zone CEMAC',
      description:
        'Étude d’opportunité, réglementation, gouvernance, systèmes et formation : les étapes pour ouvrir une fenêtre islamique en Afrique centrale.',
    },
    content: rt(
      'Une fenêtre islamique permet à un établissement conventionnel de proposer une offre conforme sans créer une nouvelle entité. Le projet touche pourtant toute l’organisation. Voici les étapes que nous observons dans les projets réussis.',
      h2('Étape 1 : vérifier l’opportunité'),
      'Qui sont les clients visés ? Quels produits attendent-ils ? Quels volumes peut-on espérer ? Une étude de marché, même courte, évite de lancer une gamme qui ne répond à aucune demande.',
      h2('Étape 2 : comprendre le cadre réglementaire'),
      'La zone CEMAC dispose d’un cadre réglementaire spécifique à l’activité de finance islamique, adopté par les autorités monétaires et bancaires de la sous-région. Il fixe notamment les conditions d’exercice, les exigences de gouvernance et de séparation des activités.',
      callout(
        'avertissement',
        'TODO(client) : compléter avec les références exactes des textes en vigueur (règlements COBAC/CEMAC) et leur date.',
      ),
      h2('Étape 3 : mettre en place la gouvernance'),
      ul(
        'constituer un comité de conformité charia indépendant ;',
        'nommer un responsable de la conformité charia ;',
        'rédiger les politiques et procédures ;',
        'prévoir un audit charia périodique.',
      ),
      h2('Étape 4 : séparer les fonds et adapter les systèmes'),
      'Les fonds collectés par la fenêtre ne doivent pas financer l’activité conventionnelle. Cela suppose une comptabilité séparée, un paramétrage spécifique du système d’information et une gestion de trésorerie dédiée.',
      h2('Étape 5 : former les équipes'),
      'Un chargé de clientèle qui ne sait pas expliquer une mourabaha la vendra comme un crédit. La formation des équipes commerciales, des analystes et des back-offices est une condition de réussite, pas une option.',
      h2('Combien de temps prévoir ?'),
      'Comptez en général entre neuf et dix-huit mois entre la décision et le lancement, selon les délais d’agrément et l’état des systèmes.',
      p(
        'Notre [guide pratique](/ressources/guides/guide-fenetre-islamique) détaille chaque étape avec des listes de contrôle.',
      ),
    ),
  },
  {
    slug: 'audit-conformite-charia-etapes',
    title: 'Audit de conformité charia : ce que vérifie l’auditeur, étape par étape',
    excerpt:
      'Cadrage, revue documentaire, tests sur dossiers, restitution : ce qui se passe pendant un audit charia et comment s’y préparer.',
    categories: ['audit-conformite'],
    authors: ['mariam-ndjock'],
    publishedAt: '2026-09-02T08:00:00.000Z',
    related: ['ouvrir-fenetre-islamique-cemac', 'contrats-mourabaha-ijara-moucharaka'],
    seo: {
      title: 'Audit charia : ce que vérifie l’auditeur',
      description:
        'Cadrage, revue documentaire, tests sur dossiers, restitution : le déroulé d’un audit de conformité charia et comment s’y préparer.',
    },
    content: rt(
      'Un audit charia vérifie que ce qui a été validé par le comité de conformité est réellement appliqué sur le terrain. Voici son déroulé type.',
      h2('Le cadrage'),
      'L’auditeur et l’établissement fixent le périmètre (produits, agences, période), le calendrier et la liste des documents. Un cadrage précis évite les allers-retours.',
      h2('La revue documentaire'),
      'L’auditeur lit les décisions du comité, les fiches produits, les contrats types et les procédures. Il vérifie leur cohérence avec les normes de référence, notamment celles de l’AAOIFI.',
      h2('Les tests sur dossiers'),
      'C’est le cœur de l’audit. L’auditeur sélectionne un échantillon d’opérations et vérifie chaque étape.',
      ul(
        'Le bien a-t-il été acheté avant d’être revendu ?',
        'Les dates des documents sont-elles cohérentes ?',
        'Les pénalités de retard sont-elles reversées à des œuvres caritatives ?',
        'Les revenus non conformes ont-ils été purifiés ?',
      ),
      callout(
        'avertissement',
        'Dans une mourabaha, la facture du fournisseur est datée après le contrat de revente au client. L’établissement a donc vendu un bien qu’il ne possédait pas encore.',
        'Constat fréquent',
      ),
      h2('La restitution'),
      'Les constats sont classés par gravité et accompagnés de recommandations. Un plan d’action précise qui fait quoi, et pour quand.',
      h3('Comment se préparer ?'),
      ol(
        'Rassemblez les décisions du comité de conformité.',
        'Vérifiez que les procédures écrites correspondent aux pratiques.',
        'Désignez un interlocuteur unique pour l’auditeur.',
      ),
    ),
  },
  {
    slug: 'comprendre-sukuk',
    title: 'Sukuk : comprendre les certificats d’investissement islamiques',
    excerpt:
      'Souvent présentés comme des « obligations islamiques », les sukuk reposent sur une logique différente : la propriété d’actifs réels.',
    categories: ['marches-sukuk'],
    authors: ['ibrahim-abdoulaye'],
    publishedAt: '2026-10-07T08:00:00.000Z',
    related: ['principes-finance-islamique', 'contrats-mourabaha-ijara-moucharaka'],
    seo: {
      title: 'Sukuk : comprendre les certificats islamiques',
      description:
        'Fonctionnement, structures courantes et différences avec les obligations : l’essentiel sur les sukuk, certificats d’investissement islamiques.',
    },
    content: rt(
      'Les États et les entreprises utilisent les sukuk pour financer des infrastructures ou des projets. Plusieurs États d’Afrique, dont certains de la zone CEMAC, y ont déjà eu recours.',
      h2('Une part de propriété, pas une créance'),
      'Une obligation est une dette : l’émetteur promet de rembourser le capital et de verser des intérêts. Un sukuk représente une **part de propriété** d’actifs ou d’un projet. Son rendement provient des revenus de ces actifs.',
      h2('Les structures les plus courantes'),
      h3('Sukuk ijara'),
      'L’émetteur cède des actifs (immeubles, équipements) à une structure qui les lui loue. Les loyers sont reversés aux détenteurs.',
      h3('Sukuk moudaraba et moucharaka'),
      'Les fonds levés sont investis dans un projet ou une activité. Les détenteurs reçoivent une part des profits.',
      h2('Les questions à poser'),
      ul(
        'Quels actifs sont réellement détenus ?',
        'Le capital est-il garanti, et par qui ?',
        'Quel comité de conformité a validé la structure ?',
      ),
      callout(
        'avertissement',
        'Un sukuk dont le capital et le rendement sont garantis quoi qu’il arrive par l’émetteur se rapproche d’une obligation. Les normes de référence encadrent ces garanties.',
      ),
      p('_Cet article est pédagogique et ne constitue pas une recommandation d’investissement._'),
    ),
  },
]

export async function seedPosts(seeder: Seeder, categories: IdMap, authors: IdMap): Promise<IdMap> {
  const ids: IdMap = new Map()
  const base = (post: PostSeed) => ({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    categories: idsOf(categories, post.categories),
    authors: idsOf(authors, post.authors),
    publishedAt: post.publishedAt,
    seo: post.seo,
    _status: 'published' as const,
  })
  for (const post of postsSeed) {
    const doc = await upsert(seeder, 'posts', { field: 'slug', value: post.slug }, base(post))
    ids.set(post.slug, doc.id)
  }
  // Articles liés : second passage, une fois tous les identifiants connus.
  for (const post of postsSeed) {
    await upsert(
      seeder,
      'posts',
      { field: 'slug', value: post.slug },
      { ...base(post), relatedPosts: idsOf(ids, post.related) },
    )
  }
  return ids
}
