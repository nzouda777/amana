import { describe, expect, it } from 'vitest'

import {
  findDuplicateFigureKeys,
  findUnknownFigureKeys,
  KEY_FIGURE_KEY_PATTERN,
  parseStatsSentence,
  resolveStatsSentence,
  statsSentenceToText,
} from '@/features/content/key-figures'
import { teamMembersQuery } from '@/features/content/team'

const figures = [
  { key: 'formes', value: '250', label: 'professionnels formés' },
  { key: 'missions', value: '30', label: null },
]

describe('chiffres clés — résolution des jetons', () => {
  it('remplace les jetons connus par des segments chiffre', () => {
    const { segments, missing } = parseStatsSentence(
      'Plus de {{formes}} professionnels et {{ missions }} missions.',
      figures,
    )
    expect(missing).toEqual([])
    expect(segments).toEqual([
      { kind: 'text', text: 'Plus de ' },
      { kind: 'figure', key: 'formes', value: '250', label: 'professionnels formés' },
      { kind: 'text', text: ' professionnels et ' },
      { kind: 'figure', key: 'missions', value: '30', label: null },
      { kind: 'text', text: ' missions.' },
    ])
    expect(statsSentenceToText(segments)).toBe('Plus de 250 professionnels et 30 missions.')
  })

  it('phrase sans jeton : un seul segment texte', () => {
    expect(parseStatsSentence('Aucun chiffre.', figures).segments).toEqual([
      { kind: 'text', text: 'Aucun chiffre.' },
    ])
    expect(parseStatsSentence('', figures).segments).toEqual([])
  })

  it('jeton inconnu : laissé tel quel et signalé une seule fois', () => {
    const { segments, missing } = parseStatsSentence('{{pays}} pays, {{pays}} encore', figures)
    expect(missing).toEqual(['pays'])
    expect(statsSentenceToText(segments)).toBe('{{pays}} pays, {{pays}} encore')
    expect(findUnknownFigureKeys('{{formes}} et {{inconnu}}', figures)).toEqual(['inconnu'])
  })

  it('jeton inconnu : visible en développement, phrase masquée en production', () => {
    const sentence = 'Présents dans {{pays}} pays.'
    const dev = resolveStatsSentence(sentence, figures, 'development')
    expect(dev && statsSentenceToText(dev)).toBe('Présents dans {{pays}} pays.')
    expect(resolveStatsSentence(sentence, figures, 'production')).toBeNull()
    expect(resolveStatsSentence('{{formes}}', figures, 'production')).not.toBeNull()
  })

  it('ignore les accolades qui ne forment pas un jeton', () => {
    const { segments, missing } = parseStatsSentence('a {b} {{ }} c', figures)
    expect(missing).toEqual([])
    expect(statsSentenceToText(segments)).toBe('a {b} {{ }} c')
  })
})

describe('chiffres clés — clés', () => {
  it('format de clé', () => {
    for (const ok of ['formes', 'pays-cemac', 'cours2026'])
      expect(ok).toMatch(KEY_FIGURE_KEY_PATTERN)
    for (const ko of ['Formes', '2pays', 'pays_cemac', 'pays-', 'a b', ''])
      expect(ko).not.toMatch(KEY_FIGURE_KEY_PATTERN)
  })

  it('détecte les doublons', () => {
    expect(findDuplicateFigureKeys([{ key: 'a' }, { key: 'b' }])).toEqual([])
    expect(
      findDuplicateFigureKeys([{ key: 'a' }, { key: 'b' }, { key: 'a' }, { key: 'a' }]),
    ).toEqual(['a'])
  })
})

describe('bloc équipe — sélection des membres', () => {
  it('sélection manuelle prioritaire, ordre conservé', () => {
    expect(teamMembersQuery('committee', [3, { id: 1 }])).toEqual({ kind: 'manual', ids: [3, 1] })
  })

  it('sinon filtre sur le drapeau comité', () => {
    expect(teamMembersQuery('committee', [])).toEqual({
      kind: 'group',
      where: { isComplianceCommittee: { equals: true } },
    })
    expect(teamMembersQuery('team', null)).toEqual({
      kind: 'group',
      where: { isComplianceCommittee: { equals: false } },
    })
  })
})
