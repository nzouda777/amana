/**
 * Globals : réglages du site, navigation (méga-menu), pied de page, avertissement.
 * Coordonnées et identité légale : placeholders `TODO(client)` (docs/CLIENT-INPUTS.md).
 */
import { type Block, h2, p, rt, ul } from './lib/richtext'
import { type Seeder, updateGlobal } from './lib/upsert'
import { servicePath, servicesSeed, type ServiceSeed } from './services'

/** Domaine réservé (RFC 2606) : aucune adresse réelle tant que le client ne l'a pas fournie. */
const PLACEHOLDER_DOMAIN = 'amana-conseil.example'

/** Chiffres de démonstration, TODO(client) : chiffres réels. */
export const keyFiguresSeed = [
  { key: 'professionnels-formes', value: '250', label: 'professionnels formés (démo)' },
  { key: 'missions', value: '30', label: 'missions d’audit et de conseil (démo)' },
  { key: 'cours', value: '6', label: 'cours en ligne (démo)' },
  { key: 'pays', value: '4', label: 'pays de la zone CEMAC (démo)' },
]

export async function seedSiteSettings(seeder: Seeder): Promise<void> {
  await updateGlobal(seeder, 'site-settings', {
    organizationName: 'Amana Conseil',
    tagline: 'Éthique, Conformité, Innovation',
    contact: {
      email: `contact@${PLACEHOLDER_DOMAIN}`,
      phone: '+237600000000',
      whatsapp: '+237600000000',
      address: 'TODO(client) : adresse exacte du cabinet, Douala',
      city: 'Douala',
      country: 'Cameroun',
      mapUrl: null,
      openingHours: 'Du lundi au vendredi, de 8 h 30 à 17 h 30 (TODO(client))',
    },
    requestRouting: (
      [
        ['audit', 'audit'],
        ['conseil', 'conseil'],
        ['accompagnement', 'conseil'],
        ['formation-entreprise', 'formation'],
        ['takaful', 'takaful'],
        ['partenariat', 'partenariats'],
        ['contact', 'contact'],
      ] as const
    ).map(([leadType, mailbox]) => ({ leadType, email: `${mailbox}@${PLACEHOLDER_DOMAIN}` })),
    // TODO(client) : comptes réseaux sociaux du cabinet.
    social: [],
    // Cités dans les phrases du bloc `stats` par leur clé : {{professionnels-formes}} (ADR 010).
    // Aucun bloc `stats` n'est seedé tant que ces valeurs restent de démonstration (TODO(client)).
    keyFigures: keyFiguresSeed,
    legal: {
      legalName: 'TODO(client) : raison sociale exacte',
      legalForm: 'TODO(client)',
      rccm: 'TODO(client)',
      niu: 'TODO(client)',
      shareCapital: 'TODO(client)',
    },
  })
}

const childrenOf = (pillar: ServiceSeed['pillar']) =>
  servicesSeed
    .filter((service) => service.pillar === pillar)
    .map((service) => ({
      label: service.navLabel,
      href: servicePath(service),
      description:
        service.summary.length > 110 ? `${service.summary.slice(0, 107)}…` : service.summary,
    }))

export async function seedNavigation(seeder: Seeder): Promise<void> {
  await updateGlobal(seeder, 'navigation', {
    items: [
      {
        label: 'Formation',
        href: '/formation',
        // Le panneau affiche déjà un lien vers le hub `/formation` : pas d'entrée en double.
        // TODO(M3) : « Sessions en présentiel » (/formation/presentiel) et « Vérifier un
        // certificat » (/certificats/verifier) à leur livraison.
        // TODO(M5) : « Offre entreprises » (/formation/entreprises) et « Bibliothèque de
        // capsules » (/formation/entreprises/capsules) à la place du devis.
        // TODO(M4) : rétablir « Pass d’accès » (/formation/abonnement) quand (shop) sera livré.
        children: [
          {
            label: 'Cours en ligne',
            href: '/formation/cours',
            description: 'Cours et capsules, extraits gratuits et certificat vérifiable.',
          },
          {
            label: 'Former vos équipes',
            href: '/devis?type=formation-entreprise',
            description: 'Décrivez vos besoins : nous vous proposons un programme adapté.',
          },
          {
            label: 'Guide gratuit',
            href: '/ressources/guides/guide-bases-finance-islamique',
            description: 'Les bases de la finance islamique, à télécharger.',
          },
        ],
      },
      { label: 'Audit et conformité', href: '/audit-conformite', children: childrenOf('audit') },
      {
        label: 'Conseil et accompagnement',
        href: '/conseil-accompagnement',
        children: childrenOf('conseil'),
      },
      { label: 'Takaful et finance', href: '/takaful-finance', children: childrenOf('takaful') },
      {
        label: 'Ressources',
        href: '/ressources',
        children: [
          {
            label: 'Articles',
            href: '/ressources/articles',
            description: 'Analyses et explications pédagogiques.',
          },
          {
            label: 'Guides',
            href: '/ressources/guides',
            description: 'Guides pratiques à télécharger.',
          },
          {
            label: 'Glossaire',
            href: '/ressources/glossaire',
            description: 'Les termes de la finance islamique expliqués.',
          },
          {
            label: 'Webinaires',
            href: '/ressources/webinaires',
            description: 'Prochains rendez-vous et replays.',
          },
          {
            label: 'Cas clients',
            href: '/cas-clients',
            description: 'Des missions racontées, de l’enjeu aux résultats.',
          },
        ],
      },
      { label: 'À propos', href: '/a-propos', children: [] },
    ],
    primaryCta: { label: 'Prendre rendez-vous', href: '/rendez-vous' },
  })
}

