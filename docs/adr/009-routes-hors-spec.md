# ADR 009 — Routes ajoutées hors SPEC §2

- Statut : accepté (2026-11-02, avant M2)

## Contexte
SPEC §2 prévoit les fiches `/cas-clients/[slug]` et `/ressources/guides/[slug]`, mais pas d'index pour ces deux types. Le seed de navigation pointait « Guides » et « Cas clients » vers `/ressources`, faute de mieux, et la fiche d'un cas client n'avait pas de page parente pour le fil d'Ariane.

## Options
1. Pas d'index : filtres par type sur `/ressources` (`?type=guides`). URL moins lisible, fil d'Ariane bancal, pas de page indexable par type.
2. Deux index dédiés, cohérents avec les fiches déjà prévues.

## Choix
Option 2. Ajout aux `pathnames` (`src/lib/i18n/routing.ts`) :

| Interne (fr, ar) | en |
|---|---|
| `/cas-clients` | `/case-studies` |
| `/ressources/guides` | `/resources/guides` |

## Conséquences
- `marketing-site` crée les deux pages en M2 ; la navigation et le pied de page du seed y pointent.
- Toute autre route hors SPEC §2 suit la même règle : entrée dans `pathnames` + ligne dans cet ADR ou un nouvel ADR.
