import { expect, test } from '@playwright/test'

import { expectNoAxeViolations, expectNoHorizontalOverflow, settle } from './site-helpers'

/**
 * Site vitrine (M2) : chaque route clé répond avec un H1, sans défilement horizontal ;
 * axe sans violation sur accueil, service, article, contact ; captures 390 / 1440 px.
 */

const SHOTS = 'docs/qa/screenshots/m2'

const pages = [
  { name: 'accueil', path: '/fr' },
  { name: 'a-propos', path: '/fr/a-propos' },
  { name: 'formation', path: '/fr/formation' },
  { name: 'audit', path: '/fr/audit-conformite' },
  { name: 'service', path: '/fr/audit-conformite/audit-conformite-charia' },
  { name: 'conseil', path: '/fr/conseil-accompagnement' },
  { name: 'takaful', path: '/fr/takaful-finance' },
  { name: 'cas-clients', path: '/fr/cas-clients' },
  { name: 'cas-client', path: '/fr/cas-clients/audit-conformite-banque-commerciale' },
  { name: 'ressources', path: '/fr/ressources' },
  { name: 'articles', path: '/fr/ressources/articles' },
  { name: 'article', path: '/fr/ressources/articles/principes-finance-islamique' },
  { name: 'guides', path: '/fr/ressources/guides' },
  { name: 'guide', path: '/fr/ressources/guides/guide-bases-finance-islamique' },
  { name: 'glossaire', path: '/fr/ressources/glossaire' },
  { name: 'terme', path: '/fr/ressources/glossaire/mourabaha' },
  { name: 'webinaires', path: '/fr/ressources/webinaires' },
  { name: 'contact', path: '/fr/contact' },
  { name: 'devis', path: '/fr/devis' },
  { name: 'rendez-vous', path: '/fr/rendez-vous' },
  { name: 'recherche', path: '/fr/recherche?q=takaful' },
  { name: 'legal', path: '/fr/legal/avertissement' },
] as const

for (const entry of pages) {
  test(`page ${entry.name} : rendu, H1 unique, pas de débordement à 390 px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const response = await page.goto(entry.path)
    expect(response?.status(), entry.path).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main#contenu')).toBeVisible()
    await settle(page)
    await expectNoHorizontalOverflow(page)
  })
}

test('URL inconnue : 404 utile dans le gabarit (recherche + pôles)', async ({ page }) => {
  const response = await page.goto('/fr/page-qui-n-existe-pas')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('introuvable')
  await expect(page.getByRole('search')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Audit et conformité' }).first()).toBeVisible()
})

test('Takaful : avertissement visible ; comité charia sur À propos', async ({ page }) => {
  await page.goto('/fr/takaful-finance')
  await expect(
    page.getByText('ni un conseil financier personnalisé ni un avis religieux'),
  ).toBeVisible()
  await page.goto('/fr/a-propos')
  await expect(page.getByRole('heading', { name: /comité de conformité charia/i })).toBeVisible()
  await expect(page.locator('#comite-charia').getByRole('heading', { level: 3 })).not.toHaveCount(0)
})

test('article : sommaire, glossaire lié, partage, newsletter', async ({ page }) => {
  await page.goto('/fr/ressources/articles/principes-finance-islamique')
  await expect(page.getByRole('navigation', { name: 'Sommaire' }).first()).toBeAttached()
  await expect(page.locator('a[data-glossary]').first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Partager sur WhatsApp/ })).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/\?text=/,
  )
  await expect(page.getByRole('heading', { name: 'Recevoir les prochains articles' })).toBeVisible()
})

test('navigation : menu principal et pied de page alimentés par le CMS', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/fr/a-propos')
  const nav = page.getByRole('navigation', { name: 'Navigation principale' })
  // Pôles et Ressources ouvrent un méga-menu alimenté par le global navigation.
  await nav.getByRole('button', { name: 'Audit', exact: true }).click()
  await expect(nav.getByRole('link', { name: 'Audit de conformité charia' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'À propos' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('contentinfo').getByRole('link', { name: 'Glossaire' }).click()
  await expect(page).toHaveURL(/\/fr\/ressources\/glossaire$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Glossaire' })).toBeVisible()
})

for (const entry of [
  { name: 'accueil', path: '/fr' },
  { name: 'service', path: '/fr/audit-conformite/audit-conformite-charia' },
  { name: 'article', path: '/fr/ressources/articles/principes-finance-islamique' },
  { name: 'contact', path: '/fr/contact' },
]) {
  test(`axe : aucune violation WCAG 2.2 AA sur ${entry.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(entry.path)
    await settle(page)
    await expectNoAxeViolations(page)
  })
}

const shots = [
  { name: 'accueil', path: '/fr' },
  { name: 'a-propos', path: '/fr/a-propos' },
  { name: 'service', path: '/fr/audit-conformite/audit-conformite-charia' },
  { name: 'article', path: '/fr/ressources/articles/principes-finance-islamique' },
  { name: 'devis-etape-1', path: '/fr/devis' },
  { name: 'glossaire', path: '/fr/ressources/glossaire' },
  { name: '404', path: '/fr/page-qui-n-existe-pas' },
] as const

for (const width of [390, 1440] as const) {
  for (const shot of shots) {
    test(`capture ${shot.name} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(shot.path)
      await settle(page)
      await page.screenshot({ path: `${SHOTS}/${shot.name}-${width}.png`, fullPage: true })
    })
  }
}
