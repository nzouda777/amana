/**
 * Pages légales (`/legal/[slug]`, ADR 011) : modèles structurés, rédigés pour la démonstration.
 *
 * Chaque page commence par l'encadré « Modèle à valider par un juriste avant publication »
 * et reste `seo.noIndex` tant que la validation juridique n'est pas faite (ADR 013) : le
 * juriste ou l'équipe décoche « Ne pas indexer » dans l'admin une fois le texte validé.
 *
 * TODO(client) : raison sociale, RCCM, NIU, capital, adresse, hébergeur, directeur de la
 * publication, délais de remboursement, référence exacte de la loi camerounaise sur la
 * protection des données personnelles, juridiction compétente.
 */
import type { LegalSlug } from '@/features/site/legal'
import type { Page } from '@/payload-types'

import { disclaimerFullBlocks } from './globals'
import { type Block, callout, h2, h3, p, rt, ul } from './lib/richtext'
import { type Seeder, upsert } from './lib/upsert'

export type LegalPageSeed = {
  slug: LegalSlug
  title: string
  blocks: Block[]
  seo: { title: string; description: string }
}

/** Titre de l'encadré placé en tête de chaque page légale. */
export const LEGAL_REVIEW_TITLE = 'Modèle à valider par un juriste avant publication'

const reviewNotice = (): Block =>
  callout(
    'avertissement',
    'Ce texte est un modèle de travail. Il doit être relu et validé par un juriste au regard du droit camerounais et de l’activité réelle du cabinet avant toute publication. Les éléments marqués TODO(client) sont à compléter.',
    LEGAL_REVIEW_TITLE,
  )

const PRIVACY_EMAIL = 'TODO(client) : adresse dédiée aux données personnelles'

