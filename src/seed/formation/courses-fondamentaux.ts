/**
 * Cours pour particuliers (1/2) : bases, banque participative, éthique des affaires.
 * Contenus FICTIFS de démonstration. TODO(client) : programmes, textes et vidéos réels,
 * relus par l'équipe pédagogique et le comité de conformité.
 */
import { h2, p, ul } from '../lib/richtext'
import { descriptionFooter, trueFalse } from './shared'
import type { CourseSeed } from './types'

export const basesFinanceIslamique: CourseSeed = {
  slug: 'bases-finance-islamique',
  title: 'Les bases de la finance islamique',
  subtitle: 'Principes, contrats et vocabulaire, expliqués par l’exemple',
  summary:
    'Comprenez les principes de la finance islamique et les contrats les plus utilisés (mourabaha, ijara, moucharaka, moudaraba), avec des exemples tirés du contexte camerounais.',
  description: [
    'Ce cours s’adresse à toute personne qui veut comprendre la finance islamique sans prérequis technique : étudiants, professionnels de la banque ou de l’assurance, entrepreneurs et épargnants.',
    h2('Ce que vous allez apprendre'),
    ul(
      'les principes qui distinguent la finance islamique : interdiction du riba, du gharar et du maysir, adossement à des actifs réels, partage des risques ;',
      'le fonctionnement des quatre grands contrats et leurs usages ;',
      'le rôle des acteurs de la zone CEMAC : banques, fenêtres islamiques, assureurs takaful, régulateur.',
    ),
    p(
      'Chaque module se termine par une courte évaluation. Une étude de cas vous fait appliquer les notions à une situation concrète.',
    ),
    ...descriptionFooter(),
  ],
  format: 'course',
  audience: 'individual',
  level: 'beginner',
  themes: ['fondamentaux'],
  instructors: ['ibrahim'],
  objectives: [
    'Expliquer les cinq principes fondamentaux de la finance islamique.',
    'Distinguer une mourabaha, une ijara, une moucharaka et une moudaraba.',
    'Repérer les éléments qui rendent une opération non conforme.',
    'Situer les acteurs de la finance islamique en zone CEMAC.',
  ],
  prerequisites: 'Aucun prérequis. Le cours se suit sur mobile, à votre rythme.',
  featured: true,
  includedInPass: true,
  certificateEnabled: true,
  modules: [
    {
      title: 'Les principes fondamentaux',
      description: 'Pourquoi une finance islamique, et quelles règles la distinguent.',
      gateQuiz: 'principes',
      lessons: [
        {
          type: 'video',
          slug: 'pourquoi-une-finance-islamique',
          title: 'Pourquoi une finance islamique ?',
          minutes: 8,
          preview: true,
          transcript: [
            'La finance islamique applique aux opérations financières les règles du droit musulman des transactions. Son objectif n’est pas de reproduire la finance conventionnelle sous un autre nom, mais d’organiser l’épargne et le financement autour d’échanges réels.',
            'Dans cette leçon, nous verrons d’où vient cette approche, comment elle s’est développée depuis les années 1970 et pourquoi elle intéresse aujourd’hui les banques et les assureurs d’Afrique centrale.',
          ],
        },
        {
          type: 'text',
          slug: 'cinq-principes',
          title: 'Les cinq principes à connaître',
          minutes: 10,
          preview: true,
          body: [
            'Cinq principes structurent la finance islamique. Ils servent de grille de lecture pour toute opération.',
            h2('1. L’interdiction du riba'),
            'Le riba désigne tout surplus fixé à l’avance dans un prêt d’argent. Un prêt de 100 remboursé 110, quelle que soit l’issue de l’activité financée, comporte du riba.',
            h2('2. L’interdiction du gharar'),
            'Le gharar est l’incertitude excessive sur l’objet, le prix ou les conditions d’un contrat. Un contrat doit dire clairement ce qui est vendu, à quel prix et quand.',
            h2('3. L’interdiction du maysir'),
            'Le maysir désigne la spéculation pure et les jeux de hasard : un gain qui dépend uniquement du sort, au détriment de l’autre partie.',
            h2('4. L’adossement à des actifs réels'),
            'Chaque financement repose sur un bien, un service ou un projet identifiable. L’argent seul ne produit pas d’argent.',
            h2('5. Le partage des risques'),
            'Celui qui perçoit un profit doit en principe supporter une part du risque. C’est la logique des contrats de partenariat.',
            'Enfin, les activités financées doivent être licites : sont notamment exclus l’alcool, les jeux d’argent et l’armement.',
          ],
        },
        {
          type: 'video',
          slug: 'riba-gharar-maysir',
          title: 'Riba, gharar, maysir : les reconnaître',
          minutes: 12,
          transcript: [
            'Trois interdictions reviennent dans toutes les analyses de conformité. Nous les illustrons avec des exemples courants : crédit à la consommation, pénalités de retard, contrats d’assurance, paris.',
            'Pour chaque exemple, posez-vous trois questions : y a-t-il un surplus fixé sur un prêt d’argent ? L’objet et le prix sont-ils clairement définis ? Le gain dépend-il du seul hasard ?',
          ],
        },
        {
          type: 'quiz',
          slug: 'quiz-principes',
          title: 'Quiz : les principes',
          minutes: 5,
          quiz: 'principes',
        },
      ],
    },
    {
      title: 'Les grands contrats',
      description: 'Ventes, location et partenariats : les outils de la finance islamique.',
      lessons: [
        {
          type: 'video',
          slug: 'mourabaha',
          title: 'La mourabaha, vente avec marge connue',
          minutes: 12,
          transcript: [
            'La mourabaha est une vente dans laquelle le vendeur indique à l’acheteur le coût d’acquisition du bien et la marge qu’il ajoute. Le paiement peut être échelonné.',
            'La banque achète d’abord le bien, en devient propriétaire, puis le revend au client. Le prix total est fixé à la signature et ne peut plus augmenter, même en cas de retard de paiement.',
          ],
          resources: [
            {
              label: 'Fiche de synthèse des contrats (PDF)',
              pdf: { title: 'Fiche de synthèse des contrats', file: 'fiche-contrats' },
            },
          ],
        },
        {
          type: 'video',
          slug: 'ijara',
          title: 'L’ijara, location d’un bien',
          minutes: 10,
          transcript: [
            'L’ijara est un contrat de location : la banque achète un bien et le met à disposition du client contre des loyers. Elle reste propriétaire et supporte les risques liés à la propriété.',
            'Dans l’ijara avec transfert de propriété, une promesse distincte prévoit la cession du bien au client à la fin du contrat.',
          ],
        },
        {
          type: 'text',
          slug: 'moucharaka-moudaraba',
          title: 'Moucharaka et moudaraba, les contrats de partenariat',
          minutes: 12,
          body: [
            'Les contrats de partenariat traduisent le plus directement le principe de partage des risques.',
            h2('La moucharaka'),
            'Deux associés ou plus apportent des capitaux à un projet. Les profits sont répartis selon une clé convenue à l’avance ; les pertes sont supportées en proportion des apports.',
            'Dans la moucharaka dégressive, utilisée pour le financement immobilier, le client rachète progressivement les parts de la banque.',
            h2('La moudaraba'),
            'Un apporteur de capitaux (rabb al-mal) confie des fonds à un gestionnaire (moudarib) qui apporte son travail. Les profits sont partagés selon la clé convenue. Les pertes financières sont supportées par l’apporteur de capitaux, sauf faute ou négligence du gestionnaire.',
          ],
        },
        {
          type: 'pdf',
          slug: 'fiche-contrats',
          title: 'Fiche de synthèse : les quatre contrats',
          minutes: 5,
          pdf: { title: 'Fiche de synthèse des contrats', file: 'fiche-contrats' },
        },
      ],
    },
    {
      title: 'La finance islamique en pratique',
      description: 'Les acteurs en zone CEMAC et une première étude de cas.',
      lessons: [
        {
          type: 'video',
          slug: 'acteurs-cemac',
          title: 'Les acteurs en zone CEMAC',
          minutes: 10,
          transcript: [
            'Banques islamiques, fenêtres islamiques des banques conventionnelles, établissements de microfinance, assureurs takaful : nous présentons les acteurs et leur rôle.',
            'Nous évoquons aussi le rôle du régulateur bancaire régional et des comités de conformité charia, qui valident les produits avant leur commercialisation.',
          ],
        },
        {
          type: 'case-study',
          slug: 'cas-financement-stock',
          title: 'Étude de cas : financer le stock d’une commerçante',
          minutes: 15,
          body: [
            h2('La situation'),
            'Awa tient une boutique de tissus au marché central de Douala. Elle souhaite acheter un stock de 4 000 000 XAF auprès d’un grossiste et rembourser en six mois. Sa banque lui propose une mourabaha. (Cas fictif.)',
            h2('Les questions'),
            ul(
              'Dans quel ordre les contrats doivent-ils être signés ?',
              'Qui est propriétaire du stock, et à quel moment ?',
              'Que se passe-t-il si Awa paie une échéance en retard ?',
            ),
            h2('Les éléments de réponse'),
            'La banque achète d’abord le stock au grossiste et en devient propriétaire. Elle le revend ensuite à Awa avec une marge connue, payable en six échéances. Un retard ne peut pas augmenter le prix : la banque peut prévoir un engagement de don à une œuvre caritative, validé par son comité de conformité, mais ne perçoit aucun revenu supplémentaire.',
          ],
        },
        {
          type: 'quiz',
          slug: 'evaluation-finale',
          title: 'Évaluation finale',
          minutes: 10,
          quiz: 'final',
        },
      ],
    },
  ],
  quizzes: [
    {
      key: 'principes',
      title: 'Quiz : les principes fondamentaux',
      instructions:
        'Trois questions pour vérifier les notions du module. Seuil de réussite : 70 %. Vous pouvez recommencer.',
      passingScorePercent: 70,
      maxAttempts: 0,
      questions: [
        {
          kind: 'single',
          prompt:
            'Un prêt de 1 000 000 XAF remboursé 1 100 000 XAF quelle que soit l’issue du projet comporte :',
          answers: [
            {
              text: 'du riba',
              correct: true,
              feedback:
                'Exact : le surplus de 100 000 XAF est fixé à l’avance sur un prêt d’argent.',
            },
            {
              text: 'du gharar',
              feedback:
                'Non : les termes sont clairs, il n’y a pas d’incertitude. Le problème est le surplus fixé.',
            },
            {
              text: 'aucune difficulté',
              feedback: 'Non : un surplus fixé à l’avance sur un prêt d’argent est du riba.',
            },
          ],
          explanation:
            'Le riba est tout surplus fixé à l’avance dans un prêt d’argent, indépendamment du résultat de l’activité financée.',
        },
        {
          kind: 'true-false',
          prompt:
            'Le gharar désigne une incertitude excessive sur l’objet, le prix ou les conditions d’un contrat.',
          answers: trueFalse(true, {
            onTrue: 'Exact : c’est la définition du gharar.',
            onFalse:
              'Non : c’est bien la définition du gharar. Le riba concerne le surplus sur un prêt.',
          }),
          explanation:
            'Un contrat doit préciser clairement ce qui est échangé, à quel prix et à quelle date.',
        },
        {
          kind: 'multiple',
          prompt: 'Parmi ces principes, lesquels caractérisent la finance islamique ?',
          answers: [
            {
              text: 'L’adossement à des actifs réels',
              correct: true,
              feedback: 'Oui : chaque financement repose sur un bien, un service ou un projet.',
            },
            {
              text: 'Le partage des risques',
              correct: true,
              feedback: 'Oui : le profit se justifie par la prise de risque.',
            },
            {
              text: 'La garantie d’un rendement fixe sur tout dépôt',
              feedback:
                'Non : seul le capital des comptes courants est garanti, sans rémunération.',
            },
          ],
          explanation:
            'Les cinq principes sont : pas de riba, pas de gharar, pas de maysir, adossement à des actifs réels, partage des risques.',
        },
      ],
    },
    {
      key: 'final',
      title: 'Évaluation finale : les bases de la finance islamique',
      instructions:
        'Cinq questions sur l’ensemble du cours. Seuil de réussite : 70 %. Trois tentatives.',
      passingScorePercent: 70,
      maxAttempts: 3,
      questions: [
        {
          kind: 'single',
          prompt:
            'Dans une mourabaha, que doit faire la banque avant de revendre le bien au client ?',
          answers: [
            {
              text: 'L’acheter et en devenir propriétaire',
              correct: true,
              feedback: 'Exact : on ne peut vendre que ce que l’on possède.',
            },
            {
              text: 'Verser l’argent directement au client',
              feedback: 'Non : ce serait un prêt d’argent avec surplus, donc du riba.',
            },
            {
              text: 'Fixer une marge variable selon le taux du marché',
              feedback: 'Non : le prix total est fixé à la signature.',
            },
          ],
          explanation:
            'La mourabaha suppose l’achat effectif du bien par la banque, puis sa revente avec une marge connue.',
        },
        {
          kind: 'true-false',
          prompt:
            'Dans une mourabaha, la banque peut augmenter le prix si le client paie en retard.',
          answers: trueFalse(false, {
            onTrue:
              'Non : le prix est fixé à la signature. Une augmentation pour retard serait du riba.',
            onFalse:
              'Exact : le prix ne change pas. Un éventuel engagement de don ne profite pas à la banque.',
          }),
          explanation:
            'La créance née de la vente ne peut pas produire de surplus au profit du vendeur.',
        },
        {
          kind: 'single',
          prompt: 'Dans une ijara, qui supporte les risques liés à la propriété du bien ?',
          answers: [
            {
              text: 'La banque, propriétaire du bien',
              correct: true,
              feedback: 'Exact : le bailleur reste propriétaire et en supporte les risques.',
            },
            {
              text: 'Le client, locataire',
              feedback:
                'Non : le locataire entretient le bien au quotidien, mais les risques de propriété restent au bailleur.',
            },
          ],
          explanation:
            'Le loyer rémunère l’usage du bien ; le bailleur assume en contrepartie les risques de propriétaire.',
        },
        {
          kind: 'single',
          prompt:
            'Dans une moudaraba, qui supporte une perte financière en l’absence de faute du gestionnaire ?',
          answers: [
            {
              text: 'L’apporteur de capitaux',
              correct: true,
              feedback:
                'Exact : le gestionnaire perd la valeur de son travail, l’apporteur perd le capital.',
            },
            {
              text: 'Le gestionnaire',
              feedback:
                'Non : sauf faute ou négligence, le gestionnaire ne rembourse pas le capital.',
            },
            {
              text: 'Les deux, à parts égales',
              feedback:
                'Non : la répartition des pertes ne suit pas la clé de partage des profits.',
            },
          ],
          explanation:
            'En moudaraba, les profits suivent la clé convenue, les pertes financières reviennent à l’apporteur de capitaux.',
        },
        {
          kind: 'multiple',
          prompt: 'Quels contrats reposent sur le partage des profits et des pertes ?',
          answers: [
            {
              text: 'Moucharaka',
              correct: true,
              feedback: 'Oui : c’est un contrat d’association.',
            },
            {
              text: 'Moudaraba',
              correct: true,
              feedback: 'Oui : capital d’un côté, travail de l’autre.',
            },
            { text: 'Mourabaha', feedback: 'Non : c’est une vente avec marge connue.' },
            { text: 'Ijara', feedback: 'Non : c’est une location.' },
          ],
          explanation:
            'Moucharaka et moudaraba sont des contrats de partenariat ; mourabaha et ijara sont des contrats d’échange.',
        },
      ],
    },
  ],
  seo: {
    title: 'Cours en ligne : les bases de la finance islamique',
    description:
      'Principes, mourabaha, ijara, moucharaka et moudaraba expliqués par l’exemple. Cours en ligne avec quiz et certificat, à suivre sur mobile.',
  },
}

