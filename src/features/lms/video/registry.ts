import { createHmac } from 'node:crypto'

import { type VideoProvider, VideoProviderError } from '../contracts'
import { BunnyStreamProvider } from './bunny'
import { LocalVideoProvider } from './local'

export const videoProviderIds = ['local', 'bunny'] as const
export type VideoProviderId = (typeof videoProviderIds)[number]

export type VideoConfig = {
  provider: VideoProviderId
  nodeEnv: 'development' | 'test' | 'production'
  /** Build de production local / CI (ALLOW_DEV_SERVICES). */
  allowDevServices: boolean
  siteUrl: string
  /** Sert à dériver le secret du fournisseur factice. */
  payloadSecret: string
  localFormat: 'hls' | 'mp4'
  bunny: {
    libraryId?: string
    apiKey?: string
    tokenKey?: string
    cdnHostname?: string
    webhookSecret?: string
    dataSaverRendition?: string
  }
}

/** Secret du fournisseur factice, séparé des autres usages de `PAYLOAD_SECRET`. */
export function deriveLocalVideoSecret(payloadSecret: string): string {
  return createHmac('sha256', payloadSecret).update('amana:local-video:v1').digest('hex')
}

/**
 * Fournisseur vidéo choisi par configuration (`VIDEO_PROVIDER`, ADR 017). Le fournisseur
 * factice est refusé en production réelle : aucune vidéo ne doit être servie depuis le
 * disque du serveur applicatif.
 */
export function buildVideoProvider(config: VideoConfig): VideoProvider {
  switch (config.provider) {
    case 'bunny': {
      const { libraryId, apiKey, tokenKey, cdnHostname, webhookSecret, dataSaverRendition } =
        config.bunny
      if (!libraryId || !apiKey || !tokenKey || !cdnHostname) {
        throw new VideoProviderError(
          'not-configured',
          'Bunny Stream : BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY, BUNNY_STREAM_TOKEN_KEY et BUNNY_STREAM_CDN_HOSTNAME sont requis.',
        )
      }
      return new BunnyStreamProvider({
        libraryId,
        apiKey,
        tokenKey,
        cdnHostname,
        ...(webhookSecret ? { webhookSecret } : {}),
        ...(dataSaverRendition ? { dataSaverRendition } : {}),
      })
    }
    case 'local': {
      if (config.nodeEnv === 'production' && !config.allowDevServices) {
        throw new VideoProviderError(
          'not-configured',
          'Le fournisseur vidéo local est interdit en production : VIDEO_PROVIDER=bunny.',
        )
      }
      return new LocalVideoProvider({
        baseUrl: new URL('/api/dev-video', config.siteUrl).toString(),
        secret: deriveLocalVideoSecret(config.payloadSecret),
        format: config.localFormat,
      })
    }
  }
}
