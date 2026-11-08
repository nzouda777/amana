import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * /styleguide : captures 390 / 1440 px en fr et ar (docs/qa/screenshots/m1),
 * accessibilité axe (WCAG 2.2 AA), absence de défilement horizontal, cibles tactiles,
 * et comportements clés (en-tête, tiroir, méga-menu, dialogue).
 */

const SHOTS = 'docs/qa/screenshots/m1'
const widths = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 900 },
] as const
const locales = ['fr', 'ar'] as const

async function open(page: Page, locale: string) {
  await page.goto(`/${locale}/styleguide`, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  // Déclenche le chargement différé des images (logos), puis revient en haut.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
    window.scrollTo(0, 0)
  })
}

for (const locale of locales) {
  for (const viewport of widths) {
    test(`capture ${locale} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await open(page, locale)
      await page.screenshot({
        path: `${SHOTS}/styleguide-${locale}-${viewport.name}-top.png`,
      })
      await page.screenshot({
        path: `${SHOTS}/styleguide-${locale}-${viewport.name}-full.png`,
        fullPage: true,
      })

      // Aucun défilement horizontal.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}

test('axe : aucune violation WCAG 2.2 AA sur /fr/styleguide', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, 'fr')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    // Les états forcés (data-force) sont des démonstrations statiques, pas des doublons d'id.
    .analyze()
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
  }))
  expect(summary).toEqual([])
})

test('axe : aucune violation WCAG 2.2 AA sur /ar/styleguide (mobile)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, 'ar')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations.map((v) => v.id)).toEqual([])
})

test('en-tête : transparent sur le héros, opaque après défilement', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page, 'fr')
  const header = page.locator('header').first()
  await expect(header).toHaveAttribute('data-transparent', 'true')
  await page.mouse.wheel(0, 600)
  await expect(header).not.toHaveAttribute('data-transparent', 'true')
})

test('méga-menu desktop : ouverture au clavier et capture', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const locale of locales) {
    await open(page, locale)
    const trigger = page.getByRole('navigation').first().getByRole('button').first()
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.screenshot({ path: `${SHOTS}/megamenu-${locale}-1440.png` })
    await page.keyboard.press('Escape')
  }
})

test('tiroir mobile : plein écran, accordéon par pôle, CTA en bas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const locale of locales) {
    await open(page, locale)
    await page.locator('header button[aria-haspopup="dialog"]').click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    await drawer.getByRole('button').nth(1).click()
    await page.screenshot({ path: `${SHOTS}/drawer-${locale}-390.png` })
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  }
})

test('dialogue et panneau : piège du focus, Échap, captures', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const viewport of widths) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    for (const locale of locales) {
      await open(page, locale)
      await page.locator('#superpositions button').first().click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await page.screenshot({ path: `${SHOTS}/dialog-${locale}-${viewport.name}.png` })
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await page.locator('#superpositions button').nth(1).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.screenshot({ path: `${SHOTS}/sheet-start-${locale}-${viewport.name}.png` })
      await page.keyboard.press('Escape')
    }
  }
})

test('cibles tactiles : chaque contrôle interactif mesure au moins 44 px (zone comprise)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, 'fr')
  const tooSmall = await page.evaluate(() => {
    const selector =
      'main a[href], main button, main input, main select, main textarea, header a, header button, footer a, footer button'
    const offenders: string[] = []
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      const rect = element.getBoundingClientRect()
      // Masqué (sr-only) : le lien d'évitement ne mesure 1 px que tant qu'il n'a pas le focus.
      if (rect.width <= 1 || rect.height <= 1) continue
      // Les liens dans le texte courant sont exemptés (WCAG 2.5.8, exception « inline »).
      if (element.closest('p, li.prose-inline, .prose') && element.tagName === 'A') continue
      // Zone agrandie par ::after (utilitaire hit-area).
      const after = getComputedStyle(element, '::after')
      const extended = after.content !== 'none' && after.position === 'absolute'
      const height = extended ? Math.max(rect.height, 44) : rect.height
      const isChoice =
        element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)
      const target = isChoice ? element.closest('label') : null
      const h = target ? target.getBoundingClientRect().height : height
      if (h < 44 - 0.5)
        offenders.push(
          `${element.tagName.toLowerCase()} « ${(element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 40)} » ${Math.round(h)} px`,
        )
    }
    return offenders
  })
  expect(tooSmall).toEqual([])
})
