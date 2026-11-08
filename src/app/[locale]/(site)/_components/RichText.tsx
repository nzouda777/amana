import {
  type JSXConverters,
  type JSXConvertersFunction,
  RichText as LexicalRichText,
} from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { Callout, Prose } from '@/components/ui/Prose'
import { Link } from '@/components/ui/Link'
import { ANCHOR_KEY } from '@/features/site/rich-text'
import { typographyFrLexical } from '@/lib/typography'

import { cmsHref } from '../_lib/href'

/**
 * Rendu des champs `richText` (Lexical) dans `Prose` : titres avec ancres (sommaire),
 * liens internes localisés, liens du glossaire avec définition, encadrés `callout`.
 * Composant serveur, sans JS client.
 */

type LinkFields = {
  url?: string
  newTab?: boolean
  linkType?: 'custom' | 'internal'
  glossaryTerm?: string
}

type CalloutFields = {
  variant?: 'retenir' | 'avertissement'
  title?: string | null
  content?: unknown
}

export type RichTextProps = {
  data: unknown
  locale: string
  /** Définitions courtes des termes liés (infobulle native `title`). */
  glossary?: ReadonlyMap<string, string>
  className?: string
  /** Sans conteneur `Prose` (encadrés, réponses courtes). */
  bare?: boolean
}

type EditorState = NonNullable<Parameters<typeof LexicalRichText>[0]['data']>

function isEditorState(value: unknown): value is EditorState {
  return typeof value === 'object' && value !== null && 'root' in value
}

function buildConverters(
  locale: string,
  glossary: ReadonlyMap<string, string> | undefined,
): JSXConvertersFunction {
  return ({ defaultConverters }) =>
    ({
      ...defaultConverters,
      heading: ({ node, nodesToJSX }) => {
        const tag = (node as { tag?: string }).tag
        const Tag = (['h2', 'h3', 'h4'].includes(tag ?? '') ? tag : 'h2') as 'h2' | 'h3' | 'h4'
        const id = (node as Record<string, unknown>)[ANCHOR_KEY]
        return (
          <Tag id={typeof id === 'string' ? id : undefined} className="scroll-mt-24">
            {nodesToJSX({ nodes: node.children })}
          </Tag>
        )
      },
      link: ({ node, nodesToJSX }) => {
        const fields = (node as { fields?: LinkFields }).fields ?? {}
        const children = nodesToJSX({ nodes: node.children })
        const href = cmsHref(fields.url)
        if (!href) return <>{children}</>
        const definition = fields.glossaryTerm ? glossary?.get(fields.glossaryTerm) : undefined
        return (
          <Link
            href={href}
            title={definition}
            data-glossary={fields.glossaryTerm ? '' : undefined}
            target={fields.newTab ? '_blank' : undefined}
          >
            {children}
          </Link>
        )
      },
      autolink: ({ node, nodesToJSX }) => {
        const fields = (node as { fields?: LinkFields }).fields ?? {}
        const href = cmsHref(fields.url)
        const children = nodesToJSX({ nodes: node.children })
        return href ? <Link href={href}>{children}</Link> : <>{children}</>
      },
      blocks: {
        callout: ({ node }) => {
          const fields = (node as { fields: CalloutFields }).fields
          return (
            <Callout
              variant={fields.variant === 'avertissement' ? 'warning' : 'key'}
              title={fields.title ?? undefined}
            >
              <RichText data={fields.content} locale={locale} bare />
            </Callout>
          )
        },
      },
    }) as JSXConverters
}

export function RichText({ data, locale, glossary, className, bare = false }: RichTextProps) {
  if (!isEditorState(data)) return null
  const state = locale === 'fr' ? typographyFrLexical(data) : data
  const content: ReactNode = (
    <LexicalRichText
      data={state}
      converters={buildConverters(locale, glossary)}
      disableContainer
      disableIndent
      disableTextAlign
    />
  )
  return bare ? content : <Prose className={className}>{content}</Prose>
}
