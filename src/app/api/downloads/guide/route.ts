import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getServerEnv } from '@/env'
import { verifySignedToken } from '@/features/leads/signed-token'
import { getPayloadClient } from '@/lib/payload'

/**
 * Téléchargement d'un guide (fichier privé, ADR 008). L'accès est accordé par un jeton
 * signé à durée courte, remis après consentement (`requestGuideDownload`). Le fichier
 * n'a pas d'URL publique.
 */
export const dynamic = 'force-dynamic'

const PRIVATE_DIR = path.resolve(process.cwd(), 'private-files')

function notFound(): Response {
  return new Response('Lien invalide ou expiré.', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token') ?? ''
  const subject = verifySignedToken(token, getServerEnv().PAYLOAD_SECRET)
  const match = subject ? /^guide:(\d+)$/.exec(subject) : null
  if (!match?.[1]) return notFound()

  const payload = await getPayloadClient()
  const guide = await payload
    .findByID({ collection: 'guides', id: Number(match[1]), depth: 1, locale: 'fr' })
    .catch(() => null)
  if (!guide || guide._status !== 'published') return notFound()

  const file = guide.file
  if (typeof file !== 'object' || !file?.filename) return notFound()
  // `path.basename` : aucun nom de fichier ne peut sortir du dossier privé.
  const filePath = path.join(PRIVATE_DIR, path.basename(file.filename))
  const content = await readFile(filePath).catch(() => null)
  if (!content) return notFound()

  const downloadName = `${guide.slug}.pdf`
  return new Response(new Uint8Array(content), {
    headers: {
      'content-type': file.mimeType ?? 'application/pdf',
      'content-length': String(content.byteLength),
      'content-disposition': `attachment; filename="${downloadName}"`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'x-robots-tag': 'noindex',
    },
  })
}
