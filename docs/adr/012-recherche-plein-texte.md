# ADR 012 — Recherche plein texte Postgres

- Statut : accepté (2026-11-03, M2)

## Contexte
SPEC §4.5 : recherche globale (pages, services, articles, glossaire ; cours en M3) en Postgres FTS, configuration `french` + `unaccent`. Les contenus localisés de Payload vivent dans des tables `<collection>_locales` ; le texte riche est en `jsonb` (Lexical).

## Options
1. Colonnes `tsvector` générées dans les tables de Payload : modifie le schéma géré par Drizzle (risque de diff à chaque migration).
2. Index GIN **d'expression** sur les tables existantes, fonctions SQL `IMMUTABLE` : aucun changement de colonne.
3. Moteur externe (Meilisearch…) : un service de plus à héberger, disproportionné pour quelques centaines de documents.

## Choix
Option 2, migration `20261103_090000_recherche_plein_texte` :
- `CREATE EXTENSION unaccent` ;
- `amana_unaccent(text)` : enveloppe `IMMUTABLE` de `unaccent` (dictionnaire qualifié `public.unaccent`), utilisable dans un index ;
- `amana_jsonb_text(jsonb)` : texte de tous les nœuds `text` d'un état Lexical ;
- `amana_search_vector(a, b, c)` : `tsvector` pondéré A (titre), B (résumé), C (corps) ;
- un index GIN par table de traduction (services, pages, articles, glossaire).

La requête (`src/app/[locale]/(site)/_data/search.ts`) reprend exactement ces expressions. La saisie est réduite à des mots (`[\p{L}\p{N}]+`, 8 au plus) transformés en préfixes `mot:*` reliés par `&` : aucun opérateur saisi n'atteint `to_tsquery`. Contenus publiés uniquement ; traduction de la locale demandée, à défaut française.

## Conséquences
- Les fonctions sont marquées `IMMUTABLE` alors que `unaccent` dépend d'un dictionnaire : modifier ce dictionnaire impose un `REINDEX` des quatre index.
- Ajouter un type (cours en M3) = une expression d'index de plus (nouvelle migration) + une branche `UNION ALL`.
- Les fonctions sont créées dans `public` et appelées qualifiées dans leur corps, pour qu'une restauration `pg_restore` (chemin de recherche vide) reconstruise les index.
