# ADR 005 — Hébergement, CDN et base Neon en développement comme en production

- Statut : accepté (2026-11-02, décision client) — remplace le Postgres local en Docker prévu initialement.

## Contexte
L'application Next.js est hébergée sur un VPS européen (Paris), derrière Cloudflare (CDN, WAF). Le poste de développement est sous Windows, où Docker est lent. Le client a choisi **Neon** (Postgres serverless) pour tous les environnements.

## Options
1. Postgres dans Docker (dev) + Postgres sur le VPS (prod) : sauvegardes et mises à jour à notre charge.
2. Neon partout : une branche par environnement, sauvegardes/PITR gérés, branches éphémères pour la CI.

## Choix
Option 2.
- **Branches Neon** : `dev` (développement local), `preview` (recette), `main` (production) ; branches éphémères créées depuis `main` pour la CI ou les tests de migration.
- **Deux chaînes de connexion par branche** :
  - `DATABASE_URL` : point d'accès *pooled* (PgBouncer, mode transaction, hôte `-pooler`), utilisé par l'application. Pool `pg` local limité (`DATABASE_POOL_MAX`, 10 par défaut), `connectionTimeoutMillis` 15 s pour absorber la sortie de veille du calcul (scale-to-zero).
  - `DATABASE_URL_UNPOOLED` : connexion **directe**, utilisée par `pnpm migrate*` (`PAYLOAD_DB_DIRECT=1`, pool de 1). Le DDL et les verrous de session de drizzle-kit ne doivent pas passer par PgBouncer en mode transaction.
  - `sslmode=require` obligatoire (vérifié par `src/env.ts`).
- **Pas de `push`**, en dev comme en prod : le schéma n'évolue que par migrations versionnées (`src/payload/migrations`), rejouables sur une branche vide. `pnpm migrate:create` fonctionne sans connexion (Payload désactive la connexion pour cette commande).
- **Région** : branche Neon en Europe (Francfort `aws-eu-central-1` ou Paris si disponible) au plus près du VPS de Paris.
- **Médias** : stockage local en développement (`media/`, `private-files/`, ignorés par git) ; en production, adaptateur de stockage objet (S3 ou Cloudflare R2) à brancher en M6 — un VPS ne doit pas être la seule copie des fichiers.
- **Image de production** : Docker `standalone`, Node LTS, non-root (security-devops, M6). Pas de Docker en développement.

## Conséquences
- Aucune base locale : le développement nécessite une connexion Internet et la `DATABASE_URL` de la branche `dev`.
- Latence VPS ↔ Neon à surveiller (même région obligatoire) ; requêtes groupées, `depth` explicite (ADR 007).
- Les sauvegardes « quotidiennes chiffrées hors serveur » de CLAUDE.md deviennent : historique/PITR Neon + export `pg_dump` chiffré quotidien vers un stockage tiers (M6), restauration testée.
- Les comptes Neon, Cloudflare et VPS doivent être au nom du client — `TODO(client)`.
