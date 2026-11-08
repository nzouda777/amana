import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/** Dossier de l'adaptateur d'e-mails de développement (`DEV_EMAIL_DIR`, défaut `.dev-emails`). */
const EMAIL_DIR = path.resolve(process.env.DEV_EMAIL_DIR ?? '.dev-emails')

export type DevEmail = { id: string; to: string[]; subject: string; text: string }

/** E-mails écrits par l'adaptateur de développement pour un destinataire donné. */
export async function emailsTo(address: string): Promise<DevEmail[]> {
  const files = await readdir(EMAIL_DIR).catch(() => [])
  const emails = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(
        async (file) => JSON.parse(await readFile(path.join(EMAIL_DIR, file), 'utf8')) as DevEmail,
      ),
  )
  return emails.filter((email) => email.to.some((to) => to.includes(address)))
}

/** Attend qu'au moins `count` e-mails soient arrivés pour cette adresse. */
export async function waitForEmails(address: string, count = 1): Promise<DevEmail[]> {
  let found: DevEmail[] = []
  await expect
    .poll(
      async () => {
        found = await emailsTo(address)
        return found.length
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThanOrEqual(count)
  return found
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
}

/** Chargement complet : polices prêtes, images différées déclenchées, retour en haut. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
    window.scrollTo(0, 0)
  })
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze()
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
  }))
  expect(summary).toEqual([])
}
