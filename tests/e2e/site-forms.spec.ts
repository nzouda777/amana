import { expect, test, type Page } from '@playwright/test'

import { emailsTo, uniqueEmail, waitForEmails } from './site-helpers'

/**
 * Formulaires de bout en bout sur le serveur réel (base Neon, Turnstile avec les clés de
 * test Cloudflare, e-mails écrits par l'adaptateur de développement dans `.dev-emails`).
 */

const SHOTS = 'docs/qa/screenshots/m2'

async function fillQuote(page: Page, email: string) {
  await page.goto('/fr/devis')
  await expect(
    page.getByRole('heading', { name: 'Quel est l’objet de votre demande ?' }),
  ).toBeVisible()

  // Étape 1 : sans choix, l'erreur dit quoi faire.
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByText('Choisissez une option dans la liste.')).toBeVisible()
  await page.getByLabel('Audit de conformité').check()
  await page.getByRole('button', { name: 'Continuer' }).click()

  // Étape 2 : champs conditionnels propres à l'audit.
  await expect(page.getByRole('heading', { name: 'Parlez-nous du contexte' })).toBeFocused()
  await expect(page.getByLabel('Périmètre de l’audit')).toBeVisible()
  await expect(page.getByLabel('Nombre de personnes à former')).toHaveCount(0)
  await page.getByLabel('Type d’organisation').selectOption('banque')
  await page.getByLabel('Périmètre de l’audit').selectOption('fenetre')
  await page.getByLabel(/Décrivez l’établissement/).fill('court')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByText('Un peu court : ajoutez quelques précisions.')).toBeVisible()
  await page
    .getByLabel(/Décrivez l’établissement/)
    .fill(
      'Banque commerciale à Douala : nous ouvrons une fenêtre islamique et souhaitons un audit.',
    )
  await page.getByRole('button', { name: 'Continuer' }).click()

  // Étape 3 : coordonnées, consentement obligatoire, newsletter décochée par défaut.
  await expect(page.getByRole('heading', { name: 'Comment vous joindre ?' })).toBeVisible()
  await page.getByLabel('Nom et prénom').fill('Awa Mbarga')
  await page.getByRole('main').getByLabel('Adresse e-mail').fill(email)
  await page.getByLabel('Organisation', { exact: true }).fill('Banque de démonstration')
  await expect(page.getByLabel(/recevoir la lettre d’information/)).not.toBeChecked()
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click()
  await expect(
    page.getByText('Cochez cette case pour que nous puissions traiter votre demande.'),
  ).toBeVisible()
  await page.getByLabel(/J’accepte que mes informations/).check()
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click()
}

for (const width of [1440, 390] as const) {
  test(`devis complet (${width} px) : demande enregistrée, e-mails équipe et accusé`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const email = uniqueEmail('devis')
    await fillQuote(page, email)

    const confirmation = page.getByRole('heading', {
      name: /Merci Awa, votre demande est bien enregistrée/,
    })
    await expect(confirmation).toBeVisible({ timeout: 45_000 })
    await expect(confirmation).toBeFocused()
    await expect(page.getByText(/sous 2 jours ouvrés/)).toBeVisible()
    const lead = await page.getByText(/référence n° \d+/).textContent()
    const reference = /n° (\d+)/.exec(lead ?? '')?.[1]
    expect(reference).toBeTruthy()

    // Accusé de réception au demandeur (référence = identifiant du lead en base).
    const [ack] = await waitForEmails(email)
    expect(ack?.subject).toContain('Nous avons bien reçu votre demande')
    expect(ack?.text).toContain(`#${reference}`)
    // Notification interne à l'adresse « audit » (réponse directe au demandeur).
    const team = await emailsTo('audit@amana-conseil.example')
    expect(team.some((message) => message.text.includes(email))).toBe(true)

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: `${SHOTS}/devis-confirmation-${width}.png`, fullPage: true })
  })
}

test('devis : ?type=takaful pré-sélectionne le type', async ({ page }) => {
  await page.goto('/fr/devis?type=takaful')
  await expect(page.getByLabel('Takaful et financement')).toBeChecked()
})