export async function seedFooter(seeder: Seeder): Promise<void> {
  await updateGlobal(seeder, 'footer', {
    columns: [
      {
        title: 'Formation',
        // TODO(M3) : « Vérifier un certificat » (/certificats/verifier) à sa livraison.
        // TODO(M5) : « Offre entreprises » (/formation/entreprises).
        // TODO(M4) : rétablir « Pass d’accès » (/formation/abonnement).
        links: [
          { label: 'Nos formations', href: '/formation' },
          { label: 'Cours en ligne', href: '/formation/cours' },
          { label: 'Former vos équipes', href: '/devis?type=formation-entreprise' },
        ],
      },
      {
        title: 'Expertises',
        links: [
          { label: 'Audit et conformité', href: '/audit-conformite' },
          { label: 'Conseil et accompagnement', href: '/conseil-accompagnement' },
          { label: 'Takaful et finance', href: '/takaful-finance' },
        ],
      },
      {
        title: 'Ressources',
        links: [
          { label: 'Articles', href: '/ressources/articles' },
          { label: 'Glossaire', href: '/ressources/glossaire' },
          { label: 'Webinaires', href: '/ressources/webinaires' },
        ],
      },
      {
        title: 'Le cabinet',
        links: [
          { label: 'À propos', href: '/a-propos' },
          { label: 'Contact', href: '/contact' },
          { label: 'Demander un devis', href: '/devis' },
          { label: 'Prendre rendez-vous', href: '/rendez-vous' },
        ],
      },
    ],
    legalLinks: [
      { label: 'Mentions légales', href: '/legal/mentions-legales' },
      { label: 'Conditions générales de vente', href: '/legal/cgv' },
      { label: 'Conditions d’utilisation', href: '/legal/cgu' },
      { label: 'Confidentialité', href: '/legal/confidentialite' },
      { label: 'Cookies', href: '/legal/cookies' },
      { label: 'Remboursement', href: '/legal/remboursement' },
      { label: 'Avertissement', href: '/legal/avertissement' },
    ],
    newsletterText:
      'Une lettre par mois : nouveaux cours, actualité réglementaire et ressources pratiques. Désinscription en un clic.',
  })
}

/** Version complète de l'avertissement (global et page /legal/avertissement). */
export const disclaimerFullBlocks: Block[] = [
  h2('Nature des contenus'),
  p(
    'Les articles, guides, cours, capsules et webinaires d’Amana Conseil ont une vocation d’information et de formation. Ils présentent des principes généraux et des pratiques de marché.',
  ),
  h2('Ni fatwa, ni conseil personnalisé'),
  p(
    'Amana Conseil ne délivre pas de fatwa. Les avis de conformité émis dans le cadre de missions d’audit ou de conseil portent sur des produits et des processus précis, pour le client concerné, et reposent sur des normes publiées.',
  ),
  p(
    'Aucun contenu de ce site ne constitue un conseil financier, juridique, fiscal ou d’investissement adapté à votre situation personnelle.',
  ),
  h2('Avant toute décision'),
  ul(
    'adressez-vous au comité de conformité de l’établissement qui propose le produit ;',
    'consultez un professionnel habilité pour votre situation personnelle ;',
    'vérifiez la réglementation applicable dans votre pays.',
  ),
]

export const disclaimerShort =
  'Les contenus de ce site ont une vocation d’information et de formation. Ils ne constituent ni une fatwa ni un conseil financier personnalisé.'

export async function seedLegalDisclaimer(seeder: Seeder): Promise<void> {
  await updateGlobal(seeder, 'legal-disclaimer', {
    short: disclaimerShort,
    full: rt(
      ...disclaimerFullBlocks,
      p('TODO(client) : texte à valider par un juriste et par le comité de conformité.'),
    ),
  })
}
