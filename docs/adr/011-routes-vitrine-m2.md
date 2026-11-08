# ADR 011 — Routes et choix du site vitrine (M2)

- Statut : accepté (2026-11-03, M2)

## Contexte
Le site vitrine (SPEC §2) a besoin de quelques routes et conventions non prévues : confirmation du double opt-in de la newsletter, téléchargement protégé des guides, webhook Cal.com, contenu des pages légales, URL inconnues.

## Choix

| Route | Rôle | Remarque |
|---|---|---|
| `/[locale]/newsletter/confirmation?token=…` | Confirmation du double opt-in | Ajoutée aux `pathnames` (identique dans toutes les locales). La confirmation demande un **clic sur un bouton** (Server Action) : les antivirus de messagerie qui ouvrent les liens ne confirment rien à la place de l'abonné. Page non indexée. |
| `/api/downloads/guide?token=…` | Fichier privé d'un guide (ADR 008) | Jeton HMAC-SHA256 signé avec `PAYLOAD_SECRET`, sans stockage, valable 7 jours, remis après consentement. `/api/guides` est réservé à l'API REST de Payload (collection `guides`) : d'où `downloads`. |
| `/api/webhooks/calcom` | Réservations Cal.com → `leads` | Signature `x-cal-signature-256` (HMAC-SHA256 hexadécimal du corps brut) ; idempotent par `appointment.bookingId`. 503 tant que `CALCOM_WEBHOOK_SECRET` est absent. |
| `/[locale]/legal/[slug]` | Pages légales | **Pas de nouvelle collection** : chaque document est une entrée de `pages` (blocs « Texte ») dont le slug appartient à une liste fermée (`src/features/site/legal.ts`). Date de mise à jour = `updatedAt` de la page. `avertissement` retombe sur le global `legal-disclaimer` (version complète). Sans contenu : gabarit avec message « en cours de rédaction », non indexé. |
| `/[locale]/(site)/[...rest]` | 404 dans le gabarit du site | Toute URL inconnue sous une locale affiche la 404 utile (recherche + pôles) avec en-tête et pied de page. |

Autres conventions :
- **Slugs localisés** : une fiche non traduite est trouvée par son slug français puis rendue dans la locale demandée (repli Payload). Seule la locale par défaut est pré-rendue (`generateStaticParams`) ; `en` et `ar` sont rendues à la demande tant qu'elles ne sont pas ouvertes.
- **Cache** : lectures Payload via `unstable_cache` étiquetées `collection:<slug>` / `global:<slug>` (`src/lib/cache/tags.ts`), invalidées par les hooks existants. Migration vers `use cache` à décider globalement (Cache Components), hors M2.
- **Messages clients** : seuls les espaces de noms `common`, `header`, `ui`, `forms`, `recovery` sont envoyés au navigateur ; `/styleguide` réenvoie tous les messages pour ses démonstrations.
- **Adaptateurs de développement** : sans `RESEND_API_KEY`, les e-mails rendus sont écrits dans `DEV_EMAIL_DIR` (ignoré par git) ; sans clés Turnstile, clés de test Cloudflare « toujours valide ». En production, `src/env.ts` exige Turnstile et Resend, sauf `ALLOW_DEV_SERVICES=1` (build local, CI).

## Conséquences
- L'agent contenu crée les pages légales dans `pages` avec les slugs listés ; aucune migration.
- Un lien de confirmation ou de téléchargement transféré fonctionne pour son porteur pendant sa durée de validité (comportement voulu, durée courte).
- La limitation de débit est en mémoire (une instance) : à remplacer par une implémentation partagée en M6, derrière l'interface `RateLimiter`.
