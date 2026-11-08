import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { parseServerEnv } from '@/env'
import { VideoProviderError } from '@/features/lms/contracts'
import {
  BunnyStreamProvider,
  mapBunnyStatus,
  normalizeCdnHostname,
} from '@/features/lms/video/bunny'
import { signBunnyUrl } from '@/features/lms/video/bunny-token'
import {
  LocalVideoProvider,
  signLocalWebhook,
  verifyLocalVideoToken,
} from '@/features/lms/video/local'
import {
  buildVideoProvider,
  deriveLocalVideoSecret,
  type VideoConfig,
} from '@/features/lms/video/registry'
import {
  assertTtl,
  PLAYBACK_TTL_DEFAULT_SECONDS,
  PLAYBACK_TTL_MAX_SECONDS,
  PLAYBACK_TTL_MIN_SECONDS,
  playbackTtlSeconds,
} from '@/features/lms/video/ttl'

const now = new Date('2026-11-07T12:00:00Z')
const nowSeconds = Math.floor(now.getTime() / 1000)
const VIDEO = '3f2a9c1e-7b4d-4e8a-9f10-2c3d4e5f6a7b'
const KEY = 'bunny-token-key-de-test'

/** Vérification telle que la fait le CDN (réimplémentée indépendamment, d'après la doc). */
function cdnAccepts(url: string, key: string, at: number): boolean {
  const match = /^https:\/\/[^/]+\/bcdn_token=([^&]+)((?:&[^/]+?)*)&expires=(\d+)(\/.*)$/.exec(url)
  if (!match) return false
  const [, token, rawParams, expires, path] = match
  const params = Object.fromEntries(
    (rawParams ?? '')
      .split('&')
      .filter(Boolean)
      .map((pair) => {
        const [k, v] = pair.split('=')
        return [k ?? '', decodeURIComponent(v ?? '')]
      }),
  )
  const tokenPath = params.token_path
  if (tokenPath && !path!.startsWith(tokenPath)) return false
  const signingData = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  const expected =
    'HS256-' +
    createHmac('sha256', key)
      .update(`${tokenPath ?? path}${expires}${signingData}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  return token === expected && Number(expires) > at
}

describe('signBunnyUrl (jeton avancé HMAC-SHA256)', () => {
  it('jeton de répertoire dans le chemin, accepté par la vérification du CDN', () => {
    const url = signBunnyUrl({
      url: `https://vz-abc.b-cdn.net/${VIDEO}/playlist.m3u8`,
      securityKey: KEY,
      expires: nowSeconds + 600,
      tokenPath: `/${VIDEO}/`,
      ignoreParams: true,
      pathBased: true,
    })
    expect(url).toMatch(
      new RegExp(
        `^https://vz-abc\\.b-cdn\\.net/bcdn_token=HS256-[A-Za-z0-9_-]{43}&token_ignore_params=true&token_path=%2F${VIDEO}%2F&expires=${nowSeconds + 600}/${VIDEO}/playlist\\.m3u8$`,
      ),
    )
    expect(cdnAccepts(url, KEY, nowSeconds)).toBe(true)
    // Le même jeton couvre un segment du répertoire (URL relative résolue par le lecteur).
    const segment = new URL('360p/video0.ts', url).toString()
    expect(cdnAccepts(segment, KEY, nowSeconds)).toBe(true)
  })

  it('refusé avec une autre clé, après échéance, ou pour une autre vidéo', () => {
    const url = signBunnyUrl({
      url: `https://vz-abc.b-cdn.net/${VIDEO}/playlist.m3u8`,
      securityKey: KEY,
      expires: nowSeconds + 600,
      tokenPath: `/${VIDEO}/`,
      ignoreParams: true,
      pathBased: true,
    })
    expect(cdnAccepts(url, 'autre-cle', nowSeconds)).toBe(false)
    expect(cdnAccepts(url, KEY, nowSeconds + 600)).toBe(false)
    const other = url.replace(
      `&expires=${nowSeconds + 600}/${VIDEO}/`,
      `&expires=${nowSeconds + 600}/autre/`,
    )
    expect(cdnAccepts(other, KEY, nowSeconds)).toBe(false)
    const extended = url.replace(`expires=${nowSeconds + 600}`, `expires=${nowSeconds + 99_999}`)
    expect(cdnAccepts(extended, KEY, nowSeconds)).toBe(false)
  })

  it('jeton en paramètre de requête sans répertoire', () => {
    const url = signBunnyUrl({
      url: 'https://zone.b-cdn.net/fichier.mp4',
      securityKey: KEY,
      expires: 1_900_000_000,
    })
    const digest = createHmac('sha256', KEY)
      .update('/fichier.mp4' + '1900000000')
      .digest('base64url')
    expect(url).toBe(`https://zone.b-cdn.net/fichier.mp4?token=HS256-${digest}&expires=1900000000`)
  })

  it('refuse une configuration incohérente', () => {
    const base = {
      url: `https://vz-abc.b-cdn.net/${VIDEO}/playlist.m3u8`,
      securityKey: KEY,
      expires: nowSeconds,
    }
    expect(() => signBunnyUrl({ ...base, securityKey: '' })).toThrow(VideoProviderError)
    expect(() => signBunnyUrl({ ...base, expires: 1.5 })).toThrow(VideoProviderError)
    expect(() => signBunnyUrl({ ...base, url: `${base.url}?a=1` })).toThrow(VideoProviderError)
    expect(() => signBunnyUrl({ ...base, tokenPath: '/autre/' })).toThrow(VideoProviderError)
    expect(() => signBunnyUrl({ ...base, tokenPath: `/${VIDEO}` })).toThrow(VideoProviderError)
  })
})

