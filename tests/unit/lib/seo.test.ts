import { describe, expect, it } from 'vitest'

import en from '../../../messages/en.json'
import fr from '../../../messages/fr.json'
import { legalSlugs } from '@/features/site/legal'
import { locales } from '@/lib/i18n/config'
import { indexedLocales, TITLE_MAX } from '@/lib/seo/config'
import {
  articleJsonLd,
  breadcrumbJsonLd,
  eventJsonLd,
  faqPageJsonLd,
  isPlaceholder,
  serializeJsonLd,
  siteGraphJsonLd,
} from '@/lib/seo/jsonld'
import { buildPageMetadata, resolveDescription, resolveTitle } from '@/lib/seo/metadata'
import { absoluteUrl, localizedPath } from '@/lib/seo/paths'
import { buildSitemap, disallowedRoutes, staticRoutes } from '@/lib/seo/sitemap'
import { clampText } from '@/lib/seo/text'
import { validateJsonLd } from '@/lib/seo/validate'

const SITE = 'https://amana.test'
const site = { siteUrl: SITE, siteName: 'Amana Conseil' }

describe('chemins localisés', () => {
  it('préfixe la locale et traduit le chemin', () => {
    expect(localizedPath('fr', '/')).toBe('/fr')
    expect(localizedPath('en', '/a-propos')).toBe('/en/about')
    expect(localizedPath('ar', '/a-propos')).toBe('/ar/a-propos')
    expect(
      localizedPath('en', { pathname: '/audit-conformite/[slug]', params: { slug: 'audit-x' } }),
    ).toBe('/en/compliance-audit/audit-x')
  })

  it('refuse un paramètre manquant', () => {
    expect(() => localizedPath('fr', '/ressources/articles/[slug]')).toThrow(/slug/)
  })
})

describe('titres et descriptions', () => {
  it('coupe sur une limite de mot', () => {
    const text = 'Un titre beaucoup trop long pour tenir dans la limite fixée par les moteurs'
    const out = clampText(text, 40)
    expect(out.length).toBeLessThanOrEqual(40)
    expect(out.endsWith('…')).toBe(true)
    expect(clampText('court', 40)).toBe('court')
  })

  it('titre ≤ 60 : gabarit si possible, sinon titre seul', () => {
    expect(resolveTitle('Contact', null, 'Amana Conseil')).toEqual({
      value: 'Contact',
      full: 'Contact · Amana Conseil',
    })
    const long = resolveTitle(
      'Audit de conformité charia des fenêtres islamiques et des produits',
      null,
      'Amana Conseil',
    )
    expect(long.full.length).toBeLessThanOrEqual(TITLE_MAX)
    expect(long.value).toEqual({ absolute: long.full })
    const custom = resolveTitle('X', 'Audit charia | Amana Conseil', 'Amana Conseil')
    expect(custom.value).toEqual({ absolute: 'Audit charia | Amana Conseil' })
  })

  it('description ≤ 155, première valeur non vide', () => {
    expect(resolveDescription(null, '  ', 'Texte')).toBe('Texte')
    expect(resolveDescription('a '.repeat(120))?.length).toBeLessThanOrEqual(155)
    expect(resolveDescription(null, undefined)).toBeUndefined()
  })

  // Titres et descriptions d'interface utilisés par generateMetadata (fr et en).
  const metaKeys = (messages: typeof fr) => [
    messages.site.services.audit.title,
    messages.site.services.conseil.title,
    messages.site.services.takaful.title,
    messages.site.cases.title,
    messages.site.contact.title,
    messages.site.quote.title,
    messages.site.appointment.title,
    messages.site.resources.title,
    messages.site.articles.title,
    messages.site.guides.title,
    messages.site.glossary.title,
    messages.site.webinars.title,
    ...Object.values(messages.site.legal.titles),
  ]
  const metaDescriptions = (messages: typeof fr) => [
    messages.site.services.audit.metaDescription,
    messages.site.services.conseil.metaDescription,
    messages.site.services.takaful.metaDescription,
    messages.site.cases.metaDescription,
    messages.site.contact.lead,
    messages.site.quote.lead,
    messages.site.appointment.lead,
    messages.site.resources.lead,
    messages.site.articles.lead,
    messages.site.guides.lead,
    messages.site.glossary.lead,
    messages.site.webinars.lead,
    messages.metadata.defaultDescription,
  ]
  it.each([
    ['fr', fr],
    ['en', en as typeof fr],
  ])('%s : titres d’interface avec le gabarit ≤ 60, descriptions ≤ 155', (_locale, messages) => {
    for (const title of metaKeys(messages))
      expect(`${title} · ${messages.metadata.siteName}`.length, title).toBeLessThanOrEqual(60)
    for (const description of metaDescriptions(messages))
      expect(description.length, description).toBeLessThanOrEqual(155)
  })
})

