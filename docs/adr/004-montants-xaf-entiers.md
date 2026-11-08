# ADR 004 — Montants en XAF entiers

- Statut : accepté (2026-11-02, M0)

## Contexte
Le franc CFA (XAF) n'a pas de subdivision utilisée. Les flottants produisent des erreurs d'arrondi sur les totaux, remises et taxes.

## Choix
- Tous les montants sont des **entiers XAF** : type marqué `Xaf` (`src/lib/money.ts`), construit par `toXaf()` qui refuse décimales, NaN et infinis. Champs Payload via `xafField()` (validation entière).
- Les taux (TVA, remises en pourcentage) sont stockés en **points de base** (1 % = 100, 19,25 % = 1925) ; `percentageOfXaf()` arrondit au franc le plus proche (demi-unité vers le haut).
- Prix catalogue **TTC**. Le total est toujours recalculé côté serveur (`computeOrderTotal`) à partir des lignes en base.
- Affichage : `Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' })` → « 12 500 FCFA », chiffres tabulaires côté CSS.

## Conséquences
- Pas de bibliothèque décimale nécessaire.
- Toute nouvelle devise (hors zone CEMAC) demanderait un ADR : le modèle suppose une devise sans décimales.
- Le taux de TVA applicable aux formations reste à confirmer — `TODO(client)`.