describe('playbackTtlSeconds (ADR 017)', () => {
  it('durée × 4/3 + 15 min, bornée', () => {
    expect(playbackTtlSeconds(600)).toBe(800 + 900)
    expect(playbackTtlSeconds(30)).toBe(40 + 900)
    expect(playbackTtlSeconds(0.1)).toBeGreaterThanOrEqual(PLAYBACK_TTL_MIN_SECONDS)
    expect(playbackTtlSeconds(10 * 3600)).toBe(PLAYBACK_TTL_MAX_SECONDS)
    for (const value of [null, undefined, 0, -5, Number.NaN]) {
      expect(playbackTtlSeconds(value)).toBe(PLAYBACK_TTL_DEFAULT_SECONDS)
    }
  })

  it('assertTtl refuse les durées hors bornes', () => {
    expect(assertTtl(60)).toBe(60)
    for (const value of [59, 1.5, PLAYBACK_TTL_MAX_SECONDS + 1, Number.NaN]) {
      expect(() => assertTtl(value)).toThrow(RangeError)
    }
  })
})

const bunnyConfig = {
  libraryId: '12345',
  cdnHostname: 'https://VZ-abc.b-cdn.net/',
  tokenKey: KEY,
  apiKey: 'api-key',
  webhookSecret: 'read-only-key',
  now: () => now,
}

