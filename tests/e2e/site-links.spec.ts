import { expect, test } from '@playwright/test'

import { settle } from './site-helpers'

/**
 * Revue qa M2 (MAJ-1) : aucun lien interne de l'accueil, de l'en-tête (méga-menu compris)
 * ni du pied de page ne mène à une 404, en `fr` comme en `ar`. Les routes non livrées
 * (LMS, commerce, entreprise) ne doivent pas apparaître (ADR 016).
 */

for (const locale of ['fr', 'ar'] as const) {
  test(`liens internes de l'accueil, de l'en-tête et du pied de page (${locale})`, async ({
    page,
    request,
    baseURL,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/${locale}`)
    await settle(page)

    const hrefs = await page
      .locator('header a[href], main a[href], footer a[href], nav a[href]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))

    const origin = new URL(baseURL ?? 'http://localhost:3000').origin
    const internal = [
      ...new Set(
        hrefs
          .filter((href) => href.startsWith('/') && !href.startsWith('//'))
          .map((href) => new URL(href, origin))
          .map((url) => `${url.pathname}${url.search}`),
      ),
    ]

    expect(internal.length).toBeGreaterThan(10)

    const failures: string[] = []
    for (const path of internal) {
      const response = await request.get(path, { maxRedirects: 5 })
      if (response.status() !== 200) failures.push(`${response.status()} ${path}`)
    }
    expect(failures, failures.join('\n')).toEqual([])
  })
}
