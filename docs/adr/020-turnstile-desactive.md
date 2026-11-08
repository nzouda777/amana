# ADR 020 — Anti-robot Turnstile désactivé par défaut

- Statut : accepté
- Date : 2026-11-08
- Remplace en partie : CLAUDE.md (« Cloudflare Turnstile sur tous les formulaires publics »)

## Contexte

Le client a demandé de retirer la vérification anti-robot. En développement, le widget
Turnstile (script tiers chargé à la première interaction) pouvait ne jamais renvoyer de
jeton et bloquer l'envoi des formulaires, dont la connexion.

## Décision

Un interrupteur unique, `NEXT_PUBLIC_TURNSTILE_ENABLED` (`0` par défaut) :

- `0` : aucun script Cloudflare n'est chargé ; le hook `useTurnstile` renvoie un jeton factice
  et le vérificateur serveur (`src/features/leads/server/deps.ts`) accepte tout. Les clés
  Turnstile ne sont plus exigées en production (`src/env.ts`).
- `1` : comportement d'origine (widget « interaction-only », vérification Siteverify, refus si
  Cloudflare est injoignable, clés obligatoires en production).

Le code Turnstile est conservé : le réactiver ne demande qu'un changement de variable et un
rebuild (la variable est lue par le navigateur).

## Conséquences

- Les formulaires publics (devis, contact, newsletter, guide, connexion, inscription, mot de
  passe) ne sont plus protégés contre les robots que par la limitation de débit par IP et par
  adresse e-mail, et la validation zod.
- Risque accru de spam et de création de comptes en masse, surtout tant que la limitation de
  débit reste en mémoire et que l'IP peut être falsifiée hors Cloudflare (revue M2, MIN-1).
- À réévaluer avant l'ouverture publique : réactiver Turnstile ou ajouter une autre parade
  (champ piège, limitation partagée derrière Cloudflare).
