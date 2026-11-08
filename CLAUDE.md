# CLAUDE.md — Amana Conseil (site + plateforme de formation)

Ce fichier est la mémoire permanente du projet. Lis-le en entier avant toute action, puis lis `docs/SPEC.md` et `docs/DESIGN.md`.

## Le projet en une phrase
Un seul produit Next.js qui réunit le site institutionnel d'Amana Conseil (cabinet de finance et d'assurance islamiques basé à Douala, Cameroun) et sa plateforme de formation en ligne (cours pour particuliers, capsules pour entreprises), avec un back-office unique, un compte utilisateur unique et un panier unique.

## Principe directeur
Ce n'est pas « un site + un LMS branché dessus ». C'est un produit cohérent : même design system, même authentification, même base de données, même back-office. Un visiteur qui lit une page Audit, télécharge un guide, achète un cours et suit une leçon ne doit jamais sentir qu'il change d'application.

## Stack imposée (ne pas dévier sans ADR)
- **Next.js** (dernière version stable, App Router, React Server Components, Server Actions), **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`).
- **Payload CMS 3** installé *dans* l'app Next.js (`/admin`), adaptateur **PostgreSQL**. Payload sert à la fois de CMS (pages, articles, services), de back-office LMS (cours, leçons, quiz) et de back-office commerce (produits, commandes, coupons).
- **Tailwind CSS v4** avec tokens CSS (`@theme`) générés depuis `docs/DESIGN.md`. Primitives accessibles **Radix UI**, composants maison dans `src/components/ui`. Pas de kit de composants visuellement reconnaissable tel quel.
- **next-intl** : routes `/[locale]/...`, `fr` par défaut au lancement, `en` et `ar` (RTL) prévus dès la structure.
- **Vidéo** : Bunny Stream (HLS adaptatif, URLs signées à durée courte) derrière une interface `VideoProvider` remplaçable.
- **Paiement** : interface `PaymentProvider` ; implémentations NotchPay et/ou CinetPay (Mobile Money MTN & Orange, cartes), virement bancaire manuel, facture B2B avec paiement différé. Devise XAF, montants en **entiers** (le XAF n'a pas de décimales).
- **E-mails** : React Email + Resend (transactionnel) ; Brevo (newsletter segmentée).
- **Rendez-vous** : Cal.com (embed + webhook vers la collection `leads`).
- **PDF** : `@react-pdf/renderer` (certificats, factures) avec QR code de vérification.
- **Anti-spam** : Cloudflare Turnstile sur tous les formulaires publics.
- **Analytics** : Umami ou Plausible (sans cookie) + événements de conversion.
- **Tests** : Vitest (unitaires), Playwright (e2e), axe-core (a11y), Lighthouse CI (perf).
- **Déploiement** : Docker (app + Postgres) sur VPS européen (Paris), Cloudflare devant (CDN, WAF), sauvegardes Postgres quotidiennes chiffrées hors serveur.

Avant d'installer une dépendance, vérifie sa version stable actuelle et sa compatibilité avec la version de Next.js et de Payload utilisée. Ne fige jamais une version de mémoire.

## Organisation en agents
Les sous-agents sont dans `.claude/agents/`. L'agent principal (toi) orchestre : il découpe, délègue, relit et intègre. Il ne laisse jamais deux agents modifier les mêmes fichiers en parallèle.

| Agent | Responsabilité | Possède |
|---|---|---|
| `architect` | Socle, structure, modèle de données, ADR | `src/payload/collections`, `src/lib/*` (contrats), `docs/adr` |
| `design-system` | Tokens, typo, composants, motifs, motion | `src/styles`, `src/components/ui`, `src/components/brand` |
| `marketing-site` | Pages institutionnelles et services | `src/app/[locale]/(site)` |
| `lms` | Catalogue, lecteur, progression, quiz, certificats | `src/app/[locale]/(learn)`, `src/features/lms` |
| `commerce` | Panier, commandes, paiements, factures, coupons, accès | `src/features/commerce`, routes webhooks |
| `b2b` | Organisations, licences, capsules, tableau de bord admin | `src/features/b2b`, `src/app/[locale]/(org)` |
| `content-seo-i18n` | Textes, SEO, données structurées, traductions | `messages/`, `src/lib/seo`, contenus de seed |
| `security-devops` | Sécurité, Docker, CI/CD, sauvegardes, monitoring | `docker/`, `.github/`, `src/middleware.ts` |
| `qa-reviewer` | Tests, accessibilité, performance, revue finale | `tests/`, rapports dans `docs/qa` |

## Jalons (dans cet ordre)
1. **M0 Socle** — repo, Next + Payload + Postgres en Docker, i18n, lint, CI, tokens de base. *(architect, security-devops, design-system)*
2. **M1 Design system** — tokens complets, typographie, composants, motif géométrique, page `/styleguide` interne. *(design-system)*
3. **M2 Site vitrine** — toutes les pages de `docs/SPEC.md` §2, formulaires de devis, rendez-vous, newsletter, pages légales. *(marketing-site, content-seo-i18n)*
4. **M3 LMS** — catalogue, fiche cours, lecteur, progression, quiz, certificats, vérification publique. *(lms)*
5. **M4 Commerce** — panier, coupons, paiement Mobile Money/carte, factures, attribution d'accès, pass d'accès (abonnement). *(commerce)*
6. **M5 Espace entreprise** — organisations, licences, invitations, capsules, tableau de bord, relances, export. *(b2b)*
7. **M6 Durcissement** — sécurité, perf, a11y, SEO, contenus de démonstration, documentation, déploiement. *(qa-reviewer, security-devops)*

Chaque jalon se termine par : tests verts, `pnpm build` sans avertissement, passage de `qa-reviewer`, captures d'écran mobile (390 px) et desktop (1440 px) relues, commit propre.

## Règles d'ingénierie
- `pnpm`. Conventional Commits. Une branche par jalon, commits petits et lisibles.
- Server Components par défaut ; `"use client"` seulement là où il y a de l'interactivité réelle.
- Toute mutation passe par une Server Action ou une route API validée par **zod**, avec contrôle d'autorisation côté serveur. Jamais de confiance dans le client.
- Logique métier dans `src/features/<domaine>/` (services purs, testables), jamais dans les composants.
- Aucun secret dans le code ; `.env.example` tenu à jour ; variables validées au démarrage (`src/env.ts`).
- Aucun texte d'interface en dur : tout passe par `messages/<locale>.json` ou par le CMS.
- Utilise des propriétés logiques CSS (`ms-`, `me-`, `ps-`, `start`, `end`) partout, pour que l'arabe (RTL) fonctionne sans réécriture.
- Images via `next/image`, AVIF/WebP, tailles déclarées. Polices via `next/font` auto-hébergées.
- Pas de `any`, pas de `// @ts-ignore`, pas de code mort, pas de `console.log` en production.
- Quand une décision n'est pas couverte par ces documents : choisis l'option la plus simple qui reste évolutive, écris un ADR court dans `docs/adr/`, continue.

## Garde-fous propres au métier
- Le site informe et forme ; il **ne délivre pas de fatwa** ni de conseil financier personnalisé. L'avertissement figure en pied de page, sur les pages Takaful et Ressources, et dans les CGV.
- Aucun mécanisme contraire à l'éthique de l'activité : pas de paiement fractionné avec frais ou intérêts, pas de jeu-concours ou tirage au sort, pas de faux compte à rebours ni de fausse rareté. Le paiement en plusieurs fois, s'il existe, est sans frais.
- Pas d'image de billets, pièces, lingots ou graphiques boursiers génériques.

## Informations encore manquantes (utiliser des placeholders clairement marqués `TODO(client)`)
Logo vectoriel (SVG), photos réelles de l'équipe et des locaux, textes définitifs, liste et prix des formations, comptes réseaux sociaux, numéro WhatsApp, adresse exacte, RCCM / NIU pour les mentions légales, choix final de la passerelle de paiement.
