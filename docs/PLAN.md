# PLAN.md — Plan de réalisation Amana Conseil

Statut : **validé le 2026-11-02** avec les décisions suivantes du client :
- **Base de données : Neon (Postgres serverless) en développement comme en production.** Plus de Postgres local dans Docker ; une branche Neon par environnement (dev, preview, prod). Voir ADR 005.
- **Paiement : un service `payments` agnostique** (`PaymentService` + registre de `PaymentProvider`). L'agrégateur sera choisi plus tard par le client ; en attendant : `ManualTransferProvider` + `SandboxProvider` (simulateur local pour dev/tests). ADR 006 rédigé au moment du choix.
- **Ordre de réalisation : le site vitrine d'abord.** M0 (socle minimal) et M1 (design system) sont des prérequis techniques, enchaînés directement vers M2.
Légende : `[P]` = parallélisable avec les autres `[P]` du même lot (aucun fichier commun) · `←` = dépend de · durée estimée entre crochets.

## 1. Le projet en 10 lignes
1. Un produit Next.js unique : site institutionnel d'Amana Conseil (finance et assurance islamiques, Douala) + plateforme de formation en ligne.
2. Une seule base Postgres, une seule authentification, un seul panier, un seul back-office Payload CMS 3 (`/admin`).
3. Vitrine : accueil, À propos (comité charia), quatre pôles (Formation, Audit, Conseil, Takaful) sur un gabarit de service commun, cas clients, ressources (blog, guides, glossaire, webinaires).
4. Machine à contacts : devis multi-étapes, rendez-vous Cal.com, newsletter double opt-in, tout centralisé dans `leads` avec export CSV.
5. LMS particuliers : catalogue filtrable, fiche cours, lecteur vidéo HLS (Bunny) avec reprise, quiz corrigés côté serveur, certificats PDF vérifiables par QR.
6. Capsules entreprises : organisations, licences à sièges, invitations CSV, assignations, relances, tableau de bord et exports.
7. Commerce en XAF entiers : produits polymorphes, coupons, Mobile Money MTN/Orange + carte via une passerelle unique, virement manuel, factures B2B à échéance, pass à durée fixe (pas de récurrent).
8. Accès unifié : `enrollments` est la seule source de vérité, accordée uniquement par webhook vérifié, licence, pass ou admin.
9. Identité forte et sobre : vert/or/sable, Baskerville + Open Sans, un seul motif mémorable (la Trame), FR d'abord, EN et AR (RTL) prêts dans la structure.
10. Exigences senior : mobile 4G lent (LCP < 2 s, JS < 120 Ko vitrine), WCAG 2.2 AA, CSP à nonces, 2FA admin, sauvegardes chiffrées, Docker sur VPS Paris derrière Cloudflare.

## 2. Versions vérifiées (npm, 2026-11-02) — à revérifier au moment d'installer
| Paquet | Version stable | Remarque |
|---|---|---|
| next | 16.4.4 | `@payloadcms/next` accepte `>=16.3.3 <17` → compatible |
| payload / @payloadcms/db-postgres / @payloadcms/next | 3.92.1 | versions alignées obligatoires |
| next-intl | 4.14.9 | |
| tailwindcss | 4.3.3 | `@theme` |
| Node / pnpm (poste) | 26.5.0 / 12.15.0 | image Docker : Node LTS (à fixer en M0, ADR 005) |

## 3. Découpage par jalon