describe('métadonnées de page', () => {
  const route = { pathname: '/audit-conformite/[slug]', params: { slug: 'audit-x' } } as const

  it('fr : canonical, hreflang (locales ouvertes + x-default), Open Graph', () => {
    const metadata = buildPageMetadata(
      { locale: 'fr', route, title: 'Audit', description: 'Description' },
      site,
    )
    expect(metadata.alternates?.canonical).toBe(`${SITE}/fr/audit-conformite/audit-x`)
    expect(metadata.alternates?.languages).toEqual({
      ...Object.fromEntries(
        indexedLocales.map((locale) => [locale, absoluteUrl(SITE, locale, route)]),
      ),
      'x-default': `${SITE}/fr/audit-conformite/audit-x`,
    })
    expect(metadata.robots).toBeUndefined()
    expect(metadata.openGraph).toMatchObject({
      url: `${SITE}/fr/audit-conformite/audit-x`,
      locale: 'fr_FR',
      images: [{ url: `${SITE}/fr/opengraph-image` }],
    })
  })

  it('locale non ouverte : noindex, pas de hreflang (ADR 014)', () => {
    for (const locale of locales.filter((value) => !indexedLocales.includes(value))) {
      const metadata = buildPageMetadata({ locale, route, title: 'Audit' }, site)
      expect(metadata.robots).toEqual({ index: false, follow: true })
      expect(metadata.alternates?.languages).toBeUndefined()
      expect(metadata.alternates?.canonical).toBe(absoluteUrl(SITE, locale, route))
    }
  })

  it('noIndex du CMS et image propre à la route', () => {
    const metadata = buildPageMetadata(
      { locale: 'fr', route, title: 'Audit', seo: { noIndex: true }, ownImage: true },
      site,
    )
    expect(metadata.robots).toEqual({ index: false, follow: true })
    expect(metadata.alternates?.languages).toBeUndefined()
    expect(metadata.openGraph && 'images' in metadata.openGraph).toBe(false)
  })

  it('article : Open Graph de type article', () => {
    const metadata = buildPageMetadata(
      {
        locale: 'fr',
        route: { pathname: '/ressources/articles/[slug]', params: { slug: 'a' } },
        title: 'Article',
        article: { publishedTime: '2026-01-10T08:00:00.000Z', authors: ['A. Auteur'] },
      },
      site,
    )
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      publishedTime: '2026-01-10T08:00:00.000Z',
    })
  })
})

describe('sitemap et robots', () => {
  const doc = (slug: string, noIndex = false) => ({
    slug,
    updatedAt: '2026-11-01T00:00:00.000Z',
    seo: { noIndex },
  })
  const sitemap = buildSitemap(SITE, {
    pages: [doc('accueil'), doc('a-propos'), doc('cgv', true), doc('cookies'), doc('inconnue')],
    legalSlugs,
    services: [
      { ...doc('audit-x'), route: '/audit-conformite/[slug]' },
      {
        ...doc('cache', true),
        route: '/audit-conformite/[slug]',
      },
    ],
    caseStudies: [doc('cas-1')],
    posts: [doc('article-1'), doc('brouillon-masque', true)],
    guides: [doc('guide-1')],
    glossaryTerms: [doc('riba')],
  })
  const urls = sitemap.map((entry) => entry.url)

  it('pages indexables seulement, locale par défaut', () => {
    expect(urls).toContain(`${SITE}/fr`)
    expect(urls).toContain(`${SITE}/fr/a-propos`)
    expect(urls).toContain(`${SITE}/fr/legal/cookies`)
    expect(urls).not.toContain(`${SITE}/fr/legal/cgv`)
    expect(urls).toContain(`${SITE}/fr/audit-conformite/audit-x`)
    expect(urls).not.toContain(`${SITE}/fr/audit-conformite/cache`)
    expect(urls).toContain(`${SITE}/fr/ressources/glossaire/riba`)
    expect(urls.some((url) => url.includes('inconnue') || url.includes('brouillon'))).toBe(false)
    expect(urls.some((url) => /recherche|styleguide|confirmation/.test(url))).toBe(false)
    expect(urls.every((url) => url.startsWith(`${SITE}/fr`))).toBe(true)
    expect(new Set(urls).size).toBe(urls.length)
    expect(urls.length).toBe(3 + staticRoutes.length + 5)
  })

  it('robots : recherche, confirmation et guide de style exclus dans chaque locale', () => {
    const paths = locales.flatMap((locale) =>
      disallowedRoutes.map((route) => localizedPath(locale, route)),
    )
    expect(paths).toEqual(expect.arrayContaining(['/fr/recherche', '/en/search', '/fr/styleguide']))
  })
})

