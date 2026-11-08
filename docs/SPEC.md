# SPEC.md — Spécification fonctionnelle Amana Conseil

Synthèse du brief client (10/10/2026) et des décisions d'architecture. En cas de doute, ce document fait foi ; s'il ne répond pas, voir la section « Décisions » de `CLAUDE.md`.

## 1. Contexte
- **Entreprise** : Amana Conseil — « Conseil en finance islamique, takaful ». Signature : Éthique, Conformité, Innovation.
- **Marché** : Cameroun (Douala) puis zone CEMAC et Afrique francophone. Devise XAF. Majorité de visiteurs sur mobile Android, connexions parfois lentes et coûteuses.
- **Rôles du site** : vitrine institutionnelle (crédibilité), plateforme de formation (revenus), machine à contacts (devis, rendez-vous, partenariats).
- **Objectifs par priorité** : 1) crédibiliser, 2) vendre des formations et capsules, 3) générer des demandes qualifiées, 4) fidéliser une audience (SEO, newsletter).
- **Cibles** : particuliers (étudiants, professionnels, épargnants), entreprises (banques, assurances, PME, ONG), porteurs de projets, institutions (régulateurs, partenaires, médias).

## 2. Arborescence et routes (`/[locale]/…`, `fr` par défaut)
| Route | Contenu |
|---|---|
| `/` | Accueil (voir DESIGN §9) |
| `/a-propos` | Histoire, vision, valeurs, équipe, comité de conformité charia, partenaires |
| `/formation` | Hub du pôle : les deux offres, cours à la une, certificats |
| `/formation/cours` | Catalogue filtrable (thème, niveau, durée, prix, langue), recherche |
| `/formation/cours/[slug]` | Fiche cours |
| `/formation/parcours/[slug]` | Parcours (bundle de cours, prix groupé) |
| `/formation/entreprises` | Offre capsules : bibliothèque, packs, licences, demande de démo |
| `/formation/entreprises/capsules` | Bibliothèque de capsules (aperçus) |
| `/formation/presentiel` | Sessions en présentiel / en direct (calendrier, inscription) |
| `/formation/abonnement` | Pass d'accès |
| `/certificats/verifier` + `/certificats/[code]` | Vérification publique d'un certificat |
| `/audit-conformite` + `/audit-conformite/[slug]` | Hub + une page par type d'audit |
| `/conseil-accompagnement` + `/[slug]` | Hub + une page par offre (structuration, fenêtre islamique, politiques et procédures, création d'activité, comité de conformité, suivi) |
| `/takaful-finance` + `/[slug]` | Produits et solutions, FAQ, demande de contact |
| `/cas-clients/[slug]` | Études de cas |
| `/ressources` | Hub : articles, guides, glossaire, webinaires |
| `/ressources/articles` + `/[slug]` | Blog (catégories, auteurs, partage) |
| `/ressources/guides/[slug]` | Guide téléchargeable (accès contre e-mail, consentement explicite) |
| `/ressources/glossaire` + `/[terme]` | Glossaire (terme arabe translittéré, définition, termes liés) |
| `/ressources/webinaires` | À venir + replays |
| `/contact` | Formulaire, rendez-vous, coordonnées, carte, WhatsApp |
| `/devis` | Formulaire multi-étapes (audit, conseil, formation entreprise, partenariat) |
| `/rendez-vous` | Embed Cal.com |
| `/recherche` | Recherche globale (pages, cours, articles, glossaire) |
| `/panier`, `/commande`, `/commande/[id]/confirmation` | Tunnel d'achat |
| `/connexion`, `/inscription`, `/mot-de-passe` | Authentification |
| `/espace` | Espace apprenant : mes cours, progression, certificats, achats, factures, profil |
| `/espace/cours/[slug]/[lecon]` | Lecteur de leçon |
| `/organisation` | Espace entreprise (admin d'organisation) |
| `/legal/[slug]` | Mentions légales, CGV, CGU, confidentialité, cookies, remboursement, avertissement |
| `/admin` | Back-office Payload |
| `/styleguide` | Design system (non indexé, protégé en production) |

Slugs traduits par locale via next-intl (`pathnames`).

## 3. Modèle de données (collections Payload)

### Contenu institutionnel
`pages` (blocs modulaires), `services` (pôle, problème, offre, méthode[], livrables[], faq[], cta), `case-studies`, `team-members` (rôle, comité de conformité oui/non), `partners`, `testimonials`, `posts`, `categories`, `authors`, `guides` (fichier + champs de capture), `glossary-terms`, `events` (webinaire / présentiel, date, lieu ou lien, places), `faqs`, `media`.
Globals : `site-settings` (coordonnées, WhatsApp, réseaux, chiffres clés), `navigation`, `footer`, `legal-disclaimer`.

### Formation
- `courses` : titre, slug, thème, niveau, durée calculée, langue, formateurs, objectifs[], prérequis, visuel, extrait vidéo, statut, `audience: individual | business | both`, `format: course | capsule`, métier[] (pour capsules : conformité, front office, back office, direction).
- `modules` (ordonnés) → `lessons` : type `video | text | pdf | quiz | case-study`, `isPreview`, durée, ressources[], transcription.
- `quizzes` / `questions` : choix unique, multiple, vrai/faux ; feedback par réponse ; seuil de réussite ; nombre de tentatives.
- `paths` (parcours) : cours ordonnés.
- `enrollments` : utilisateur, cours, source (`purchase | pass | license | gift | admin`), dates d'accès, statut.
- `lesson-progress` : position vidéo (secondes), terminé, horodatage.
- `quiz-attempts` : réponses, score, réussite.
- `certificates` : code public unique (non devinable), cours ou parcours, date, PDF généré, révocable.
- `reviews` : note + avis, réservés aux inscrits ayant ≥ 50 % de progression, modération.

### Commerce
- `products` : polymorphe (cours, parcours, pack de capsules, licence entreprise, pass d'accès, place en présentiel), prix en entier XAF, prix barré optionnel, TVA.
- `coupons` : pourcentage ou montant, dates, plafond d'utilisation, produits ciblés.
- `carts` (invités + connectés, fusion à la connexion), `orders`, `order-items`, `payments` (fournisseur, référence externe, statut, payload brut chiffré), `invoices` (numérotation séquentielle continue, PDF), `refunds`.
- Statuts de commande : `pending → paid → fulfilled` ; `failed`, `cancelled`, `refunded`. L'accès est accordé **uniquement** par le webhook de paiement vérifié (idempotent), jamais par la page de retour.

### Entreprise (B2B)
`organizations` (raison sociale, NIU, adresse de facturation, logo optionnel), `org-members` (rôle `owner | admin | learner`, équipe, métier), `licenses` (produit, nombre de sièges, dates), `invitations` (jeton à usage unique, expiration), `assignments` (capsules assignées à un membre / une équipe, échéance), `reminders` (règles de relance), `quotes` (devis B2B → bon de commande → facture → paiement différé).

### Contacts et marketing
`leads` (type : audit, conseil, accompagnement, formation entreprise, takaful, partenariat, contact ; champs qualifiants ; statut `new | contacted | qualified | won | lost` ; responsable ; notes) — c'est le « tableau de suivi » du brief, avec export CSV depuis l'admin. `newsletter-subscribers` (centres d'intérêt, double opt-in, synchronisé avec Brevo). `consents` (journal des consentements).

### Utilisateurs et rôles
- Collection `users` (auth Payload) avec rôles : `super-admin`, `editor` (contenus), `instructor` (ses cours), `sales` (leads, commandes, devis), `learner`.
- Les droits d'organisation sont portés par `org-members`, pas par le rôle global.
- Contrôle d'accès Payload défini par collection **et** par champ ; tests unitaires sur chaque règle.

## 4. Fonctionnalités détaillées

### 4.1 Formation particuliers
- Catalogue filtrable côté serveur (URL partageable), tri, pagination, recherche plein texte Postgres.
- Fiche cours avec leçons d'extrait jouables sans compte.
- Lecteur : reprise exacte de la position, marquage automatique à 90 % de la vidéo, leçon texte marquée à la fin du défilement ou manuellement, quiz bloquant optionnel avant le module suivant.
- Certificat PDF automatique quand toutes les leçons sont terminées et les quiz requis réussis : nom, cours, date, durée, code, QR vers `/certificats/[code]`, signature du responsable pédagogique, Trame en filigrane.
- Vidéo : HLS adaptatif, rendu 240p/360p/720p, URLs signées courtes, filigrane dynamique discret (e-mail de l'apprenant), pas de lien de téléchargement direct. Option « économie de données » (qualité basse forcée, transcription en premier).
- Modèles de vente : à l'unité, parcours, pass d'accès à durée fixe (30 / 90 / 365 jours), coupons.
- **Abonnement et Mobile Money** : le prélèvement récurrent automatique n'est pas fiable en Mobile Money. Le « pass » est un accès à durée fixe, renouvelable en un clic, avec rappels J-7, J-1 et J+1. Si la passerelle choisie gère le récurrent par carte, l'ajouter comme option sans changer le modèle.

### 4.2 Capsules entreprises
- Capsules de 3 à 10 minutes = cours `format: capsule` d'une seule leçon + mini-quiz.
- Bibliothèque par thème et par métier, aperçu de 30 secondes.
- Vente : capsule, pack thématique, licence annuelle à N sièges. Achat en ligne ou via devis (bon de commande, facture, paiement différé à 30 jours).
- Admin d'organisation : invitation par e-mail ou import CSV, équipes, assignations avec échéance, relances automatiques, tableau de bord, export CSV/XLSX.
- Rappels périodiques de bonnes pratiques (e-mail mensuel par métier).
- À étudier (ADR, pas d'implémentation en M5) : marque blanche aux couleurs du client, export SCORM 1.2.

### 4.3 Services et contacts
- Pages de services sur le gabarit commun (DESIGN §9), alimentées par la collection `services`.
- Formulaires : validation zod client + serveur, Turnstile, limitation de débit, enregistrement dans `leads`, e-mail à l'équipe (adresse par type de demande) et accusé de réception au demandeur.
- Rendez-vous via Cal.com (types : découverte 30 min, audit, conseil). Webhook → `leads`.
- WhatsApp : lien `wa.me` avec message prérempli selon la page.

### 4.4 Ressources
- Blog avec catégories, temps de lecture, auteur, articles liés, partage (LinkedIn, Facebook, WhatsApp, X), sommaire automatique.
- Guides téléchargeables contre e-mail avec consentement explicite à la newsletter (case non cochée par défaut).
- Glossaire avec liens automatiques vers les termes depuis les articles (première occurrence uniquement).
- Newsletter : double opt-in, centres d'intérêt (formation, audit, takaful, actualité réglementaire).

### 4.5 Recherche et analytics
- Recherche globale (cours, pages, articles, glossaire) en Postgres FTS avec configuration `french` + `unaccent`.
- Événements de conversion : `lead_submitted` (par type), `appointment_booked`, `checkout_started`, `purchase_completed`, `guide_downloaded`, `newsletter_subscribed`, `course_completed`.

## 5. Paiement
- Interface `PaymentProvider { createCheckout, verifyWebhook, getStatus, refund }`.
- Implémentation principale : passerelle disponible au Cameroun couvrant MTN Mobile Money, Orange Money et cartes (NotchPay, CinetPay ou équivalent). **Vérifier disponibilité, frais et conditions marchands à jour avant de coder**, consigner le choix dans un ADR, puis implémenter une seule passerelle proprement.
- Virement bancaire : commande `pending` avec instructions et référence ; validation manuelle dans l'admin.
- B2B : facture avec échéance, rapprochement manuel.
- Factures : numérotation continue, mentions légales camerounaises (`TODO(client)` pour RCCM / NIU), PDF archivé.
- Éthique : aucun frais de paiement fractionné, aucun intérêt de retard présenté comme pénalité financière (à valider par le comité de conformité du client, `TODO(client)`).

## 6. Exigences non fonctionnelles
- **Performance** (mobile, réseau 4G lent simulé) : LCP < 2,0 s, INP < 200 ms, CLS < 0,05 ; JS client < 120 Ko compressé sur les pages vitrine ; Lighthouse ≥ 95 dans les quatre catégories sur accueil, fiche cours, page de service, article.
- **Accessibilité** : WCAG 2.2 AA, navigation clavier complète y compris lecteur vidéo et quiz, `lang` et `dir` corrects.
- **Sécurité** : en-têtes (CSP stricte avec nonces, HSTS, Referrer-Policy, Permissions-Policy), cookies `HttpOnly; Secure; SameSite=Lax`, limitation de débit sur auth et formulaires, verrouillage progressif après échecs, 2FA pour les rôles admin, journal d'audit des actions admin, webhooks signés et idempotents.
- **Données personnelles** : bannière de consentement (uniquement si des traceurs non exemptés sont utilisés), export et suppression de compte en libre-service, durées de conservation documentées. Se conformer à la loi camerounaise sur la protection des données personnelles en vigueur (`TODO(client)` : validation juridique).
- **SEO** : métadonnées par page, `hreflang`, sitemap par locale, `robots.txt`, données structurées (`Organization`, `ProfessionalService`, `Course`, `Article`, `FAQPage`, `BreadcrumbList`, `Event`), URLs propres, images Open Graph générées (`next/og`) aux couleurs de la marque.
- **Exploitation** : sauvegardes quotidiennes Postgres + médias, rétention 30 jours, restauration testée ; monitoring d'erreurs (Sentry ou GlitchTip auto-hébergé) ; disponibilité surveillée.
- **Propriété** : tout (domaine, code, contenus, comptes tiers) au nom du client ; documentation de passation.

## 7. Mots-clés SEO prioritaires
finance islamique, assurance takaful, formation finance islamique, audit charia, conformité charia, banque participative, sukuk, fenêtre islamique — avec variantes locales (Cameroun, Douala, Yaoundé, CEMAC, Afrique centrale).

## 8. Hors périmètre initial (préparer la structure, ne pas construire)
Annuaire d'experts, offres de partenariat avancées, podcast, service de questions-réponses, abonnement de veille réglementaire, chatbot FAQ, application mobile native.