### M0 — Socle (branche `m0-socle`) — ~2 jours
| # | Tâche | Agent | Dépend | Durée |
|---|---|---|---|---|
| M0.1 | `git init`, Next 16 + TS strict (`noUncheckedIndexedAccess`), pnpm, ESLint/Prettier, alias `@/` | architect | — | 1 h |
| M0.2 | Payload 3 dans l'app, adaptateur Postgres, `docker-compose.yml` dev (Postgres 17), `.env.example`, `src/env.ts` zod | architect | M0.1 | 2 h |
| M0.3 | next-intl : `fr`/`en`/`ar`, `pathnames` traduits, `dir` RTL, fallback `fr`, `messages/*.json` minimaux | architect | M0.1 | 2 h |
| M0.4 | Arborescence complète (groupes de routes, `features/`, `payload/`, `tests/`) | architect | M0.1 | 1 h |
| M0.5 | Collections contenu institutionnel + globals (SPEC §3) | architect | M0.2 | 3 h |
| M0.6 | Collections Formation (courses → certificates, reviews) | architect | M0.5 | 3 h |
| M0.7 | Collections Commerce + B2B + leads/newsletter/consents + users/rôles | architect | M0.6 | 3 h |
| M0.8 | `payload/access/*` réutilisables + tests unitaires par règle | architect | M0.7 | 2 h |
| M0.9 | `contracts.ts` : PaymentProvider, VideoProvider, EmailSender, CertificateRenderer, AccessService | architect | M0.4 | 1 h |
| M0.10 | Migrations Postgres initiales + types générés, rejouables sur base vide | architect | M0.8 | 1 h |
| M0.11 | ADR 001–005 | architect | M0.2 | 1 h |
| M0.12 `[P]` | Tokens de base `src/styles/tokens.css` + polices `next/font` par locale | design-system | M0.3 | 2 h |
| M0.13 `[P]` | Vitest, Playwright (squelettes), CI GitHub Actions (lint, typecheck, test, build) | security-devops | M0.1 | 2 h |
| M0.14 | `middleware.ts` (locale + routes protégées, sans CSP encore) | security-devops | M0.3 | 1 h |

