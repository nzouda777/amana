/**
 * Sélection des membres affichés par le bloc `team` (pages). Logique pure : le rendu
 * passe le filtre obtenu à `payload.find({ collection: 'team-members', where, depth })`.
 */

export type TeamGroup = 'team' | 'committee'

export type TeamMembersQuery =
  | { kind: 'manual'; ids: number[] }
  | { kind: 'group'; where: { isComplianceCommittee: { equals: boolean } } }

/**
 * Sélection manuelle si des membres sont choisis (ordre conservé), sinon tous les membres
 * du groupe : `committee` = comité de conformité charia, `team` = membres hors comité.
 */
export function teamMembersQuery(
  group: TeamGroup,
  members: readonly (number | { id: number })[] | null | undefined,
): TeamMembersQuery {
  const ids = (members ?? []).map((member) => (typeof member === 'number' ? member : member.id))
  if (ids.length > 0) return { kind: 'manual', ids }
  return { kind: 'group', where: { isComplianceCommittee: { equals: group === 'committee' } } }
}
