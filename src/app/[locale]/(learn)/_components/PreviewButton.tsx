'use client'

import { FileText, PlayCircle } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { type ReactNode, useCallback, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/Dialog'
import { Alert } from '@/components/ui/Feedback'
import { Spinner } from '@/components/ui/Spinner'

import { loadPreviewAction, type PreviewResult } from '../_actions/preview'

export type PreviewTarget =
  | { kind: 'lesson'; courseId: number; lessonId: number; media: 'video' | 'text' }
  | { kind: 'trailer'; courseId: number; media: 'video' }

/**
 * Économie de données : préférence du navigateur (`Save-Data`) ou réseau lent annoncé.
 * Le serveur force alors le rendu le plus bas (ADR 017).
 */
function prefersDataSaver(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection
  return (
    Boolean(connection?.saveData) ||
    ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '')
  )
}

/** Lecture HLS native (Safari, Android) ; sinon le lecteur complet (M3.6) chargera hls.js. */
const canPlay = (mimeType: string) =>
  mimeType === 'video/mp4' || document.createElement('video').canPlayType(mimeType) !== ''

/**
 * Extrait gratuit d'une leçon ou bande-annonce du cours, dans un dialogue. Rien n'est
 * téléchargé avant l'ouverture : ni vidéo, ni texte (fiche légère en 3G). L'URL vidéo est
 * signée à la demande, après vérification de l'accès côté serveur.
 */
export function PreviewButton({
  target,
  title,
  label,
  variant = 'link',
}: {
  target: PreviewTarget
  /** Titre du dialogue (titre de la leçon). */
  title: string
  /** Libellé du bouton, avec le titre pour les lecteurs d'écran. */
  label: string
  variant?: 'link' | 'button'
}) {
  const locale = useLocale()
  const t = useTranslations('learn.preview')
  const [result, setResult] = useState<PreviewResult | null>(null)
  const [pending, startTransition] = useTransition()
  const retried = useRef(false)

  const load = useCallback(() => {
    startTransition(async () => {
      setResult(await loadPreviewAction(locale, { ...target, dataSaver: prefersDataSaver() }))
    })
  }, [locale, target])

  const onOpenChange = (open: boolean) => {
    if (open && !result) load()
    if (!open) {
      // URL signée à durée courte : nouvelle demande à la prochaine ouverture.
      setResult(null)
      retried.current = false
    }
  }

  let body: ReactNode = (
    <p role="status" className="flex items-center gap-3 text-body text-ink-muted">
      <Spinner />
      {t('loading')}
    </p>
  )
  if (!pending && result) {
    if (!result.ok) {
      body = (
        <Alert tone={result.reason === 'rate-limited' ? 'warning' : 'info'} role="alert">
          {t(`errors.${result.reason}`)}
        </Alert>
      )
    } else if (result.kind === 'text') {
      body = <div className="max-h-[60dvh] overflow-y-auto">{result.content}</div>
    } else if (!canPlay(result.video.mimeType)) {
      body = (
        <div className="flex flex-col gap-4">
          <Alert tone="info">{t('errors.unsupported')}</Alert>
          {result.transcript}
        </div>
      )
    } else {
      body = (
        <div className="flex flex-col gap-6">
          {/* Pas de téléchargement direct (SPEC §4.1) ; commandes natives, accessibles au clavier. */}
          <video
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            poster={result.video.poster ?? undefined}
            className="aspect-video w-full rounded-media bg-green-900"
            aria-label={title}
            onContextMenu={(event) => event.preventDefault()}
            onError={() => {
              // Jeton expiré (longue pause) : une nouvelle URL, une seule fois.
              if (retried.current) return
              retried.current = true
              load()
            }}
          >
            <source src={result.video.src} type={result.video.mimeType} />
            {result.video.captions.map((caption, index) => (
              <track
                key={caption.locale}
                kind="captions"
                src={caption.url}
                srcLang={caption.locale}
                label={caption.label}
                default={index === 0}
              />
            ))}
          </video>
          {result.transcript ? (
            <details className="rounded-panel border border-line p-4">
              <summary className="min-h-11 cursor-pointer content-center font-semibold text-ink">
                {t('transcript')}
              </summary>
              <div className="mt-4 max-h-[40dvh] overflow-y-auto">{result.transcript}</div>
            </details>
          ) : null}
        </div>
      )
    }
  }

  const Icon = target.media === 'video' ? PlayCircle : FileText
  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {variant === 'button' ? (
          <Button variant="secondary" fullWidth icon={<Icon aria-hidden="true" />}>
            {label}
          </Button>
        ) : (
          <button
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-media text-small font-semibold text-green-700 is-hover:text-green-800 is-hover:underline"
          >
            <Icon aria-hidden="true" className="size-4" />
            <span>{label}</span>
            <span className="sr-only">{t('of', { title })}</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent title={title} description={t('free')} size="lg">
        <div aria-busy={pending || undefined}>{body}</div>
      </DialogContent>
    </Dialog>
  )
}
