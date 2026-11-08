/**
 * `pnpm create-admin` — crée (ou promeut) un compte `super-admin` dans la base visée par `.env`.
 *
 * - Interactif dans un terminal : e-mail, puis mot de passe saisi sans écho, confirmé.
 * - Non interactif (CI, terminal sans TTY) : variables `ADMIN_EMAIL` et `ADMIN_PASSWORD`.
 * - Si l'adresse existe déjà : rôle `super-admin` ajouté, mot de passe remplacé, adresse
 *   marquée vérifiée, verrouillage levé. Les autres rôles sont conservés.
 *
 * Le mot de passe n'est jamais affiché, journalisé ni écrit sur disque.
 */
import { createInterface } from 'node:readline/promises'

import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/features/auth/schemas'

const emailSchema = z.email().max(254)
const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH)

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    return (await rl.question(question)).trim()
  } finally {
    rl.close()
  }
}

/** Lecture sans écho (mode brut du terminal). */
function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process
    stdout.write(question)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    let value = ''
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          stdin.setRawMode(false)
          stdin.pause()
          stdin.off('data', onData)
          stdout.write('\n')
          resolve(value)
          return
        }
        if (char === '\u0003') {
          stdin.setRawMode(false)
          reject(new Error('Annulé.'))
          return
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1)
        else value += char
      }
    }
    stdin.on('data', onData)
  })
}

async function readCredentials(): Promise<{ email: string; password: string }> {
  const fromEnv = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }
  if (fromEnv.email && fromEnv.password) return { email: fromEnv.email, password: fromEnv.password }
  if (!process.stdin.isTTY) {
    throw new Error(
      'Terminal non interactif : définissez ADMIN_EMAIL et ADMIN_PASSWORD, ou lancez la commande dans un terminal.',
    )
  }
  const email = fromEnv.email ?? (await ask('E-mail de l’administrateur : '))
  const password = await askHidden(`Mot de passe (${PASSWORD_MIN_LENGTH} caractères minimum) : `)
  const confirmation = await askHidden('Confirmez le mot de passe : ')
  if (password !== confirmation) throw new Error('Les deux mots de passe ne correspondent pas.')
  return { email, password }
}

async function main(): Promise<void> {
  const raw = await readCredentials()
  const email = emailSchema.safeParse(raw.email.toLowerCase())
  if (!email.success) throw new Error('Adresse e-mail invalide.')
  const password = passwordSchema.safeParse(raw.password)
  if (!password.success) {
    throw new Error(
      `Le mot de passe doit contenir entre ${PASSWORD_MIN_LENGTH} et ${PASSWORD_MAX_LENGTH} caractères.`,
    )
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email.data } },
    limit: 1,
    overrideAccess: true,
  })
  const user = existing.docs[0]

  if (user) {
    const roles = [...new Set([...(user.roles ?? []), 'super-admin' as const])]
    await payload.update({
      collection: 'users',
      id: user.id,
      // Verrouillage levé : compteur d'échecs remis à zéro, échéance effacée.
      data: { roles, password: password.data, _verified: true, loginAttempts: 0, lockUntil: null },
      overrideAccess: true,
    })
    process.stdout.write(`Compte existant promu super-admin : ${email.data}\n`)
  } else {
    await payload.create({
      collection: 'users',
      data: { email: email.data, password: password.data, roles: ['super-admin'], _verified: true },
      disableVerificationEmail: true,
      overrideAccess: true,
    })
    process.stdout.write(`Compte super-admin créé : ${email.data}\n`)
  }
  process.stdout.write('Connexion : /admin (serveur lancé avec pnpm dev ou pnpm start).\n')
  process.exit(0)
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
