import { sql } from '@payloadcms/db-postgres'

import { type SearchHit, type SearchKind, toPrefixTsQuery } from '@/features/site/search'
import { getPayloadClient } from '@/lib/payload'

import type { Locale } from './cache'

/**
 * Recherche plein texte Postgres (configuration `french` + `unaccent`, migration
 * `20261103_090000_recherche_plein_texte`). Les expressions reprennent exactement celles
 * des index GIN. Contenus publiés uniquement ; traduction de la locale demandée, sinon
 * français (repli).
 * Cours et capsules publiés compris (titre, résumé, sous-titre et description SEO ; sans
 * index dédié, volume faible).
 */

type Row = {
  kind: SearchKind
  id: number
  slug: string | null
  title: string | null
  excerpt: string | null
  pillar: string | null
  rank: number | string
}

/** Page exclue des résultats : l'accueil n'est pas une réponse utile. */
const hiddenPage = 'accueil'

export async function searchSite(input: string, locale: Locale, limit = 40): Promise<SearchHit[]> {
  const tsquery = toPrefixTsQuery(input)
  if (!tsquery) return []
  const payload = await getPayloadClient()
  const query = sql`to_tsquery('french'::regconfig, public.amana_unaccent(${tsquery}))`
  const locales =
    locale === 'fr' ? sql`ARRAY['fr']::_locales[]` : sql`ARRAY[${locale}, 'fr']::_locales[]`
  const preferred = sql`(l._locale = ${locale}::_locales)`

  const result = await payload.db.drizzle.execute(sql`
    WITH q AS (SELECT ${query} AS query),
    hits AS (
      (SELECT DISTINCT ON (s.id) 'service' AS kind, s.id, l.slug, l.title, l.summary AS excerpt,
        s.pillar::text AS pillar,
        ts_rank(amana_search_vector(l.title, l.summary, l.seo_description), q.query) AS rank
      FROM services s JOIN services_locales l ON l._parent_id = s.id, q
      WHERE s._status = 'published' AND l._locale = ANY(${locales})
        AND amana_search_vector(l.title, l.summary, l.seo_description) @@ q.query
      ORDER BY s.id, ${preferred} DESC)
      UNION ALL
      (SELECT DISTINCT ON (c.id) 'course', c.id, l.slug, l.title, l.summary, NULL,
        ts_rank(amana_search_vector(l.title, l.summary,
          concat_ws(' ', l.subtitle, l.seo_description)), q.query)
      FROM courses c JOIN courses_locales l ON l._parent_id = c.id, q
      WHERE c._status = 'published' AND l._locale = ANY(${locales})
        AND amana_search_vector(l.title, l.summary,
          concat_ws(' ', l.subtitle, l.seo_description)) @@ q.query
      ORDER BY c.id, ${preferred} DESC)
      UNION ALL
      (SELECT DISTINCT ON (p.id) 'page', p.id, l.slug, l.title, l.seo_description, NULL,
        ts_rank(amana_search_vector(l.title, l.seo_description), q.query)
      FROM pages p JOIN pages_locales l ON l._parent_id = p.id, q
      WHERE p._status = 'published' AND l._locale = ANY(${locales})
        AND l.slug <> ${hiddenPage}
        AND amana_search_vector(l.title, l.seo_description) @@ q.query
      ORDER BY p.id, ${preferred} DESC)
      UNION ALL
      (SELECT DISTINCT ON (a.id) 'article', a.id, l.slug, l.title, l.excerpt, NULL,
        ts_rank(amana_search_vector(l.title, l.excerpt, amana_jsonb_text(l.content)), q.query)
      FROM posts a JOIN posts_locales l ON l._parent_id = a.id, q
      WHERE a._status = 'published' AND l._locale = ANY(${locales})
        AND amana_search_vector(l.title, l.excerpt, amana_jsonb_text(l.content)) @@ q.query
      ORDER BY a.id, ${preferred} DESC)
      UNION ALL
      (SELECT DISTINCT ON (g.id) 'glossary', g.id, l.slug, l.term, l.short_definition, NULL,
        ts_rank(amana_search_vector(l.term, l.short_definition, amana_jsonb_text(l.definition)), q.query)
      FROM glossary_terms g JOIN glossary_terms_locales l ON l._parent_id = g.id, q
      WHERE l._locale = ANY(${locales})
        AND amana_search_vector(l.term, l.short_definition, amana_jsonb_text(l.definition)) @@ q.query
      ORDER BY g.id, ${preferred} DESC)
    )
    SELECT * FROM hits ORDER BY rank DESC LIMIT ${limit}
  `)

  const rows = (result as unknown as { rows: Row[] }).rows
  return rows.flatMap((row) =>
    row.slug && row.title
      ? [
          {
            kind: row.kind,
            id: Number(row.id),
            slug: row.slug,
            title: row.title,
            excerpt: row.excerpt,
            pillar: row.pillar,
            rank: Number(row.rank),
          },
        ]
      : [],
  )
}
