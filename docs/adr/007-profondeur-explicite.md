# ADR 007 — Profondeur de relation explicite

- Statut : accepté (2026-11-02, M0)

## Contexte
Payload peuple les relations jusqu'à `defaultDepth` (2 par défaut). Sur des listes (catalogue, articles), cela multiplie les requêtes vers Neon et la taille des réponses, souvent sans que le développeur s'en rende compte.

## Choix
`defaultDepth: 0` et `maxDepth: 4` dans `payload.config.ts`. Toute lecture qui a besoin d'une relation peuplée le demande (`depth: 1`, idéalement avec `select` / `populate`). Jamais de `depth` implicite sur les listes. Les relations inverses passent par des champs `join` (modules d'un cours, leçons d'un module, lignes d'une commande).

## Conséquences
- Requêtes prévisibles ; un oubli se voit immédiatement (identifiant au lieu d'objet) au lieu de dégrader les performances.
- Les types générés restent des unions `number | Doc` : utiliser des gardes de type côté rendu.