describe('BunnyStreamProvider', () => {
  const provider = new BunnyStreamProvider(bunnyConfig)
  const video = { provider: 'bunny', videoId: VIDEO }

  it('URL HLS, vignette et sous-titres signés, échéance courte, filigrane', async () => {
    const source = await provider.getPlaybackSource({
      video,
      viewer: { userId: 7, email: 'awa@example.com' },
      ttlSeconds: 900,
      captions: [
        { locale: 'fr', label: 'Français' },
        { locale: '../x', label: 'piège' },
      ],
    })
    expect(source.hlsUrl).toContain(`/${VIDEO}/playlist.m3u8`)
    expect(source.hlsUrl.startsWith('https://vz-abc.b-cdn.net/bcdn_token=HS256-')).toBe(true)
    expect(cdnAccepts(source.hlsUrl, KEY, nowSeconds)).toBe(true)
    expect(cdnAccepts(source.posterUrl!, KEY, nowSeconds)).toBe(true)
    expect(source.captions).toHaveLength(1)
    expect(source.captions![0]!.url).toContain(`/${VIDEO}/captions/fr.vtt`)
    expect(cdnAccepts(source.captions![0]!.url, KEY, nowSeconds)).toBe(true)
    expect(source.expiresAt).toEqual(new Date((nowSeconds + 900) * 1000))
    expect(cdnAccepts(source.hlsUrl, KEY, nowSeconds + 900)).toBe(false)
    expect(source.watermark).toBe('awa@example.com')
    // Aucune clé ni l'identifiant de bibliothèque dans l'URL publique.
    expect(source.hlsUrl).not.toContain(KEY)
    expect(source.hlsUrl).not.toContain('api-key')
  })

  it('économie de données : rendu unique le plus bas', async () => {
    const source = await provider.getPlaybackSource({
      video,
      viewer: null,
      ttlSeconds: 900,
      dataSaver: true,
    })
    expect(source.hlsUrl).toMatch(new RegExp(`/${VIDEO}/240p/video\\.m3u8$`))
    expect(cdnAccepts(source.hlsUrl, KEY, nowSeconds)).toBe(true)
    expect(source).not.toHaveProperty('watermark')
  })

  it('refuse un identifiant qui n’est pas un GUID Bunny (traversée de chemin)', async () => {
    for (const videoId of ['../secret', `${VIDEO}/../x`, '', 'abc']) {
      await expect(
        provider.getPlaybackSource({
          video: { provider: 'bunny', videoId },
          viewer: null,
          ttlSeconds: 900,
        }),
      ).rejects.toMatchObject({ code: 'invalid-video-id' })
    }
    await expect(
      provider.getPlaybackSource({
        video: { provider: 'vimeo', videoId: VIDEO },
        viewer: null,
        ttlSeconds: 900,
      }),
    ).rejects.toMatchObject({ code: 'invalid-video-id' })
  })

  it('refuse une durée de validité trop longue', async () => {
    await expect(
      provider.getPlaybackSource({ video, viewer: null, ttlSeconds: 7 * 24 * 3600 }),
    ).rejects.toThrow(RangeError)
  })

  it('configuration incomplète ou invalide', () => {
    expect(() => new BunnyStreamProvider({ ...bunnyConfig, tokenKey: ' ' })).toThrow(
      VideoProviderError,
    )
    expect(() => new BunnyStreamProvider({ ...bunnyConfig, cdnHostname: 'pas un hôte' })).toThrow(
      VideoProviderError,
    )
    expect(() => new BunnyStreamProvider({ ...bunnyConfig, dataSaverRendition: 'low' })).toThrow(
      VideoProviderError,
    )
    expect(normalizeCdnHostname('https://VZ-x.b-cdn.net/')).toBe('vz-x.b-cdn.net')
  })

  it('getVideoInfo interroge l’API avec la clé et traduit le statut', async () => {
    const calls: { url: string; headers: unknown }[] = []
    const fetchStub: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), headers: init?.headers })
      return new Response(JSON.stringify({ status: 3, length: 754 }), { status: 200 })
    }
    const withFetch = new BunnyStreamProvider({ ...bunnyConfig, fetch: fetchStub })
    expect(await withFetch.getVideoInfo(video)).toEqual({ status: 'ready', durationSeconds: 754 })
    expect(calls[0]!.url).toBe(`https://video.bunnycdn.com/library/12345/videos/${VIDEO}`)
    expect(calls[0]!.headers).toMatchObject({ AccessKey: 'api-key' })

    const failing = new BunnyStreamProvider({
      ...bunnyConfig,
      fetch: async () => new Response('nope', { status: 401 }),
    })
    await expect(failing.getVideoInfo(video)).rejects.toMatchObject({ code: 'upstream-error' })
    const offline = new BunnyStreamProvider({
      ...bunnyConfig,
      fetch: async () => {
        throw new TypeError('network')
      },
    })
    await expect(offline.getVideoInfo(video)).rejects.toMatchObject({ code: 'upstream-error' })
  })

  it('statuts Bunny', () => {
    expect(mapBunnyStatus(3)).toBe('ready')
    expect(mapBunnyStatus(5)).toBe('failed')
    expect(mapBunnyStatus(8)).toBe('failed')
    for (const status of [0, 1, 2, 4, 6, 7]) expect(mapBunnyStatus(status)).toBe('processing')
    for (const status of [9, 10, 12, 32, 99]) expect(mapBunnyStatus(status)).toBeNull()
  })

  describe('verifyWebhook', () => {
    const body = JSON.stringify({
      VideoLibraryId: 12345,
      VideoGuid: VIDEO.toUpperCase(),
      Status: 3,
      EventId: 'evt-1',
    })
    const sign = (raw: string, key = 'read-only-key') =>
      createHmac('sha256', key).update(raw).digest('hex')
    const headers = (raw: string, key?: string) => ({
      'X-BunnyStream-Signature-Version': 'v1',
      'X-BunnyStream-Signature-Algorithm': 'hmac-sha256',
      'X-BunnyStream-Signature': sign(raw, key),
    })

    it('accepte une signature valide (en-têtes insensibles à la casse)', async () => {
      expect(await provider.verifyWebhook({ headers: headers(body), rawBody: body })).toEqual({
        videoId: VIDEO,
        status: 'ready',
        eventId: 'evt-1',
      })
      expect(
        await provider.verifyWebhook({
          headers: { 'x-bunnystream-signature': sign(body).toUpperCase() },
          rawBody: body,
        }),
      ).toMatchObject({ status: 'ready' })
    })

    it('refuse signature absente, fausse, autre clé, corps modifié, version inconnue', async () => {
      const cases: Record<string, string>[] = [
        {},
        { 'X-BunnyStream-Signature': 'abc' },
        headers(body, 'autre-cle'),
        { ...headers(body), 'X-BunnyStream-Signature-Version': 'v2' },
        { ...headers(body), 'X-BunnyStream-Signature-Algorithm': 'sha1' },
      ]
      for (const caseHeaders of cases) {
        await expect(
          provider.verifyWebhook({ headers: caseHeaders, rawBody: body }),
        ).rejects.toMatchObject({
          code: 'invalid-signature',
        })
      }
      await expect(
        provider.verifyWebhook({ headers: headers(body), rawBody: body.replace('3', '5') }),
      ).rejects.toMatchObject({ code: 'invalid-signature' })
    })

    it('refuse une autre bibliothèque ou un corps incohérent, même bien signé', async () => {
      for (const raw of [
        JSON.stringify({ VideoLibraryId: 999, VideoGuid: VIDEO, Status: 3 }),
        JSON.stringify({ VideoLibraryId: 12345, VideoGuid: '../x', Status: 3 }),
        JSON.stringify({ VideoLibraryId: 12345, VideoGuid: VIDEO, Status: 'done' }),
        'pas du json',
      ]) {
        await expect(
          provider.verifyWebhook({ headers: headers(raw), rawBody: raw }),
        ).rejects.toMatchObject({
          code: 'invalid-payload',
        })
      }
    })

    it('événement sans effet sur la lecture : statut null', async () => {
      const raw = JSON.stringify({ VideoLibraryId: '12345', VideoGuid: VIDEO, Status: 9 })
      expect(await provider.verifyWebhook({ headers: headers(raw), rawBody: raw })).toEqual({
        videoId: VIDEO,
        status: null,
        eventId: null,
      })
    })

    it('sans secret configuré : not-configured', async () => {
      const noSecret = new BunnyStreamProvider({ ...bunnyConfig, webhookSecret: undefined })
      await expect(
        noSecret.verifyWebhook({ headers: headers(body), rawBody: body }),
      ).rejects.toMatchObject({
        code: 'not-configured',
      })
    })
  })
})

