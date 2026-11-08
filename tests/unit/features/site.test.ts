import { readdirSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { createCmsPathMatcher, isExternalCmsHref } from '@/features/site/cms-href'
import {
  isReleasedRoute,
  releasedPathnames,
  releasedRoute,
  unreleasedRoutes,
} from '@/features/site/routes'
import { groupByLetter, initialLetter } from '@/features/site/glossary'
import { isLegalSlug, mergeRichText } from '@/features/site/legal'
import {
  richTextParagraphList,
  richTextToParagraphs,
  withHeadingAnchors,
} from '@/features/site/rich-text'
import {
  groupSearchHits,
  type SearchHit,
  searchTerms,
  toPrefixTsQuery,
} from '@/features/site/search'
import { type AppPathname, pathnames } from '@/lib/i18n/routing'
import { validateCmsHref } from '@/payload/fields/href'

const text = (value: string) => ({ type: 'text', text: value, format: 0, version: 1 })
const paragraph = (value: string) => ({ type: 'paragraph', version: 1, children: [text(value)] })
const heading = (tag: string, value: string) => ({
  type: 'heading',
  tag,
  version: 1,
  children: [text(value)],
})
const state = (...children: object[]) => ({ root: { type: 'root', version: 1, children } })

describe('liens du CMS', () => {
  const match = createCmsPathMatcher(Object.keys(pathnames))

  it('reconnaît les routes statiques et dynamiques françaises', () => {
    expect(match('/audit-conformite')).toEqual({ pathname: '/audit-conformite' })
    expect(match('/audit-conformite/revue-produit')).toEqual({
      pathname: '/audit-conformite/[slug]',
      params: { slug: 'revue-produit' },
    })
    expect(match('/ressources/glossaire/riba/')).toEqual({
      pathname: '/ressources/glossaire/[term]',
      params: { term: 'riba' },
    })
  })

  it('préfère une route statique à une route à paramètre', () => {
    expect(match('/formation/cours')).toEqual({ pathname: '/formation/cours' })
    expect(match('/ressources/guides')).toEqual({ pathname: '/ressources/guides' })
  })

  it('conserve la requête et ignore l’ancre', () => {
    expect(match('/devis?type=audit#haut')).toEqual({
      pathname: '/devis',
      query: { type: 'audit' },
    })
  })

  it('refuse les routes inconnues et les URL relatives', () => {
    expect(match('/inconnue')).toBeNull()
    expect(match('devis')).toBeNull()
    expect(match('')).toBeNull()
  })

  it('ignore un segment mal encodé sans lever d’exception', () => {
    expect(() => match('/audit-conformite/%E0%A4%A')).not.toThrow()
    expect(match('/audit-conformite/%E0%A4%A')).toBeNull()
    expect(match('/ressources/glossaire/%')).toBeNull()
    expect(match('/audit-conformite/revue%20produit')).toEqual({
      pathname: '/audit-conformite/[slug]',
      params: { slug: 'revue produit' },
    })
  })

  it('distingue les liens externes', () => {
    expect(isExternalCmsHref('https://wa.me/237')).toBe(true)
    expect(isExternalCmsHref('mailto:contact@example.cm')).toBe(true)
    expect(isExternalCmsHref('#offre')).toBe(true)
    expect(isExternalCmsHref('/contact')).toBe(false)
    expect(isExternalCmsHref('javascript:alert(1)')).toBe(false)
  })
})

describe('routes non livrées (ADR 016)', () => {
  const all = Object.keys(pathnames) as AppPathname[]
  const matchReleased = createCmsPathMatcher(releasedPathnames(all))

  it('ne résout aucun lien vers une partie du LMS, le commerce ou l’espace entreprise à venir', () => {
    for (const href of [
      '/formation/entreprises',
      '/formation/entreprises/capsules',
      '/formation/presentiel',
      '/formation/abonnement',
      '/certificats/verifier',
      '/certificats/ABC123',
      '/panier',
      '/commande',
      '/espace',
      '/organisation',
    ])
      expect(matchReleased(href), href).toBeNull()
  })

  it('résout les routes du LMS livrées en M3 (catalogue, fiche, parcours, authentification)', () => {
    expect(matchReleased('/formation/cours')).toEqual({ pathname: '/formation/cours' })
    expect(matchReleased('/formation/cours/finance-islamique-101')).toEqual({
      pathname: '/formation/cours/[slug]',
      params: { slug: 'finance-islamique-101' },
    })
    expect(matchReleased('/formation/parcours/conformite-bancaire')).toEqual({
      pathname: '/formation/parcours/[slug]',
      params: { slug: 'conformite-bancaire' },
    })
    for (const href of ['/connexion', '/inscription', '/mot-de-passe'])
      expect(matchReleased(href), href).toEqual({ pathname: href })
  })

  it('résout toujours les routes de la vitrine', () => {
    expect(matchReleased('/formation')).toEqual({ pathname: '/formation' })
    expect(matchReleased('/devis?type=formation-entreprise')).toEqual({
      pathname: '/devis',
      query: { type: 'formation-entreprise' },
    })
    expect(matchReleased('/audit-conformite/revue-produit')).toEqual({
      pathname: '/audit-conformite/[slug]',
      params: { slug: 'revue-produit' },
    })
  })

  it('expose une route livrée et masque une route à venir', () => {
    expect(releasedRoute('/rendez-vous')).toBe('/rendez-vous')
    expect(releasedRoute('/espace')).toBeUndefined()
    expect(releasedRoute('/panier')).toBeUndefined()
    expect(isReleasedRoute('/formation/cours/[slug]')).toBe(true)
    expect(isReleasedRoute('/certificats/[code]')).toBe(false)
  })

  it('ne liste que des routes déclarées dans `pathnames`', () => {
    for (const route of unreleasedRoutes) expect(all).toContain(route)
  })

  it('correspond aux pages présentes dans `src/app/[locale]`', () => {
    const root = path.resolve(process.cwd(), 'src/app/[locale]')
    const served = new Set<string>()
    const walk = (dir: string, segments: string[]) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const name = entry.name
          if (name.startsWith('_') || name.startsWith('[...')) continue
          walk(path.join(dir, name), /^\(.*\)$/.test(name) ? segments : [...segments, name])
        } else if (entry.name === 'page.tsx') {
          served.add(`/${segments.join('/')}`)
        }
      }
    }
    walk(root, [])
    for (const route of all)
      expect(served.has(route), `${route} : livrée ${isReleasedRoute(route)}`).toBe(
        isReleasedRoute(route),
      )
  })
})

