import { createHmac, timingSafeEqual } from 'node:crypto'

import {
  type Id,
  type PlaybackSource,
  type VideoProvider,
  VideoProviderError,
  type VideoRef,
  type VideoStatus,
} from '../contracts'
import { signBunnyUrl } from './bunny-token'
import { assertTtl } from './ttl'

/**
 * Bunny Stream (production). TODO(client) : aucun compte Bunny n'existe encore ; créer la
 * bibliothèque au nom du cabinet, activer « CDN token authentication » sur sa Pull Zone,
 * encoder en 240p / 360p / 720p, désactiver le téléchargement MP4, puis renseigner les
 * variables `BUNNY_STREAM_*` (voir `.env.example`).
 *
 * URL de la bibliothèque (Pull Zone `vz-….b-cdn.net`) :
 * - manifeste HLS adaptatif : `/{videoId}/playlist.m3u8`
 * - rendu unique (économie de données) : `/{videoId}/{rendu}/video.m3u8`
 * - vignette : `/{videoId}/thumbnail.jpg` ; sous-titres : `/{videoId}/captions/{langue}.vtt`
 * Toutes sont signées par un même jeton de répertoire `/{videoId}/`.
 */

/** Identifiant de vidéo Bunny (GUID) : interdit toute traversée de chemin dans `token_path`. */
const BUNNY_VIDEO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CAPTION_LOCALE = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i
const RENDITION = /^\d{3,4}p$/

export const BUNNY_API_BASE = 'https://video.bunnycdn.com'

export type BunnyStreamConfig = {
  libraryId: string
  /** Nom d'hôte de la Pull Zone de la bibliothèque, sans schéma (ex. `vz-abc123.b-cdn.net`). */
  cdnHostname: string
  /** « URL Token Authentication Key » de la Pull Zone. */
  tokenKey: string
  /** Clé d'API de la bibliothèque (lecture des métadonnées). */
  apiKey: string
  /** Secret de signature des webhooks : clé d'API en lecture seule de la bibliothèque. */
  webhookSecret?: string
  /** Rendu forcé en économie de données. */
  dataSaverRendition?: string
  fetch?: typeof fetch
  now?: () => Date
}

/** Statuts d'encodage Bunny Stream (API et webhooks). */
export function mapBunnyStatus(status: number): VideoStatus | null {
  switch (status) {
    case 0: // Queued
    case 1: // Processing
    case 2: // Encoding
    case 4: // Resolution finished (encodage partiel)
    case 6: // Presigned upload started
    case 7: // Presigned upload finished
      return 'processing'
    case 3: // Finished
      return 'ready'
    case 5: // Failed
    case 8: // Presigned upload failed
      return 'failed'
    default: // Sous-titres, chapitres, génération automatique… : sans effet sur la lecture
      return null
  }
}

export function normalizeCdnHostname(value: string): string {
  const host = value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(host)) {
    throw new VideoProviderError('not-configured', `Nom d'hôte Bunny invalide : ${value}`)
  }
  return host.toLowerCase()
}

const header = (headers: Record<string, string>, name: string): string | undefined => {
  const wanted = name.toLowerCase()
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) return value
  }
  return undefined
}

export class BunnyStreamProvider implements VideoProvider {
  readonly id = 'bunny'
  private readonly host: string
  private readonly rendition: string
  private readonly fetcher: typeof fetch
  private readonly now: () => Date

  constructor(private readonly config: BunnyStreamConfig) {
    for (const key of ['libraryId', 'tokenKey', 'apiKey'] as const) {
      if (config[key].trim() === '')
        throw new VideoProviderError('not-configured', `Bunny Stream : ${key} manquant.`)
    }
    this.host = normalizeCdnHostname(config.cdnHostname)
    this.rendition = config.dataSaverRendition ?? '240p'
    if (!RENDITION.test(this.rendition))
      throw new VideoProviderError('not-configured', `Rendu invalide : ${this.rendition}`)
    this.fetcher = config.fetch ?? fetch
    this.now = config.now ?? (() => new Date())
  }

  private videoId(video: VideoRef): string {
    if (video.provider !== this.id || !BUNNY_VIDEO_ID.test(video.videoId)) {
      throw new VideoProviderError('invalid-video-id', 'Référence de vidéo Bunny invalide.')
    }
    return video.videoId.toLowerCase()
  }

  private sign(path: string, directory: string, expires: number): string {
    return signBunnyUrl({
      url: `https://${this.host}${path}`,
      securityKey: this.config.tokenKey,
      expires,
      tokenPath: directory,
      ignoreParams: true,
      pathBased: true,
    })
  }