*Parallélisme* : après M0.4, M0.12 et M0.13 tournent en parallèle de M0.5–M0.10 (fichiers disjoints). M0.14 attend M0.3 et ne touche que `src/middleware.ts`.
*Terminé quand* : `pnpm dev` + `/admin` OK, toutes les collections visibles, migrations rejouables, `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verts.

### M1 — Design system (branche `m1-design-system`) — ~3 jours
| # | Tâche | Agent | Dépend | Durée |
|---|---|---|---|---|
| M1.1 | Tokens complets, `pairs.ts`, `tests/a11y/contrast.test.ts` | design-system | M0 | 2 h |
| M1.2 | `Logo` (3 variantes, placeholder `TODO(client)`), `Trame` SVG paramétrable + tracé animé RTL | design-system | M1.1 | 3 h |
| M1.3 | Primitives formulaire : Button, Link, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Field, Stepper | design-system | M1.1 | 3 h |
| M1.4 | Primitives Radix : Dialog, Sheet, Popover, Tooltip, Tabs, Accordion, Toast | design-system | M1.3 | 3 h |
| M1.5 | Affichage : Badge, Tag, Avatar, Breadcrumb, Pagination, Skeleton, EmptyState, ProgressBar, Table, Price, Prose | design-system | M1.3 | 3 h |
| M1.6 | Patterns : SiteHeader (méga-menu, tiroir), SiteFooter, WhatsAppButton | design-system | M1.4 | 3 h |
| M1.7 | Patterns : PillarIndex, CourseCard, CapsuleRow, StickyPurchase, CTASection, Testimonial, FAQ, StatsSentence, ServiceTemplate | design-system | M1.5 | 3 h |
| M1.8 | `/styleguide` (fr + ar côte à côte, tous états), captures 390/1440, `docs/qa/design-journal.md` | design-system | M1.7 | 3 h |
| M1.9 | Revue M1 → `docs/qa/M1-report.md` | qa-reviewer | M1.8 | 2 h |

*Séquentiel* : un seul agent propriétaire de `src/components/ui` → pas de parallélisme interne. En parallèle `[P]` : security-devops peut préparer le Dockerfile de production et l'en-tête CSP (M6.2 anticipé) sans toucher aux composants.

### M2 — Site vitrine (branche `m2-site`) — ~5 jours
| # | Tâche | Agent | Dépend | Durée |
|---|---|---|---|---|
| M2.1 | Layout `(site)` : header/footer branchés sur globals, avertissement légal, 404/500 | marketing-site | M1 | 2 h |
| M2.2 `[P]` | Seed contenu institutionnel : services (tous pôles), équipe + comité (fictifs signalés), témoignages, cas clients, partenaires | content-seo-i18n | M0 | 3 h |
| M2.3 `[P]` | Seed ressources : 6 articles, 2 guides, 40 termes, 2 webinaires | content-seo-i18n | M0 | 3 h |
| M2.4 `[P]` | `typographyFr()` + tests ; liaison glossaire première occurrence + tests | content-seo-i18n | M0 | 2 h |
| M2.5 | Accueil (blocs Payload) + À propos | marketing-site | M2.1, M2.2 | 3 h |
| M2.6 | Hubs et pages de services (Audit, Conseil, Takaful) via `ServiceTemplate` + revalidation | marketing-site | M2.5 | 3 h |
| M2.7 | Cas clients, Ressources (hub, articles avec sommaire/partage, guides contre e-mail, glossaire, webinaires) | marketing-site | M2.3, M2.4 | 3 h |
| M2.8 | `features/leads` : Server Actions zod, Turnstile, rate-limit, e-mails React Email/Resend (équipe + accusé) | marketing-site | M0.9 | 3 h |
| M2.9 | Contact, Devis multi-étapes, Rendez-vous (Cal.com à la demande + webhook → leads), newsletter double opt-in Brevo | marketing-site | M2.8 | 3 h |
| M2.10 | Recherche globale Postgres FTS `french` + `unaccent` | marketing-site | M2.7 | 2 h |
| M2.11 `[P]` | Pages légales (modèles + mention « à valider par un juriste »), messages `fr` complets, `en`, `ar` clés | content-seo-i18n | M2.1 | 3 h |
| M2.12 | SEO : `generateMetadata`, sitemap, robots, hreflang, JSON-LD + tests, OG `next/og`, manifest | content-seo-i18n | M2.7 | 3 h |
| M2.13 | Relecture visuelle 390/1440 | design-system | M2.10 | 2 h |
| M2.14 | Revue + e2e formulaires → `docs/qa/M2-report.md` | qa-reviewer | M2.13 | 3 h |

*Parallélisme* : M2.2, M2.3, M2.4 (content-seo-i18n, `src/seed/`, `src/lib/typography`) en parallèle de M2.1 et M2.8 (marketing-site). M2.11 en parallèle de M2.5–M2.7 (seul `messages/` et `legal`).

### M3 — LMS (branche `m3-lms`) — ~5 jours
| # | Tâche | Agent | Dépend | Durée |
|---|---|---|---|---|
| M3.1 | `features/lms` : AccessService (enrollments), complétion, éligibilité certificat, score quiz — tests exhaustifs | lms | M0 | 3 h |
| M3.2 `[P]` | Seed formation : 6 cours, 12 capsules, 2 parcours, 3 packs, quiz | content-seo-i18n | M0 | 3 h |
| M3.3 | `VideoProvider` Bunny (URLs signées courtes) + implémentation factice pour dev/tests | lms | M3.1 | 2 h |
| M3.4 | Catalogue filtrable serveur (URL), hub Formation, parcours | lms | M3.2 | 3 h |
| M3.5 | Fiche cours (extraits jouables, panneau collant, JSON-LD Course) | lms | M3.4 | 3 h |
| M3.6 | Lecteur : hls.js à la demande, reprise, sauvegarde groupée hors-ligne, économie de données, clavier | lms | M3.3 | 3 h |
| M3.7 | Leçons texte/PDF/étude de cas, sommaire, progression signature | lms | M3.6 | 2 h |
| M3.8 | Quiz (correction serveur, tentatives, feedback) | lms | M3.1 | 3 h |
| M3.9 | Certificats `@react-pdf/renderer` + QR + vérification publique | lms | M3.8 | 3 h |
| M3.10 | Espace apprenant `/espace`, avis + modération, export/suppression de données | lms | M3.9 | 3 h |
| M3.11 | Auth front (`/connexion`, `/inscription`, `/mot-de-passe`) sur Payload auth | lms | M3.1 | 2 h |
| M3.12 | Relecture visuelle + revue + e2e (Slow 4G, RTL) | design-system, qa-reviewer | M3.10 | 4 h |

### M4 — Commerce (branche `m4-commerce`) — ~5 jours
| # | Tâche | Agent | Dépend | Durée |
|---|---|---|---|---|
| M4.1 | Recherche passerelles (NotchPay, CinetPay, alternatives) → ADR 006 + questions client | commerce | — (peut commencer dès M2) | 2 h |
| M4.2 | Machine à états commandes + tests ; calcul montants/coupons/TVA en entiers | commerce | M0 | 3 h |
| M4.3 | Panier invité/connecté, fusion, mini-panier, « déjà possédé » | commerce | M4.2 | 3 h |
| M4.4 | Tunnel une page, écran d'attente push USSD, cas d'échec | commerce | M4.3 | 3 h |
| M4.5 | `PaymentProvider` choisi + `ManualTransferProvider` ; webhook signé, idempotent → `AccessService.grant()` | commerce | M4.1, M4.4 | 3 h |
| M4.6 | Factures (numérotation continue, PDF), remboursements + avoir, export comptable | commerce | M4.5 | 3 h |
| M4.7 | Pass d'accès : durée fixe, renouvellement, rappels J-7/J-1/J+1 (jobs Payload) | commerce | M4.5 | 2 h |
| M4.8 | E-mails transactionnels + analytics `checkout_started`/`purchase_completed` | commerce | M4.5 | 2 h |
| M4.9 | Relecture + revue + e2e sandbox | design-system, qa-reviewer | M4.8 | 4 h |

### M5 — Espace entreprise (branche `m5-b2b`) — ~5 jours
| # | Tâche | Agent | Dépend | Durée |
|---|---|---|---|---|
| M5.1 | `features/b2b` : isolation par organisation + tests anti-fuite | b2b | M4 | 3 h |
| M5.2 | Invitations (jeton ≥ 128 bits, 7 j), import CSV avec rapport ligne par ligne, équipes, désactivation | b2b | M5.1 | 3 h |
| M5.3 | Licences (sièges, blocage, extension), assignations avec échéance | b2b | M5.2 | 3 h |
| M5.4 | Tableau de bord `/organisation`, filtres, fiche individuelle, export CSV/XLSX, perf 2 000 membres | b2b | M5.3 | 3 h |
| M5.5 | Relances configurables + plafond, rappels mensuels par métier | b2b | M5.3 | 2 h |
| M5.6 | Devis B2B → bon de commande → facture à échéance → activation | b2b | M5.3 | 3 h |
| M5.7 | Page commerciale `/formation/entreprises` + bibliothèque capsules | b2b | M5.1 | 2 h |
| M5.8 | ADR marque blanche + SCORM (sans implémentation) | b2b | — | 1 h |
| M5.9 | Relecture + revue + e2e scénario licence 50 sièges | design-system, qa-reviewer | M5.6 | 4 h |

### M6 — Durcissement (branche `m6-hardening`) — ~4 jours
| # | Tâche | Agent | Dépend | Durée |
|---|---|---|---|---|
| M6.1 | CSP à nonces, HSTS, en-têtes, rate-limit partagé, verrouillage progressif, 2FA TOTP admin, journal d'audit, uploads | security-devops | M5 | 3 h |
| M6.2 `[P]` | Dockerfile prod standalone non-root, `docker-compose.prod.yml`, migrations au démarrage | security-devops | M0 | 2 h |
| M6.3 `[P]` | Sauvegardes chiffrées + restauration démontrée, monitoring (GlitchTip), sonde | security-devops | M6.2 | 3 h |
| M6.4 | CI complète : e2e Postgres éphémère, axe, Lighthouse CI budgets, audit deps | security-devops | M6.1 | 2 h |
| M6.5 `[P]` | Audit a11y/perf/visuel complet 320→1920 px, fr + ar | qa-reviewer | M5 | 4 h |
| M6.6 | Contenus de démonstration finaux, `HOSTING.md`, `RUNBOOK.md`, `HANDOVER.md` | security-devops, content-seo-i18n | M6.3 | 3 h |
| M6.7 | Revue finale → `docs/qa/M6-report.md` | qa-reviewer | tout | 3 h |

## 4. Règles d'orchestration
- Un seul agent écrit dans un répertoire donné à un instant donné (tableau des propriétaires de `CLAUDE.md`).
- Fichiers partagés (`messages/*.json`, `src/payload/payload.config.ts`, `package.json`) : modifiés uniquement par l'orchestrateur ou séquentiellement, jamais par deux agents en parallèle.
- Chaque jalon se termine par : tests verts, `pnpm build` sans avertissement, captures 390/1440 relues, rapport `qa-reviewer` accepté, commit Conventional Commits, mise à jour de ce fichier, **puis attente de votre feu vert**.

## 5. Risques
| Risque | Impact | Parade |
|---|---|---|
| Passerelle de paiement : KYC marchand, délais d'ouverture de compte, sandbox incomplète | Bloque la mise en ligne de M4 | Lancer la démarche côté client dès maintenant ; développer contre la sandbox + `ManualTransferProvider` utilisable seul |
| Payload 3 + Next 16 évoluent vite (versions mineures fréquentes) | Casse au build | Versions figées dans le lockfile, montée de version encadrée par la CI |
| Bunny Stream : coût et compte non ouverts | Vidéo indisponible en démo | `VideoProvider` factice (MP4/HLS local) pour dev et tests |
| Docker sur Windows (poste de dev) : performances du montage de volume | Lenteur `pnpm dev` | App lancée en natif, seul Postgres en conteneur en dev |
| Budget JS 120 Ko avec Radix + next-intl | Échec Lighthouse | Composants interactifs en îlots `"use client"` minimaux, mesure dès M1 |
| Contenus démo pris pour des contenus réels | Risque d'image | Marquage `TODO(client)` visible, bandeau « démonstration » hors production |
| Cadre légal camerounais (données personnelles, mentions, facturation) | Non-conformité | Modèles marqués « à valider par un juriste » |

## 6. Questions ouvertes pour le client
**Paiement**
1. Passerelle : avez-vous déjà un compte marchand (NotchPay, CinetPay, autre) ? Qui porte le KYC (RCCM, NIU, compte bancaire) ?
2. Coordonnées bancaires pour les instructions de virement ?
3. TVA applicable aux formations (taux, exonération) ? Mentions obligatoires sur les factures ?
4. Délai de paiement B2B (30 jours prévu) et traitement des retards validé par votre comité de conformité ?

**Contenus**
5. Logo vectoriel (SVG), photos de l'équipe et des locaux.
6. Liste définitive des formations, capsules, packs, prix et formateurs.
7. Composition réelle du comité de conformité charia (noms, qualifications, accord de publication).
8. Coordonnées : adresse exacte, téléphone, WhatsApp, e-mails par type de demande, réseaux sociaux.
9. Références et logos clients autorisés à l'affichage ; témoignages réels.
10. Signataire du certificat (responsable pédagogique) et sa signature numérisée.

**Juridique et exploitation**
11. RCCM / NIU, raison sociale exacte pour les mentions légales.
12. Validation juridique des CGV/CGU/confidentialité selon la loi camerounaise en vigueur.
13. Comptes tiers à créer au nom du cabinet : domaine, Cloudflare, VPS, Bunny, Resend, Brevo, Cal.com, Turnstile, analytics.
14. Une version anglaise au lancement, ou `fr` seul ?

## 7. Avancement
| Jalon | Statut |
|---|---|
| M0 Socle | fait (2026-11-02) — 46 collections, migration initiale sur Neon, 125 tests verts |
| M1 Design system | fait — tokens, composants, Trame, /styleguide, captures fr/ar (rapport qa M1 non rédigé) |
| M2 Site vitrine | accepté avec réserves (2026-11-07, `docs/qa/M2-report.md`) — 442 tests unitaires, e2e verts ; avant fusion sur `main` : captures à refaire après purge du cache (R-1) ; mineurs MIN-1, 2, 5, 6, 14, 15, 21, 22 à traiter avant ouverture publique |
| M3 LMS | à faire |
| M4 Commerce | à faire |
| M5 Espace entreprise | à faire |
| M6 Durcissement | à faire |