describe('validation des liens dans le back-office', () => {
  it('accepte les routes déclarées et les liens externes', () => {
    expect(validateCmsHref('/audit-conformite/revue-produit')).toBe(true)
    expect(validateCmsHref('/devis?type=audit#haut')).toBe(true)
    expect(validateCmsHref('https://wa.me/237600000000')).toBe(true)
    expect(validateCmsHref('mailto:contact@example.cm')).toBe(true)
    expect(validateCmsHref('#offres')).toBe(true)
    // Route à venir : acceptée, masquée au rendu jusqu'à sa livraison.
    expect(validateCmsHref('/formation/cours')).toBe(true)
  })

  it('gère le caractère obligatoire du champ', () => {
    expect(validateCmsHref('', { required: true })).toEqual(expect.any(String))
    expect(validateCmsHref(null, { required: true })).toEqual(expect.any(String))
    expect(validateCmsHref('   ')).toBe(true)
    expect(validateCmsHref(undefined)).toBe(true)
  })

  it('refuse ce que `cmsHref` ne sait pas résoudre', () => {
    for (const href of [
      '/audit-conformite/%E0%A4%A',
      '/inconnue',
      'devis',
      'javascript:alert(1)',
      'data:text/html,x',
      '//exemple.com',
      'ftp://exemple.com',
    ])
      expect(validateCmsHref(href), href).toEqual(expect.any(String))
  })
})