describe('LocalVideoProvider', () => {
  const secret = deriveLocalVideoSecret('x'.repeat(32))
  const provider = new LocalVideoProvider({
    baseUrl: 'http://localhost:3000/api/dev-video/',
    secret,
    format: 'hls',
    now: () => now,
  })

  it('URL signée dans le chemin, vérifiable et limitée à la vidéo', async () => {
    const source = await provider.getPlaybackSource({
      video: { provider: 'bunny', videoId: 'demo-intro' },
      viewer: { userId: 1, email: 'dev@example.com' },
      ttlSeconds: 900,
      captions: [{ locale: 'fr', label: 'Français' }],
    })
    const match =
      /^http:\/\/localhost:3000\/api\/dev-video\/([^/]+)\/demo-intro\/playlist\.m3u8$/.exec(
        source.hlsUrl,
      )
    expect(match).not.toBeNull()
    const token = decodeURIComponent(match![1]!)
    expect(verifyLocalVideoToken(token, 'demo-intro', secret, now.getTime())).toBe(true)
    expect(verifyLocalVideoToken(token, 'autre', secret, now.getTime())).toBe(false)
    expect(verifyLocalVideoToken(token, 'demo-intro', 'autre-secret', now.getTime())).toBe(false)
    expect(verifyLocalVideoToken(token, 'demo-intro', secret, now.getTime() + 900_000)).toBe(false)
    expect(verifyLocalVideoToken(token, '../demo-intro', secret, now.getTime())).toBe(false)
    expect(source.captions![0]!.url).toMatch(/\/demo-intro\/captions\/fr\.vtt$/)
    expect(source.expiresAt).toEqual(new Date(now.getTime() + 900_000))
  })

  it('format MP4', async () => {
    const mp4 = new LocalVideoProvider({
      baseUrl: 'http://localhost:3000/api/dev-video',
      secret,
      format: 'mp4',
    })
    const source = await mp4.getPlaybackSource({
      video: { provider: 'bunny', videoId: VIDEO },
      viewer: null,
      ttlSeconds: 900,
    })
    expect(source.hlsUrl).toMatch(new RegExp(`/${VIDEO}/video\\.mp4$`))
  })

  it('refuse les identifiants dangereux', async () => {
    await expect(
      provider.getPlaybackSource({
        video: { provider: 'local', videoId: '../../etc' },
        viewer: null,
        ttlSeconds: 900,
      }),
    ).rejects.toMatchObject({ code: 'invalid-video-id' })
  })

  it('webhook simulé signé', async () => {
    const raw = JSON.stringify({ videoId: 'demo', status: 'ready', eventId: 'e1' })
    const signature = signLocalWebhook(raw, secret)
    expect(
      await provider.verifyWebhook({
        headers: { 'X-Local-Video-Signature': signature },
        rawBody: raw,
      }),
    ).toEqual({ videoId: 'demo', status: 'ready', eventId: 'e1' })
    await expect(provider.verifyWebhook({ headers: {}, rawBody: raw })).rejects.toMatchObject({
      code: 'invalid-signature',
    })
    await expect(
      provider.verifyWebhook({ headers: { 'x-local-video-signature': 'ab' }, rawBody: raw }),
    ).rejects.toMatchObject({ code: 'invalid-signature' })
  })

  it('refuse un secret trop court', () => {
    expect(
      () =>
        new LocalVideoProvider({
          baseUrl: 'http://localhost:3000',
          secret: 'court',
          format: 'mp4',
        }),
    ).toThrow(VideoProviderError)
  })
})

