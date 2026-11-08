/**
 * Capsules entreprises (SPEC §4.2) : cours `format: capsule` d'une seule leçon vidéo de
 * 3 à 10 minutes suivie d'un mini-quiz, trois par métier. L'aperçu de 30 secondes est
 * l'extrait vidéo du cours (`trailer`). Contenus FICTIFS de démonstration.
 * TODO(client) : liste, scripts et vidéos définitifs des capsules.
 */
import { p } from '../lib/richtext'
import { descriptionFooter, trueFalse } from './shared'
import type { CourseSeed, JobRole, QuestionSeed } from './types'

type CapsuleInput = {
  slug: string
  title: string
  summary: string
  jobRoles: JobRole[]
  themes: string[]
  instructor: string
  level: CourseSeed['level']
  /** Durée de la vidéo (3 à 8 min ; le mini-quiz ajoute 2 min). */
  minutes: number
  objectives: string[]
  transcript: string[]
  questions: QuestionSeed[]
  seo: CourseSeed['seo']
}

export const CAPSULE_QUIZ_MINUTES = 2

function capsule(input: CapsuleInput): CourseSeed {
  return {
    slug: input.slug,
    title: input.title,
    subtitle: `Capsule de ${input.minutes + CAPSULE_QUIZ_MINUTES} minutes, vidéo et mini-quiz`,
    summary: input.summary,
    description: [p(input.summary), ...descriptionFooter()],
    format: 'capsule',
    audience: 'business',
    level: input.level,
    themes: input.themes,
    jobRoles: input.jobRoles,
    instructors: [input.instructor],
    objectives: input.objectives,
    prerequisites: 'Aucun prérequis.',
    featured: false,
    includedInPass: false,
    certificateEnabled: false,
    modules: [
      {
        title: input.title,
        description: input.summary,
        lessons: [
          {
            type: 'video',
            slug: 'video',
            title: input.title,
            minutes: input.minutes,
            transcript: input.transcript,
          },
          {
            type: 'quiz',
            slug: 'mini-quiz',
            title: 'Mini-quiz',
            minutes: CAPSULE_QUIZ_MINUTES,
            quiz: 'mini-quiz',
          },
        ],
      },
    ],
    quizzes: [
      {
        key: 'mini-quiz',
        title: `Mini-quiz : ${input.title}`,
        instructions:
          'Trois questions pour vérifier l’essentiel. Seuil de réussite : 60 %. Vous pouvez recommencer.',
        passingScorePercent: 60,
        maxAttempts: 0,
        questions: input.questions,
      },
    ],
    seo: input.seo,
  }
}

