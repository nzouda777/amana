# ADR 014 — SEO : métadonnées, hreflang limité aux locales ouvertes, images de partage

- Statut : accepté (2026-11-03, M2)

## Contexte
Les routes existent en `fr`, `en` et `ar`, mais seules les pages françaises sont relues ; `en` est traduit sans validation client, `ar` contient des `TODO(translation)` et les contenus Payload retombent sur le français. Annoncer ces versions en `hreflang` ou les lister dans le sitemap exposerait du contenu dupliqué ou inachevé (question client 14 du PLAN : ouverture des langues).

## Choix
- **Locales indexées** : liste unique `indexedLocales` (`src/lib/seo/config.ts`), `['fr']` aujourd'hui. Une page d'une locale non listée est rendue avec `noindex, follow`, son propre canonical et **aucun** `hreflang`. Le sitemap ne liste que les locales indexées ; il n'ajoute les alternatives de langue qu'à partir de deux locales ouvertes. Ouvrir `en` = l'ajouter à la liste.
- **Pages françaises** : `hreflang` `fr` + `x-default` (vers `fr`), canonical absolu, `og:locale`.
- **Métadonnées** : un seul constructeur pur, `buildPageMetadata` (`src/lib/seo/metadata.ts`), appelé par `pageMetadata` dans chaque `generateMetadata` du site. Titre : titre SEO du CMS tel quel, sinon « Titre · Amana Conseil » s'il tient en 60 caractères, sinon titre seul coupé à 60 ; description coupée à 155 sur une limite de mot.
- **Images Open Graph** : `next/og`, fond vert profond, Trame en or, titre en Baskervville (TTF statique embarqué : Satori ne lit ni WOFF2 ni police variable). Fichiers `opengraph-image.tsx` pour les fiches de service et les articles ; image par défaut (accueil) dans `src/app/[locale]/opengraph-image.tsx`, hors du groupe `(site)` car Next suffixe d’un hachage les routes de métadonnées situées dans un groupe : son URL stable `/<locale>/opengraph-image` est déclarée explicitement par les autres pages (sans quoi l’`openGraph` de la page masquerait l’image du segment parent) et par le JSON-LD `Article`/`Event`.
- **Données structurées** (`src/lib/seo/jsonld.ts`, vérifiées par `validate.ts`) : `Organization` + `ProfessionalService` + `WebSite` dans le gabarit, `BreadcrumbList` partout où un fil d'Ariane est affiché, `Article`, `Event` (webinaires à venir seulement), `FAQPage` (une seule par page : la première FAQ des pages composées). Les valeurs provisoires du seed (`TODO(client)`, domaine `.example`, numéro factice) ne sont jamais émises. `Course` arrive en M3.
- **robots.txt** : `/admin`, `/api`, recherche, confirmation de newsletter, guide de style, panier, commande, espace et organisation exclus dans chaque locale.

## Conséquences
- Les URL `en`/`ar` restent partageables mais invisibles des moteurs jusqu'à décision du client.
- Les images Open Graph des locales non françaises reprennent les libellés français tant que l'arabe n'est pas traduit.