describe('buildVideoProvider', () => {
  const config: VideoConfig = {
    provider: 'local',
    nodeEnv: 'development',
    allowDevServices: false,
    siteUrl: 'http://localhost:3000',
    payloadSecret: 'p'.repeat(32),
    localFormat: 'mp4',
    bunny: {},
  }

  it('local en développement, interdit en production', () => {
    expect(buildVideoProvider(config).id).toBe('local')
    expect(() => buildVideoProvider({ ...config, nodeEnv: 'production' })).toThrow(
      VideoProviderError,
    )
    expect(
      buildVideoProvider({ ...config, nodeEnv: 'production', allowDevServices: true }).id,
    ).toBe('local')
  })

  it('bunny exige sa configuration', () => {
    expect(() => buildVideoProvider({ ...config, provider: 'bunny' })).toThrow(/BUNNY_STREAM/)
    expect(
      buildVideoProvider({
        ...config,
        provider: 'bunny',
        bunny: { libraryId: '1', apiKey: 'a', tokenKey: 'k', cdnHostname: 'vz-1.b-cdn.net' },
      }).id,
    ).toBe('bunny')
  })

  it('le secret local est dérivé et distinct de PAYLOAD_SECRET', () => {
    const derived = deriveLocalVideoSecret(config.payloadSecret)
    expect(derived).toMatch(/^[0-9a-f]{64}$/)
    expect(derived).not.toBe(config.payloadSecret)
    expect(deriveLocalVideoSecret('q'.repeat(32))).not.toBe(derived)
  })
})

