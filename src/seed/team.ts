/**
 * Équipe et comité de conformité charia — profils FICTIFS de démonstration.
 * TODO(client) : remplacer par les profils réels (noms, qualifications, photos, accord
 * de publication de chaque membre du comité).
 */
import { rt } from './lib/richtext'
import { type IdMap, type Seeder, upsert } from './lib/upsert'

const DEMO = 'Profil fictif de démonstration. TODO(client) : remplacer par le profil réel.'

type MemberSeed = {
  key: string
  name: string
  role: string
  committee: boolean
  qualifications: string
  bio: string[]
}

export const teamSeed: MemberSeed[] = [
  {
    key: 'direction',
    name: 'Mariam Ndjock (démo)',
    role: 'Associée fondatrice, directrice des missions',
    committee: false,
    qualifications: `${DEMO} Master en finance, certification en audit charia, 12 ans d'expérience bancaire en zone CEMAC.`,
    bio: [
      DEMO,
      "Mariam dirige les missions d'audit et de conseil du cabinet. Avant de fonder Amana Conseil, elle a conduit des projets de conformité dans des banques commerciales et des établissements de microfinance à Douala et à Yaoundé.",
    ],
  },
  {
    key: 'formation',
    name: 'Ibrahim Abdoulaye (démo)',
    role: 'Responsable pédagogique',
    committee: false,
    qualifications: `${DEMO} Docteur en économie, formateur en finance islamique depuis 8 ans.`,
    bio: [
      DEMO,
      'Ibrahim conçoit les cours en ligne et les capsules pour entreprises. Il veille à ce que chaque module parte de cas concrets et se termine par une évaluation utile.',
    ],
  },
  {
    key: 'takaful',
    name: 'Clarisse Fotso (démo)',
    role: 'Consultante senior takaful et assurance',
    committee: false,
    qualifications: `${DEMO} Actuaire, 10 ans en compagnie d'assurance.`,
    bio: [
      DEMO,
      'Clarisse accompagne les assureurs qui conçoivent des produits takaful et les entreprises qui souhaitent une couverture conforme.',
    ],
  },
  {
    key: 'audit',
    name: 'Hamadou Bouba (démo)',
    role: 'Auditeur charia',
    committee: false,
    qualifications: `${DEMO} Expert-comptable, formation aux normes AAOIFI.`,
    bio: [
      DEMO,
      'Hamadou réalise les revues de contrats, les tests de conformité et la rédaction des rapports d’audit.',
    ],
  },
  {
    key: 'comite-president',
    name: 'Cheikh Oumarou Sali (démo)',
    role: 'Président du comité de conformité charia',
    committee: true,
    qualifications: `${DEMO} Docteur en droit musulman des transactions (fiqh al-mouamalat).`,
    bio: [
      DEMO,
      'Le président du comité valide la méthode d’audit et les avis de conformité émis par le cabinet. Le comité rend des avis sur des produits et des opérations ; il ne délivre pas de fatwa individuelle.',
    ],
  },
  {
    key: 'comite-membre-1',
    name: 'Dr Aïssatou Bello (démo)',
    role: 'Membre du comité de conformité charia',
    committee: true,
    qualifications: `${DEMO} Docteure en finance islamique, enseignante-chercheuse.`,
    bio: [DEMO, 'Spécialiste des contrats de partenariat (moucharaka, moudaraba) et des sukuk.'],
  },
  {
    key: 'comite-membre-2',
    name: 'Moussa Njoya (démo)',
    role: 'Membre du comité de conformité charia',
    committee: true,
    qualifications: `${DEMO} Juriste, spécialiste du droit OHADA et de la réglementation COBAC.`,
    bio: [
      DEMO,
      'Il fait le lien entre les exigences de la charia et le droit des affaires applicable en zone CEMAC.',
    ],
  },
]

export async function seedTeam(seeder: Seeder): Promise<IdMap> {
  const ids: IdMap = new Map()
  for (const [index, member] of teamSeed.entries()) {
    const doc = await upsert(
      seeder,
      'team-members',
      { field: 'name', value: member.name },
      {
        name: member.name,
        role: member.role,
        isComplianceCommittee: member.committee,
        qualifications: member.qualifications,
        bio: rt(...member.bio),
        order: index + 1,
      },
    )
    ids.set(member.key, doc.id)
  }
  return ids
}

export async function seedAuthors(seeder: Seeder, team: IdMap): Promise<IdMap> {
  const authors = [
    { slug: 'mariam-ndjock', member: 'direction', bio: 'Associée fondatrice d’Amana Conseil.' },
    { slug: 'ibrahim-abdoulaye', member: 'formation', bio: 'Responsable pédagogique.' },
    { slug: 'clarisse-fotso', member: 'takaful', bio: 'Consultante senior takaful.' },
  ]
  const ids: IdMap = new Map()
  for (const author of authors) {
    const member = teamSeed.find((m) => m.key === author.member)
    if (!member) throw new Error(`Seed : membre inconnu ${author.member}`)
    const doc = await upsert(
      seeder,
      'authors',
      { field: 'slug', value: author.slug },
      {
        name: member.name,
        slug: author.slug,
        role: member.role,
        bio: `${author.bio} ${DEMO}`,
        teamMember: team.get(author.member) ?? null,
      },
    )
    ids.set(author.slug, doc.id)
  }
  return ids
}