describe('données structurées', () => {
  it('graphe du site valide, sans valeurs provisoires', () => {
    const graph = siteGraphJsonLd({
      siteUrl: SITE,
      homeUrl: `${SITE}/fr`,
      name: 'Amana Conseil',
      legalName: 'TODO(client) : raison sociale exacte',
      description: 'Cabinet de conseil.',
      logoUrl: `${SITE}/brand/icon-512.png`,
      email: 'contact@amana-conseil.example',
      telephone: '+237600000000',
      streetAddress: 'TODO(client) : adresse',
      city: 'Douala',
      country: 'Cameroun',
      sameAs: [],
      areaServed: ['Cameroun', 'CEMAC'],
      inLanguage: 'fr',
    })
    expect(validateJsonLd(graph)).toEqual([])
    const text = JSON.stringify(graph)
    expect(text).not.toMatch(/TODO|\.example|600000000/)
    expect(text).toContain('"addressCountry":"CM"')
    expect(text).toContain('ProfessionalService')
  })

  it('valeurs provisoires reconnues', () => {
    expect(isPlaceholder('+237600000000')).toBe(true)
    expect(isPlaceholder('contact@amana-conseil.example')).toBe(true)
    expect(isPlaceholder('+237677123456')).toBe(false)
  })

  it('fil d’Ariane : positions, URL absolues sauf la page courante', () => {
    const data = breadcrumbJsonLd([
      { name: 'Accueil', url: `${SITE}/fr` },
      { name: 'Audit', url: `${SITE}/fr/audit-conformite` },
      { name: 'Audit charia' },
    ])
    expect(validateJsonLd(data)).toEqual([])
    expect(validateJsonLd(breadcrumbJsonLd([{ name: 'A' }, { name: 'B' }]))).toHaveLength(1)
  })

  it('article, événement et FAQ valides', () => {
    const article = articleJsonLd({
      siteUrl: SITE,
      url: `${SITE}/fr/ressources/articles/a`,
      headline: 'Comprendre la mourabaha',
      description: 'Résumé',
      datePublished: '2026-10-01T08:00:00.000Z',
      dateModified: null,
      authors: [{ name: 'Auteur (démo)' }],
      imageUrl: `${SITE}/fr/ressources/articles/a/opengraph-image`,
      inLanguage: 'fr',
    })
    expect(validateJsonLd(article)).toEqual([])
    expect(article).toMatchObject({ dateModified: '2026-10-01T08:00:00.000Z' })

    const event = eventJsonLd({
      siteUrl: SITE,
      name: 'Webinaire takaful',
      startDate: '2026-12-01T14:00:00.000Z',
      url: `${SITE}/fr/ressources/webinaires`,
      imageUrl: `${SITE}/fr/opengraph-image`,
      performers: ['Intervenant (démo)'],
      inLanguage: 'fr',
      free: true,
    })
    expect(validateJsonLd(event)).toEqual([])
    expect(event).toMatchObject({
      location: { '@type': 'VirtualLocation', url: `${SITE}/fr/ressources/webinaires` },
    })

    expect(validateJsonLd(faqPageJsonLd([{ question: 'Q ?', answer: 'R.' }]))).toEqual([])
    expect(validateJsonLd(faqPageJsonLd([]))).not.toEqual([])
  })

  it('détecte les erreurs et sérialise sans balise fermante', () => {
    expect(validateJsonLd({ '@type': 'Article' })).not.toEqual([])
    expect(
      validateJsonLd({ '@context': 'https://schema.org', '@type': 'Event', name: 'x' }),
    ).not.toEqual([])
    const json = serializeJsonLd(faqPageJsonLd([{ question: '</script>', answer: 'x' }]))
    expect(json).not.toContain('</script>')
    expect(JSON.parse(json)).toMatchObject({ mainEntity: [{ name: '</script>' }] })
  })
})
