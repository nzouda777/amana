/**
 * Cours pour particuliers (2/2) : takaful, audit de conformité charia, sukuk.
 * Contenus FICTIFS de démonstration. TODO(client) : programmes, textes et vidéos réels,
 * relus par l'équipe pédagogique et le comité de conformité.
 */
import { h2, p, ul } from '../lib/richtext'
import { descriptionFooter, trueFalse } from './shared'
import type { CourseSeed } from './types'

export const takaful: CourseSeed = {
  slug: 'takaful-assurance-islamique',
  title: 'Takaful : comprendre l’assurance islamique',
  subtitle: 'Principes, modèles de gestion et lecture d’une offre',
  summary:
    'Le fonctionnement du takaful : contributions solidaires, séparation des fonds, modèles wakala et moudaraba, traitement des excédents, et les questions à poser avant de souscrire.',
  description: [
    'Ce cours s’adresse aux particuliers qui envisagent une couverture takaful, aux professionnels de l’assurance et aux responsables des ressources humaines.',
    h2('Au programme'),
    ul(
      'pourquoi l’assurance conventionnelle pose question au regard de la charia ;',
      'le principe de la contribution solidaire (tabarru) et la séparation des fonds ;',
      'les modèles wakala, moudaraba et hybride ;',
      'le sort des excédents et la couverture des déficits ;',
      'les points de vigilance à la lecture d’une offre.',
    ),
    p(
      'Le cabinet ne commercialise pas de contrats d’assurance : ce cours vous donne les clés pour comparer les offres, pas une recommandation de produit.',
    ),
    ...descriptionFooter(),
  ],
  format: 'course',
  audience: 'individual',
  level: 'beginner',
  themes: ['takaful'],
  instructors: ['clarisse'],
  objectives: [
    'Expliquer le principe d’entraide sur lequel repose le takaful.',
    'Distinguer le fonds des participants et le fonds de l’opérateur.',
    'Comparer les modèles wakala, moudaraba et hybride.',
    'Lire une offre takaful et repérer les points de vigilance.',
  ],
  prerequisites: 'Aucun prérequis. Des notions de finance islamique facilitent le suivi.',
  featured: true,
  includedInPass: true,
  certificateEnabled: true,
  modules: [
    {
      title: 'Les principes du takaful',
      description: 'Entraide, contributions et séparation des fonds.',
      lessons: [
        {
          type: 'video',
          slug: 'assurance-et-charia',
          title: 'L’assurance au regard de la charia',
          minutes: 10,
          preview: true,
          transcript: [
            'Dans l’assurance conventionnelle, l’assuré achète une garantie à l’assureur. Les savants y relèvent du gharar, du maysir et, dans le placement des primes, du riba.',
            'Le takaful répond à ces objections en organisant une entraide entre participants plutôt qu’une vente de garantie.',
          ],
        },
        {
          type: 'text',
          slug: 'tabarru-fonds-participants',
          title: 'La contribution solidaire et le fonds des participants',
          minutes: 12,
          preview: true,
          body: [
            'Chaque participant verse une contribution, dont tout ou partie est un don (tabarru) au fonds commun des participants. Ce fonds indemnise les participants qui subissent un sinistre.',
            h2('Deux fonds distincts'),
            ul(
              '**Le fonds des participants** reçoit les contributions et paie les sinistres.',
              '**Le fonds de l’opérateur** reçoit la rémunération de la société qui gère le fonds.',
            ),
            'L’opérateur gère le fonds des participants pour leur compte ; il n’en est pas propriétaire.',
          ],
        },
        {
          type: 'video',
          slug: 'separation-fonds',
          title: 'Pourquoi la séparation des fonds est essentielle',
          minutes: 10,
          transcript: [
            'La séparation des fonds garantit que les contributions servent d’abord à l’entraide entre participants. Elle se vérifie dans les comptes, les placements et les procédures.',
            'Nous montrons comment un auditeur la contrôle concrètement.',
          ],
        },
      ],
    },
    {
      title: 'Les modèles de gestion',
      description: 'Comment l’opérateur est rémunéré, et ce que deviennent les excédents.',
      lessons: [
        {
          type: 'video',
          slug: 'modele-wakala',
          title: 'Le modèle wakala',
          minutes: 12,
          transcript: [
            'Dans le modèle wakala, l’opérateur agit comme mandataire des participants. Il perçoit des frais de gestion fixés à l’avance et annoncés dans le contrat.',
            'Les résultats techniques du fonds, positifs ou négatifs, restent aux participants.',
          ],
          resources: [
            {
              label: 'Schéma des flux d’un takaful (PDF)',
              pdf: { title: 'Schéma des flux d’un takaful', file: 'schema-flux' },
            },
          ],
        },
        {
          type: 'video',
          slug: 'modele-moudaraba-hybride',
          title: 'Les modèles moudaraba et hybride',
          minutes: 12,
          transcript: [
            'Dans le modèle moudaraba, l’opérateur est rémunéré par une part des profits issus du placement des fonds. Le modèle hybride, le plus répandu, combine des frais de gestion (wakala) et une part des profits de placement (moudaraba).',
            'Nous comparons les incitations de l’opérateur dans chaque modèle.',
          ],
        },
        {
          type: 'text',
          slug: 'excedent-deficit',
          title: 'Excédent et déficit du fonds',
          minutes: 10,
          body: [
            h2('L’excédent'),
            'Lorsque les contributions dépassent les sinistres, les frais et les provisions, le fonds dégage un excédent. Il peut être redistribué aux participants, conservé en réserve ou affecté selon les règles annoncées dans le contrat.',
            h2('Le déficit'),
            'Lorsque le fonds ne suffit pas, l’opérateur peut lui consentir un prêt sans intérêt (qard hassan), remboursé sur les excédents futurs.',
          ],
        },
        {
          type: 'pdf',
          slug: 'schema-flux',
          title: 'Schéma des flux d’un takaful',
          minutes: 5,
          pdf: { title: 'Schéma des flux d’un takaful', file: 'schema-flux' },
        },
      ],
    },
    {
      title: 'Lire une offre takaful',
      description: 'Une étude de cas et une liste de questions à poser.',
      lessons: [
        {
          type: 'case-study',
          slug: 'cas-couverture-salaries',
          title: 'Étude de cas : couvrir les salariés d’une PME',
          minutes: 15,
          body: [
            h2('La situation'),
            'Une PME de Garoua emploie 40 salariés et souhaite une couverture santé conforme. Deux offres takaful lui sont proposées : l’une en modèle wakala avec des frais de 25 % des contributions, l’autre en modèle hybride. (Cas fictif.)',
            h2('Les questions'),
            ul(
              'Quelles informations manquent pour comparer les deux offres ?',
              'Comment chaque opérateur est-il rémunéré ?',
              'Que prévoit chaque contrat en cas d’excédent ?',
            ),
            h2('Pistes de corrigé'),
            'Il faut connaître le détail des frais, la règle de partage des profits de placement, la politique de redistribution des excédents et l’avis du comité de conformité de chaque opérateur. La comparaison ne se limite pas au montant des contributions.',
          ],
        },
        {
          type: 'text',
          slug: 'points-vigilance',
          title: 'Les points de vigilance avant de souscrire',
          minutes: 10,
          body: [
            'Avant de souscrire, demandez :',
            ul(
              'le modèle de gestion et le niveau des frais ;',
              'la règle d’affectation des excédents ;',
              'la politique de placement du fonds des participants ;',
              'l’avis du comité de conformité de l’opérateur et sa date ;',
              'les exclusions de garantie et les délais d’indemnisation.',
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
      title: 'Évaluation finale : takaful',
      instructions:
        'Cinq questions sur l’ensemble du cours. Seuil de réussite : 70 %. Trois tentatives.',
      passingScorePercent: 70,
      maxAttempts: 3,
      questions: [
        {
          kind: 'single',
          prompt: 'Sur quel principe repose le takaful ?',
          answers: [
            {
              text: 'L’entraide entre participants qui alimentent un fonds commun',
              correct: true,
              feedback: 'Exact : les participants s’indemnisent mutuellement.',
            },
            {
              text: 'La vente d’une garantie par l’assureur',
              feedback: 'Non : c’est le principe de l’assurance conventionnelle.',
            },
            {
              text: 'Un placement à rendement garanti',
              feedback: 'Non : le takaful n’est pas un produit de placement garanti.',
            },
          ],
          explanation:
            'Les contributions alimentent un fonds des participants, qui indemnise ceux qui subissent un sinistre.',
        },
        {
          kind: 'true-false',
          prompt: 'L’opérateur takaful est propriétaire du fonds des participants.',
          answers: trueFalse(false, {
            onTrue: 'Non : l’opérateur gère le fonds pour le compte des participants.',
            onFalse: 'Exact : il le gère sans en être propriétaire.',
          }),
          explanation: 'Le fonds des participants et le fonds de l’opérateur sont distincts.',
        },
        {
          kind: 'single',
          prompt: 'Dans le modèle wakala, l’opérateur est rémunéré par :',
          answers: [
            {
              text: 'des frais de gestion fixés à l’avance',
              correct: true,
              feedback: 'Exact : il agit comme mandataire.',
            },
            {
              text: 'une part des profits de placement uniquement',
              feedback: 'Non : c’est le modèle moudaraba.',
            },
            {
              text: 'l’excédent technique du fonds',
              feedback: 'Non : l’excédent revient aux participants selon les règles du contrat.',
            },
          ],
          explanation:
            'Wakala : frais de gestion. Moudaraba : part des profits de placement. Hybride : les deux.',
        },
        {
          kind: 'single',
          prompt: 'Comment l’opérateur peut-il couvrir un déficit du fonds des participants ?',
          answers: [
            {
              text: 'Par un prêt sans intérêt (qard hassan), remboursé sur les excédents futurs',
              correct: true,
              feedback: 'Exact.',
            },
            { text: 'Par un prêt avec intérêt', feedback: 'Non : un intérêt serait du riba.' },
            {
              text: 'En augmentant rétroactivement les contributions',
              feedback: 'Non : les contributions passées ne sont pas modifiées.',
            },
          ],
          explanation: 'Le qard hassan permet de soutenir le fonds sans générer de riba.',
        },
        {
          kind: 'multiple',
          prompt: 'Quelles informations faut-il demander avant de comparer deux offres takaful ?',
          answers: [
            {
              text: 'Le modèle de gestion et le niveau des frais',
              correct: true,
              feedback: 'Oui.',
            },
            { text: 'La règle d’affectation des excédents', correct: true, feedback: 'Oui.' },
            {
              text: 'L’avis du comité de conformité de l’opérateur',
              correct: true,
              feedback: 'Oui.',
            },
            {
              text: 'Le seul montant de la contribution',
              feedback: 'Non : il ne suffit pas à comparer deux offres.',
            },
          ],
          explanation:
            'Le montant de la contribution ne dit rien de la gestion du fonds ni du sort des excédents.',
        },
      ],
    },
  ],
  seo: {
    title: 'Cours takaful : comprendre l’assurance islamique',
    description:
      'Principes du takaful, séparation des fonds, modèles wakala et moudaraba, excédents et lecture d’une offre. Cours en ligne avec certificat.',
  },
}

export const auditConformiteCharia: CourseSeed = {
  slug: 'audit-conformite-charia',
  title: 'Audit de conformité charia : méthode et pratique',
  subtitle: 'Planifier, tester, conclure : la démarche d’un auditeur charia',
  summary:
    'Une méthode complète d’audit charia : référentiels AAOIFI, planification, échantillonnage, tests de conformité, rédaction du rapport et suivi des recommandations.',
  description: [
    'Ce cours s’adresse aux auditeurs internes, aux responsables de la conformité, aux contrôleurs charia et aux experts-comptables.',
    h2('Au programme'),
    ul(
      'revue, contrôle et audit charia : qui fait quoi ;',
      'les référentiels de gouvernance et d’audit de l’AAOIFI ;',
      'la planification et l’échantillonnage ;',
      'les tests de conformité sur une mourabaha et une ijara ;',
      'la rédaction du rapport et la purification des revenus.',
    ),
    ...descriptionFooter(),
  ],
  format: 'course',
  audience: 'individual',
  level: 'advanced',
  themes: ['audit-conformite'],
  instructors: ['hamadou', 'mariam'],
  objectives: [
    'Situer l’audit charia par rapport à la revue et au contrôle charia.',
    'Construire un programme de travail fondé sur les risques.',
    'Conduire des tests de conformité sur un échantillon de contrats.',
    'Rédiger des constats et des recommandations actionnables.',
  ],
  prerequisites:
    'Connaître les principaux contrats de la finance islamique et les bases de l’audit. Le cours « Banque participative » est recommandé.',
  featured: false,
  includedInPass: true,
  certificateEnabled: true,
  modules: [
    {
      title: 'Le cadre de l’audit charia',
      description: 'Les niveaux de contrôle et les référentiels.',
      gateQuiz: 'cadre',
      lessons: [
        {
          type: 'video',
          slug: 'revue-controle-audit',
          title: 'Revue, contrôle et audit charia',
          minutes: 10,
          preview: true,
          transcript: [
            'La revue charia valide un produit avant son lancement. Le contrôle charia interne vérifie au quotidien l’application des décisions du comité. L’audit charia évalue périodiquement, de façon indépendante, l’ensemble du dispositif.',
            'Nous situons chaque niveau dans l’organisation et précisons ses livrables.',
          ],
        },
        {
          type: 'text',
          slug: 'referentiels',
          title: 'Les référentiels : AAOIFI et IFSB',
          minutes: 12,
          preview: true,
          body: [
            'Deux organismes internationaux publient l’essentiel des référentiels utilisés par les auditeurs.',
            h2('L’AAOIFI'),
            'L’AAOIFI publie des normes charia par contrat, des normes comptables, des normes de gouvernance (dont celles qui encadrent le comité de conformité et l’audit charia) et un code d’éthique.',
            h2('L’IFSB'),
            'L’IFSB (Islamic Financial Services Board) publie des principes prudentiels et de gouvernance destinés aux régulateurs.',
            'Le référentiel retenu pour une mission est précisé dans la lettre de mission, avec les décisions du comité de l’établissement audité.',
          ],
        },
        {
          type: 'quiz',
          slug: 'quiz-cadre',
          title: 'Quiz : le cadre de l’audit',
          minutes: 5,
          quiz: 'cadre',
        },
      ],
    },
    {
      title: 'Conduire une mission',
      description: 'De la planification aux tests.',
      lessons: [
        {
          type: 'video',
          slug: 'planifier-mission',
          title: 'Planifier une mission fondée sur les risques',
          minutes: 12,
          transcript: [
            'Une mission commence par la compréhension de l’activité : produits, volumes, systèmes, organisation. Cette analyse permet de classer les processus selon leur risque de non-conformité.',
            'Le programme de travail concentre les tests sur les processus les plus exposés.',
          ],
          resources: [
            {
              label: 'Programme de travail type (PDF)',
              pdf: { title: 'Programme de travail type', file: 'programme-travail' },
            },
          ],
        },
        {
          type: 'video',
          slug: 'echantillonner-contrats',
          title: 'Échantillonner les contrats',
          minutes: 12,
          transcript: [
            'Il est rarement possible de revoir tous les contrats. Nous présentons l’échantillonnage par strates (produit, agence, montant) et la documentation du choix.',
            'Un échantillon bien construit permet de conclure sur la population, à condition de documenter la méthode.',
          ],
        },
        {
          type: 'text',
          slug: 'tests-mourabaha',
          title: 'Tester une mourabaha : la liste de contrôle',
          minutes: 15,
          body: [
            'Pour chaque dossier de mourabaha de l’échantillon, l’auditeur vérifie :',
            ul(
              'la promesse d’achat du client, distincte de la vente ;',
              'la facture et la preuve que la banque a acquis le bien avant de le revendre ;',
              'la chronologie des dates : achat par la banque, puis vente au client ;',
              'le prix de vente, fixé à la signature et non indexé ;',
              'le traitement des retards : aucun revenu supplémentaire conservé par la banque.',
            ),
            'Chaque écart est documenté avec la pièce justificative et son incidence sur la conformité de l’opération.',
          ],
        },
        {
          type: 'pdf',
          slug: 'programme-travail',
          title: 'Programme de travail type',
          minutes: 5,
          pdf: { title: 'Programme de travail type', file: 'programme-travail' },
        },
      ],
    },
    {
      title: 'Constats et rapport',
      description: 'Qualifier un écart, recommander, suivre.',
      lessons: [
        {
          type: 'case-study',
          slug: 'cas-mourabaha-non-conforme',
          title: 'Étude de cas : une mourabaha signée trop tôt',
          minutes: 20,
          body: [
            h2('La situation'),
            'Lors d’un audit, vous constatez que 7 dossiers sur 40 portent une date de vente au client antérieure à la date de la facture d’achat de la banque. (Cas fictif.)',
            h2('Votre mission'),
            ul(
              'Qualifiez le constat et son niveau de gravité.',
              'Indiquez le traitement possible des revenus correspondants.',
              'Formulez une recommandation et un indicateur de suivi.',
            ),
            h2('Pistes de corrigé'),
            'La banque a vendu un bien qu’elle ne possédait pas encore : la condition essentielle de la mourabaha n’est pas remplie. Le traitement des revenus relève du comité de conformité de l’établissement, qui peut décider leur purification. La recommandation porte sur un blocage dans le système : la vente ne peut être saisie qu’après l’enregistrement de l’achat.',
          ],
        },
        {
          type: 'video',
          slug: 'rediger-rapport',
          title: 'Rédiger un rapport utile',
          minutes: 10,
          transcript: [
            'Un bon constat dit ce qui a été observé, la règle de référence, la cause et l’incidence. Une bonne recommandation désigne un responsable et une échéance.',
            'Nous relisons ensemble trois constats mal rédigés et les réécrivons.',
          ],
        },
        {
          type: 'text',
          slug: 'purification-suivi',
          title: 'Purification des revenus et suivi des recommandations',
          minutes: 10,
          body: [
            'Lorsque le comité conclut qu’un revenu est non conforme, ce revenu est isolé puis affecté à des œuvres caritatives. L’auditeur vérifie que la décision est appliquée et correctement comptabilisée.',
            'Le suivi des recommandations fait l’objet d’un tableau partagé avec la direction et le comité, revu à chaque réunion.',
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
      key: 'cadre',
      title: 'Quiz : le cadre de l’audit charia',
      instructions:
        'Trois questions. Seuil de réussite : 70 %. Ce quiz conditionne l’accès au module suivant.',
      passingScorePercent: 70,
      maxAttempts: 0,
      questions: [
        {
          kind: 'single',
          prompt: 'Quel niveau de contrôle valide un produit avant son lancement ?',
          answers: [
            {
              text: 'La revue charia',
              correct: true,
              feedback: 'Exact : elle intervient en amont.',
            },
            { text: 'L’audit charia', feedback: 'Non : l’audit évalue a posteriori.' },
            {
              text: 'Le contrôle charia interne',
              feedback: 'Non : il vérifie l’application au quotidien.',
            },
          ],
          explanation: 'Revue (avant), contrôle (pendant), audit (après, de façon indépendante).',
        },
        {
          kind: 'true-false',
          prompt:
            'L’AAOIFI publie des normes de gouvernance qui encadrent le comité de conformité et l’audit charia.',
          answers: trueFalse(true, {
            onTrue: 'Exact.',
            onFalse: 'Non : ces normes de gouvernance font partie des publications de l’AAOIFI.',
          }),
          explanation:
            'L’AAOIFI publie des normes charia, comptables, de gouvernance et d’éthique.',
        },
        {
          kind: 'single',
          prompt: 'Où est précisé le référentiel retenu pour une mission d’audit charia ?',
          answers: [
            { text: 'Dans la lettre de mission', correct: true, feedback: 'Exact.' },
            {
              text: 'Dans le rapport final uniquement',
              feedback: 'Non : il doit être fixé avant le début des travaux.',
            },
            {
              text: 'Nulle part : il est implicite',
              feedback: 'Non : un référentiel implicite rend les conclusions contestables.',
            },
          ],
          explanation:
            'Le référentiel et les décisions du comité de l’établissement sont fixés dès la lettre de mission.',
        },
      ],
    },
    {
      key: 'final',
      title: 'Évaluation finale : audit de conformité charia',
      instructions:
        'Cinq questions sur l’ensemble du cours. Seuil de réussite : 75 %. Trois tentatives.',
      passingScorePercent: 75,
      maxAttempts: 3,
      questions: [
        {
          kind: 'multiple',
          prompt: 'Lors du test d’une mourabaha, quels points l’auditeur vérifie-t-il ?',
          answers: [
            {
              text: 'La preuve que la banque a acquis le bien avant la vente',
              correct: true,
              feedback: 'Oui : c’est la condition essentielle.',
            },
            { text: 'Un prix de vente fixé à la signature', correct: true, feedback: 'Oui.' },
            {
              text: 'L’absence de revenu de retard conservé par la banque',
              correct: true,
              feedback: 'Oui.',
            },
            {
              text: 'L’indexation du prix sur un taux de marché',
              feedback: 'Non : un prix indexé après la vente n’est pas conforme.',
            },
          ],
          explanation:
            'Propriété préalable, prix fixe et traitement des retards sont les trois points clés.',
        },
        {
          kind: 'single',
          prompt: 'Sur quoi repose une planification fondée sur les risques ?',
          answers: [
            {
              text: 'Sur l’analyse des processus selon leur exposition au risque de non-conformité',
              correct: true,
              feedback: 'Exact.',
            },
            {
              text: 'Sur la revue exhaustive de tous les contrats',
              feedback: 'Non : c’est rarement possible et pas nécessaire.',
            },
            {
              text: 'Sur les processus les plus faciles à tester',
              feedback: 'Non : la facilité ne mesure pas le risque.',
            },
          ],
          explanation: 'Les tests se concentrent là où le risque est le plus élevé.',
        },
        {
          kind: 'true-false',
          prompt:
            'L’auditeur charia décide seul de la purification des revenus d’un établissement.',
          answers: trueFalse(false, {
            onTrue: 'Non : la décision relève du comité de conformité de l’établissement.',
            onFalse: 'Exact : l’auditeur constate et recommande, le comité décide.',
          }),
          explanation: 'L’auditeur vérifie ensuite que la décision du comité a été appliquée.',
        },
        {
          kind: 'single',
          prompt: 'Que doit contenir un constat d’audit bien rédigé ?',
          answers: [
            {
              text: 'L’observation, la règle de référence, la cause et l’incidence',
              correct: true,
              feedback: 'Exact.',
            },
            {
              text: 'Le nom des personnes fautives',
              feedback: 'Non : un constat porte sur un processus, pas sur des personnes.',
            },
            {
              text: 'Une appréciation générale sans pièce',
              feedback: 'Non : chaque constat s’appuie sur des pièces.',
            },
          ],
          explanation: 'Un constat complet permet à la direction de comprendre et de corriger.',
        },
        {
          kind: 'single',
          prompt:
            '7 dossiers sur 40 montrent une vente au client antérieure à l’achat par la banque. Quelle recommandation est la plus robuste ?',
          answers: [
            {
              text: 'Bloquer dans le système la saisie de la vente tant que l’achat n’est pas enregistré',
              correct: true,
              feedback: 'Exact : le contrôle devient automatique.',
            },
            {
              text: 'Rappeler la règle aux équipes par e-mail',
              feedback: 'Utile, mais insuffisant : rien n’empêche l’erreur de se reproduire.',
            },
            {
              text: 'Antidater les factures d’achat',
              feedback: 'Non : ce serait une falsification.',
            },
          ],
          explanation:
            'Une recommandation robuste corrige la cause, ici l’absence de contrôle bloquant.',
        },
      ],
    },
  ],
  seo: {
    title: 'Formation audit charia : méthode et pratique',
    description:
      'Référentiels AAOIFI, planification, tests de conformité, rapport et purification des revenus : la méthode complète de l’audit charia.',
  },
}

export const sukuk: CourseSeed = {
  slug: 'sukuk-marches-capitaux',
  title: 'Sukuk et marchés de capitaux islamiques',
  subtitle: 'Structures, émission et marché secondaire',
  summary:
    'Ce qui distingue un sukuk d’une obligation, les principales structures (ijara, moucharaka, wakala, mourabaha), les étapes d’une émission et les règles de négociation sur le marché secondaire.',
  description: [
    'Ce cours s’adresse aux professionnels des marchés, aux trésoriers, aux analystes et aux étudiants en finance.',
    h2('Au programme'),
    ul(
      'sukuk et obligations : la différence de nature ;',
      'les principales structures et leurs usages ;',
      'les acteurs et les étapes d’une émission ;',
      'la négociabilité et la gestion de la liquidité ;',
      'les risques pour l’investisseur.',
    ),
    ...descriptionFooter(),
  ],
  format: 'course',
  audience: 'individual',
  level: 'advanced',
  themes: ['marches-sukuk'],
  instructors: ['mariam'],
  objectives: [
    'Expliquer en quoi un sukuk diffère d’une obligation.',
    'Choisir une structure de sukuk selon l’actif disponible.',
    'Décrire les étapes et les acteurs d’une émission.',
    'Évaluer la négociabilité d’un sukuk sur le marché secondaire.',
  ],
  prerequisites:
    'Connaître les contrats de base de la finance islamique et le fonctionnement des obligations.',
  featured: false,
  includedInPass: true,
  certificateEnabled: true,
  modules: [
    {
      title: 'Comprendre les sukuk',
      description: 'Nature juridique et structures.',
      lessons: [
        {
          type: 'video',
          slug: 'sukuk-obligations',
          title: 'Sukuk et obligations : la différence',
          minutes: 10,
          preview: true,
          transcript: [
            'Une obligation est une créance : l’investisseur prête de l’argent et reçoit des intérêts. Un sukuk représente une part indivise de propriété dans des actifs, des usufruits, des services ou un projet.',
            'Le revenu du porteur de sukuk provient de ces actifs : loyers, profits, marges.',
          ],
        },
        {
          type: 'text',
          slug: 'structures',
          title: 'Les principales structures',
          minutes: 15,
          preview: true,
          body: [
            h2('Sukuk ijara'),
            'Les porteurs détiennent un actif loué ; ils perçoivent les loyers. C’est la structure la plus répandue.',
            h2('Sukuk moucharaka et moudaraba'),
            'Les porteurs participent à un projet ou à une activité et perçoivent une part des profits.',
            h2('Sukuk wakala'),
            'Un mandataire gère un portefeuille d’actifs pour le compte des porteurs, contre une rémunération.',
            h2('Sukuk mourabaha'),
            'Les porteurs détiennent une créance née d’une vente. Leur négociation est très encadrée, car céder une créance à un autre prix que sa valeur nominale reviendrait à du riba.',
          ],
        },
      ],
    },
    {
      title: 'Structurer une émission',
      description: 'Acteurs, étapes et documentation.',
      lessons: [
        {
          type: 'video',
          slug: 'acteurs-emission',
          title: 'Les acteurs d’une émission',
          minutes: 12,
          transcript: [
            'L’initiateur cède des actifs à une entité ad hoc qui émet les sukuk. Un représentant des porteurs défend leurs intérêts. Un comité de conformité valide la structure et la documentation. Arrangeurs, conseils et agences de notation complètent le dispositif.',
            'Nous précisons les responsabilités de chacun.',
          ],
        },
        {
          type: 'video',
          slug: 'etapes-sukuk-ijara',
          title: 'Les étapes d’un sukuk ijara',
          minutes: 12,
          transcript: [
            'Cession de l’actif à l’entité ad hoc, émission des sukuk, location de l’actif à l’initiateur, versement périodique des loyers aux porteurs, rachat de l’actif à l’échéance.',
            'Nous suivons chaque flux sur un schéma.',
          ],
          resources: [
            {
              label: 'Schéma d’un sukuk ijara (PDF)',
              pdf: { title: 'Schéma d’un sukuk ijara', file: 'schema-sukuk-ijara' },
            },
          ],
        },
        {
          type: 'pdf',
          slug: 'schema-sukuk-ijara',
          title: 'Schéma d’un sukuk ijara',
          minutes: 5,
          pdf: { title: 'Schéma d’un sukuk ijara', file: 'schema-sukuk-ijara' },
        },
        {
          type: 'case-study',
          slug: 'cas-sukuk-infrastructure',
          title: 'Étude de cas : financer une infrastructure par sukuk',
          minutes: 20,
          body: [
            h2('La situation'),
            'Une collectivité de la zone CEMAC souhaite financer un marché couvert de 6 milliards XAF. Elle dispose de bâtiments administratifs libres de toute charge. (Cas fictif.)',
            h2('Votre mission'),
            ul(
              'Proposez une structure de sukuk adaptée.',
              'Identifiez l’actif support et son mode d’évaluation.',
              'Listez les validations nécessaires avant l’émission.',
            ),
            h2('Pistes de corrigé'),
            'Un sukuk ijara adossé aux bâtiments administratifs est une option : la collectivité les cède à l’entité ad hoc puis les loue. Un sukuk istisna peut compléter le montage pour la phase de construction. La structure doit être validée par un comité de conformité et par l’autorité de marché compétente.',
          ],
        },
      ],
    },
    {
      title: 'Marché secondaire et risques',
      description: 'Négocier un sukuk et en mesurer les risques.',
      lessons: [
        {
          type: 'text',
          slug: 'negociabilite',
          title: 'La négociabilité des sukuk',
          minutes: 12,
          body: [
            'La possibilité de céder un sukuk à un prix librement fixé dépend de la composition des actifs sous-jacents.',
            ul(
              'Actifs réels (biens loués, participations) : négociation au prix du marché possible.',
              'Créances (mourabaha) : cession au nominal uniquement.',
              'Portefeuille mixte : la proportion d’actifs réels détermine la négociabilité, selon les normes retenues par le comité.',
            ),
          ],
        },
        {
          type: 'video',
          slug: 'risques-investisseur',
          title: 'Les risques pour l’investisseur',
          minutes: 10,
          transcript: [
            'Risque de crédit de l’initiateur, risque lié à l’actif support, risque de liquidité sur un marché secondaire encore étroit, risque de non-conformité de la structure.',
            'Nous voyons comment les documents d’émission traitent chacun de ces risques.',
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
      title: 'Évaluation finale : sukuk et marchés de capitaux',
      instructions:
        'Cinq questions sur l’ensemble du cours. Seuil de réussite : 75 %. Trois tentatives.',
      passingScorePercent: 75,
      maxAttempts: 3,
      questions: [
        {
          kind: 'single',
          prompt: 'Que représente un sukuk ?',
          answers: [
            {
              text: 'Une part indivise de propriété dans des actifs, des usufruits ou un projet',
              correct: true,
              feedback: 'Exact.',
            },
            {
              text: 'Une créance rémunérée par un intérêt',
              feedback: 'Non : c’est la définition d’une obligation.',
            },
            {
              text: 'Une action de la société émettrice',
              feedback: 'Non : le porteur ne devient pas actionnaire de l’initiateur.',
            },
          ],
          explanation:
            'Le revenu du sukuk provient des actifs détenus, pas d’un intérêt sur un prêt.',
        },
        {
          kind: 'single',
          prompt: 'Dans un sukuk ijara, d’où provient le revenu des porteurs ?',
          answers: [
            { text: 'Des loyers versés pour l’actif loué', correct: true, feedback: 'Exact.' },
            {
              text: 'D’un coupon calculé sur un taux interbancaire, sans lien avec l’actif',
              feedback:
                'Non : le revenu doit provenir de l’actif. Un taux peut servir de référence au calcul du loyer, mais le revenu reste un loyer.',
            },
            {
              text: 'De la revente immédiate de l’actif',
              feedback: 'Non : l’actif est loué pendant toute la durée.',
            },
          ],
          explanation: 'Les porteurs, propriétaires de l’actif, perçoivent les loyers.',
        },
        {
          kind: 'true-false',
          prompt: 'Un sukuk mourabaha peut être revendu librement au-dessus de sa valeur nominale.',
          answers: trueFalse(false, {
            onTrue: 'Non : il représente une créance, qui ne se cède qu’au nominal.',
            onFalse: 'Exact : céder une créance à un autre prix reviendrait à du riba.',
          }),
          explanation: 'La négociabilité dépend de la nature des actifs : réels ou créances.',
        },
        {
          kind: 'multiple',
          prompt: 'Quels acteurs interviennent dans une émission de sukuk ?',
          answers: [
            { text: 'L’initiateur', correct: true, feedback: 'Oui : il cède les actifs.' },
            {
              text: 'L’entité ad hoc émettrice',
              correct: true,
              feedback: 'Oui : elle détient les actifs pour les porteurs.',
            },
            {
              text: 'Le comité de conformité',
              correct: true,
              feedback: 'Oui : il valide la structure.',
            },
            {
              text: 'Un prêteur rémunéré par un intérêt',
              feedback: 'Non : aucun prêt à intérêt n’intervient dans une structure conforme.',
            },
          ],
          explanation:
            'Arrangeurs, représentant des porteurs et agences de notation complètent le dispositif.',
        },
        {
          kind: 'single',
          prompt:
            'Une collectivité dispose de bâtiments libres de charges et veut financer un projet. Quelle structure est la plus directe ?',
          answers: [
            {
              text: 'Un sukuk ijara adossé aux bâtiments',
              correct: true,
              feedback: 'Exact : l’actif existe et peut être loué.',
            },
            {
              text: 'Un sukuk mourabaha sans bien sous-jacent',
              feedback: 'Non : une mourabaha suppose un bien vendu.',
            },
            {
              text: 'Une obligation classique renommée',
              feedback: 'Non : le changement de nom ne change pas la nature du contrat.',
            },
          ],
          explanation: 'Le choix de la structure part de l’actif disponible.',
        },
      ],
    },
  ],
  seo: {
    title: 'Cours : sukuk et marchés de capitaux islamiques',
    description:
      'Différence entre sukuk et obligation, structures ijara, moucharaka et wakala, étapes d’une émission et marché secondaire. Cours en ligne avancé.',
  },
}
