/**
 * Glossaire : 40 termes. Translittération française cohérente dans tout le site
 * (mourabaha, ijara, moucharaka, moudaraba, sukuk, takaful, riba, gharar, charia) ;
 * le champ `transliteration` donne la forme internationale usuelle.
 * TODO(client) : relecture par le comité de conformité (définitions et graphies arabes).
 */
import { rt } from './lib/richtext'
import { type IdMap, type Seeder, upsert } from './lib/upsert'

export type GlossarySeed = {
  slug: string
  term: string
  transliteration?: string
  arabic?: string
  short: string
  definition: string[]
  synonyms?: string[]
  related?: string[]
}

export const glossarySeed: GlossarySeed[] = [
  {
    slug: 'charia',
    term: 'Charia',
    transliteration: 'sharia',
    arabic: 'شريعة',
    short:
      'Ensemble des règles et principes issus des sources de l’islam, qui encadrent notamment les transactions financières.',
    definition: [
      'La charia désigne l’ensemble des règles issues du Coran, de la Sunna et des méthodes d’interprétation reconnues. En finance, on parle de conformité à la charia pour un produit qui respecte ses principes : interdiction du riba, du gharar excessif et du maysir, adossement à des actifs réels.',
    ],
    synonyms: ['sharia', 'chariah', 'shariah'],
    related: ['fiqh', 'maqasid-al-charia', 'comite-de-conformite-charia'],
  },
  {
    slug: 'fiqh',
    term: 'Fiqh',
    transliteration: 'fiqh',
    arabic: 'فقه',
    short:
      'Jurisprudence islamique : la science qui déduit les règles pratiques à partir des sources.',
    definition: [
      'Le fiqh est le travail d’interprétation qui permet d’appliquer les principes de la charia à des situations concrètes. Le fiqh des transactions (fiqh al-mouamalat) traite des contrats, des ventes et des partenariats.',
    ],
    related: ['charia', 'fatwa'],
  },
  {
    slug: 'fatwa',
    term: 'Fatwa',
    transliteration: 'fatwa',
    arabic: 'فتوى',
    short: 'Avis juridique rendu par un savant qualifié en réponse à une question précise.',
    definition: [
      'Une fatwa est un avis rendu par une autorité religieuse qualifiée. Amana Conseil ne délivre pas de fatwa : le cabinet émet des avis techniques de conformité sur des produits et des processus, fondés sur des normes publiées.',
    ],
    synonyms: ['fatwas'],
    related: ['comite-de-conformite-charia', 'fiqh'],
  },
  {
    slug: 'maqasid-al-charia',
    term: 'Maqasid al-charia',
    transliteration: 'maqasid al-sharia',
    arabic: 'مقاصد الشريعة',
    short:
      'Finalités de la charia : préservation de la religion, de la vie, de l’intellect, de la descendance et des biens.',
    definition: [
      'Les maqasid sont les objectifs que poursuivent les règles de la charia. Ils servent de boussole pour évaluer un produit au-delà de sa forme juridique : un contrat formellement conforme mais contraire à ces finalités pose question.',
    ],
    synonyms: ['maqasid'],
    related: ['charia'],
  },
  {
    slug: 'riba',
    term: 'Riba',
    transliteration: 'riba',
    arabic: 'ربا',
    short:
      'Tout surplus fixé à l’avance sur un prêt d’argent ou dans certains échanges : l’intérêt est la forme la plus connue de riba.',
    definition: [
      'Le riba est interdit en finance islamique. Il désigne principalement l’intérêt d’un prêt (riba al-nasi’a) mais aussi certains échanges inégaux de biens de même nature (riba al-fadl). C’est pourquoi la finance islamique remplace le prêt à intérêt par des ventes, des locations ou des partenariats.',
    ],
    related: ['gharar', 'maysir', 'qard-hassan'],
  },
  {
    slug: 'gharar',
    term: 'Gharar',
    transliteration: 'gharar',
    arabic: 'غرر',
    short:
      'Incertitude excessive sur l’objet, le prix ou les conditions d’un contrat. Un gharar excessif rend le contrat non conforme.',
    definition: [
      'Le gharar vise les contrats dont un élément essentiel est inconnu ou aléatoire : marchandise non définie, prix non fixé, échéance indéterminée. Un gharar mineur est toléré ; un gharar excessif est interdit.',
    ],
    related: ['riba', 'maysir', 'salam'],
  },
  {
    slug: 'maysir',
    term: 'Maysir',
    transliteration: 'maysir',
    arabic: 'ميسر',
    short: 'Jeu de hasard ou spéculation où le gain de l’un dépend de la perte de l’autre.',
    definition: [
      'Le maysir est interdit. En finance, il concerne la spéculation pure et certains produits dérivés dont le résultat dépend du hasard et non d’une activité économique réelle.',
    ],
    synonyms: ['qimar'],
    related: ['gharar', 'riba'],
  },
  {
    slug: 'halal',
    term: 'Halal',
    transliteration: 'halal',
    arabic: 'حلال',
    short: 'Ce qui est permis.',
    definition: [
      'Est halal ce qui est permis par la charia. En finance, une activité ou un investissement halal ne finance pas de secteur interdit et ne repose pas sur des mécanismes interdits.',
    ],
    related: ['haram', 'charia'],
  },
  {
    slug: 'haram',
    term: 'Haram',
    transliteration: 'haram',
    arabic: 'حرام',
    short: 'Ce qui est interdit.',
    definition: [
      'Est haram ce qui est interdit par la charia. Les secteurs généralement exclus des investissements comprennent l’alcool, les jeux de hasard, l’armement et la finance conventionnelle à intérêt.',
    ],
    related: ['halal', 'purification-des-revenus'],
  },
  {
    slug: 'mourabaha',
    term: 'Mourabaha',
    transliteration: 'murabaha',
    arabic: 'مرابحة',
    short:
      'Vente avec marge connue : l’établissement achète un bien puis le revend au client à un prix majoré, payable à terme.',
    definition: [
      'Dans une mourabaha, l’établissement achète d’abord le bien demandé par le client, en devient propriétaire, puis le lui revend avec une marge annoncée. Le prix total est fixé à la signature et ne varie plus, même en cas de retard.',
      'L’ordre des opérations est essentiel : la revente avant l’acquisition rend le contrat non conforme.',
    ],
    synonyms: ['mourabahas', 'murabaha', 'murabahah'],
    related: ['bay', 'tawarruq', 'hamich-jiddiyya'],
  },
  {
    slug: 'ijara',
    term: 'Ijara',
    transliteration: 'ijara',
    arabic: 'إجارة',
    short: 'Location : l’établissement achète un bien et le loue au client contre des loyers.',
    definition: [
      'L’ijara est un contrat de location. L’établissement reste propriétaire du bien et assume les risques liés à la propriété ; le client paie un loyer pour son usage. C’est la base de nombreux financements de véhicules, d’équipements et de sukuk.',
    ],
    synonyms: ['ijarah'],
    related: ['ijara-wa-iqtina', 'sukuk'],
  },
  {
    slug: 'ijara-wa-iqtina',
    term: 'Ijara wa iqtina',
    transliteration: 'ijara wa iqtina',
    arabic: 'إجارة واقتناء',
    short: 'Location suivie d’un transfert de propriété au client, proche du crédit-bail.',
    definition: [
      'L’ijara wa iqtina combine une location et une promesse de transfert de propriété en fin de contrat. Le transfert fait l’objet d’un acte distinct, par vente ou donation.',
    ],
    synonyms: ['ijara mountahia bittamlik', 'ijara muntahia bittamleek'],
    related: ['ijara'],
  },
  {
    slug: 'moucharaka',
    term: 'Moucharaka',
    transliteration: 'musharaka',
    arabic: 'مشاركة',
    short:
      'Partenariat où chaque associé apporte des fonds ; les profits sont partagés selon un ratio convenu et les pertes selon les apports.',
    definition: [
      'La moucharaka est un contrat d’association. Les associés apportent du capital, partagent les profits selon une clé définie à l’avance et supportent les pertes en proportion de leurs apports. Elle sert au financement de projets et de fonds de roulement.',
    ],
    synonyms: ['musharaka', 'musharakah'],
    related: ['moucharaka-degressive', 'moudaraba'],
  },
  {
    slug: 'moucharaka-degressive',
    term: 'Moucharaka dégressive',
    transliteration: 'musharaka mutanaqisa',
    arabic: 'مشاركة متناقصة',
    short:
      'Partenariat où le client rachète progressivement la part de l’établissement jusqu’à devenir seul propriétaire.',
    definition: [
      'Utilisée notamment pour l’immobilier, la moucharaka dégressive associe une copropriété, une location de la part de l’établissement et des rachats successifs de parts par le client.',
    ],
    synonyms: ['moucharaka moutanaqissa', 'musharaka mutanaqisa'],
    related: ['moucharaka', 'ijara'],
  },
  {
    slug: 'moudaraba',
    term: 'Moudaraba',
    transliteration: 'mudaraba',
    arabic: 'مضاربة',
    short:
      'Partenariat où l’un apporte le capital et l’autre son travail ; les profits sont partagés, les pertes financières supportées par l’apporteur.',
    definition: [
      'Dans une moudaraba, le rabb al-mal confie des fonds au moudarib, qui les fait fructifier. Les profits sont partagés selon un ratio convenu. En cas de perte sans faute du moudarib, l’apporteur supporte la perte financière et le moudarib perd le fruit de son travail.',
    ],
    synonyms: ['mudaraba', 'mudarabah'],
    related: ['rabb-al-mal', 'moudarib', 'moucharaka'],
  },
  {
    slug: 'rabb-al-mal',
    term: 'Rabb al-mal',
    transliteration: 'rabb al-mal',
    arabic: 'رب المال',
    short: 'Apporteur de capitaux dans un contrat de moudaraba.',
    definition: [
      'Le rabb al-mal confie ses fonds au moudarib. Dans un compte d’investissement, le déposant joue ce rôle et l’établissement celui de moudarib.',
    ],
    related: ['moudaraba', 'moudarib'],
  },
  {
    slug: 'moudarib',
    term: 'Moudarib',
    transliteration: 'mudarib',
    arabic: 'مضارب',
    short: 'Gestionnaire qui apporte son travail et son expertise dans un contrat de moudaraba.',
    definition: [
      'Le moudarib gère les fonds confiés par le rabb al-mal. Il est rémunéré par une part des profits et ne garantit pas le capital, sauf faute ou négligence.',
    ],
    synonyms: ['mudarib'],
    related: ['moudaraba', 'rabb-al-mal'],
  },
  {
    slug: 'salam',
    term: 'Salam',
    transliteration: 'salam',
    arabic: 'سلم',
    short:
      'Vente à livraison différée avec paiement comptant du prix, utilisée notamment en agriculture.',
    definition: [
      'Le salam permet de payer aujourd’hui une marchandise livrée plus tard. Pour éviter le gharar, la quantité, la qualité, la date et le lieu de livraison sont précisés dans le contrat.',
    ],
    related: ['istisna', 'gharar'],
  },
  {
    slug: 'istisna',
    term: 'Istisna',
    transliteration: 'istisna',
    arabic: 'استصناع',
    short:
      'Commande d’un bien à fabriquer ou à construire, avec un paiement pouvant être échelonné.',
    definition: [
      'L’istisna est utilisé pour financer la construction ou la fabrication : bâtiments, équipements, infrastructures. Le prix et les spécifications sont fixés à la commande.',
    ],
    synonyms: ['istisnaa', "istisna'"],
    related: ['salam'],
  },
  {
    slug: 'wakala',
    term: 'Wakala',
    transliteration: 'wakala',
    arabic: 'وكالة',
    short:
      'Mandat : une partie agit pour le compte d’une autre contre une rémunération fixée à l’avance.',
    definition: [
      'La wakala est un contrat de mandat. En takaful, l’opérateur gère le fonds des participants en qualité de mandataire (wakil) et perçoit des frais de gestion connus d’avance.',
    ],
    synonyms: ['wakalah'],
    related: ['takaful', 'moudaraba'],
  },
  {
    slug: 'qard-hassan',
    term: 'Qard hassan',
    transliteration: 'qard hasan',
    arabic: 'قرض حسن',
    short: 'Prêt sans intérêt : l’emprunteur rembourse uniquement le montant emprunté.',
    definition: [
      'Le qard hassan est un prêt bienveillant. En takaful, l’opérateur peut accorder un qard hassan au fonds des participants pour couvrir un déficit, remboursé sur les excédents futurs.',
    ],
    synonyms: ['qard hasan', 'qard al-hassan'],
    related: ['riba', 'takaful'],
  },
  {
    slug: 'sukuk',
    term: 'Sukuk',
    transliteration: 'sukuk',
    arabic: 'صكوك',
    short:
      'Certificats d’investissement représentant une part de propriété d’actifs réels ou d’un projet, souvent comparés à des obligations.',
    definition: [
      'Les sukuk donnent à leurs détenteurs un droit sur des actifs sous-jacents et sur les revenus qu’ils génèrent. Contrairement à une obligation, ils ne représentent pas une dette portant intérêt. Les structures les plus courantes reposent sur l’ijara, la moudaraba ou la moucharaka.',
    ],
    synonyms: ['sukuks', 'soukouk'],
    related: ['ijara', 'moucharaka', 'moudaraba'],
  },
  {
    slug: 'takaful',
    term: 'Takaful',
    transliteration: 'takaful',
    arabic: 'تكافل',
    short:
      'Assurance fondée sur l’entraide : les participants alimentent un fonds commun qui indemnise ceux d’entre eux qui subissent un sinistre.',
    definition: [
      'Dans le takaful, les participants versent des contributions (tabarru) à un fonds qui leur appartient collectivement. Un opérateur gère ce fonds contre une rémunération définie à l’avance, selon un modèle wakala, moudaraba ou mixte. Les excédents éventuels peuvent être redistribués aux participants.',
    ],
    synonyms: ['assurance takaful', 'assurance islamique'],
    related: ['retakaful', 'tabarru', 'wakala'],
  },
  {
    slug: 'retakaful',
    term: 'Retakaful',
    transliteration: 'retakaful',
    arabic: 'إعادة التكافل',
    short: 'Réassurance conforme aux principes du takaful.',
    definition: [
      'Le retakaful permet aux opérateurs takaful de partager une partie de leurs risques avec d’autres fonds, sur les mêmes principes d’entraide et de séparation des fonds.',
    ],
    related: ['takaful'],
  },
  {
    slug: 'tabarru',
    term: 'Tabarru',
    transliteration: "tabarru'",
    arabic: 'تبرع',
    short:
      'Contribution volontaire versée au fonds takaful pour aider les participants touchés par un sinistre.',
    definition: [
      'Le tabarru est une donation : il transforme la contribution d’assurance en acte d’entraide, ce qui écarte le gharar et le maysir propres à l’assurance conventionnelle.',
    ],
    synonyms: ["tabarru'"],
    related: ['takaful'],
  },
  {
    slug: 'wadia',
    term: 'Wadia',
    transliteration: "wadi'a",
    arabic: 'وديعة',
    short: 'Dépôt en garde : l’établissement conserve les fonds et les restitue à la demande.',
    definition: [
      'Le compte wadia correspond à un compte courant : les fonds sont garantis et ne produisent pas de rendement contractuel.',
    ],
    synonyms: ["wadi'a", 'wadiah'],
    related: ['amana', 'qard-hassan'],
  },
  {
    slug: 'amana',
    term: 'Amana',
    transliteration: 'amana',
    arabic: 'أمانة',
    short:
      'Dépôt confié : ce qui est remis en confiance et doit être restitué. Le mot signifie aussi « confiance ».',
    definition: [
      'L’amana désigne un bien confié à une personne qui doit le préserver. Le dépositaire n’en répond qu’en cas de faute. Le mot a donné son nom au cabinet.',
    ],
    related: ['wadia'],
  },
  {
    slug: 'zakat',
    term: 'Zakat',
    transliteration: 'zakat',
    arabic: 'زكاة',
    short:
      'Aumône obligatoire calculée sur certains biens au-delà d’un seuil, l’un des cinq piliers de l’islam.',
    definition: [
      'La zakat est due chaque année sur certains biens (épargne, marchandises, récoltes…) au-delà d’un seuil appelé nisab. Certains établissements la calculent pour le compte de leurs actionnaires ou de leurs clients.',
    ],
    synonyms: ['zakah'],
    related: ['sadaqa', 'waqf'],
  },
  {
    slug: 'sadaqa',
    term: 'Sadaqa',
    transliteration: 'sadaqa',
    arabic: 'صدقة',
    short: 'Don volontaire à des fins charitables.',
    definition: [
      'La sadaqa est un don libre. Les revenus non conformes purifiés par un établissement sont souvent reversés sous forme de dons à des œuvres caritatives.',
    ],
    synonyms: ['sadaqah'],
    related: ['zakat', 'purification-des-revenus'],
  },
  {
    slug: 'waqf',
    term: 'Waqf',
    transliteration: 'waqf',
    arabic: 'وقف',
    short:
      'Bien immobilisé de façon perpétuelle dont les revenus financent une œuvre d’intérêt général.',
    definition: [
      'Le waqf est une dotation : le bien ne peut être ni vendu ni donné, et ses revenus sont affectés à une cause (éducation, santé, entretien de lieux de culte). Certains modèles de takaful reposent sur un waqf.',
    ],
    synonyms: ['waqfs', 'awqaf'],
    related: ['sadaqa', 'takaful'],
  },
  {
    slug: 'comite-de-conformite-charia',
    term: 'Comité de conformité charia',
    transliteration: "hay'at al-raqaba al-shar'iyya",
    arabic: 'هيئة الرقابة الشرعية',
    short:
      'Organe indépendant de spécialistes qui valide la conformité des produits et des opérations d’un établissement.',
    definition: [
      'Le comité de conformité charia (ou conseil de supervision charia) approuve les produits, émet des avis et supervise les contrôles. Son indépendance et la qualification de ses membres sont au cœur de la gouvernance d’une activité islamique.',
    ],
    synonyms: ['comité charia', 'conseil de supervision charia', 'shariah board'],
    related: ['charia', 'fatwa', 'audit-charia'],
  },
  {
    slug: 'audit-charia',
    term: 'Audit charia',
    transliteration: "shari'a audit",
    short:
      'Vérification indépendante de la conformité des produits, contrats et opérations d’un établissement aux principes de la charia.',
    definition: [
      'L’audit charia examine les contrats, les dossiers et les processus pour vérifier qu’ils respectent les décisions du comité de conformité et les normes de référence. Il débouche sur un rapport et un plan d’action.',
    ],
    synonyms: ['audit de conformité charia', 'audit shariah'],
    related: ['comite-de-conformite-charia', 'aaoifi'],
  },
  {
    slug: 'fenetre-islamique',
    term: 'Fenêtre islamique',
    short:
      'Département d’un établissement conventionnel qui propose des produits conformes, avec des fonds et une comptabilité séparés.',
    definition: [
      'Une fenêtre islamique permet à une banque, une assurance ou un établissement de microfinance de proposer une offre conforme sans créer une entité distincte. Elle suppose une stricte séparation des fonds, une comptabilité dédiée et un comité de conformité.',
    ],
    synonyms: ['fenêtres islamiques', 'guichet islamique', 'islamic window'],
    related: ['banque-participative', 'comite-de-conformite-charia'],
  },
  {
    slug: 'banque-participative',
    term: 'Banque participative',
    short:
      'Appellation utilisée dans plusieurs pays francophones pour désigner les banques et fenêtres proposant des produits conformes à la charia.',
    definition: [
      'Le terme met l’accent sur le partage des risques et des résultats entre la banque et ses clients. Il recouvre en pratique les activités de finance islamique.',
    ],
    synonyms: ['banques participatives', 'finance participative'],
    related: ['fenetre-islamique', 'moucharaka'],
  },
  {
    slug: 'purification-des-revenus',
    term: 'Purification des revenus',
    transliteration: 'tathir',
    arabic: 'تطهير',
    short:
      'Reversement à des œuvres caritatives des revenus jugés non conformes, pour qu’ils ne profitent ni à l’établissement ni aux investisseurs.',
    definition: [
      'Lorsqu’un revenu provient d’une source non conforme (intérêts perçus par erreur, part d’activité interdite dans une entreprise investie), il est calculé puis reversé. La procédure est fixée par le comité de conformité.',
    ],
    synonyms: ['purification', 'tathir'],
    related: ['sadaqa', 'gharama'],
  },
  {
    slug: 'gharama',
    term: 'Gharama',
    transliteration: 'gharama',
    arabic: 'غرامة',
    short:
      'Pénalité de retard qu’un client s’engage à verser à des œuvres caritatives ; elle ne constitue pas un revenu pour l’établissement.',
    definition: [
      'Pour inciter au paiement à l’échéance sans pratiquer le riba, certains contrats prévoient un engagement à faire un don en cas de retard. Les sommes sont purifiées et ne peuvent pas enrichir l’établissement.',
    ],
    related: ['purification-des-revenus', 'riba'],
  },

  {
    slug: 'hamich-jiddiyya',
    term: 'Hamich jiddiyya',
    transliteration: 'hamish jiddiyah',
    arabic: 'هامش الجدية',
    short:
      'Dépôt de garantie versé par un client pour montrer le sérieux de sa demande avant une mourabaha.',
    definition: [
      'Si le client renonce après que l’établissement a acheté le bien, le dépôt peut couvrir la perte réelle subie. Le surplus est restitué au client.',
    ],
    synonyms: ['hamish jiddiyah', 'marge de sérieux'],
    related: ['mourabaha', 'bay'],
  },

  {
    slug: 'bay',
    term: 'Bay’',
    transliteration: "bay'",
    arabic: 'بيع',
    short: 'Contrat de vente, base de nombreux produits de financement islamique.',
    definition: [
      'La vente (bay’) transfère la propriété d’un bien contre un prix. Ses variantes (vente au comptant, à terme, avec marge, sur commande) structurent la mourabaha, le salam et l’istisna.',
    ],
    synonyms: ["bay'", 'bai'],
    related: ['mourabaha', 'salam', 'istisna'],
  },
  {
    slug: 'tawarruq',
    term: 'Tawarruq',
    transliteration: 'tawarruq',
    arabic: 'تورق',
    short:
      'Achat à terme d’une marchandise immédiatement revendue au comptant à un tiers pour obtenir des liquidités. Son usage est controversé.',
    definition: [
      'Le tawarruq permet d’obtenir des liquidités. Les normes de référence l’encadrent strictement, et de nombreux comités en limitent l’usage car il peut reproduire économiquement un prêt à intérêt.',
    ],
    synonyms: ['tawarruq organisé', 'commodity murabaha'],
    related: ['mourabaha', 'riba'],
  },
  {
    slug: 'aaoifi',
    term: 'AAOIFI',
    transliteration: 'AAOIFI',
    arabic: 'هيئة المحاسبة والمراجعة للمؤسسات المالية الإسلامية',
    short:
      'Organisation de comptabilité et d’audit des institutions financières islamiques, qui publie des normes charia, comptables et de gouvernance.',
    definition: [
      'Basée à Bahreïn, l’AAOIFI publie des normes de référence utilisées par les établissements, les auditeurs et les régulateurs de nombreux pays.',
    ],
    related: ['audit-charia', 'comite-de-conformite-charia'],
  },
]

