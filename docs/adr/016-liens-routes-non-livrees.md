# ADR 016 — Aucun lien vers une route pas encore livrée

- Statut : accepté
- Date : 2026-11-06
- Contexte : revue QA M2, MAJ-1 et MAJ-3 (`docs/qa/M2-report.md`)

## Contexte

La vitrine (M2) peut être mise en ligne avant le LMS (M3), le commerce (M4) et l'espace
entreprise (M5). Toutes les routes de SPEC §2 sont déjà déclarées dans `pathnames`
(`src/lib/i18n/routing.ts`), mais `(learn)`, `(shop)` et `(org)` ne contiennent aucune page :
l'index des pôles, les icônes Compte et Panier et plusieurs liens saisis dans le CMS menaient
à la page 404.

## Décision

1. **Source unique** : `unreleasedRoutes` dans `src/features/site/routes.ts` liste les clés de
   `pathnames` non servies, regroupées par jalon. Pas de drapeau d'environnement : la liste
   est versionnée avec le code qui livre la route.
2. **Code** : l'en-tête reçoit `accountHref` et `cartHref` via `releasedRoute()` ; absents, les
   icônes (et l'entrée Compte du tiroir mobile) ne sont pas rendues. L'index des pôles donne
   à chaque offre Formation une route cible et un repli : catalogue → `/formation`, offre
   entreprises → `/devis?type=formation-entreprise`, présentiel → retiré.
3. **Filet CMS** : `cmsHref()` ne résout que `releasedPathnames(...)`. Un lien vers une route
   non livrée renvoie `null`, comme une route inconnue ou mal encodée : l'entrée de menu, le
   lien de pied de page ou le bouton du héros est retiré ; un lien de texte riche devient du
   texte ; le bandeau CTA retombe sur « Nous contacter » → `/contact` avec son propre libellé.
4. **Back-office** : `validateCmsHref` (`src/payload/fields/href.ts`) refuse sur les champs
   `href` de `navigation`, `footer` et des blocs ce qu'aucune version du site ne saurait
   résoudre (route inconnue, segment mal encodé, schéma non autorisé). Il **accepte** une
   route déclarée mais non livrée : le contenu peut être préparé avant M3/M4 (et le seed ne
   casse pas), il apparaît dès la livraison. Validation applicative seulement, aucune migration.
5. Un test unitaire compare `unreleasedRoutes` aux `page.tsx` présents sous `src/app/[locale]` :
   livrer une page sans retirer sa ligne (ou l'inverse) fait échouer la CI.

## Conséquences

- Réactivation en M3/M4/M5 : retirer les lignes concernées de `unreleasedRoutes` ; l'en-tête,
  l'index des pôles et les liens du CMS réapparaissent sans autre changement.
- Un éditeur qui saisit un lien vers une route à venir ne le voit pas sur le site ; l'aide du
  champ le signale.
- Le test de correspondance impose de tenir la liste à jour à chaque nouvelle page.
