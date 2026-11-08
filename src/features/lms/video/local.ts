import { createHmac, timingSafeEqual } from 'node:crypto'

import { createSignedToken, verifySignedToken } from '@/features/leads/signed-token'

import {
  type Id,
  type PlaybackSource,
  type VideoProvider,
  VideoProviderError,
  type VideoRef,
  type VideoStatus,
  videoStatuses,
} from '../contracts'
import { assertTtl } from './ttl'

/**
 * Fournisseur factice pour le développement et les tests : fichiers locaux (HLS ou MP4)
 * servis par une route serveur (`/api/dev-video/{jeton}/{videoId}/{fichier}`, livrée avec
 * le lecteur en M3.6) qui appelle `verifyLocalVideoToken`. Même forme d'URL que Bunny
 * (jeton dans le chemin) : les segments HLS relatifs héritent du jeton, et une URL non
 * signée ne fonctionne pas, même en développement. Interdit en production (registre).
 */

const LOCAL_VIDEO_ID = /^[A-Za-z0-9_-]{1,64}$/
const CAPTION_LOCALE = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i

export const LOCAL_WEBHOOK_SIGNATURE_HEADER = 'x-local-video-signature'

export type LocalVideoConfig = {
  /** Base absolue de la route de service, ex. `http://localhost:3000/api/dev-video`. */
  baseUrl: string
  /** Secret HMAC dédié (dérivé de `PAYLOAD_SECRET` par le registre). */
  secret: string
  format: 'hls' | 'mp4'
  now?: () => Date
}

const subject = (videoId: string) => `video:${videoId}`

/** Le jeton du chemin couvre-t-il cette vidéo, et est-il encore valide ? */
export function verifyLocalVideoToken(
  token: string,
  videoId: string,
  secret: string,
  now: number = Date.now(),
): boolean {
  return LOCAL_VIDEO_ID.test(videoId) && verifySignedToken(token, secret, now) === subject(videoId)
}

export function signLocalWebhook(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
}

export class LocalVideoProvider implements VideoProvider {
  readonly id = 'local'
  private readonly baseUrl: string
  private readonly now: () => Date

  constructor(private readonly config: LocalVideoConfig) {
    if (config.secret.length < 16)
      throw new VideoProviderError('not-configured', 'Secret vidéo local trop court.')
    this.baseUrl = new URL(config.baseUrl).toString().replace(/\/+$/, '')
    this.now = config.now ?? (() => new Date())
  }

  private videoId(video: VideoRef): string {
    // Les leçons de démonstration référencent `bunny` : le fournisseur factice les sert toutes.
    if (!LOCAL_VIDEO_ID.test(video.videoId))
      throw new VideoProviderError('invalid-video-id', 'Identifiant de vidéo invalide.')
    return video.videoId
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
    const now = this.now().getTime()
    const token = createSignedToken(subject(videoId), ttl, this.config.secret, now)
    const base = `${this.baseUrl}/${encodeURIComponent(token)}/${videoId}`
    const expiresAt = new Date((Math.floor(now / 1000) + ttl) * 1000)
    return {
      hlsUrl: `${base}/${this.config.format === 'hls' ? 'playlist.m3u8' : 'video.mp4'}`,
      expiresAt,
      posterUrl: `${base}/thumbnail.jpg`,
      captions: (input.captions ?? [])
        .filter((caption) => CAPTION_LOCALE.test(caption.locale))
        .map((caption) => ({
          locale: caption.locale,
          label: caption.label,
          url: `${base}/captions/${caption.locale}.vtt`,
        })),
      ...(input.viewer ? { watermark: input.viewer.email } : {}),
    }
  }

  async getVideoInfo(
    video: VideoRef,
  ): Promise<{ status: VideoStatus; durationSeconds: number | null }> {
    this.videoId(video)
    return { status: 'ready', durationSeconds: null }
  }

  /** Webhook simulé : `{ videoId, status }` signé HMAC-SHA256 hexadécimal. */
  async verifyWebhook(request: {
    headers: Record<string, string>
    rawBody: string
  }): Promise<{ videoId: string; status: VideoStatus | null; eventId: string | null }> {
    const received = Object.entries(request.headers)
      .find(([key]) => key.toLowerCase() === LOCAL_WEBHOOK_SIGNATURE_HEADER)?.[1]
      ?.trim()
      .toLowerCase()
    const expected = Buffer.from(signLocalWebhook(request.rawBody, this.config.secret))
    const actual = Buffer.from(received ?? '')
    if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) {
      throw new VideoProviderError('invalid-signature', 'Signature de webhook invalide.')
    }
    let payload: { videoId?: unknown; status?: unknown; eventId?: unknown }
    try {
      payload = JSON.parse(request.rawBody) as typeof payload
    } catch {
      throw new VideoProviderError('invalid-payload', 'Corps de webhook illisible.')
    }
    if (typeof payload.videoId !== 'string' || !LOCAL_VIDEO_ID.test(payload.videoId))
      throw new VideoProviderError('invalid-payload', 'Identifiant de vidéo invalide.')
    const status = videoStatuses.find((candidate) => candidate === payload.status) ?? null
    return {
      videoId: payload.videoId,
      status,
      eventId: typeof payload.eventId === 'string' ? payload.eventId : null,
    }
  }
}