export const legalPagesSeed: LegalPageSeed[] = [
  {
    slug: 'mentions-legales',
    title: 'Mentions légales',
    seo: {
      title: 'Mentions légales | Amana Conseil',
      description:
        'Éditeur du site, hébergement, propriété intellectuelle et contact : les informations légales du site d’Amana Conseil, cabinet basé à Douala.',
    },
    blocks: [
      h2('Éditeur du site'),
      p(
        'Le site est édité par **Amana Conseil**, cabinet de conseil et de formation en finance et assurance islamiques.',
      ),
      ul(
        'Raison sociale : TODO(client)',
        'Forme juridique et capital social : TODO(client)',
        'Siège social : TODO(client) : adresse exacte, Douala, Cameroun',
        'Registre du commerce et du crédit mobilier (RCCM) : TODO(client)',
        'Numéro d’identifiant unique (NIU) : TODO(client)',
        'Téléphone et e-mail : voir la [page Contact](/contact)',
      ),
      h2('Direction de la publication'),
      p('Directeur ou directrice de la publication : TODO(client) : nom et fonction.'),
      h2('Hébergement'),
      p(
        'Le site et sa base de données sont hébergés dans un centre de données situé dans l’Union européenne (Paris, France).',
      ),
      ul(
        'Hébergeur : TODO(client) : raison sociale, adresse et téléphone',
        'Réseau de distribution et protection : Cloudflare, Inc. (TODO(client) : à confirmer)',
      ),
      h2('Propriété intellectuelle'),
      p(
        'Les textes, cours, capsules, guides, schémas, vidéos, le logo et la Trame graphique sont la propriété d’Amana Conseil ou de ses partenaires. Toute reproduction, diffusion ou adaptation sans autorisation écrite est interdite, sauf courte citation mentionnant la source.',
      ),
      p(
        'Les polices Baskervville et Open Sans sont distribuées sous licence SIL Open Font License 1.1.',
      ),
      h2('Liens vers d’autres sites'),
      p(
        'Le site peut renvoyer vers des sites tiers. Amana Conseil ne contrôle pas leur contenu et n’en est pas responsable.',
      ),
      h2('Nature des contenus'),
      p(
        'Les contenus du site informent et forment. Ils ne constituent ni une fatwa ni un conseil financier personnalisé : voir l’[avertissement](/legal/avertissement).',
      ),
      h2('Contact'),
      p('Pour toute question sur ces mentions, écrivez-nous depuis la [page Contact](/contact).'),
    ],
  },
  {
    slug: 'cgv',
    title: 'Conditions générales de vente',
    seo: {
      title: 'Conditions générales de vente | Amana Conseil',
      description:
        'Cours en ligne, capsules, pass d’accès et licences entreprise : prix en francs CFA, paiement Mobile Money, carte, virement ou facture, sans frais cachés.',
    },
    blocks: [
      h2('Objet'),
      p(
        'Les présentes conditions s’appliquent aux achats effectués sur le site d’Amana Conseil : formations en ligne, capsules pour entreprises, pass d’accès et licences. Les missions d’audit, de conseil et d’accompagnement font l’objet d’un devis et d’une convention distincts.',
      ),
      h2('Offres'),
      ul(
        '**Cours en ligne** : accès à un cours, à ses leçons, quiz et ressources depuis l’espace apprenant.',
        '**Parcours** : ensemble de cours vendus ensemble.',
        '**Capsules et packs** : modules courts destinés aux équipes, vendus à l’unité ou par pack thématique.',
        '**Licences entreprise** : accès pour un nombre défini de collaborateurs (sièges), pour une durée d’un an.',
        '**Pass d’accès** : accès au catalogue pour une durée fixe de 30, 90 ou 365 jours.',
      ),
      p(
        'Chaque fiche présente le contenu, la durée indicative, le prix et la durée d’accès avant l’achat.',
      ),
      h2('Prix'),
      p(
        'Les prix sont indiqués en francs CFA (XAF), sans décimale. TODO(client) : préciser si les prix s’entendent hors taxes ou toutes taxes comprises et le taux de TVA applicable.',
      ),
      p(
        'Le prix payé est le prix affiché au moment de la commande, après application d’un éventuel code de réduction.',
      ),
      h2('Commande'),
      p(
        'La commande est validée après création ou connexion au compte, vérification du panier et acceptation des présentes conditions. Un e-mail de confirmation récapitule la commande.',
      ),
      h2('Paiement'),
      p('Les moyens de paiement proposés sont :'),
      ul(
        '**Mobile Money** (MTN Mobile Money, Orange Money) et **carte bancaire**, par l’intermédiaire d’un prestataire de paiement (TODO(client) : nom de la passerelle retenue) ;',
        '**virement bancaire** : la commande reste en attente jusqu’à la réception des fonds portant la référence indiquée ;',
        '**facture entreprise** : pour les organisations, paiement à réception de facture, à 30 jours au plus tard, sur bon de commande.',
      ),
      callout(
        'retenir',
        'Aucun frais de paiement fractionné, aucun intérêt et aucune pénalité financière de retard ne sont appliqués. Si un paiement en plusieurs fois est proposé, il est sans frais : le total payé est égal au prix affiché.',
        'Paiement sans frais ni intérêt',
      ),
      p(
        'Amana Conseil ne conserve aucune donnée de carte bancaire ni code Mobile Money : ces informations sont traitées par le prestataire de paiement.',
      ),
      h2('Accès aux contenus'),
      p(
        'L’accès est ouvert dès la confirmation du paiement (ou, pour un virement ou une facture, dès son enregistrement). Il est personnel : les identifiants ne doivent pas être partagés.',
      ),
      h3('Pass d’accès'),
      p(
        'Le pass donne accès au catalogue pendant la durée achetée. **Il ne se renouvelle pas automatiquement** : vous recevez un rappel sept jours et un jour avant son échéance. Un renouvellement prolonge l’accès à partir de la fin du pass en cours.',
      ),
      h3('Licences entreprise'),
      p(
        'L’administrateur de l’organisation attribue les sièges à ses collaborateurs. Un siège peut être réattribué tant que le collaborateur n’a pas commencé la formation. TODO(client) : règles de réattribution définitives.',
      ),
      h3('Certificats'),
      p(
        'Un certificat de réussite est délivré lorsque toutes les leçons sont terminées et les quiz requis réussis. Il atteste du suivi d’une formation d’Amana Conseil ; ce n’est pas un diplôme d’État.',
      ),
      h2('Annulation et remboursement'),
      p(
        'Les conditions de remboursement figurent dans la [politique de remboursement](/legal/remboursement).',
      ),
      h2('Propriété intellectuelle'),
      p(
        'Les contenus de formation sont réservés à l’usage personnel de l’acheteur ou des collaborateurs titulaires d’un siège. Leur enregistrement, leur copie ou leur diffusion sont interdits.',
      ),
      h2('Nature des formations'),
      p(
        'Les formations transmettent des connaissances générales. Elles ne constituent **ni une fatwa ni un conseil financier personnalisé** : voir l’[avertissement](/legal/avertissement).',
      ),
      h2('Réclamations et litiges'),
      p(
        'Toute réclamation peut être adressée depuis la [page Contact](/contact). Nous répondons dans un délai de TODO(client) jours ouvrés et recherchons d’abord une solution amiable.',
      ),
      p(
        'Les présentes conditions sont soumises au droit camerounais. À défaut d’accord amiable, le litige est porté devant les juridictions compétentes de TODO(client) : ville.',
      ),
    ],
  },
  {
    slug: 'cgu',
    title: 'Conditions générales d’utilisation',
    seo: {
      title: 'Conditions générales d’utilisation | Amana Conseil',
      description:
        'Règles d’utilisation du site et de la plateforme de formation d’Amana Conseil : compte personnel, sécurité, usage des contenus et des avis.',
    },
    blocks: [
      h2('Objet'),
      p(
        'Ces conditions encadrent l’utilisation du site d’Amana Conseil et de sa plateforme de formation, avec ou sans compte.',
      ),
      h2('Compte utilisateur'),
      ul(
        'Le compte est personnel. Vous fournissez des informations exactes et les tenez à jour.',
        'Vous protégez votre mot de passe et nous signalez toute utilisation non autorisée.',
        'Un compte peut être rattaché à une organisation qui finance vos formations : son administrateur voit alors votre progression sur les formations attribuées.',
      ),
      h2('Usage des contenus'),
      p(
        'Les vidéos, textes et quiz sont réservés à votre usage personnel. Il est interdit de les enregistrer, de les copier, de les revendre ou de partager vos accès. Les vidéos peuvent comporter un filigrane discret propre à chaque apprenant.',
      ),
      h2('Avis et contributions'),
      p(
        'Les avis publiés doivent rester courtois, exacts et liés à la formation suivie. Amana Conseil peut modérer ou retirer un avis contraire à ces règles.',
      ),
      h2('Disponibilité'),
      p(
        'Nous faisons le nécessaire pour que le site reste accessible, sans pouvoir le garantir en permanence : maintenance, incident technique ou réseau.',
      ),
      h2('Suspension'),
      p(
        'En cas d’usage contraire à ces conditions (partage d’accès, tentative d’intrusion, contenu abusif), l’accès peut être suspendu après information de l’utilisateur.',
      ),
      h2('Nature des contenus'),
      p(
        'Les contenus informent et forment. Ils ne constituent ni une fatwa ni un conseil financier personnalisé : voir l’[avertissement](/legal/avertissement).',
      ),
      h2('Modification des conditions'),
      p(
        'Ces conditions peuvent évoluer. La date de mise à jour figure en tête de page ; les changements importants sont signalés par e-mail aux titulaires d’un compte.',
      ),
      h2('Droit applicable'),
      p('Ces conditions sont soumises au droit camerounais.'),
    ],
  },
  {
    slug: 'confidentialite',
    title: 'Politique de confidentialité',
    seo: {
      title: 'Politique de confidentialité | Amana Conseil',
      description:
        'Données collectées, finalités, durées de conservation et droits : comment Amana Conseil protège vos données personnelles, et comment les exporter.',
    },
    blocks: [
      h2('Responsable du traitement'),
      p(
        'Amana Conseil (TODO(client) : raison sociale et adresse) est responsable des traitements décrits ici. Contact : ' +
          PRIVACY_EMAIL +
          '.',
      ),
      p(
        'Ces traitements respectent la loi camerounaise relative à la protection des données à caractère personnel (TODO(client) : référence exacte du texte en vigueur et de l’autorité de contrôle compétente).',
      ),
      h2('Données collectées et finalités'),
      ul(
        '**Compte et formation** : nom, e-mail, mot de passe chiffré, progression, résultats aux quiz, certificats. Finalité : fournir la formation achetée (exécution du contrat).',
        '**Commandes et factures** : contenu de la commande, montant, moyen de paiement utilisé, référence de transaction. Finalité : vente et obligations comptables.',
        '**Demandes de devis, de contact et de rendez-vous** : coordonnées, organisation, message. Finalité : répondre à votre demande (mesures précontractuelles).',
        '**Lettre d’information** : e-mail et centres d’intérêt, après confirmation de votre inscription (consentement).',
        '**Téléchargement de guides** : e-mail et consentement éventuel à la lettre.',
        '**Sécurité** : journaux techniques (adresse IP, date, action) pour prévenir les abus. Finalité : intérêt légitime.',
      ),
      p(
        'Nous ne vendons aucune donnée et n’utilisons pas vos données pour de la publicité ciblée.',
      ),
      h2('Destinataires et sous-traitants'),
      p(
        'Les données sont accessibles à l’équipe d’Amana Conseil, dans la limite de ses missions, et à des prestataires techniques qui agissent sur nos instructions :',
      ),
      ul(
        'hébergement du site et de la base de données (Union européenne) : TODO(client) ;',
        'envoi des e-mails transactionnels : Resend ;',
        'lettre d’information : Brevo ;',
        'prise de rendez-vous : Cal.com ;',
        'paiement : TODO(client) : passerelle retenue ;',
        'diffusion des vidéos : Bunny Stream ;',
        'protection anti-robots des formulaires et réseau : Cloudflare.',
      ),
      p(
        'Certains prestataires sont situés hors du Cameroun (Union européenne, États-Unis). TODO(client) : garanties encadrant ces transferts, à valider par le juriste.',
      ),
      h2('Durées de conservation'),
      ul(
        'Compte : pendant la durée d’utilisation, puis suppression après 3 ans sans connexion (avec un e-mail de prévenance).',
        'Demandes de devis et de contact sans suite : 3 ans après le dernier échange.',
        'Lettre d’information : jusqu’à la désinscription ; preuve du consentement : 5 ans.',
        'Commandes, factures et pièces comptables : 10 ans (TODO(client) : durée légale à confirmer).',
        'Certificats : conservés tant que leur vérification publique peut être demandée (TODO(client) : durée).',
        'Journaux de sécurité : 12 mois.',
      ),
      h2('Vos droits'),
      p(
        'Vous pouvez accéder à vos données, les rectifier, les supprimer, vous opposer à un traitement, retirer votre consentement à tout moment et recevoir vos données dans un format lisible.',
      ),
      ul(
        '**Export et suppression en libre-service** : depuis votre espace personnel, rubrique « Mon compte ».',
        '**Lettre d’information** : lien de désinscription dans chaque envoi.',
        '**Autres demandes** : écrivez à ' + PRIVACY_EMAIL + '. Nous répondons sous 30 jours.',
      ),
      p('La suppression d’un compte n’efface pas les factures, que nous devons conserver.'),
      h2('Sécurité'),
      p(
        'Connexions chiffrées, mots de passe chiffrés, accès d’administration protégés par une double authentification, sauvegardes chiffrées et journal des actions d’administration.',
      ),
      h2('Cookies'),
      p('Voir la [politique cookies](/legal/cookies).'),
    ],
  },
  {
    slug: 'cookies',
    title: 'Politique cookies',
    seo: {
      title: 'Politique cookies | Amana Conseil',
      description:
        'Le site n’utilise que des cookies nécessaires à son fonctionnement et une mesure d’audience sans cookie : aucun bandeau de consentement requis.',
    },
    blocks: [
      h2('Ce que nous utilisons'),
      p(
        'Le site n’utilise **que des cookies strictement nécessaires** à son fonctionnement. Ils ne servent ni à la publicité ni au suivi d’un site à l’autre.',
      ),
      ul(
        '**Session** : vous garder connecté à votre compte et sécuriser vos actions.',
        '**Panier** : conserver le contenu de votre panier.',
        '**Sécurité des formulaires** : vérification anti-robots (Cloudflare Turnstile).',
      ),
      h2('Mesure d’audience sans cookie'),
      p(
        'Nous mesurons la fréquentation avec un outil qui ne dépose aucun cookie et ne collecte aucune donnée permettant de vous identifier (TODO(client) : Umami ou Plausible). Les statistiques sont agrégées.',
      ),
      h2('Contenus de tiers'),
      p(
        'Le module de prise de rendez-vous (Cal.com) et le lecteur vidéo peuvent utiliser leurs propres traceurs techniques lorsqu’ils sont affichés. TODO(client) : liste à vérifier avant la mise en ligne.',
      ),
      h2('Pourquoi aucun bandeau'),
      p(
        'Les cookies strictement nécessaires sont exemptés de consentement. Si un traceur non exempté est ajouté un jour, un bandeau vous permettra de l’accepter ou de le refuser aussi simplement.',
      ),
      h2('Gérer les cookies'),
      p(
        'Vous pouvez supprimer les cookies depuis les réglages de votre navigateur. La connexion à votre compte et le panier ne fonctionneront plus sans eux.',
      ),
    ],
  },
  {
    slug: 'remboursement',
    title: 'Politique de remboursement',
    seo: {
      title: 'Politique de remboursement | Amana Conseil',
      description:
        'Cours, capsules, pass d’accès et licences : dans quels cas et dans quels délais Amana Conseil rembourse un achat, et comment le demander.',
    },
    blocks: [
      h2('Principe'),
      p(
        'Si une formation ne correspond pas à ce que vous attendiez, vous pouvez demander un remboursement dans les conditions ci-dessous. Les délais sont proposés à titre de modèle : TODO(client) : délais définitifs.',
      ),
      h2('Cours, parcours et capsules'),
      p(
        'Remboursement intégral sur demande dans les **14 jours** suivant l’achat, si vous avez suivi moins de 20 % des leçons et qu’aucun certificat n’a été délivré.',
      ),
      h2('Pass d’accès'),
      p(
        'Remboursement intégral dans les **14 jours** suivant l’achat si le pass n’a pas été utilisé. Un pass entamé n’est pas remboursé au prorata.',
      ),
      h2('Licences entreprise'),
      p(
        'Les conditions figurent sur le bon de commande ou la convention signée. À défaut, les sièges qui n’ont jamais été attribués peuvent être remboursés dans les **30 jours** suivant la facture.',
      ),
      h2('Erreur ou double paiement'),
      p(
        'Un paiement en double ou une erreur technique de notre part est toujours remboursé en totalité, sans condition de délai.',
      ),
      h2('Modalités'),
      ul(
        'Demande depuis la [page Contact](/contact), avec le numéro de commande.',
        'Remboursement par le moyen de paiement utilisé (Mobile Money, carte ou virement), dans un délai de 14 jours après acceptation.',
        'Un avoir est émis pour toute facture remboursée.',
        'L’accès au contenu remboursé est retiré.',
      ),
      p(
        'TODO(client) : préciser si les frais facturés par le prestataire de paiement sont remboursés ou conservés.',
      ),
    ],
  },
  {
    slug: 'avertissement',
    title: 'Avertissement',
    seo: {
      title: 'Avertissement : ni fatwa ni conseil | Amana Conseil',
      description:
        'Les contenus d’Amana Conseil informent et forment. Ils ne constituent ni une fatwa ni un conseil financier, juridique ou fiscal personnalisé.',
    },
    blocks: disclaimerFullBlocks,
  },
]

type Layout = NonNullable<Page['layout']>

/** Contenu Lexical d'une page légale : encadré de validation, puis le texte. */
export function legalContent(page: LegalPageSeed) {
  return rt(reviewNotice(), ...page.blocks)
}

export async function seedLegalPages(seeder: Seeder): Promise<void> {
  for (const page of legalPagesSeed) {
    const layout: Layout = [{ blockType: 'richText', content: legalContent(page) }]
    await upsert(
      seeder,
      'pages',
      { field: 'slug', value: page.slug },
      {
        title: page.title,
        slug: page.slug,
        layout,
        // Non indexée tant que le juriste n'a pas validé le texte (ADR 013).
        seo: { ...page.seo, noIndex: true },
        _status: 'published',
      },
    )
  }
}