  async getPlaybackSource(input: {
    video: VideoRef
    viewer: { userId: Id; email: string } | null
    ttlSeconds: number
    dataSaver?: boolean
    captions?: readonly { locale: string; label: string }[]
  }): Promise<PlaybackSource> {
    const videoId = this.videoId(input.video)
    const ttl = assertTtl(input.ttlSeconds)
    const expires = Math.floor(this.now().getTime() / 1000) + ttl
    const directory = `/${videoId}/`
    const manifest = input.dataSaver
      ? `${directory}${this.rendition}/video.m3u8`
      : `${directory}playlist.m3u8`

    return {
      hlsUrl: this.sign(manifest, directory, expires),
      expiresAt: new Date(expires * 1000),
      posterUrl: this.sign(`${directory}thumbnail.jpg`, directory, expires),
      captions: (input.captions ?? [])
        .filter((caption) => CAPTION_LOCALE.test(caption.locale))
        .map((caption) => ({
          locale: caption.locale,
          label: caption.label,
          url: this.sign(`${directory}captions/${caption.locale}.vtt`, directory, expires),
        })),
      ...(input.viewer ? { watermark: input.viewer.email } : {}),
    }
  }

  async getVideoInfo(
    video: VideoRef,
  ): Promise<{ status: VideoStatus; durationSeconds: number | null }> {
    const videoId = this.videoId(video)
    const url = `${BUNNY_API_BASE}/library/${encodeURIComponent(this.config.libraryId)}/videos/${videoId}`
    let response: Response
    try {
      response = await this.fetcher(url, {
        headers: { AccessKey: this.config.apiKey, accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      })
    } catch (error) {
      throw new VideoProviderError('upstream-error', `Bunny Stream injoignable : ${String(error)}`)
    }
    if (!response.ok)
      throw new VideoProviderError('upstream-error', `Bunny Stream a répondu ${response.status}.`)
    const body = (await response.json()) as { status?: unknown; length?: unknown }
    const status = typeof body.status === 'number' ? mapBunnyStatus(body.status) : null
    const length = typeof body.length === 'number' && body.length > 0 ? body.length : null
    return { status: status ?? 'processing', durationSeconds: length }
  }

  /**
   * Webhook Bunny Stream : `X-BunnyStream-Signature` = HMAC-SHA256 hexadécimal (minuscules)
   * du corps brut, clé = clé d'API en lecture seule de la bibliothèque.
   * https://bunny.net/docs/stream/webhooks
   */
  async verifyWebhook(request: {
    headers: Record<string, string>
    rawBody: string
  }): Promise<{ videoId: string; status: VideoStatus | null; eventId: string | null }> {
    const secret = this.config.webhookSecret
    if (!secret) throw new VideoProviderError('not-configured', 'Secret de webhook Bunny absent.')

    const version = header(request.headers, 'x-bunnystream-signature-version')
    const algorithm = header(request.headers, 'x-bunnystream-signature-algorithm')
    const signature = header(request.headers, 'x-bunnystream-signature')?.trim().toLowerCase()
    if (
      (version !== undefined && version !== 'v1') ||
      (algorithm !== undefined && algorithm.toLowerCase() !== 'hmac-sha256') ||
      !signature ||
      !/^[0-9a-f]{64}$/.test(signature)
    ) {
      throw new VideoProviderError('invalid-signature', 'Signature de webhook absente ou invalide.')
    }
    const expected = Buffer.from(
      createHmac('sha256', secret).update(request.rawBody, 'utf8').digest('hex'),
    )
    if (!timingSafeEqual(expected, Buffer.from(signature)))
      throw new VideoProviderError('invalid-signature', 'Signature de webhook invalide.')

    let payload: unknown
    try {
      payload = JSON.parse(request.rawBody)
    } catch {
      throw new VideoProviderError('invalid-payload', 'Corps de webhook illisible.')
    }
    const event = payload as {
      VideoLibraryId?: unknown
      VideoGuid?: unknown
      Status?: unknown
      EventId?: unknown
    }
    if (
      (typeof event.VideoLibraryId !== 'number' && typeof event.VideoLibraryId !== 'string') ||
      String(event.VideoLibraryId) !== this.config.libraryId
    ) {
      throw new VideoProviderError('invalid-payload', 'Webhook d’une autre bibliothèque.')
    }
    if (typeof event.VideoGuid !== 'string' || !BUNNY_VIDEO_ID.test(event.VideoGuid))
      throw new VideoProviderError('invalid-payload', 'Identifiant de vidéo invalide.')
    if (typeof event.Status !== 'number' || !Number.isInteger(event.Status))
      throw new VideoProviderError('invalid-payload', 'Statut de webhook invalide.')

    return {
      videoId: event.VideoGuid.toLowerCase(),
      status: mapBunnyStatus(event.Status),
      eventId: typeof event.EventId === 'string' && event.EventId !== '' ? event.EventId : null,
    }
  }
}