export const banqueParticipative: CourseSeed = {
  slug: 'banque-participative',
  title: 'Banque participative : produits et fonctionnement',
  subtitle:
    'Comptes, financements, comptabilité et gouvernance d’une banque ou d’une fenêtre islamique',
  summary:
    'Comment fonctionne une banque participative : comptes de dépôt et d’investissement, financements, traitement comptable selon les normes AAOIFI, gouvernance et risques propres.',
  description: [
    'Ce cours s’adresse aux professionnels de la banque et de la microfinance, aux étudiants en finance et aux porteurs de projet de fenêtre islamique.',
    h2('Au programme'),
    ul(
      'le bilan d’une banque participative et ses différences avec une banque conventionnelle ;',
      'les comptes courants et les comptes d’investissement ;',
      'le financement de l’immobilier et des équipements ;',
      'les principes de comptabilisation selon les normes AAOIFI ;',
      'la gouvernance charia et les risques spécifiques.',
    ),
    ...descriptionFooter(),
  ],
  format: 'course',
  audience: 'individual',
  level: 'intermediate',
  themes: ['banque-participative', 'reglementation'],
  instructors: ['mariam', 'hamadou'],
  objectives: [
    'Décrire le bilan d’une banque participative.',
    'Distinguer compte courant et compte d’investissement.',
    'Comparer mourabaha, ijara et moucharaka dégressive pour un financement immobilier.',
    'Appliquer les principes de comptabilisation AAOIFI à une mourabaha.',
    'Identifier les risques propres à une fenêtre islamique.',
  ],
  prerequisites:
    'Avoir suivi « Les bases de la finance islamique » ou connaître les principaux contrats.',
  featured: true,
  includedInPass: true,
  certificateEnabled: true,
  modules: [
    {
      title: 'Fonctionnement d’une banque participative',
      description: 'Ressources, emplois et organisation.',
      lessons: [
        {
          type: 'video',
          slug: 'bilan-banque-participative',
          title: 'Lire le bilan d’une banque participative',
          minutes: 10,
          preview: true,
          transcript: [
            'À l’actif, des créances nées de ventes, des biens loués et des participations. Au passif, des comptes courants et des comptes d’investissement dont la rémunération dépend des résultats.',
            'Nous comparons ce bilan à celui d’une banque conventionnelle, poste par poste.',
          ],
        },
        {
          type: 'text',
          slug: 'comptes-depots',
          title: 'Comptes courants et comptes d’investissement',
          minutes: 12,
          preview: true,
          body: [
            h2('Le compte courant'),
            'Le compte courant fonctionne comme un dépôt à vue : la banque garantit le remboursement du capital et ne verse aucune rémunération.',
            h2('Le compte d’investissement'),
            'Le compte d’investissement repose le plus souvent sur une moudaraba : le déposant confie ses fonds à la banque, qui les investit. Il reçoit une part des profits selon une clé convenue. Le capital n’est pas garanti contractuellement.',
            h2('Les réserves de lissage'),
            'Pour éviter des variations trop fortes de rémunération, certaines banques constituent des réserves, dont l’usage doit être encadré et expliqué aux déposants.',
          ],
        },
        {
          type: 'video',
          slug: 'fenetre-islamique',
          title: 'La fenêtre islamique d’une banque conventionnelle',
          minutes: 12,
          transcript: [
            'Une fenêtre islamique permet à une banque conventionnelle de proposer des produits conformes. La condition essentielle est la séparation des fonds : ressources, emplois et résultats de la fenêtre ne se mélangent pas avec ceux de l’activité conventionnelle.',
            'Nous détaillons l’organisation type : comité de conformité, contrôle charia, comptabilité séparée, formation des équipes.',
          ],
        },
      ],
    },
    {
      title: 'Les produits de financement',
      description: 'Immobilier, équipement et traitement comptable.',
      lessons: [
        {
          type: 'video',
          slug: 'financement-immobilier',
          title: 'Financer un logement : trois montages',
          minutes: 12,
          transcript: [
            'Mourabaha immobilière, ijara avec transfert de propriété, moucharaka dégressive : chaque montage répartit différemment la propriété et les risques.',
            'Nous comparons les trois pour un même logement à Yaoundé, sur la durée, le coût et les obligations de chaque partie.',
          ],
          resources: [
            {
              label: 'Grille de comparaison des produits (PDF)',
              pdf: { title: 'Grille de comparaison des produits', file: 'grille-produits' },
            },
          ],
        },
        {
          type: 'text',
          slug: 'comptabilisation-aaoifi',
          title: 'Comptabiliser une mourabaha et une ijara selon l’AAOIFI',
          minutes: 15,
          body: [
            'L’AAOIFI (Accounting and Auditing Organization for Islamic Financial Institutions) publie des normes comptables, de gouvernance et d’audit propres aux institutions financières islamiques.',
            h2('La mourabaha'),
            'Le bien acheté figure d’abord en stock chez la banque. À la vente, la banque enregistre une créance sur le client. La marge n’est pas reconnue d’un coup : elle est étalée sur la durée du financement.',
            h2('L’ijara'),
            'Le bien loué reste à l’actif de la banque et il est amorti. Les loyers sont reconnus en produits sur la durée du contrat.',
            h2('Les revenus non conformes'),
            'Un revenu jugé non conforme par le comité n’est pas conservé en résultat : il est isolé puis affecté à des œuvres caritatives.',
            'Les numéros et versions des normes applicables sont à vérifier sur le site de l’AAOIFI au moment de la mise en œuvre.',
          ],
        },
        {
          type: 'case-study',
          slug: 'cas-equipement-pme',
          title: 'Étude de cas : l’équipement d’une PME de transformation',
          minutes: 20,
          body: [
            h2('La situation'),
            'Une PME de Bafoussam qui transforme du manioc veut acquérir une ligne de séchage de 18 000 000 XAF. Elle prévoit de rembourser sur quatre ans à partir de ses ventes. (Cas fictif.)',
            h2('Votre mission'),
            ul(
              'Comparez une mourabaha et une ijara avec transfert de propriété pour ce besoin.',
              'Indiquez qui assure la ligne de séchage dans chaque montage.',
              'Listez les documents à demander à la PME.',
            ),
            h2('Pistes de corrigé'),
            'En mourabaha, la PME devient propriétaire dès la vente et assume les risques du bien. En ijara, la banque reste propriétaire jusqu’au transfert et supporte les risques de propriété ; l’assurance du bien lui incombe en principe, de préférence auprès d’un assureur takaful.',
          ],
        },
        {
          type: 'pdf',
          slug: 'grille-produits',
          title: 'Grille de comparaison des produits',
          minutes: 5,
          pdf: { title: 'Grille de comparaison des produits', file: 'grille-produits' },
        },
      ],
    },
    {
      title: 'Gouvernance et risques',
      description: 'Qui valide, qui contrôle, et ce qui peut mal tourner.',
      lessons: [
        {
          type: 'video',
          slug: 'gouvernance-charia',
          title: 'La gouvernance charia d’un établissement',
          minutes: 10,
          transcript: [
            'Le comité de conformité charia valide les produits et les contrats types. Le contrôle charia interne vérifie leur application au quotidien. L’audit charia, interne ou externe, évalue périodiquement l’ensemble.',
            'Nous voyons comment ces trois niveaux s’articulent avec la direction générale et le conseil d’administration.',
          ],
        },
        {
          type: 'text',
          slug: 'risques-specifiques',
          title: 'Les risques propres à la banque participative',
          minutes: 12,
          body: [
            'Une banque participative est exposée aux risques bancaires habituels, et à quelques risques propres.',
            ul(
              '**Risque de non-conformité** : une opération jugée non conforme peut entraîner la purification des revenus et une atteinte à la réputation.',
              '**Risque commercial déplacé** : la pression pour servir aux déposants une rémunération comparable au marché, même quand les résultats sont plus faibles.',
              '**Risque de propriété** : en ijara ou en mourabaha, la banque détient des biens et en supporte les risques.',
              '**Risque de liquidité** : les instruments de placement conformes à court terme restent peu nombreux.',
            ),
          ],
        },
        {
          type: 'quiz',
          slug: 'evaluation-finale',
          title: 'Évaluation finale',
          minutes: 10,
          quiz: 'final',
        },
      ],
    },
  ],
  quizzes: [
    {
      key: 'final',
      title: 'Évaluation finale : banque participative',
      instructions:
        'Cinq questions sur l’ensemble du cours. Seuil de réussite : 70 %. Trois tentatives.',
      passingScorePercent: 70,
      maxAttempts: 3,
      questions: [
        {
          kind: 'single',
          prompt:
            'Dans une banque participative, le compte d’investissement fondé sur une moudaraba :',
          answers: [
            {
              text: 'rémunère le déposant selon les résultats, sans garantie contractuelle du capital',
              correct: true,
              feedback: 'Exact : le déposant est apporteur de capitaux.',
            },
            {
              text: 'verse un taux fixé à l’avance',
              feedback: 'Non : un rendement fixé à l’avance sur un dépôt serait du riba.',
            },
            {
              text: 'garantit le capital et ne rapporte rien',
              feedback: 'Non : c’est la description du compte courant.',
            },
          ],
          explanation:
            'Compte courant : capital garanti, pas de rémunération. Compte d’investissement : participation aux résultats.',
        },
        {
          kind: 'true-false',
          prompt:
            'Une fenêtre islamique peut mélanger ses ressources avec celles de l’activité conventionnelle si les comptes sont présentés séparément en fin d’année.',
          answers: trueFalse(false, {
            onTrue:
              'Non : la séparation des fonds s’applique en permanence, pas seulement dans la présentation des comptes.',
            onFalse: 'Exact : ressources, emplois et résultats restent séparés en permanence.',
          }),
          explanation:
            'La séparation des fonds est la condition première d’une fenêtre islamique crédible.',
        },
        {
          kind: 'single',
          prompt:
            'Selon les principes AAOIFI, la marge d’une mourabaha à paiement échelonné est reconnue :',
          answers: [
            {
              text: 'progressivement, sur la durée du financement',
              correct: true,
              feedback: 'Exact : la marge est étalée.',
            },
            {
              text: 'en totalité le jour de la vente',
              feedback: 'Non : la reconnaissance immédiate ne reflète pas la durée du financement.',
            },
            {
              text: 'uniquement au dernier paiement',
              feedback: 'Non : la marge est étalée sur toute la durée.',
            },
          ],
          explanation: 'La marge différée est reconnue au fil du temps, en fonction des échéances.',
        },
        {
          kind: 'multiple',
          prompt:
            'Quels risques sont propres, ou particulièrement marqués, dans une banque participative ?',
          answers: [
            {
              text: 'Le risque de non-conformité',
              correct: true,
              feedback: 'Oui : il est spécifique à l’activité.',
            },
            {
              text: 'Le risque commercial déplacé',
              correct: true,
              feedback: 'Oui : il naît de la rémunération variable des comptes d’investissement.',
            },
            {
              text: 'Le risque de propriété des biens financés',
              correct: true,
              feedback: 'Oui : la banque détient réellement des biens.',
            },
          ],
          explanation:
            'Ces trois risques s’ajoutent aux risques bancaires habituels (crédit, liquidité, opérationnel).',
        },
        {
          kind: 'single',
          prompt: 'Que devient un revenu jugé non conforme par le comité de conformité ?',
          answers: [
            {
              text: 'Il est isolé puis affecté à des œuvres caritatives',
              correct: true,
              feedback: 'Exact : c’est la purification des revenus.',
            },
            {
              text: 'Il est conservé en réserve pour lisser les rémunérations',
              feedback: 'Non : un revenu non conforme ne profite ni à la banque ni aux déposants.',
            },
            {
              text: 'Il est reversé aux actionnaires',
              feedback: 'Non : il ne peut pas être conservé par l’établissement.',
            },
          ],
          explanation:
            'La purification évite que l’établissement ou ses clients tirent profit d’un revenu non conforme.',
        },
      ],
    },
  ],
  seo: {
    title: 'Cours : banque participative, produits et gouvernance',
    description:
      'Comptes, financements, comptabilité AAOIFI, gouvernance charia et risques d’une banque participative ou d’une fenêtre islamique. Cours en ligne.',
  },
}

