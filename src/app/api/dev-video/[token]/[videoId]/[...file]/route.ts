import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'

import { getServerEnv } from '@/env'
import { verifyLocalVideoToken } from '@/features/lms/video/local'
import { deriveLocalVideoSecret } from '@/features/lms/video/registry'

/**
 * Service des vidéos du fournisseur factice (`VIDEO_PROVIDER=local`, ADR 017), pour le
 * développement, la CI et les démonstrations. Même forme d'URL que Bunny : le jeton signé
 * à durée courte est dans le chemin et couvre la vidéo ; sans jeton valide, rien n'est
 * servi. Fichiers lus dans `LOCAL_VIDEO_DIR/<videoId>/…`, et pour les vidéos de
 * démonstration du seed (`demo-…`) dans `LOCAL_VIDEO_DIR/demo/…` à défaut.
 * Interdit en production réelle, comme le fournisseur lui-même.
 */

export const dynamic = 'force-dynamic'

const SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,127}$/

const contentTypes: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.m4s': 'video/iso.segment',
  '.vtt': 'text/vtt; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}

type Params = { token: string; videoId: string; file: string[] }

const notFound = () => new Response(null, { status: 404 })

async function locate(root: string, videoId: string, file: string[]): Promise<string | null> {
  const candidates = [videoId, ...(videoId.startsWith('demo-') ? ['demo'] : [])]
  for (const folder of candidates) {
    const base = path.resolve(root, folder)
    const target = path.resolve(base, ...file)
    // Défense en profondeur : le chemin résolu reste sous le dossier de la vidéo.
    if (!target.startsWith(`${base}${path.sep}`)) return null
    try {
      if ((await stat(/* turbopackIgnore: true */ target)).isFile()) return target
    } catch {
      // Fichier absent : candidat suivant.
    }
  }
  return null
}

export async function GET(request: Request, { params }: { params: Promise<Params> }) {
  const env = getServerEnv()
  if (env.VIDEO_PROVIDER !== 'local' || (env.NODE_ENV === 'production' && !env.ALLOW_DEV_SERVICES))
    return notFound()

  const { token, videoId, file } = await params
  if (!file.every((segment) => SEGMENT.test(segment) && segment !== '..')) return notFound()
  if (
    !verifyLocalVideoToken(
      decodeURIComponent(token),
      videoId,
      deriveLocalVideoSecret(env.PAYLOAD_SECRET),
    )
  )
    return new Response(null, { status: 403 })

  const root = path.resolve(/* turbopackIgnore: true */ process.cwd(), env.LOCAL_VIDEO_DIR)
  const filePath = await locate(root, videoId, file)
  if (!filePath) return notFound()

  const extension = path.extname(filePath).toLowerCase()
  const type = contentTypes[extension]
  if (!type) return notFound()
  const { size } = await stat(/* turbopackIgnore: true */ filePath)
  const headers = new Headers({
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=300',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
  })

  // Requêtes partielles : avance rapide dans un MP4 (obligatoire pour Safari).
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '')
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
    if (start > end || start >= size) {
      headers.set('Content-Range', `bytes */${size}`)
      return new Response(null, { status: 416, headers })
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
    headers.set('Content-Length', String(end - start + 1))
    const stream = Readable.toWeb(
      createReadStream(/* turbopackIgnore: true */ filePath, { start, end }),
    ) as ReadableStream
    return new Response(stream, { status: 206, headers })
  }

  headers.set('Content-Length', String(size))
  return new Response(
    Readable.toWeb(createReadStream(/* turbopackIgnore: true */ filePath)) as ReadableStream,
    {
      status: 200,
      headers,
    },
  )
}
