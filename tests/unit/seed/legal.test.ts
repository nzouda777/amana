import { describe, expect, it } from 'vitest'

import { legalSlugs } from '@/features/site/legal'
import { LEGAL_REVIEW_TITLE, legalContent, legalPagesSeed } from '@/seed/legal'
import { servicesSeed } from '@/seed/services'

/** Texte brut d'un état Lexical (titres d'encadrés compris). */
function plain(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(plain).join(' ')
  if (typeof value === 'object' && value !== null) {
    const node = value as Record<string, unknown>
    const fields = node.fields as Record<string, unknown> | undefined
    return [node.text, node.children, node.root, fields?.title, fields?.content]
      .map(plain)
      .join(' ')
  }
  return ''
}

describe('seed — pages légales', () => {
  it('couvre toute la liste fermée de `/legal/[slug]`', () => {
    expect(legalPagesSeed.map((page) => page.slug).sort()).toEqual([...legalSlugs].sort())
  })

  it.each(legalPagesSeed)('$slug : encadré de validation juridique en tête, SEO borné', (page) => {
    const content = legalContent(page)
    const first = content.root.children[0] as { type: string; fields?: { title?: string } }
    expect(first.type).toBe('block')
    expect(first.fields?.title).toBe(LEGAL_REVIEW_TITLE)
    expect(plain(content)).toContain('juriste')
    expect(page.seo.title.length).toBeLessThanOrEqual(60)
    expect(page.seo.description.length).toBeLessThanOrEqual(155)
    // Au moins deux sections titrées (sommaire automatique).
    expect(page.blocks.filter((block) => block.type === 'heading').length).toBeGreaterThan(1)
  })

  it('mentions légales : RCCM, NIU, hébergeur et adresse à compléter', () => {
    const text = plain(legalContent(legalPagesSeed.find((p) => p.slug === 'mentions-legales')!))
    for (const field of ['RCCM', 'NIU', 'Hébergeur', 'adresse'])
      expect(text).toMatch(new RegExp(String.raw`${field}[^.]*TODO\(client\)`, 'i'))
  })

  it('CGV : moyens de paiement, pass non reconduit, aucun frais ni intérêt', () => {
    const text = plain(legalContent(legalPagesSeed.find((p) => p.slug === 'cgv')!))
    for (const expected of [
      'Mobile Money',
      'virement',
      'facture',
      'ne se renouvelle pas automatiquement',
      'Aucun frais de paiement fractionné',
      'ni une fatwa ni un conseil financier personnalisé',
    ])
      expect(text).toContain(expected)
  })

  it('confidentialité : loi camerounaise (référence à fournir), conservation, droits, export', () => {
    const text = plain(legalContent(legalPagesSeed.find((p) => p.slug === 'confidentialite')!))
    expect(text).toMatch(/loi camerounaise[^.]*TODO\(client\)/)
    for (const expected of ['Durées de conservation', 'Export et suppression', 'désinscription'])
      expect(text).toContain(expected)
  })

  it('cookies : mesure d’audience sans cookie ; avertissement : pas de fatwa', () => {
    expect(plain(legalContent(legalPagesSeed.find((p) => p.slug === 'cookies')!))).toContain(
      'ne dépose aucun cookie',
    )
    expect(plain(legalContent(legalPagesSeed.find((p) => p.slug === 'avertissement')!))).toContain(
      'ne délivre pas de fatwa',
    )
  })
})

describe('seed — appels à l’action des services', () => {
  it.each(servicesSeed)('$slug : le libellé annonce la destination', (service) => {
    // `accompagnement` mène au rendez-vous (ServicePages) ; les autres types de devis au devis.
    if (/rendez-vous/i.test(service.cta.label)) expect(service.cta.leadType).toBe('accompagnement')
    if (/devis/i.test(service.cta.label)) expect(service.cta.leadType).not.toBe('accompagnement')
  })
})
