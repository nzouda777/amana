# ADR 001 — Next.js + Payload CMS dans une seule application

- Statut : accepté (2026-11-02, M0)

## Contexte
Amana Conseil veut un site institutionnel, une plateforme de formation (particuliers et entreprises) et une boutique, avec un seul compte utilisateur, un seul panier, un seul back-office et un design homogène. Visiteurs majoritairement mobiles, réseaux lents. Le client doit être propriétaire du code et des contenus.

## Options
1. **WordPress + LearnDash + WooCommerce** : rapide au départ, mais trois logiques d'extensions, thème difficile à rendre performant, dette de sécurité des plugins, modèle de données imposé (licences B2B, pass, Mobile Money mal couverts).
2. **Site Next.js + Moodle séparé** : LMS complet, mais deux comptes, deux designs, SSO à maintenir, hébergement PHP en plus, expérience « on change d'application ».
3. **Next.js (App Router) + Payload CMS 3 installé dans l'app** : un seul code TypeScript, une seule base Postgres, admin `/admin` généré depuis nos collections, Local API sans réseau entre le site et le CMS.

## Choix
Option 3. Versions figées au 2026-11-02 : next 16.4.4, payload et `@payloadcms/*` 3.92.1 (alignées strictement ; `@payloadcms/next` accepte next `>=16.3.3 <17`), next-intl 4.14.9, Tailwind 4.3.3, TypeScript 6.0.3 (typescript-eslint exige `<6.1`), ESLint 9.39.5 (plugins React/import/jsx-a11y pas encore compatibles ESLint 10), graphql 16.14.2 (peer de Payload ; l'API GraphQL est désactivée).

Emplacement de la configuration : `src/payload/payload.config.ts`, déclarée via l'alias `@payload-config` de `tsconfig.json`, que l'outillage Payload (CLI, `findConfig`) sait lire. La carte d'import de l'admin est générée dans `src/app/(payload)/admin/importMap.js` (`pnpm generate:importmap`).

Next 16 remplace `middleware.ts` par **`src/proxy.ts`** (même rôle, runtime Node). La négociation de locale next-intl y vit ; security-devops y ajoutera protection de routes et en-têtes.

## Conséquences
- Un seul déploiement, un seul design system, une seule authentification (Payload `users`).
- Montées de version Payload/Next à encadrer (versions mineures fréquentes) : versions exactes dans `package.json`, lockfile commité, CI obligatoire.
- Les fonctions LMS (lecteur, quiz, certificats) sont à construire : c'est le prix de la maîtrise du modèle (pass, licences, Mobile Money).
- Deux layouts racine coexistent : `src/app/[locale]/layout.tsx` (site, `lang`/`dir`) et `src/app/(payload)/layout.tsx` (admin).
