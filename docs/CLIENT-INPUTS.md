# Éléments attendus du client — `TODO(client)`

Chaque élément manquant est signalé dans le code ou l'admin par `TODO(client)`. Ce fichier en est l'index ; le cocher quand l'élément est reçu et intégré. Questions détaillées : `docs/PLAN.md` §6.

## Identité et contenus
- [ ] Logo vectoriel (SVG) → `public/brand/logo.svg` et `symbol.svg` ; puis régénérer les icônes dérivées du symbole provisoire : `src/app/icon.svg` (copie), `src/app/apple-icon.png` (180 px), `public/brand/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (fond sable `#faf4ea`, symbole centré à 72 %, 56 % pour la version maskable)
- [ ] Photos réelles de l'équipe et des locaux
- [ ] Textes définitifs (accueil, À propos, pages de services)
- [ ] Composition du comité de conformité charia (noms, qualifications, accord de publication) → collection `team-members`
- [ ] Références et logos clients autorisés à l'affichage (`partners.displayAuthorized`) ; témoignages réels (`testimonials.displayAuthorized`)
- [ ] Traductions anglaise et arabe validées (`messages/ar.json` contient des textes provisoires) ; ouverture de `en` au lancement ou non (`localeDetection` désactivée en attendant, `src/lib/i18n/routing.ts`). Ouvrir une langue à l'indexation = l'ajouter à `indexedLocales` (`src/lib/seo/config.ts`, ADR 014) : hreflang et sitemap suivent

## Contenus de démonstration à remplacer avant la mise en ligne (`pnpm seed`)
Tous signalés « (démo) », « fictif » ou `TODO(client)` dans l'admin.
- [ ] Équipe : 4 profils fictifs (`team-members`, noms suffixés « (démo) ») → profils, photos et fonctions réels
- [ ] Comité de conformité charia : 3 membres fictifs (`isComplianceCommittee`) → composition réelle et accord de publication
- [ ] Témoignages : 4 témoignages fictifs, `displayAuthorized` coché pour la démo → **décocher ou remplacer avant lancement**
- [ ] Cas clients : 3 cas fictifs anonymisés (`case-studies`) → missions réelles avec accord du client
- [ ] Partenaires et références : 5 entrées génériques, `displayAuthorized` décoché → références réelles et logos
- [ ] Chiffres clés (réglages du site et bloc « Chiffres clés » de l'accueil) : valeurs de démonstration
- [ ] Textes des 13 pages de service (périmètre, délais, FAQ) ; points marqués `TODO(client)` : zone d'intervention, délais d'ouverture d'une fenêtre, délai de réponse du suivi, absence d'activité d'intermédiation en assurance, indépendance de la rémunération
- [ ] Pages Accueil, À propos (histoire, date de création, fondateurs), Formation
- [ ] Articles (6) : relecture par l'équipe et le comité ; références exactes des textes CEMAC/COBAC sur la finance islamique (article « Ouvrir une fenêtre islamique »)
- [ ] Glossaire (40 termes) : relecture des définitions et des graphies arabes par le comité
- [ ] Guides (2) : PDF définitifs (des PDF provisoires d'une page sont en place dans `documents`)
- [ ] Webinaires (2) : dates réelles, lien de connexion, identifiant vidéo du replay (Bunny Stream)
- [ ] Auteurs des articles (`authors`, liés aux profils fictifs)

## Coordonnées (global « Réglages du site » dans l'admin)
Valeurs provisoires semées : e-mails `@amana-conseil.example` (domaine réservé, non routable), téléphone et WhatsApp `+237600000000`, adresse `TODO(client)`, horaires à confirmer, aucun réseau social.
- [ ] Adresse exacte, ville, lien de carte
- [ ] Téléphone et numéro WhatsApp (format E.164, ex. `+2376…`)
- [ ] E-mail général et e-mails par type de demande (audit, conseil, formation entreprise, takaful, partenariat, contact)
- [ ] Comptes réseaux sociaux

## Mentions légales et facturation
- [ ] Raison sociale exacte, forme juridique, capital
- [ ] RCCM et NIU
- [ ] Taux de TVA applicable aux formations, mentions obligatoires sur les factures (ADR 004)
- [ ] Validation juridique des 7 pages légales semées (`src/seed/legal.ts`) : mentions légales, CGV, CGU, confidentialité, cookies, remboursement, avertissement. Après validation : retirer l'encadré « Modèle à valider… » et décocher « Ne pas indexer » dans l'admin (ADR 013)
- [ ] Référence exacte de la loi camerounaise sur la protection des données personnelles en vigueur et autorité de contrôle compétente (page confidentialité)
- [ ] Adresse e-mail dédiée aux demandes sur les données personnelles ; garanties des transferts hors Cameroun (hébergement UE, prestataires américains)
- [ ] Directeur ou directrice de la publication ; hébergeur (raison sociale, adresse, téléphone)
- [ ] Juridiction compétente (CGV) et délai de réponse aux réclamations
- [ ] Délais de remboursement définitifs (modèle : 14 jours, moins de 20 % suivi ; 30 jours pour les sièges non attribués) et sort des frais de la passerelle de paiement
- [ ] Durées de conservation à confirmer (factures : 10 ans proposés ; certificats ; comptes inactifs : 3 ans proposés)
- [ ] Outil d'analytics sans cookie (Umami ou Plausible) et liste des traceurs de Cal.com et du lecteur vidéo (page cookies)
- [ ] Traitement des retards de paiement B2B validé par le comité de conformité (aucune pénalité financière)

## Formation
- [ ] Liste des formations, capsules, packs, parcours ; prix ; formateurs
- [ ] Signataire des certificats (responsable pédagogique) et signature numérisée (`certificates.signatory`)

## Paiement (ADR 006)
- [ ] Choix de l'agrégateur Mobile Money / carte (NotchPay, CinetPay ou autre) et ouverture du compte marchand (KYC)
- [ ] Coordonnées bancaires pour le virement (`BANK_TRANSFER_*` dans `.env`)

## Comptes tiers, au nom du cabinet
- [ ] Neon (projet + branches `dev`, `preview`, `main`) → `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (ADR 005)
- [ ] Nom de domaine, Cloudflare, VPS (Paris)
- [ ] Bunny Stream, Resend, Brevo, Cal.com, Cloudflare Turnstile, outil d'analytics sans cookie
