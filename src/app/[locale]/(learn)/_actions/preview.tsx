'use server'

import type { ReactNode } from 'react'
import { z } from 'zod'

import { getClientIp } from '@/features/auth/server/request'
import { MemoryRateLimiter } from '@/features/leads/rate-limit'
import { VideoProviderError } from '@/features/lms/contracts'
import { getAccessService, getSessionUser, toViewer } from '@/features/lms/server/services'
import { getVideoProvider, playbackTtlSeconds } from '@/features/lms/video'
import { isLocale } from '@/lib/i18n/config'
import { getPayloadClient } from '@/lib/payload'

import { RichText } from '../../(site)/_components/RichText'

/**
 * Extraits jouables de la fiche cours, chargés à la demande (rien dans le HTML de la
 * page, aucune donnée vidéo avant le clic : économie de données). Chaque appel revérifie
 * l'accès par `AccessService` avant de signer une URL vidéo à durée courte (ADR 017).
 */

const limiter = new MemoryRateLimiter({ limit: 60, windowMs: 10 * 60 * 1000 })

const id = z.number().int().positive().max(2_147_483_647)

const inputSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('lesson'), courseId: id, lessonId: id, dataSaver: z.boolean() }),
  z.strictObject({ kind: z.literal('trailer'), courseId: id, dataSaver: z.boolean() }),
])

export type PreviewVideo = {
  src: string
  /** `application/x-mpegURL` (HLS) ou `video/mp4`. */
  mimeType: string
  poster: string | null
  captions: { locale: string; label: string; url: string }[]
  expiresAt: string
}

export type PreviewResult =
  | { ok: true; kind: 'video'; video: PreviewVideo; transcript: ReactNode | null }
  | { ok: true; kind: 'text'; content: ReactNode }
  | { ok: false; reason: 'not-found' | 'unavailable' | 'rate-limited' }

const mimeTypeOf = (url: string) =>
  new URL(url).pathname.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'

async function sign(
  videoId: string,
  durationSeconds: number | null,
  viewer: { userId: number; email: string } | null,
  dataSaver: boolean,
): Promise<PreviewVideo | null> {
  try {
    const source = await getVideoProvider().getPlaybackSource({
      video: { provider: 'bunny', videoId },
      viewer,
      ttlSeconds: playbackTtlSeconds(durationSeconds),
      dataSaver,
    })
    return {
      src: source.hlsUrl,
      mimeType: mimeTypeOf(source.hlsUrl),
      poster: source.posterUrl ?? null,
      captions: source.captions ?? [],
      expiresAt: source.expiresAt.toISOString(),
    }
  } catch (error) {
    if (error instanceof VideoProviderError) return null
    throw error
  }
}

export async function loadPreviewAction(locale: string, input: unknown): Promise<PreviewResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'not-found' }
  const rate = await limiter.consume(`preview:${(await getClientIp()) ?? 'unknown'}`)
  if (!rate.allowed) return { ok: false, reason: 'rate-limited' }
  const contentLocale = isLocale(locale) ? locale : 'fr'
  const payload = await getPayloadClient()
  const user = await getSessionUser()
  const watermarkViewer = user ? { userId: user.id, email: user.email } : null

  if (parsed.data.kind === 'trailer') {
    // Extrait du cours : public, sur un cours publié uniquement.
    const result = await payload.find({
      collection: 'courses',
      where: {
        and: [{ id: { equals: parsed.data.courseId } }, { _status: { equals: 'published' } }],
      },
      select: { trailer: true },
      depth: 0,
      limit: 1,
      overrideAccess: false,
    })
    const videoId = result.docs[0]?.trailer?.videoId
    if (!videoId) return { ok: false, reason: 'not-found' }
    const video = await sign(videoId, null, watermarkViewer, parsed.data.dataSaver)
    return video
      ? { ok: true, kind: 'video', video, transcript: null }
      : { ok: false, reason: 'unavailable' }
  }

  const { courseId, lessonId, dataSaver } = parsed.data
  const access = await getAccessService()
  const decision = await access.canAccessLesson(toViewer(user), lessonId, {
    expectedCourseId: courseId,
  })
  if (!decision.allowed) return { ok: false, reason: 'not-found' }

  // Accès vérifié : lecture du contenu protégé (champs réservés au personnel par défaut).
  const lesson = await payload.findByID({
    collection: 'lessons',
    id: lessonId,
    select: { type: true, video: true, body: true, transcript: true },
    locale: contentLocale,
    depth: 0,
    overrideAccess: true,
  })

  if (lesson.type === 'video') {
    const videoId = lesson.video?.videoId
    if (!videoId) return { ok: false, reason: 'unavailable' }
    const video = await sign(
      videoId,
      lesson.video?.durationSeconds ?? null,
      watermarkViewer,
      dataSaver,
    )
    if (!video) return { ok: false, reason: 'unavailable' }
    return {
      ok: true,
      kind: 'video',
      video,
      transcript: lesson.transcript ? (
        <RichText data={lesson.transcript} locale={contentLocale} />
      ) : null,
    }
  }
  if ((lesson.type === 'text' || lesson.type === 'case-study') && lesson.body) {
    return {
      ok: true,
      kind: 'text',
      content: <RichText data={lesson.body} locale={contentLocale} />,
    }
  }
  return { ok: false, reason: 'not-found' }
}
