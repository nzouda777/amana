import { useTranslations } from 'next-intl'

import { Accordion, AccordionItem } from '@/components/ui/Disclosure'
import { faqPageJsonLd, serializeJsonLd } from '@/lib/seo/jsonld'

export type FaqItem = {
  id: string
  question: string
  /** Réponse en texte brut ; les paragraphes sont séparés par une ligne vide. */
  answer: string
}

export type FAQProps = {
  items: readonly FaqItem[]
  /** Titre de la section ; « Questions fréquentes » par défaut. */
  title?: string
  /** Émet les données structurées FAQPage (une seule FAQ balisée par page). */
  structuredData?: boolean
  headingLevel?: 2 | 3
  /** Identifiant du titre (pour `aria-labelledby` de la section parente). */
  id?: string
  className?: string
}

function paragraphs(answer: string) {
  return answer
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/** JSON-LD FAQPage (constructeur et sérialisation sûre : `src/lib/seo/jsonld.ts`). */
function faqJsonLd(items: readonly FaqItem[]): string {
  return serializeJsonLd(
    faqPageJsonLd(
      items.map((item) => ({
        question: item.question,
        answer: paragraphs(item.answer).join('\n\n'),
      })),
    ),
  )
}

/** FAQ en accordéon (plusieurs réponses ouvrables), avec données structurées FAQPage. */
export function FAQ({
  items,
  title,
  structuredData = false,
  headingLevel = 2,
  id,
  className,
}: FAQProps) {
  const t = useTranslations('ui.faq')
  const Heading = `h${headingLevel}` as const
  const itemLevel = headingLevel === 2 ? 3 : 4
  return (
    <div className={className}>
      <Heading id={id} className={headingLevel === 2 ? 'mb-8 text-h2' : 'mb-6 text-h3'}>
        {title ?? t('title')}
      </Heading>
      <Accordion type="multiple">
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            title={item.question}
            headingLevel={itemLevel}
          >
            {paragraphs(item.answer).map((paragraph, index) => (
              <p key={index} className={index > 0 ? 'mt-3' : undefined}>
                {paragraph}
              </p>
            ))}
          </AccordionItem>
        ))}
      </Accordion>
      {structuredData ? (
        <script
          type="application/ld+json"
          // Contenu sérialisé et échappé ci-dessus : aucune donnée HTML brute.
          dangerouslySetInnerHTML={{ __html: faqJsonLd(items) }}
        />
      ) : null}
    </div>
  )
}
