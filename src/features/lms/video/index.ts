import { getServerEnv } from '@/env'

import type { VideoProvider } from '../contracts'
import { buildVideoProvider } from './registry'

export { playbackTtlSeconds } from './ttl'

let provider: VideoProvider | undefined

/**
 * Fournisseur vidéo du serveur (mémorisé). À n'appeler qu'après la décision
 * d'`AccessService` : chaque URL signée correspond à un accès vérifié.
 */
export function getVideoProvider(): VideoProvider {
  if (provider) return provider
  const env = getServerEnv()
  provider = buildVideoProvider({
    provider: env.VIDEO_PROVIDER,
    nodeEnv: env.NODE_ENV,
    allowDevServices: env.ALLOW_DEV_SERVICES,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    payloadSecret: env.PAYLOAD_SECRET,
    localFormat: env.LOCAL_VIDEO_FORMAT,
    bunny: {
      libraryId: env.BUNNY_STREAM_LIBRARY_ID,
      apiKey: env.BUNNY_STREAM_API_KEY,
      tokenKey: env.BUNNY_STREAM_TOKEN_KEY,
      cdnHostname: env.BUNNY_STREAM_CDN_HOSTNAME,
      webhookSecret: env.BUNNY_STREAM_WEBHOOK_SECRET,
      dataSaverRendition: env.BUNNY_STREAM_DATA_SAVER_RENDITION,
    },
  })
  return provider
}