describe('variables d’environnement vidéo', () => {
  const valid = {
    DATABASE_URL: 'postgres://u:p@localhost:5432/amana',
    PAYLOAD_SECRET: 'x'.repeat(32),
  }

  it('local par défaut, rendu économie 240p', () => {
    const env = parseServerEnv(valid)
    expect(env.VIDEO_PROVIDER).toBe('local')
    expect(env.LOCAL_VIDEO_FORMAT).toBe('mp4')
    expect(env.BUNNY_STREAM_DATA_SAVER_RENDITION).toBe('240p')
  })

  it('VIDEO_PROVIDER=bunny exige les quatre variables Bunny', () => {
    expect(() => parseServerEnv({ ...valid, VIDEO_PROVIDER: 'bunny' })).toThrow(
      /BUNNY_STREAM_LIBRARY_ID.*\n.*BUNNY_STREAM_API_KEY/s,
    )
    const env = parseServerEnv({
      ...valid,
      VIDEO_PROVIDER: 'bunny',
      BUNNY_STREAM_LIBRARY_ID: '12345',
      BUNNY_STREAM_API_KEY: 'a',
      BUNNY_STREAM_TOKEN_KEY: 'k',
      BUNNY_STREAM_CDN_HOSTNAME: 'vz-abc.b-cdn.net',
    })
    expect(env.VIDEO_PROVIDER).toBe('bunny')
  })

  it('valeurs mal formées refusées', () => {
    expect(() => parseServerEnv({ ...valid, VIDEO_PROVIDER: 'youtube' })).toThrow(/VIDEO_PROVIDER/)
    expect(() =>
      parseServerEnv({ ...valid, BUNNY_STREAM_CDN_HOSTNAME: 'https://vz.b-cdn.net' }),
    ).toThrow(/BUNNY_STREAM_CDN_HOSTNAME/)
    expect(() => parseServerEnv({ ...valid, BUNNY_STREAM_LIBRARY_ID: 'abc' })).toThrow(
      /BUNNY_STREAM_LIBRARY_ID/,
    )
    expect(() => parseServerEnv({ ...valid, BUNNY_STREAM_DATA_SAVER_RENDITION: 'low' })).toThrow(
      /BUNNY_STREAM_DATA_SAVER_RENDITION/,
    )
  })
})