export const capsulesSeed: CourseSeed[] = [
  // --- Conformité -------------------------------------------------------------
  capsule({
    slug: 'reperer-le-riba',
    title: 'Repérer le riba dans une opération',
    summary:
      'Trois questions simples pour repérer un surplus interdit dans un prêt, une pénalité ou un échange de devises.',
    jobRoles: ['compliance', 'front-office'],
    themes: ['fondamentaux', 'audit-conformite'],
    instructor: 'hamadou',
    level: 'beginner',
    minutes: 6,
    objectives: [
      'Définir le riba.',
      'Repérer un surplus interdit dans trois situations courantes.',
    ],
    transcript: [
      'Le riba est tout surplus fixé à l’avance dans un prêt d’argent. Il apparaît aussi dans certaines pénalités de retard et dans les échanges de devises à terme.',
      'Trois questions suffisent souvent : s’agit-il d’un prêt d’argent ? Le remboursement dépasse-t-il le montant prêté ? Ce surplus est-il fixé à l’avance ?',
    ],
    questions: [
      {
        kind: 'single',
        prompt: 'Une pénalité de retard versée au créancier dans une mourabaha est :',
        answers: [
          {
            text: 'un surplus interdit au profit du créancier',
            correct: true,
            feedback: 'Exact : la dette ne peut pas croître au profit du vendeur.',
          },
          {
            text: 'une pratique conforme',
            feedback:
              'Non : seul un engagement de don à une œuvre caritative, validé par le comité, peut être envisagé.',
          },
        ],
        explanation: 'Le prix d’une mourabaha est fixé à la signature.',
      },
      {
        kind: 'true-false',
        prompt: 'Un prêt sans intérêt (qard hassan) comporte du riba.',
        answers: trueFalse(false, {
          onTrue: 'Non : sans surplus, il n’y a pas de riba.',
          onFalse: 'Exact : le qard hassan est remboursé au nominal.',
        }),
        explanation: 'Le riba suppose un surplus fixé à l’avance.',
      },
      {
        kind: 'multiple',
        prompt: 'Quelles questions aident à repérer le riba ?',
        answers: [
          { text: 'S’agit-il d’un prêt d’argent ?', correct: true, feedback: 'Oui.' },
          { text: 'Le surplus est-il fixé à l’avance ?', correct: true, feedback: 'Oui.' },
          {
            text: 'Le client est-il satisfait ?',
            feedback: 'Non : la satisfaction ne dit rien de la conformité.',
          },
        ],
        explanation: 'Prêt d’argent, surplus, fixation à l’avance : trois indices du riba.',
      },
    ],
    seo: {
      title: 'Capsule : repérer le riba dans une opération',
      description:
        'Capsule de 8 minutes pour les équipes conformité et front office : repérer un surplus interdit dans un prêt, une pénalité ou un change.',
    },
  }),
  capsule({
    slug: 'gharar-clauses-contrat',
    title: 'Gharar : les clauses à surveiller',
    summary:
      'Les clauses qui créent une incertitude excessive dans un contrat, et comment les reformuler.',
    jobRoles: ['compliance'],
    themes: ['audit-conformite'],
    instructor: 'hamadou',
    level: 'intermediate',
    minutes: 7,
    objectives: [
      'Reconnaître une clause porteuse de gharar.',
      'Proposer une reformulation précise.',
    ],
    transcript: [
      'Le gharar naît d’une incertitude excessive sur l’objet, le prix ou la date d’exécution. Dans les contrats, il se cache souvent dans des formules vagues : « prix à déterminer », « livraison dès que possible ».',
      'Nous passons en revue cinq clauses fréquentes et leur reformulation.',
    ],
    questions: [
      {
        kind: 'single',
        prompt: 'Laquelle de ces clauses présente un risque de gharar ?',
        answers: [
          {
            text: 'Prix à déterminer ultérieurement par le vendeur',
            correct: true,
            feedback: 'Exact : le prix doit être connu à la conclusion.',
          },
          {
            text: 'Prix total de 2 500 000 XAF payable en 10 échéances',
            feedback: 'Non : le prix et les modalités sont précis.',
          },
        ],
        explanation: 'L’objet, le prix et la date doivent être déterminés.',
      },
      {
        kind: 'true-false',
        prompt: 'Une date de livraison précise réduit le gharar.',
        answers: trueFalse(true, {
          onTrue: 'Exact : la précision réduit l’incertitude.',
          onFalse: 'Non : une date précise réduit bien l’incertitude.',
        }),
        explanation: 'Plus les termes sont précis, moins le contrat comporte de gharar.',
      },
      {
        kind: 'single',
        prompt: 'Que faire face à une clause vague ?',
        answers: [
          {
            text: 'Proposer une reformulation précise et la soumettre au comité',
            correct: true,
            feedback: 'Exact.',
          },
          {
            text: 'L’ignorer si le montant est faible',
            feedback: 'Non : le gharar ne dépend pas du montant.',
          },
        ],
        explanation: 'La conformité se traite dans la rédaction, avant la signature.',
      },
    ],
    seo: {
      title: 'Capsule : gharar, les clauses à surveiller',
      description:
        'Capsule pour les équipes conformité : reconnaître les clauses porteuses de gharar dans un contrat et les reformuler avec précision.',
    },
  }),
  capsule({
    slug: 'signaler-non-conformite',
    title: 'Signaler une non-conformité charia',
    summary:
      'La procédure à suivre quand vous constatez une opération qui pourrait être non conforme.',
    jobRoles: ['compliance', 'back-office', 'front-office'],
    themes: ['audit-conformite'],
    instructor: 'mariam',
    level: 'beginner',
    minutes: 5,
    objectives: ['Connaître le circuit de signalement.', 'Documenter un signalement utile.'],
    transcript: [
      'Vous constatez une opération douteuse : une vente enregistrée avant l’achat, une pénalité conservée, un placement inhabituel. Le bon réflexe est de signaler, pas de corriger seul.',
      'Un signalement utile indique les faits, les pièces et la règle qui semble enfreinte. Il est adressé au contrôle charia interne, qui saisit le comité si nécessaire.',
    ],
    questions: [
      {
        kind: 'single',
        prompt: 'À qui adresser en premier un signalement de non-conformité ?',
        answers: [
          {
            text: 'Au contrôle charia interne',
            correct: true,
            feedback: 'Exact : il instruit et saisit le comité si besoin.',
          },
          {
            text: 'Directement au client',
            feedback: 'Non : le signalement suit le circuit interne.',
          },
          {
            text: 'À personne, si l’opération est déjà passée',
            feedback: 'Non : une opération passée peut appeler une purification.',
          },
        ],
        explanation: 'Le contrôle charia interne est le point d’entrée.',
      },
      {
        kind: 'multiple',
        prompt: 'Que contient un signalement utile ?',
        answers: [
          { text: 'Les faits constatés', correct: true, feedback: 'Oui.' },
          { text: 'Les pièces justificatives', correct: true, feedback: 'Oui.' },
          {
            text: 'Une opinion sur les collègues concernés',
            feedback: 'Non : le signalement porte sur des faits.',
          },
        ],
        explanation: 'Faits, pièces, règle concernée.',
      },
      {
        kind: 'true-false',
        prompt: 'Il vaut mieux corriger soi-même l’opération sans en parler.',
        answers: trueFalse(false, {
          onTrue:
            'Non : une correction isolée efface la trace et prive le comité de l’information.',
          onFalse: 'Exact : on signale, on ne corrige pas seul.',
        }),
        explanation: 'La traçabilité protège l’établissement et le collaborateur.',
      },
    ],
    seo: {
      title: 'Capsule : signaler une non-conformité charia',
      description:
        'Capsule de 7 minutes : le circuit de signalement d’une opération potentiellement non conforme et les éléments d’un signalement utile.',
    },
  }),
  // --- Front office -----------------------------------------------------------
  capsule({
    slug: 'expliquer-mourabaha-client',
    title: 'Expliquer une mourabaha à un client',
    summary:
      'Une explication claire et honnête de la mourabaha, en cinq minutes, avec les mots du client.',
    jobRoles: ['front-office'],
    themes: ['banque-participative'],
    instructor: 'ibrahim',
    level: 'beginner',
    minutes: 5,
    objectives: [
      'Expliquer la mourabaha en termes simples.',
      'Répondre à la question « est-ce un crédit déguisé ? ».',
    ],
    transcript: [
      'Le client veut savoir ce qu’il signe. Dites-le simplement : la banque achète le bien, puis vous le revend avec une marge connue dès le départ ; vous payez en plusieurs fois, et le prix ne changera pas.',
      'À la question « est-ce un crédit déguisé ? », répondez par les faits : la banque est réellement propriétaire avant la vente, et le prix total est fixe.',
    ],
    questions: [
      {
        kind: 'single',
        prompt: 'Quelle phrase décrit le mieux la mourabaha pour un client ?',
        answers: [
          {
            text: 'La banque achète le bien et vous le revend avec une marge connue, payable en plusieurs fois',
            correct: true,
            feedback: 'Exact : simple et fidèle.',
          },
          {
            text: 'La banque vous prête de l’argent à un taux avantageux',
            feedback: 'Non : il n’y a pas de prêt d’argent.',
          },
        ],
        explanation: 'Achat par la banque, revente avec marge connue, prix fixe.',
      },
      {
        kind: 'true-false',
        prompt: 'On peut dire au client que le prix total ne changera pas pendant le financement.',
        answers: trueFalse(true, {
          onTrue: 'Exact : le prix est fixé à la signature.',
          onFalse: 'Non : le prix total est bien fixé à la signature.',
        }),
        explanation: 'C’est un argument clé, à condition qu’il soit exact.',
      },
      {
        kind: 'single',
        prompt:
          'Un client demande si la banque garantit la conformité religieuse du produit. Que répondre ?',
        answers: [
          {
            text: 'Le produit a été validé par le comité de conformité de la banque, dont l’avis peut être consulté',
            correct: true,
            feedback: 'Exact : on renvoie à l’avis du comité, sans délivrer d’avis personnel.',
          },
          {
            text: 'Je vous le garantis personnellement',
            feedback: 'Non : un conseiller ne délivre pas d’avis religieux.',
          },
        ],
        explanation: 'Le conseiller informe ; l’avis de conformité relève du comité.',
      },
    ],
    seo: {
      title: 'Capsule : expliquer une mourabaha à un client',
      description:
        'Capsule pour les conseillers : expliquer la mourabaha en termes simples et répondre honnêtement à la question du crédit déguisé.',
    },
  }),
  capsule({
    slug: 'presenter-offre-takaful',
    title: 'Présenter une offre takaful sans promesse abusive',
    summary:
      'Présenter une couverture takaful de façon exacte : entraide, frais, excédents, exclusions.',
    jobRoles: ['front-office'],
    themes: ['takaful'],
    instructor: 'clarisse',
    level: 'beginner',
    minutes: 6,
    objectives: [
      'Présenter le principe du takaful.',
      'Éviter les promesses que le contrat ne tient pas.',
    ],
    transcript: [
      'Présentez d’abord le principe : une entraide entre participants, gérée par un opérateur rémunéré. Indiquez ensuite les frais, la règle des excédents et les principales exclusions.',
      'Évitez les promesses : un excédent n’est jamais garanti, et la conformité relève de l’avis du comité de l’opérateur.',
    ],
    questions: [
      {
        kind: 'true-false',
        prompt: 'On peut promettre au client qu’il recevra un excédent chaque année.',
        answers: trueFalse(false, {
          onTrue: 'Non : l’excédent dépend des sinistres et n’est jamais garanti.',
          onFalse: 'Exact : un excédent est possible, pas garanti.',
        }),
        explanation: 'Une promesse non tenue engage la responsabilité du vendeur.',
      },
      {
        kind: 'multiple',
        prompt: 'Que faut-il présenter au client ?',
        answers: [
          { text: 'Les frais de l’opérateur', correct: true, feedback: 'Oui.' },
          { text: 'La règle d’affectation des excédents', correct: true, feedback: 'Oui.' },
          { text: 'Les principales exclusions', correct: true, feedback: 'Oui.' },
        ],
        explanation: 'Frais, excédents et exclusions sont les trois points de transparence.',
      },
      {
        kind: 'single',
        prompt: 'Comment résumer le takaful en une phrase ?',
        answers: [
          {
            text: 'Une entraide entre participants, gérée par un opérateur rémunéré',
            correct: true,
            feedback: 'Exact.',
          },
          {
            text: 'Une assurance classique avec un autre nom',
            feedback: 'Non : le mécanisme est différent.',
          },
        ],
        explanation: 'Le participant contribue à un fonds commun ; l’opérateur le gère.',
      },
    ],
    seo: {
      title: 'Capsule : présenter une offre takaful',
      description:
        'Capsule pour les équipes commerciales : présenter une couverture takaful avec exactitude, sans promesse que le contrat ne tient pas.',
    },
  }),
  capsule({
    slug: 'ijara-questions-clients',
    title: 'Ijara : répondre aux questions des clients',
    summary: 'Les cinq questions les plus fréquentes sur l’ijara et des réponses exactes.',
    jobRoles: ['front-office'],
    themes: ['banque-participative'],
    instructor: 'ibrahim',
    level: 'beginner',
    minutes: 6,
    objectives: [
      'Expliquer qui est propriétaire pendant l’ijara.',
      'Répondre sur l’entretien, l’assurance et le transfert de propriété.',
    ],
    transcript: [
      'Qui est propriétaire ? La banque, jusqu’au transfert. Qui entretient ? Le client pour l’usage courant, la banque pour ce qui relève du propriétaire. Qui assure ? En principe la banque, propriétaire.',
      'Quand devient-on propriétaire ? À la fin du contrat, par une promesse distincte de transfert, si le contrat le prévoit.',
    ],
    questions: [
      {
        kind: 'single',
        prompt: 'Pendant l’ijara, qui est propriétaire du bien ?',
        answers: [
          { text: 'La banque', correct: true, feedback: 'Exact.' },
          { text: 'Le client', feedback: 'Non : le client est locataire jusqu’au transfert.' },
        ],
        explanation: 'Le transfert intervient à la fin, par une promesse distincte.',
      },
      {
        kind: 'single',
        prompt: 'Qui prend en charge l’entretien courant lié à l’usage du bien ?',
        answers: [
          { text: 'Le client, locataire', correct: true, feedback: 'Exact.' },
          {
            text: 'La banque',
            feedback: 'Non : la banque assume ce qui relève du propriétaire, pas l’usage courant.',
          },
        ],
        explanation: 'Usage courant : locataire. Risques de propriété : bailleur.',
      },
      {
        kind: 'true-false',
        prompt:
          'Le transfert de propriété en fin d’ijara repose sur une promesse distincte du contrat de location.',
        answers: trueFalse(true, {
          onTrue: 'Exact.',
          onFalse: 'Non : il repose bien sur une promesse distincte.',
        }),
        explanation: 'Location et transfert sont deux engagements séparés.',
      },
    ],
    seo: {
      title: 'Capsule : ijara, les questions des clients',
      description:
        'Capsule pour les conseillers : propriété, entretien, assurance et transfert, les réponses exactes aux questions des clients sur l’ijara.',
    },
  }),
  // --- Back office ------------------------------------------------------------
  capsule({
    slug: 'comptabiliser-mourabaha-aaoifi',
    title: 'Comptabiliser une mourabaha selon l’AAOIFI',
    summary:
      'Les écritures clés d’une mourabaha à paiement échelonné : stock, créance, marge différée.',
    jobRoles: ['back-office'],
    themes: ['audit-conformite', 'banque-participative'],
    instructor: 'hamadou',
    level: 'intermediate',
    minutes: 8,
    objectives: [
      'Enregistrer l’achat puis la vente.',
      'Étaler la marge sur la durée du financement.',
    ],
    transcript: [
      'À l’achat, le bien entre en stock chez la banque. À la vente, la banque constate une créance sur le client pour le prix total, et une marge différée.',
      'La marge différée est reconnue en produits au fil des échéances. Un éventuel montant lié à un retard, s’il est prévu, n’entre pas en produits.',
    ],
    questions: [
      {
        kind: 'single',
        prompt: 'À l’achat du bien par la banque, quelle écriture enregistre-t-on ?',
        answers: [
          {
            text: 'L’entrée du bien en stock',
            correct: true,
            feedback: 'Exact : la banque est propriétaire.',
          },
          { text: 'Une créance sur le client', feedback: 'Non : la créance naît à la vente.' },
        ],
        explanation: 'Achat : stock. Vente : créance et marge différée.',
      },
      {
        kind: 'true-false',
        prompt:
          'La marge d’une mourabaha échelonnée est reconnue en produits sur la durée du financement.',
        answers: trueFalse(true, {
          onTrue: 'Exact.',
          onFalse: 'Non : elle est bien étalée.',
        }),
        explanation: 'La marge différée suit le rythme des échéances.',
      },
      {
        kind: 'single',
        prompt: 'Un montant versé par un client en retard, au titre d’un engagement de don, est :',
        answers: [
          {
            text: 'isolé et affecté à des œuvres caritatives, hors produits',
            correct: true,
            feedback: 'Exact.',
          },
          {
            text: 'comptabilisé en produits de la banque',
            feedback: 'Non : la banque ne peut pas en tirer profit.',
          },
        ],
        explanation: 'Les montants à vocation caritative ne figurent jamais en résultat.',
      },
    ],
    seo: {
      title: 'Capsule : comptabiliser une mourabaha (AAOIFI)',
      description:
        'Capsule pour le back office : écritures clés d’une mourabaha échelonnée selon les principes AAOIFI, du stock à la marge différée.',
    },
  }),
  capsule({
    slug: 'separer-fonds-fenetre',
    title: 'Séparer les fonds d’une fenêtre islamique',
    summary:
      'Comptes, systèmes et procédures : comment garantir au quotidien la séparation des fonds.',
    jobRoles: ['back-office', 'management'],
    themes: ['banque-participative'],
    instructor: 'mariam',
    level: 'intermediate',
    minutes: 7,
    objectives: [
      'Identifier les points de mélange possibles.',
      'Mettre en place des contrôles simples.',
    ],
    transcript: [
      'Le mélange des fonds arrive rarement par décision : il arrive par commodité. Un compte de trésorerie commun, une compensation automatique, un placement de liquidités excédentaires.',
      'Trois contrôles simples : des comptes dédiés, des paramètres système qui interdisent les compensations, un rapprochement mensuel revu par le contrôle charia.',
    ],
    questions: [
      {
        kind: 'multiple',
        prompt: 'Quelles situations peuvent conduire à un mélange des fonds ?',
        answers: [
          { text: 'Un compte de trésorerie commun', correct: true, feedback: 'Oui.' },
          { text: 'Une compensation automatique entre activités', correct: true, feedback: 'Oui.' },
          {
            text: 'Un rapprochement mensuel revu par le contrôle charia',
            feedback: 'Non : c’est un contrôle, pas une cause de mélange.',
          },
        ],
        explanation: 'Le mélange vient souvent de la commodité opérationnelle.',
      },
      {
        kind: 'true-false',
        prompt:
          'Les liquidités excédentaires de la fenêtre peuvent être placées sur le marché interbancaire conventionnel.',
        answers: trueFalse(false, {
          onTrue: 'Non : un placement rémunéré par intérêt n’est pas conforme.',
          onFalse: 'Exact : il faut des placements conformes.',
        }),
        explanation: 'La gestion de la liquidité est l’un des points sensibles d’une fenêtre.',
      },
      {
        kind: 'single',
        prompt: 'Quel contrôle est le plus efficace pour éviter les compensations ?',
        answers: [
          {
            text: 'Un paramétrage système qui les interdit',
            correct: true,
            feedback: 'Exact : le contrôle est automatique.',
          },
          { text: 'Une note de service', feedback: 'Utile, mais insuffisant seul.' },
        ],
        explanation: 'Un contrôle bloquant est plus robuste qu’une consigne.',
      },
    ],
    seo: {
      title: 'Capsule : séparer les fonds d’une fenêtre islamique',
      description:
        'Capsule pour le back office et la direction : comptes, systèmes et contrôles qui garantissent la séparation des fonds d’une fenêtre.',
    },
  }),
  capsule({
    slug: 'purifier-revenus',
    title: 'Purifier les revenus non conformes',
    summary: 'Le traitement opérationnel et comptable d’un revenu jugé non conforme par le comité.',
    jobRoles: ['back-office', 'compliance'],
    themes: ['audit-conformite'],
    instructor: 'hamadou',
    level: 'intermediate',
    minutes: 6,
    objectives: [
      'Connaître les étapes de la purification.',
      'Comptabiliser et tracer le versement caritatif.',
    ],
    transcript: [
      'La purification commence par une décision du comité de conformité qui qualifie un revenu de non conforme. Le back office isole alors le montant sur un compte dédié.',
      'Le versement à des œuvres caritatives est tracé : bénéficiaire, date, montant, référence de la décision. Le montant ne transite jamais par le résultat.',
    ],
    questions: [
      {
        kind: 'single',
        prompt: 'Qui décide qu’un revenu doit être purifié ?',
        answers: [
          { text: 'Le comité de conformité', correct: true, feedback: 'Exact.' },
          { text: 'Le back office', feedback: 'Non : le back office exécute la décision.' },
        ],
        explanation: 'Le comité décide, le back office exécute, l’audit vérifie.',
      },
      {
        kind: 'true-false',
        prompt: 'Un revenu purifié peut d’abord être enregistré en résultat, puis reversé.',
        answers: trueFalse(false, {
          onTrue: 'Non : il est isolé sur un compte dédié, hors résultat.',
          onFalse: 'Exact.',
        }),
        explanation:
          'Le revenu non conforme ne profite jamais à l’établissement, même temporairement.',
      },
      {
        kind: 'multiple',
        prompt: 'Quelles informations tracer lors du versement caritatif ?',
        answers: [
          { text: 'Le bénéficiaire et la date', correct: true, feedback: 'Oui.' },
          { text: 'La référence de la décision du comité', correct: true, feedback: 'Oui.' },
          {
            text: 'Le nom du client à l’origine du revenu, publié sur le site',
            feedback: 'Non : aucune publication de données client.',
          },
        ],
        explanation: 'La traçabilité permet l’audit sans exposer les clients.',
      },
    ],
    seo: {
      title: 'Capsule : purifier les revenus non conformes',
      description:
        'Capsule pour le back office : décision du comité, isolement du montant, versement caritatif et traçabilité de la purification.',
    },
  }),
  // --- Direction --------------------------------------------------------------
  capsule({
    slug: 'gouvernance-comite-charia',
    title: 'Le rôle du comité de conformité charia',
    summary: 'Ce que fait le comité, ce qu’il ne fait pas, et ce que la direction lui doit.',
    jobRoles: ['management'],
    themes: ['audit-conformite', 'reglementation'],
    instructor: 'mariam',
    level: 'intermediate',
    minutes: 7,
    objectives: [
      'Situer le comité dans la gouvernance.',
      'Organiser les échanges entre la direction et le comité.',
    ],
    transcript: [
      'Le comité de conformité valide les produits et les contrats types, rend des avis sur les opérations et suit les constats d’audit. Il ne gère pas l’établissement et ne délivre pas de fatwa individuelle aux clients.',
      'La direction lui doit l’indépendance, l’accès à l’information et des moyens : un secrétariat, un calendrier de réunions, un suivi formalisé de ses avis.',
    ],
    questions: [
      {
        kind: 'multiple',
        prompt: 'Quelles missions relèvent du comité de conformité ?',
        answers: [
          { text: 'Valider les produits et les contrats types', correct: true, feedback: 'Oui.' },
          { text: 'Suivre les constats d’audit charia', correct: true, feedback: 'Oui.' },
          {
            text: 'Fixer les objectifs commerciaux',
            feedback: 'Non : c’est le rôle de la direction.',
          },
        ],
        explanation: 'Le comité valide, rend des avis et suit ; la direction gère.',
      },
      {
        kind: 'true-false',
        prompt:
          'L’indépendance du comité suppose qu’il ait accès à l’information sans filtre de la direction commerciale.',
        answers: trueFalse(true, {
          onTrue: 'Exact.',
          onFalse: 'Non : l’accès direct à l’information est une condition de son indépendance.',
        }),
        explanation: 'Un comité mal informé ne peut pas rendre d’avis fiable.',
      },
      {
        kind: 'single',
        prompt: 'Le comité délivre-t-il des fatwas individuelles aux clients ?',
        answers: [
          {
            text: 'Non : il rend des avis sur les produits et les opérations de l’établissement',
            correct: true,
            feedback: 'Exact.',
          },
          { text: 'Oui, sur demande de chaque client', feedback: 'Non : ce n’est pas son rôle.' },
        ],
        explanation: 'Le comité rend des avis institutionnels, pas des avis personnels.',
      },
    ],
    seo: {
      title: 'Capsule : le rôle du comité de conformité charia',
      description:
        'Capsule pour les dirigeants : missions du comité de conformité, limites de son rôle et conditions de son indépendance.',
    },
  }),
  capsule({
    slug: 'piloter-risques-fenetre',
    title: 'Piloter les risques d’une fenêtre islamique',
    summary:
      'Les indicateurs qu’une direction suit chaque mois pour piloter une fenêtre islamique.',
    jobRoles: ['management'],
    themes: ['banque-participative'],
    instructor: 'mariam',
    level: 'advanced',
    minutes: 8,
    objectives: ['Choisir cinq indicateurs de pilotage.', 'Fixer des seuils d’alerte.'],
    transcript: [
      'Cinq indicateurs suffisent pour commencer : taux de constats de non-conformité, montants purifiés, écart de rémunération des comptes d’investissement avec le marché, liquidité disponible en placements conformes, délai de traitement des avis du comité.',
      'Chaque indicateur reçoit un seuil d’alerte et un responsable. Le tableau est présenté au comité et au conseil.',
    ],
    questions: [
      {
        kind: 'multiple',
        prompt: 'Quels indicateurs sont pertinents pour piloter une fenêtre islamique ?',
        answers: [
          { text: 'Le taux de constats de non-conformité', correct: true, feedback: 'Oui.' },
          { text: 'Les montants purifiés', correct: true, feedback: 'Oui.' },
          {
            text: 'Le nombre de visiteurs du site internet',
            feedback: 'Non : sans lien direct avec les risques de la fenêtre.',
          },
        ],
        explanation: 'Les indicateurs suivent la conformité, la rémunération et la liquidité.',
      },
      {
        kind: 'single',
        prompt:
          'Un écart croissant entre la rémunération des comptes d’investissement et le marché signale surtout :',
        answers: [
          {
            text: 'un risque commercial déplacé',
            correct: true,
            feedback: 'Exact : la pression pour aligner les rémunérations augmente.',
          },
          { text: 'un risque de change', feedback: 'Non : sans lien ici.' },
        ],
        explanation: 'Le risque commercial déplacé naît de la comparaison avec le marché.',
      },
      {
        kind: 'true-false',
        prompt: 'Chaque indicateur doit avoir un seuil d’alerte et un responsable.',
        answers: trueFalse(true, {
          onTrue: 'Exact.',
          onFalse: 'Non : sans seuil ni responsable, l’indicateur ne déclenche aucune action.',
        }),
        explanation: 'Un indicateur sert à décider.',
      },
    ],
    seo: {
      title: 'Capsule : piloter les risques d’une fenêtre islamique',
      description:
        'Capsule pour les directions : cinq indicateurs de pilotage d’une fenêtre islamique, seuils d’alerte et présentation au comité.',
    },
  }),
  capsule({
    slug: 'decider-conflit-interets',
    title: 'Décider face à un conflit d’intérêts',
    summary:
      'Déclarer, s’abstenir, tracer : la conduite d’un dirigeant face à un conflit d’intérêts.',
    jobRoles: ['management', 'compliance'],
    themes: ['ethique-des-affaires'],
    instructor: 'ibrahim',
    level: 'beginner',
    minutes: 5,
    objectives: [
      'Reconnaître un conflit d’intérêts.',
      'Appliquer la règle : déclarer, s’abstenir, tracer.',
    ],
    transcript: [
      'Un fournisseur appartient à un proche, un client est un associé, un administrateur siège chez un concurrent : le conflit d’intérêts n’est pas une faute, mais le taire en devient une.',
      'La règle tient en trois mots : déclarer, s’abstenir, tracer.',
    ],
    questions: [
      {
        kind: 'true-false',
        prompt: 'Se trouver en situation de conflit d’intérêts est en soi une faute.',
        answers: trueFalse(false, {
          onTrue: 'Non : la faute est de ne pas le déclarer.',
          onFalse: 'Exact : c’est le silence qui pose problème.',
        }),
        explanation: 'Les situations de conflit sont fréquentes ; leur gestion fait la différence.',
      },
      {
        kind: 'single',
        prompt: 'Quel est l’ordre des réflexes ?',
        answers: [
          { text: 'Déclarer, s’abstenir, tracer', correct: true, feedback: 'Exact.' },
          { text: 'Décider, puis déclarer', feedback: 'Non : la déclaration précède la décision.' },
        ],
        explanation: 'La déclaration vient toujours en premier.',
      },
      {
        kind: 'single',
        prompt: 'Le fournisseur retenu appartient au frère du directeur des achats. Que faire ?',
        answers: [
          {
            text: 'Le directeur déclare le lien et ne participe pas au choix',
            correct: true,
            feedback: 'Exact.',
          },
          {
            text: 'Rien, si le prix est le meilleur',
            feedback: 'Non : même un bon prix ne dispense pas de la déclaration.',
          },
        ],
        explanation: 'La transparence protège la décision et la personne.',
      },
    ],
    seo: {
      title: 'Capsule : décider face à un conflit d’intérêts',
      description:
        'Capsule de 7 minutes pour les dirigeants : reconnaître un conflit d’intérêts et appliquer la règle déclarer, s’abstenir, tracer.',
    },
  }),
]
