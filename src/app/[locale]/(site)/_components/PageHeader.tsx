import type { ReactNode } from 'react'

import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { Container } from '@/components/ui/Layout'

import { BreadcrumbJsonLd } from './JsonLd'

/**
 * En-tête des pages de contenu (hors héros vert) : fil d'Ariane, H1, chapeau,
 * éléments complémentaires (métadonnées, actions). Aligné à gauche, filet bas.
 * Émet le `BreadcrumbList` correspondant au fil d'Ariane.
 */
export function PageHeader({
  breadcrumb,
  title,
  lead,
  children,
}: {
  breadcrumb: readonly BreadcrumbItem[]
  title: string
  lead?: string | null
  children?: ReactNode
}) {
  return (
    <header className="border-b border-line pt-6 pb-12 lg:pb-16">
      <Container className="flex flex-col gap-8">
        <Breadcrumb items={breadcrumb} />
        <BreadcrumbJsonLd items={breadcrumb} />
        <div className="flex max-w-xl flex-col gap-5">
          <h1 className="text-h1">{title}</h1>
          {lead ? <p className="max-w-measure text-body-lg text-ink-muted">{lead}</p> : null}
          {children}
        </div>
      </Container>
    </header>
  )
}
