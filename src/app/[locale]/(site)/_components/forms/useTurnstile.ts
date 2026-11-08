'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Cloudflare Turnstile chargé à la demande : le script tiers n'est injecté qu'à la
 * première interaction avec le formulaire (focus, saisie), jamais au chargement de la
 * page. Mode « interaction-only » : invisible tant que Cloudflare ne demande rien.
 */

type TurnstileApi = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
      appearance?: 'always' | 'execute' | 'interaction-only'
      language?: string
      size?: 'normal' | 'flexible' | 'compact'
      theme?: 'light' | 'dark' | 'auto'
    },
  ): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/** Clé de site : configurée, sinon clé de test Cloudflare « toujours valide » (dev, CI). */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise: Promise<TurnstileApi> | null = null

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile'))
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('turnstile'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export type TurnstileState = 'idle' | 'loading' | 'ready' | 'error'

export function useTurnstile(locale: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)
  const tokenRef = useRef('')
  const waiters = useRef<Array<(token: string) => void>>([])
  const [state, setState] = useState<TurnstileState>('idle')

  const activate = useCallback(() => {
    if (widgetRef.current || !containerRef.current || state === 'loading') return
    setState('loading')
    loadScript()
      .then((api) => {
        if (!containerRef.current || widgetRef.current) return
        widgetRef.current = api.render(containerRef.current, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          size: 'flexible',
          theme: 'light',
          language: locale,
          callback: (token) => {
            tokenRef.current = token
            setState('ready')
            for (const resolve of waiters.current.splice(0)) resolve(token)
          },
          'expired-callback': () => {
            tokenRef.current = ''
          },
          'error-callback': () => setState('error'),
        })
      })
      .catch(() => setState('error'))
  }, [locale, state])

  /** Jeton courant, en attendant au plus `timeoutMs` qu'il arrive. */
  const getToken = useCallback(
    (timeoutMs = 15_000): Promise<string> => {
      activate()
      if (tokenRef.current) return Promise.resolve(tokenRef.current)
      return new Promise((resolve) => {
        const timer = window.setTimeout(() => resolve(''), timeoutMs)
        waiters.current.push((token) => {
          window.clearTimeout(timer)
          resolve(token)
        })
      })
    },
    [activate],
  )

  /** Un jeton ne sert qu'une fois : nouveau défi après chaque envoi. */
  const reset = useCallback(() => {
    tokenRef.current = ''
    if (widgetRef.current && window.turnstile) window.turnstile.reset(widgetRef.current)
  }, [])

  useEffect(
    () => () => {
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current)
      widgetRef.current = null
    },
    [],
  )

  return { containerRef, activate, getToken, reset, state }
}