export async function seedGlossary(seeder: Seeder): Promise<IdMap> {
  const ids: IdMap = new Map()
  // 1er passage : les termes ; 2e passage : les termes liés (références croisées).
  for (const item of glossarySeed) {
    const doc = await upsert(
      seeder,
      'glossary-terms',
      { field: 'slug', value: item.slug },
      {
        term: item.term,
        slug: item.slug,
        transliteration: item.transliteration ?? null,
        arabic: item.arabic ?? null,
        shortDefinition: item.short,
        definition: rt(...item.definition),
        synonyms: (item.synonyms ?? []).map((value) => ({ value })),
        seo: {
          title: `${item.term} : définition`,
          description: item.short.length <= 155 ? item.short : `${item.short.slice(0, 152)}…`,
        },
      },
    )
    ids.set(item.slug, doc.id)
  }
  for (const item of glossarySeed) {
    if (!item.related?.length) continue
    await upsert(
      seeder,
      'glossary-terms',
      { field: 'slug', value: item.slug },
      {
        term: item.term,
        slug: item.slug,
        shortDefinition: item.short,
        relatedTerms: item.related.map((slug) => {
          const id = ids.get(slug)
          if (id === undefined) throw new Error(`Glossaire : terme lié inconnu « ${slug} ».`)
          return id
        }),
      },
    )
  }
  return ids
}