export const ethiqueDesAffaires: CourseSeed = {
  slug: 'ethique-des-affaires',
  title: 'Éthique des affaires et finance islamique',
  subtitle: 'Transparence, loyauté et responsabilité dans les pratiques commerciales',
  summary:
    'Les règles éthiques qui encadrent le commerce et la finance islamiques : transparence des contrats, vente loyale, conflits d’intérêts et responsabilité envers les parties prenantes.',
  description: [
    'Ce cours s’adresse aux entrepreneurs, aux commerciaux, aux dirigeants et à toute personne qui veut ancrer sa pratique professionnelle dans des principes clairs.',
    h2('Au programme'),
    ul(
      'la notion d’amana et la confiance dans les relations d’affaires ;',
      'la transparence des contrats et la vente loyale ;',
      'les conflits d’intérêts et leur prévention ;',
      'la responsabilité envers les salariés, les fournisseurs et les clients.',
    ),
    ...descriptionFooter(),
  ],
  format: 'course',
  audience: 'individual',
  level: 'beginner',
  themes: ['ethique-des-affaires'],
  instructors: ['ibrahim'],
  objectives: [
    'Expliquer les principes éthiques qui encadrent les transactions.',
    'Identifier les pratiques commerciales trompeuses.',
    'Prévenir et déclarer un conflit d’intérêts.',
    'Rédiger les premiers engagements d’une charte éthique.',
  ],
  prerequisites: 'Aucun prérequis.',
  featured: false,
  includedInPass: true,
  certificateEnabled: true,
  modules: [
    {
      title: 'Les fondements',
      description: 'Confiance, transparence et consentement.',
      lessons: [
        {
          type: 'video',
          slug: 'amana-confiance',
          title: 'L’amana : la confiance comme fondement',
          minutes: 8,
          preview: true,
          transcript: [
            'L’amana désigne à la fois le dépôt confié et la loyauté de celui qui le reçoit. Dans les affaires, elle fonde les obligations du mandataire, du gestionnaire et du vendeur.',
            'Nous voyons comment ce principe se traduit concrètement dans la gestion des fonds d’autrui et dans la relation client.',
          ],
        },
        {
          type: 'text',
          slug: 'transparence-contrats',
          title: 'Transparence et consentement dans les contrats',
          minutes: 10,
          preview: true,
          body: [
            'Un contrat valide suppose le consentement libre et éclairé des parties. Ce consentement n’existe que si chacun dispose des informations utiles.',
            h2('Ce qui doit être clair'),
            ul(
              'l’objet du contrat et ses caractéristiques ;',
              'le prix total et les modalités de paiement ;',
              'les obligations de chaque partie et les conséquences d’un manquement.',
            ),
            'Une information cachée ou présentée de façon trompeuse vicie le consentement, même si le contrat est signé.',
          ],
        },
      ],
    },
    {
      title: 'Pratiques commerciales',
      description: 'Vendre loyalement et éviter les conflits d’intérêts.',
      lessons: [
        {
          type: 'video',
          slug: 'vente-loyale',
          title: 'La vente loyale',
          minutes: 10,
          transcript: [
            'Le vendeur doit signaler les défauts connus du bien. Sont proscrites la tromperie sur la marchandise, les fausses enchères destinées à faire monter le prix et la rétention de stock pour créer une pénurie.',
            'Nous transposons ces règles anciennes aux pratiques actuelles : publicité, vente en ligne, promotions.',
          ],
        },
        {
          type: 'case-study',
          slug: 'cas-promotion',
          title: 'Étude de cas : une promotion trop pressante',
          minutes: 15,
          body: [
            h2('La situation'),
            'Une boutique en ligne de Douala prépare une campagne : compte à rebours de 24 heures relancé chaque jour, mention « plus que 3 articles » affichée en permanence, frais cachés révélés à la dernière étape. (Cas fictif.)',
            h2('Les questions'),
            ul(
              'Quelles pratiques posent problème, et pourquoi ?',
              'Que proposeriez-vous à la place ?',
            ),
            h2('Pistes de corrigé'),
            'Le faux compte à rebours et la fausse rareté trompent le client sur les conditions réelles de la vente ; les frais cachés faussent le prix. Une promotion loyale indique une date de fin réelle, un stock exact et le prix total dès le départ.',
          ],
        },
        {
          type: 'text',
          slug: 'conflits-interets',
          title: 'Prévenir les conflits d’intérêts',
          minutes: 10,
          body: [
            'Un conflit d’intérêts existe quand un intérêt personnel peut influencer une décision prise pour le compte d’autrui.',
            h2('Trois réflexes'),
            ul(
              '**Déclarer** : signaler la situation avant toute décision.',
              '**S’abstenir** : ne pas participer à la décision concernée.',
              '**Tracer** : consigner la déclaration et la décision prise.',
            ),
          ],
        },
      ],
    },
    {
      title: 'Responsabilité de l’entreprise',
      description: 'Salariés, fournisseurs, clients : les droits de chacun.',
      lessons: [
        {
          type: 'video',
          slug: 'parties-prenantes',
          title: 'Les droits des parties prenantes',
          minutes: 10,
          transcript: [
            'Payer les salaires à l’échéance, respecter les délais convenus avec les fournisseurs, traiter les réclamations des clients : l’éthique des affaires se juge d’abord sur ces gestes simples.',
            'Nous proposons une grille pour évaluer les pratiques de votre organisation.',
          ],
        },
        {
          type: 'pdf',
          slug: 'charte-ethique',
          title: 'Modèle de charte éthique',
          minutes: 5,
          pdf: { title: 'Modèle de charte éthique', file: 'charte-ethique' },
        },
        {
          type: 'quiz',
          slug: 'evaluation-finale',
          title: 'Évaluation finale',
          minutes: 8,
          quiz: 'final',
        },
      ],
    },
  ],
  quizzes: [
    {
      key: 'final',
      title: 'Évaluation finale : éthique des affaires',
      instructions:
        'Cinq questions sur l’ensemble du cours. Seuil de réussite : 70 %. Recommencez autant que nécessaire.',
      passingScorePercent: 70,
      maxAttempts: 0,
      questions: [
        {
          kind: 'single',
          prompt: 'Que désigne l’amana dans les relations d’affaires ?',
          answers: [
            {
              text: 'La loyauté de celui à qui un bien ou une mission est confié',
              correct: true,
              feedback: 'Exact : l’amana est à la fois le dépôt et la loyauté du dépositaire.',
            },
            {
              text: 'Une garantie de rendement',
              feedback: 'Non : l’amana ne garantit aucun rendement.',
            },
            {
              text: 'Un type de contrat de vente',
              feedback: 'Non : c’est un principe, pas un contrat de vente.',
            },
          ],
          explanation:
            'Le dépositaire ou le gestionnaire agit dans l’intérêt de celui qui lui a fait confiance.',
        },
        {
          kind: 'multiple',
          prompt: 'Quelles pratiques sont contraires à la vente loyale ?',
          answers: [
            {
              text: 'Un compte à rebours relancé chaque jour',
              correct: true,
              feedback: 'Oui : la date de fin annoncée est fausse.',
            },
            {
              text: 'Une mention de stock limité inexacte',
              correct: true,
              feedback: 'Oui : c’est une fausse rareté.',
            },
            {
              text: 'L’affichage du prix total dès la première page',
              feedback: 'Non : c’est au contraire une bonne pratique.',
            },
          ],
          explanation:
            'Toute information trompeuse sur le prix, le stock ou la durée d’une offre vicie le consentement du client.',
        },
        {
          kind: 'true-false',
          prompt:
            'Un contrat signé reste parfaitement loyal même si une information essentielle a été cachée à l’acheteur.',
          answers: trueFalse(false, {
            onTrue: 'Non : une information cachée vicie le consentement, même après signature.',
            onFalse: 'Exact : le consentement suppose une information complète.',
          }),
          explanation:
            'La signature ne couvre pas un défaut d’information sur un élément essentiel.',
        },
        {
          kind: 'single',
          prompt: 'Face à un conflit d’intérêts, quel est le premier réflexe ?',
          answers: [
            {
              text: 'Le déclarer avant toute décision',
              correct: true,
              feedback: 'Exact : la déclaration vient en premier.',
            },
            {
              text: 'Décider rapidement pour limiter l’exposition',
              feedback: 'Non : décider seul aggrave le conflit.',
            },
            {
              text: 'Attendre qu’un collègue le remarque',
              feedback: 'Non : la responsabilité de déclarer est personnelle.',
            },
          ],
          explanation: 'Déclarer, s’abstenir, tracer : dans cet ordre.',
        },
        {
          kind: 'true-false',
          prompt:
            'Payer les salaires et les fournisseurs à l’échéance convenue relève de l’éthique des affaires.',
          answers: trueFalse(true, {
            onTrue:
              'Exact : respecter ses engagements envers les parties prenantes en est le cœur.',
            onFalse:
              'Non : le respect des échéances est une obligation éthique autant que contractuelle.',
          }),
          explanation:
            'L’éthique des affaires se juge d’abord sur le respect des engagements pris.',
        },
      ],
    },
  ],
  seo: {
    title: 'Cours : éthique des affaires et finance islamique',
    description:
      'Transparence des contrats, vente loyale, conflits d’intérêts et responsabilité de l’entreprise. Cours en ligne avec quiz et certificat.',
  },
}