describe('texte riche', () => {
  it('ancre les titres h2/h3 et construit le sommaire, sans modifier l’entrée', () => {
    const input = state(
      heading('h2', '1. Pas d’intérêt'),
      paragraph('…'),
      heading('h3', 'Et les secteurs exclus ?'),
      heading('h2', '1. Pas d’intérêt'),
      heading('h4', 'Ignoré'),
    )
    const { state: output, toc } = withHeadingAnchors(input)
    expect(toc).toEqual([
      { id: '1-pas-d-interet', text: '1. Pas d’intérêt', level: 2 },
      { id: 'et-les-secteurs-exclus', text: 'Et les secteurs exclus ?', level: 3 },
      { id: '1-pas-d-interet-2', text: '1. Pas d’intérêt', level: 2 },
    ])
    expect((output.root.children[0] as Record<string, unknown>).anchorId).toBe('1-pas-d-interet')
    expect((input.root.children[0] as Record<string, unknown>).anchorId).toBeUndefined()
  })

  it('renvoie un sommaire vide pour une valeur qui n’est pas un état Lexical', () => {
    expect(withHeadingAnchors(null).toc).toEqual([])
  })

  it('convertit en paragraphes de texte brut (listes sur des lignes)', () => {
    const list = {
      type: 'list',
      version: 1,
      children: [
        { type: 'listitem', version: 1, children: [text('un')] },
        { type: 'listitem', version: 1, children: [text('deux')] },
      ],
    }
    const input = state(paragraph('Premier  paragraphe.'), list, paragraph(''))
    expect(richTextToParagraphs(input)).toBe('Premier paragraphe.\n\nun\ndeux')
    expect(richTextParagraphList(input)).toEqual(['Premier paragraphe.', 'un\ndeux'])
    expect(richTextToParagraphs('texte')).toBe('')
  })
})

describe('glossaire', () => {
  it('initiale sans accent, « # » pour le reste', () => {
    expect(initialLetter('Éthique')).toBe('E')
    expect(initialLetter('ʿaqd')).toBe('#')
    expect(initialLetter('  riba')).toBe('R')
  })

  it('groupe et trie par lettre selon la langue', () => {
    const groups = groupByLetter(['takaful', 'Éthique', 'ijara', 'élément', '1 dinar'], (v) => v)
    expect(groups.map((g) => g.letter)).toEqual(['E', 'I', 'T', '#'])
    expect(groups[0]?.items).toEqual(['élément', 'Éthique'])
  })
})

describe('pages légales', () => {
  it('liste fermée de slugs', () => {
    expect(isLegalSlug('cgv')).toBe(true)
    expect(isLegalSlug('a-propos')).toBe(false)
  })

  it('fusionne les blocs « Texte »', () => {
    const merged = mergeRichText([state(paragraph('a')), null, state(paragraph('b'))])
    expect(merged?.root.children).toHaveLength(2)
    expect(mergeRichText([])).toBeNull()
  })
})

describe('recherche', () => {
  it('ne garde que des mots utiles et produit une requête préfixée sûre', () => {
    expect(searchTerms("L'audit & la charia | !riba:*")).toEqual(['audit', 'la', 'charia', 'riba'])
    expect(toPrefixTsQuery('Fenêtre islamique')).toBe('fenêtre:* & islamique:*')
    expect(toPrefixTsQuery('  ! ')).toBeNull()
    expect(toPrefixTsQuery('a')).toBeNull()
  })

  it('limite la longueur et le nombre de mots', () => {
    const many = Array.from({ length: 20 }, (_, i) => `mot${i}`).join(' ')
    expect(searchTerms(many)).toHaveLength(8)
  })

  it('groupe les résultats par type, dans l’ordre d’affichage', () => {
    const hit = (kind: SearchHit['kind'], id: number, rank: number): SearchHit => ({
      kind,
      id,
      slug: `s${id}`,
      title: `T${id}`,
      excerpt: null,
      pillar: null,
      rank,
    })
    const groups = groupSearchHits([
      hit('glossary', 1, 0.2),
      hit('service', 2, 0.1),
      hit('glossary', 3, 0.9),
    ])
    expect(groups.map((g) => g.kind)).toEqual(['service', 'glossary'])
    expect(groups[1]?.hits.map((h) => h.id)).toEqual([3, 1])
  })
})

describe('webinaires', () => {
  it('sépare à venir (du plus proche) et passés, selon la fin', async () => {
    const { splitEvents } = await import('@/features/site/events')
    const now = Date.parse('2026-11-03T12:00:00Z')
    const events = [
      { id: 1, startsAt: '2026-12-10T17:00:00Z' },
      { id: 2, startsAt: '2026-10-08T15:00:00Z' },
      { id: 3, startsAt: '2026-11-03T11:00:00Z', endsAt: '2026-11-03T13:00:00Z' },
    ]
    const { upcoming, past } = splitEvents(events, now)
    expect(upcoming.map((e) => e.id)).toEqual([3, 1])
    expect(past.map((e) => e.id)).toEqual([2])
  })
})
