import type { Option } from 'payload'

/** Libellé bilingue de l'admin Payload. */
export const l = (fr: string, en: string) => ({ fr, en })

/** Groupes de navigation de l'admin. */
export const groups = {
  site: l('Site', 'Site'),
  resources: l('Ressources', 'Resources'),
  training: l('Formation', 'Training'),
  learners: l('Suivi apprenants', 'Learner tracking'),
  commerce: l('Commerce', 'Commerce'),
  business: l('Entreprises', 'Business'),
  contacts: l('Contacts', 'Contacts'),
  system: l('Système', 'System'),
}

/** Construit des options de `select` à partir d'un tableau de valeurs typées. */
export function options<T extends string>(
  values: readonly T[],
  labels: Record<T, { fr: string; en: string }>,
): Option[] {
  return values.map((value) => ({ value, label: labels[value] }))
}

export const pillars = ['formation', 'audit', 'conseil', 'takaful'] as const
export type Pillar = (typeof pillars)[number]
export const pillarOptions = options(pillars, {
  formation: l('Formation', 'Training'),
  audit: l('Audit de conformité', 'Compliance audit'),
  conseil: l('Conseil et accompagnement', 'Advisory'),
  takaful: l('Takaful et finance', 'Takaful and finance'),
})

export const jobRoles = [
  'compliance',
  'front-office',
  'back-office',
  'management',
  'other',
] as const
export const jobRoleOptions = options(jobRoles, {
  compliance: l('Conformité', 'Compliance'),
  'front-office': l('Front office', 'Front office'),
  'back-office': l('Back office', 'Back office'),
  management: l('Direction', 'Management'),
  other: l('Autre', 'Other'),
})

export const leadTypes = [
  'audit',
  'conseil',
  'accompagnement',
  'formation-entreprise',
  'takaful',
  'partenariat',
  'contact',
] as const
export type LeadType = (typeof leadTypes)[number]
export const leadTypeOptions = options(leadTypes, {
  audit: l('Audit', 'Audit'),
  conseil: l('Conseil', 'Advisory'),
  accompagnement: l('Accompagnement', 'Support'),
  'formation-entreprise': l('Formation entreprise', 'Corporate training'),
  takaful: l('Takaful', 'Takaful'),
  partenariat: l('Partenariat', 'Partnership'),
  contact: l('Contact', 'Contact'),
})

export const interests = ['formation', 'audit', 'takaful', 'reglementaire'] as const
export const interestOptions = options(interests, {
  formation: l('Formation', 'Training'),
  audit: l('Audit', 'Audit'),
  takaful: l('Takaful', 'Takaful'),
  reglementaire: l('Actualité réglementaire', 'Regulatory news'),
})

export const contentLanguages = ['fr', 'en', 'ar'] as const
export const contentLanguageOptions = options(contentLanguages, {
  fr: l('Français', 'French'),
  en: l('Anglais', 'English'),
  ar: l('Arabe', 'Arabic'),
})
