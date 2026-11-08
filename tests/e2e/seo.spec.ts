import { expect, type Page, test } from '@playwright/test'

import { validateJsonLd } from '../../src/lib/seo/validate'

/**
 * SEO technique (ADR 013, 014) : sitemap, robots, métadonnées, données structurées
 * parsables et valides sur les gabarits clés, images Open Graph générées.
 */

async function jsonLd(page: Page): Promise<Array<Record<string, unknown>>> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
  return scripts.map((text) => JSON.parse(text) as Record<string, unknown>)
}

/** Types présents (racine ou `@graph`). */
function types(documents: Array<Record<string, unknown>>): string[] {
  return documents.flatMap((document) =>
    Array.isArray(document['@graph'])
      ? (document['@graph'] as Array<{ '@type': string }>).map((node) => node['@type'])
      : [String(document['@type'])],
  )
}

test('sitemap : pages françaises indexables, sans pages exclues', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  const xml = await response.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1] ?? '')
  const paths = urls.map((url) => new URL(url).pathname)
  expect(paths).toEqual(
    expect.arrayContaining([
      '/fr',
      '/fr/audit-conformite/audit-conformite-charia',
      '/fr/ressources/articles/principes-finance-islamique',
      '/fr/ressources/glossaire/mourabaha',
    ]),
  )
  expect(paths.every((path) => path.startsWith('/fr'))).toBe(true)
  // Pages légales non validées (noindex), recherche, guide de style : absentes.
  expect(paths.some((path) => /\/legal\/|recherche|styleguide|confirmation/.test(path))).toBe(false)
})

test('robots.txt : admin, API, recherche et guide de style exclus', async ({ request }) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  const text = await response.text()
  for (const rule of ['/admin', '/api', '/fr/recherche', '/fr/styleguide'])
    expect(text).toContain(`Disallow: ${rule}`)
  expect(text).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/)
})

for (const entry of [
  {
    name: 'accueil',
    path: '/fr',
    expected: ['Organization', 'ProfessionalService', 'WebSite'],
  },
  {
    name: 'service',
    path: '/fr/audit-conformite/audit-conformite-charia',
    expected: ['Organization', 'BreadcrumbList', 'FAQPage'],
  },
  {
    name: 'article',
    path: '/fr/ressources/articles/principes-finance-islamique',
    expected: ['Organization', 'BreadcrumbList', 'Article'],
  },
]) {
  test(`JSON-LD et métadonnées : ${entry.name}`, async ({ page }) => {
    await page.goto(entry.path)
    const documents = await jsonLd(page)
    for (const document of documents) expect(validateJsonLd(document)).toEqual([])
    const found = types(documents)
    expect(found).toEqual(expect.arrayContaining(entry.expected))
    // Une seule FAQPage par page.
    expect(found.filter((type) => type === 'FAQPage').length).toBeLessThanOrEqual(1)

    const title = await page.title()
    expect(title.length).toBeLessThanOrEqual(60)
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description?.length ?? 0).toBeGreaterThan(0)
    expect(description?.length ?? 0).toBeLessThanOrEqual(155)
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(new URL(canonical ?? '').pathname).toBe(entry.path)
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1)
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1)
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0)
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute(
      'content',
      /opengraph-image/,
    )
  })
}

test('locale non ouverte : noindex, sans hreflang', async ({ page }) => {
  await page.goto('/en/about')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
})

test('page légale : modèle signalé, non indexé tant que non validé', async ({ page }) => {
  await page.goto('/fr/legal/cgv')
  await expect(page.getByText('Modèle à valider par un juriste avant publication')).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('images Open Graph : PNG générés (accueil, service, article)', async ({ page, request }) => {
  for (const path of [
    '/fr',
    '/fr/audit-conformite/audit-conformite-charia',
    '/fr/ressources/articles/principes-finance-islamique',
  ]) {
    await page.goto(path)
    const url = await page.locator('meta[property="og:image"]').first().getAttribute('content')
    const target = new URL(url ?? '')
    const response = await request.get(`${target.pathname}${target.search}`)
    expect(response.status(), path).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  }
})

test('manifeste et icônes', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest')
  expect(manifest.status()).toBe(200)
  const body = (await manifest.json()) as { icons: Array<{ src: string }> }
  for (const icon of body.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200)
})

test('newsletter : un seul formulaire sur un article, aucune case précochée', async ({ page }) => {
  await page.goto('/fr/ressources/articles/principes-finance-islamique')
  await expect(page.getByRole('button', { name: 'S’inscrire' })).toHaveCount(1)
  await expect(
    page.getByRole('contentinfo').getByRole('button', { name: 'S’inscrire' }),
  ).toBeHidden()
  const boxes = page.locator('input[name="interests"]')
  await expect(boxes).not.toHaveCount(0)
  for (const box of await boxes.all()) await expect(box).not.toBeChecked()
})
