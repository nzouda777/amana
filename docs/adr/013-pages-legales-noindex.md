# ADR 013 — Pages légales non indexées jusqu'à validation juridique

- Statut : accepté (2026-11-03, M2)

## Contexte
Les sept pages légales (`/legal/[slug]`, ADR 011) sont semées par `src/seed/legal.ts` : modèles structurés, rédigés pour la démonstration, à faire valider par un juriste (droit camerounais, activité réelle du cabinet). Le gabarit affichait « en cours de rédaction » (et `noindex`) tant qu'aucun contenu n'existait ; une fois le contenu semé, rien n'empêchait plus l'indexation d'un texte juridique non validé.

## Options
1. Indexer dès que le contenu existe : un modèle non validé peut apparaître dans les résultats de recherche et être cité.
2. Liste figée dans le code des pages validées : chaque validation exige un déploiement.
3. Utiliser le champ existant `seo.noIndex` (« Ne pas indexer ») de la collection `pages`.

## Choix
Option 3. Le seed crée chaque page légale avec `seo.noIndex: true` et un encadré en tête « Modèle à valider par un juriste avant publication ». Une fois le texte validé, l'équipe **retire l'encadré et décoche « Ne pas indexer »** dans l'admin : la page devient indexable et entre dans le sitemap, sans déploiement. Aucune migration.

Comportement du gabarit (`src/app/[locale]/(site)/legal/[slug]/page.tsx`) :
- sans contenu : message « en cours de rédaction », `noindex` (inchangé) ;
- avec contenu : le texte s'affiche ; l'indexation suit `seo.noIndex` ;
- le sitemap (`src/lib/seo/sitemap.ts`) exclut tout document `seo.noIndex`.

L'avertissement (`/legal/avertissement`) est désormais aussi une page `pages` (même texte que le global `legal-disclaimer`, plus l'encadré) ; le repli sur le global est conservé si la page est supprimée.

## Conséquences
- Les liens du pied de page restent actifs : les visiteurs lisent les modèles, signalés comme tels.
- Le seed est rejouable : il remet `noIndex` à vrai. Ne plus rejouer le seed légal en production après validation (ou retirer l'appel dans `src/seed/index.ts`).