test('newsletter : double opt-in (e-mail, lien, confirmation explicite)', async ({ page }) => {
  const email = uniqueEmail('lettre')
  await page.goto('/fr/ressources/glossaire')
  const footer = page.getByRole('contentinfo')
  await footer.getByLabel('Adresse e-mail').fill(email)
  await footer.getByRole('button', { name: 'S’inscrire' }).click()
  await expect(footer.getByText(/un e-mail de confirmation vient de vous être envoyé/)).toBeVisible(
    {
      timeout: 45_000,
    },
  )

  const [message] = await waitForEmails(email)
  const link = /https?:\/\/\S+\/newsletter\/confirmation\?token=[\w-]+/.exec(
    message?.text ?? '',
  )?.[0]
  expect(link).toBeTruthy()
  const url = new URL(link ?? '')

  // Ouvrir le lien ne suffit pas : il faut cliquer.
  await page.goto(`${url.pathname}${url.search}`)
  await page.getByRole('button', { name: 'Confirmer mon inscription' }).click()
  await expect(page.getByText('Inscription confirmée')).toBeVisible({ timeout: 30_000 })

  // Second clic sur le même lien : déjà confirmée.
  await page.goto(`${url.pathname}${url.search}`)
  await page.getByRole('button', { name: 'Confirmer mon inscription' }).click()
  await expect(page.getByText('Inscription déjà confirmée')).toBeVisible({ timeout: 30_000 })
})

test('guide : téléchargement contre e-mail, fichier servi par jeton', async ({ page, request }) => {
  const email = uniqueEmail('guide')
  await page.goto('/fr/ressources/guides/guide-bases-finance-islamique')
  await expect(page.getByLabel(/recevoir la lettre d’information/)).not.toBeChecked()
  await page.getByRole('main').getByLabel('Adresse e-mail').fill(email)
  await page.getByRole('button', { name: 'Recevoir le guide' }).click()
  const download = page.getByRole('link', { name: 'Télécharger le guide (PDF)' })
  await expect(download).toBeVisible({ timeout: 45_000 })
  const href = await download.getAttribute('href')
  const file = await request.get(href ?? '')
  expect(file.status()).toBe(200)
  expect(file.headers()['content-type']).toContain('application/pdf')
  expect((await request.get('/api/downloads/guide?token=faux.jeton')).status()).toBe(404)
  await waitForEmails(email)
})

test('recherche : résultats groupés et raccourci « / »', async ({ page }) => {
  await page.goto('/fr/a-propos')
  await page.locator('body').press('/')
  await expect(page).toHaveURL(/\/fr\/recherche$/)
  const input = page.getByLabel('Que cherchez-vous ?')
  await expect(input).toBeFocused()
  await input.fill('fenetre islamique')
  await input.press('Enter')
  await expect(page).toHaveURL(/q=fenetre/)
  await expect(page.getByRole('status')).toContainText('résultat')
  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { name: /^Expertises/ })).toBeVisible()
  await expect(main.getByRole('heading', { name: /^Glossaire/ })).toBeVisible()
  // Le raccourci replace le focus dans le champ depuis la page de résultats.
  await page.getByRole('heading', { level: 1 }).click()
  await page.keyboard.press('/')
  await expect(input).toBeFocused()

  await page.goto('/fr/recherche?q=zzzzqqq')
  await expect(page.getByText('Aucun résultat', { exact: true })).toBeVisible()
})

test('rendez-vous : aucun script Cal.com avant le clic', async ({ page }) => {
  const calls: string[] = []
  page.on('request', (req) => {
    if (req.url().includes('cal.com')) calls.push(req.url())
  })
  await page.goto('/fr/rendez-vous')
  await page.waitForLoadState('networkidle')
  expect(calls).toEqual([])
})

test('webhook Cal.com : signature exigée', async ({ request }) => {
  const response = await request.post('/api/webhooks/calcom', {
    data: { triggerEvent: 'BOOKING_CREATED' },
    headers: { 'x-cal-signature-256': 'faux' },
  })
  // 401 (signature invalide) si le secret est configuré, 503 sinon : jamais accepté.
  expect([401, 503]).toContain(response.status())
})
