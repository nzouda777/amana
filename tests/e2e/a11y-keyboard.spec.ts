import { expect, type Locator, type Page, test } from '@playwright/test'

import {
  expectNoAxeViolations,
  expectNoHorizontalOverflow,
  settle,
  uniqueEmail,
} from './site-helpers'

/**
 * Revue qa M2 : axe sur toutes les routes vitrine, parcours clavier (lien d'évitement,
 * méga-menu, tiroir mobile, devis complet, recherche), zoom 200 % et RTL.
 */

const vitrineRoutes = [
  '/fr',
  '/fr/a-propos',
  '/fr/formation',
  '/fr/audit-conformite',
  '/fr/audit-conformite/audit-conformite-charia',
  '/fr/conseil-accompagnement',
  '/fr/conseil-accompagnement/fenetre-islamique',
  '/fr/takaful-finance',
  '/fr/takaful-finance/takaful-entreprises',
  '/fr/cas-clients',
  '/fr/cas-clients/audit-conformite-banque-commerciale',
  '/fr/ressources',
  '/fr/ressources/articles',
  '/fr/ressources/articles/principes-finance-islamique',
  '/fr/ressources/guides',
  '/fr/ressources/guides/guide-bases-finance-islamique',
  '/fr/ressources/glossaire',
  '/fr/ressources/glossaire/mourabaha',
  '/fr/ressources/webinaires',
  '/fr/contact',
  '/fr/devis',
  '/fr/rendez-vous',
  '/fr/recherche?q=takaful',
  '/fr/legal/mentions-legales',
  '/fr/legal/avertissement',
  '/fr/newsletter/confirmation?token=jeton-de-test-invalide',
  '/fr/page-inexistante',
  '/ar',
  '/ar/audit-conformite/audit-conformite-charia',
] as const

for (const route of vitrineRoutes) {
  test(`axe ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route)
    await settle(page)
    await expectNoAxeViolations(page)
  })
}

/** Appuie sur Tab jusqu'à ce que `target` ait le focus (échoue au-delà de `max`). */
async function tabTo(page: Page, target: Locator, max = 80): Promise<void> {
  for (let i = 0; i < max; i += 1) {
    if (await target.evaluate((node) => node === document.activeElement).catch(() => false)) return
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}

test('clavier : lien d’évitement vers le contenu', async ({ page }) => {
  await page.goto('/fr/a-propos')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Aller au contenu' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#contenu$/)
})

test('clavier : méga-menu (ouverture, parcours, Échap rend le focus)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/fr/a-propos')
  const nav = page.getByRole('navigation', { name: 'Navigation principale' })
  const trigger = nav.getByRole('button', { name: 'Audit', exact: true })
  await tabTo(page, trigger)
  await page.keyboard.press('Enter')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const firstOffer = nav.getByRole('link', { name: 'Audit de conformité charia' })
  await expect(firstOffer).toBeVisible()
  await tabTo(page, firstOffer, 10)
  await page.keyboard.press('Escape')
  await expect(firstOffer).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('clavier : tiroir mobile (piège du focus, Échap, retour du focus)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/fr/a-propos')
  const trigger = page.getByRole('button', { name: 'Ouvrir le menu' })
  await tabTo(page, trigger)
  await page.keyboard.press('Enter')
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab')
    const inside = await drawer.evaluate((node) => node.contains(document.activeElement))
    expect(inside, `focus sorti du tiroir après ${i + 1} Tab`).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('clavier : devis complet sans souris', async ({ page }) => {
  // IP propre au test : la limite de débit (5 envois / 10 min / IP) ne doit pas gêner la suite.
  await page.setExtraHTTPHeaders({
    'x-forwarded-for': `10.0.${Date.now() % 250}.${Math.floor(Math.random() * 250)}`,
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/fr/devis')
  const main = page.getByRole('main')

  await tabTo(page, main.getByLabel('Audit de conformité'))
  await page.keyboard.press('Space')
  await expect(main.getByLabel('Audit de conformité')).toBeChecked()
  await tabTo(page, main.getByRole('button', { name: 'Continuer' }))
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'Parlez-nous du contexte' })).toBeFocused()
  const kind = main.getByLabel('Type d’organisation')
  await tabTo(page, kind)
  await kind.selectOption('banque') // <select> natif : équivalent clavier des flèches.
  const scope = main.getByLabel('Périmètre de l’audit')
  await tabTo(page, scope)
  await scope.selectOption('produit')
  const description = main.getByLabel(/Décrivez l’établissement/)
  await tabTo(page, description)
  await page.keyboard.type(
    'Assureur à Douala : nous voulons auditer un produit takaful avant son lancement.',
  )
  await tabTo(page, main.getByRole('button', { name: 'Continuer' }))
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'Comment vous joindre ?' })).toBeVisible()
  await tabTo(page, main.getByLabel('Nom et prénom'))
  await page.keyboard.type('Ndeye Kamga')
  await tabTo(page, main.getByLabel('Adresse e-mail'))
  await page.keyboard.type(uniqueEmail('devis-clavier'))
  await tabTo(page, main.getByLabel('Organisation', { exact: true }))
  await page.keyboard.type('Assurance de démonstration')
  const consent = main.getByLabel(/J’accepte que mes informations/)
  await tabTo(page, consent)
  await page.keyboard.press('Space')
  await expect(consent).toBeChecked()
  await tabTo(page, main.getByRole('button', { name: 'Envoyer ma demande' }))
  await page.keyboard.press('Enter')

  const done = page.getByRole('heading', {
    name: /Merci Ndeye, votre demande est bien enregistrée/,
  })
  await expect(done).toBeVisible({ timeout: 45_000 })
  await expect(done).toBeFocused()
})

test('clavier : recherche depuis l’en-tête', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/fr/a-propos')
  const search = page.getByRole('banner').getByRole('link', { name: 'Rechercher' })
  await tabTo(page, search)
  await page.keyboard.press('Enter')
  const input = page.getByLabel('Que cherchez-vous ?')
  await expect(input).toBeFocused()
  await page.keyboard.type('sukuk')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/q=sukuk/)
  await expect(page.getByRole('status')).toContainText('résultat')
})

test('zoom 200 % : pas de débordement horizontal (640 px CSS)', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 450 })
  for (const route of [
    '/fr',
    '/fr/audit-conformite/audit-conformite-charia',
    '/fr/devis',
    '/fr/ressources/articles/principes-finance-islamique',
  ]) {
    await page.goto(route)
    await settle(page)
    await expectNoHorizontalOverflow(page)
  }
})

test('RTL : /ar a lang="ar" dir="rtl", sans débordement, tiroir en RTL', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of ['/ar', '/ar/audit-conformite/audit-conformite-charia']) {
    await page.goto(route)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await settle(page)
    await expectNoHorizontalOverflow(page)
  }
  const trigger = page.locator('header button[aria-haspopup="dialog"]')
  await trigger.click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  expect(await drawer.evaluate((node) => getComputedStyle(node).direction)).toBe('rtl')
})
