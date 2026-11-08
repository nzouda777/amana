'use client'

import { useLocale, useTranslations } from 'next-intl'
import { type ReactNode, useActionState } from 'react'

import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'

import { verifyEmailAction, type VerifyState } from '../../_actions/auth'

/**
 * Confirmation de l'adresse par un bouton (pas au simple chargement du lien : un
 * antivirus qui suit le lien ne confirme rien). Fonctionne sans JavaScript.
 */
export function VerifyEmailPanel({ token, signIn }: { token: string; signIn: ReactNode }) {
  const locale = useLocale()
  const t = useTranslations('learn.auth.verify')
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifyEmailAction, {
    status: 'idle',
  })

  if (state.status === 'verified') {
    return (
      <div className="flex flex-col gap-8">
        <Alert tone="success" role="status" title={t('doneTitle')}>
          {t('doneText')}
        </Alert>
        {signIn}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {state.status === 'invalid' || state.status === 'error' ? (
        <Alert tone="warning" role="alert" title={t(`${state.status}.title`)}>
          {t(`${state.status}.text`)}
        </Alert>
      ) : (
        <p className="text-body text-ink-muted">{t('intro')}</p>
      )}
      {state.status === 'invalid' ? (
        signIn
      ) : (
        <form action={action}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" loading={pending} fullWidth>
            {t('submit')}
          </Button>
        </form>
      )}
    </div>
  )
}
