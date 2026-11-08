import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

import { Trame } from '@/components/brand/Trame'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Container } from '@/components/ui/Layout'
import { Link, type Href } from '@/components/ui/Link'

export type RecoveryLabels = {
  title: string
  text: string
  searchLabel: string
  searchSubmit: string
  pillarsTitle: string
  pillars: readonly { label: string; href: Href }[]
}

/**
 * Pages 404 et 500 utiles : Trame (état vide de marque), une phrase, la recherche et les
 * pôles. Le formulaire de recherche est un simple GET : il fonctionne même si le
 * JavaScript de la page a échoué.
 */
export function RecoveryPanel({
  labels,
  searchAction,
  extra,
}: {
  labels: RecoveryLabels
  /** URL localisée de la page Recherche. */
  searchAction: string
  /** Action supplémentaire (réessayer, sur la page d'erreur). */
  extra?: ReactNode
}) {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-green-900">
      <Trame
        density={4}
        rows={3}
        className="absolute inset-y-0 end-0 -z-10 w-1/3 opacity-30 lg:opacity-100"
      />
      <Container className="py-24 lg:py-32">
        <div className="flex max-w-lg flex-col gap-10">
          <div className="flex max-w-lg flex-col gap-5">
            <h1 className="text-h1 text-paper">{labels.title}</h1>
            <p className="text-body-lg text-sand-300">{labels.text}</p>
            {extra}
          </div>
          <form
            action={searchAction}
            method="get"
            role="search"
            className="flex max-w-md flex-col gap-3"
          >
            <label htmlFor="secours-q" className="text-small font-semibold text-paper">
              {labels.searchLabel}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input id="secours-q" name="q" type="search" className="sm:flex-1" />
              <Button type="submit" variant="gold" icon={<Search aria-hidden="true" />}>
                {labels.searchSubmit}
              </Button>
            </div>
          </form>
          <nav aria-labelledby="secours-poles" className="flex flex-col gap-3">
            <h2 id="secours-poles" className="font-sans text-small font-semibold text-sand-300">
              {labels.pillarsTitle}
            </h2>
            <ul className="flex flex-wrap gap-x-8">
              {labels.pillars.map((pillar) => (
                <li key={pillar.label}>
                  <Link href={pillar.href} variant="standalone" tone="light">
                    {pillar.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </section>
  )
}
