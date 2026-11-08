import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Recherche plein texte (SPEC §4.5, ADR 012) : extension `unaccent`, fonctions IMMUTABLE
 * (utilisables dans des index) et index GIN d'expression sur les tables de traduction.
 * Aucune colonne ni table de Payload n'est modifiée : le schéma Drizzle reste inchangé.
 * La requête de `src/app/[locale]/(site)/_data/search.ts` reprend exactement ces
 * expressions pour que les index soient utilisés.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE EXTENSION IF NOT EXISTS unaccent;

  CREATE OR REPLACE FUNCTION amana_unaccent(text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
    AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

  CREATE OR REPLACE FUNCTION amana_jsonb_text(jsonb) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT coalesce(string_agg(value #>> '{}', ' '), '')
      FROM jsonb_path_query(coalesce($1, '{}'::jsonb), 'strict $.**.text') AS t(value)
    $$;

  CREATE OR REPLACE FUNCTION amana_search_vector(a text, b text, c text DEFAULT NULL)
    RETURNS tsvector
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT setweight(to_tsvector('french'::regconfig, public.amana_unaccent(coalesce(a, ''))), 'A')
          || setweight(to_tsvector('french'::regconfig, public.amana_unaccent(coalesce(b, ''))), 'B')
          || setweight(to_tsvector('french'::regconfig, public.amana_unaccent(coalesce(c, ''))), 'C')
    $$;

  CREATE INDEX IF NOT EXISTS "services_locales_search_idx" ON "services_locales"
    USING gin (amana_search_vector("title", "summary", "seo_description"));
  CREATE INDEX IF NOT EXISTS "pages_locales_search_idx" ON "pages_locales"
    USING gin (amana_search_vector("title", "seo_description"));
  CREATE INDEX IF NOT EXISTS "posts_locales_search_idx" ON "posts_locales"
    USING gin (amana_search_vector("title", "excerpt", amana_jsonb_text("content")));
  CREATE INDEX IF NOT EXISTS "glossary_terms_locales_search_idx" ON "glossary_terms_locales"
    USING gin (amana_search_vector("term", "short_definition", amana_jsonb_text("definition")));
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "glossary_terms_locales_search_idx";
  DROP INDEX IF EXISTS "posts_locales_search_idx";
  DROP INDEX IF EXISTS "pages_locales_search_idx";
  DROP INDEX IF EXISTS "services_locales_search_idx";
  DROP FUNCTION IF EXISTS amana_search_vector(text, text, text);
  DROP FUNCTION IF EXISTS amana_jsonb_text(jsonb);
  DROP FUNCTION IF EXISTS amana_unaccent(text);
  `)
}
