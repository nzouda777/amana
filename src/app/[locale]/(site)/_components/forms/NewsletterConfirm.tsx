'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'

import { Button, ButtonLink } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'

import { confirmNewsletterAction, type ConfirmState } from '../../_actions/leads'

/**
 * Confirmation du double opt-in par un clic explicite : les antivirus de messagerie qui
 * ouvrent les liens ne peuvent pas confirmer une inscription à la place de l'abonné.
 * Fonctionne sans JavaScript (formulaire serveur), amélioré avec.
 */
export function NewsletterConfirm({ token }: { token: string }) {
  const t = useTranslations('forms.newsletterConfirm')
  const [state, action, pending] = useActionState<ConfirmState, FormData>(confirmNewsletterAction, {
    outcome: null,
  })

  if (state.outcome === 'confirmed' || state.outcome === 'already-confirmed') {
    return (
      <div className="flex flex-col gap-6">
        <Alert tone="success" role="status" title={t(`${state.outcome}.title`)}>
          {t(`${state.outcome}.text`)}
        </Alert>
        <div>
          <ButtonLink href="/ressources" variant="secondary">
            {t('resources')}
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="token" value={token} />
      {state.outcome ? (
        <Alert tone="danger" role="alert" title={t(`${state.outcome}.title`)}>
          {t(`${state.outcome}.text`)}
        </Alert>
      ) : null}
      <div>
        <Button type="submit" loading={pending}>
          {t('submit')}
        </Button>
      </div>
    </form>
  )
}
