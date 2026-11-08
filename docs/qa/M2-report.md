# Revue qa — M2 Site vitrine (branche `m2-site`)

- 1re passe : 2026-11-06 (relecture du code jusqu'à `11d7072`)
- 2e passe : 2026-11-07 (relecture des corrections `11d7072..2320259` : 5664fe7, 07153f7, 9a46525, 2320259 ; ADR 016)
- Relecteur : qa-reviewer
- Périmètre : `src/app/[locale]/(site)`, `src/app/api/{webhooks/calcom,downloads/guide}`, `src/features/{leads,site,content,email}`, `src/lib/seo`, `src/seed`, `messages/`, composants et motifs utilisés par la vitrine, ADR 009 à 016, captures `docs/qa/screenshots/m2`.
- Vérifié par l'orchestrateur après corrections (non refait ici) : `pnpm typecheck`, `pnpm lint`, prettier, `pnpm test` (442 tests, 22 fichiers), `pnpm build` sans avertissement, e2e (voir section « e2e »).
- Non lancé par qa (contrainte mémoire) : serveur, Playwright, axe, Lighthouse.

## Verdict final

**Accepté avec réserves.** Les 3 majeurs sont corrigés (voir « Statut des majeurs ») ; aucun bloquant ; e2e verts. Il reste des mineurs, consignés comme dette ; ceux marqués **avant mise en ligne** doivent être traités avant toute ouverture publique de la vitrine (avant M3 si la vitrine sort seule).

Réserves attachées à l'acceptation :
1. **Captures à refaire** (R-1 ci-dessous) : les captures commitées en 9a46525 montrent encore la phrase de chiffres clés et une colonne « Formation » vide dans le pied de page. Elles ont été prises sur un cache Next antérieur au nouveau seed, pas sur l'état corrigé. À refaire après purge du cache, et à relire avant la fusion sur `main`.
2. Corriger la colonne de pied de page sans lien (MIN-19), visible dès qu'une colonne ne contient que des routes non livrées.

### Verdict provisoire de la 1re passe (historique)

Refusé en attente des e2e : 3 majeurs (liens vers des routes inexistantes, chiffres clés fictifs présentés comme réels, saisie du back-office pouvant faire tomber tout le site).

## Statut des majeurs (2e passe)

| # | Statut | Vérification |
|---|---|---|
| MAJ-1 | **Corrigé** | `src/features/site/routes.ts` (`unreleasedRoutes`, source unique) ; `cmsHref()` ne résout que les routes livrées ; icônes Compte et Panier masquées (`layout.tsx`, `SiteHeader.tsx`, tiroir mobile compris) ; index des pôles avec repli (`/formation`, `/devis?type=formation-entreprise`, présentiel retiré) ; seed : héros, hub Formation, méga-menu, pied de page et article repointés. Test unitaire de correspondance `unreleasedRoutes` ↔ `page.tsx` ; e2e `site-links.spec.ts` (fr, ar) : tous les liens internes de l'accueil, de l'en-tête et du pied de page en 200. ADR 016 cohérent. |
| MAJ-2 | **Corrigé (contenu)** | Bloc `stats` retiré du seed de l'accueil avec `TODO(client)` (`src/seed/pages.ts:75-81`). Réserve : les valeurs de démonstration restent dans `site-settings.keyFigures` ; un éditeur qui ajoute un bloc `stats` les afficherait sans marquage (MIN-21). |
| MAJ-3 | **Corrigé** | `decodeParams` en `try/catch` → `null` (`src/features/site/cms-href.ts:43-52, 72-74`) ; `validateCmsHref` (`src/payload/fields/href.ts`) branché sur `navigation`, `footer` (via `linkFields`) et le champ `cta.href` des blocs ; tests unitaires `match('/audit-conformite/%E0%A4%A')` → `null` sans lever, et refus des liens invalides dans l'admin. |

Points solides constatés : validation zod côté serveur sur toutes les Server Actions, ordre des gardes (validation → débit → Turnstile → écriture), Turnstile en « fail closed », clés de production exigées par `src/env.ts`, signature Cal.com en temps constant sur le corps brut, jeton de guide HMAC sans fuite de chemin (`path.basename`), fichiers privés non servis par Payload (`documents.read = isStaff`), lectures publiques en `overrideAccess: false`, recherche FTS paramétrée (aucun opérateur saisi transmis), JSON-LD échappé, liens CMS en liste blanche de schémas, aucune case précochée, double opt-in avec confirmation par bouton, pas d'énumération d'abonnés, aucun texte d'interface en dur relevé, propriétés CSS logiques respectées (un seul `translate-x` Radix, légitime), pas de `any` / `ts-ignore` / `console.log` hors script de seed.

---

## Bloquants

Aucun.

## Majeurs (constat de la 1re passe, tous corrigés : voir « Statut des majeurs »)

### MAJ-1 — L'accueil et la navigation envoient vers des routes qui n'existent pas encore (404)
- Fichiers :
  - `src/seed/pages.ts:49` (CTA principal du héros « Voir les formations » → `/formation/cours`), `src/seed/pages.ts:188-189` (hub Formation : `/formation/cours`, `/formation/entreprises`)
  - `src/app/[locale]/(site)/_components/blocks/PillarIndexBlock.tsx:32-34` (index des pôles : `/formation/cours`, `/formation/entreprises`, `/formation/presentiel`, en dur)
  - `src/seed/globals.ts:78-103` (méga-menu Formation : 6 entrées), `src/seed/globals.ts:158-161` (pied de page : Cours en ligne, Offre entreprises, Pass d'accès, Vérifier un certificat)
  - `src/app/[locale]/(site)/layout.tsx:99-100` (icônes Compte `/espace` et Panier `/panier` de l'en-tête)
  - `src/seed/posts.ts:62` (article « cinq principes » : « Suivez le cours… » → `/formation/cours`)
- Reproduction : ouvrir `/fr`, cliquer « Voir les formations » (premier bouton du héros) → page 404 du site (`[...rest]` → `notFound()`). Idem pour « Cours en ligne », « Offre entreprises », « Sessions en présentiel » de l'index des pôles, tout le méga-menu Formation, les liens Formation du pied de page, et les icônes Compte et Panier sur toutes les pages. `src/app/[locale]/(learn)` et `(shop)` ne contiennent qu'un `.gitkeep`.
- Pourquoi majeur : le plan acte « vitrine d'abord » ; la vitrine M2 peut être mise en ligne avant M3/M4. Le premier bouton de la page la plus vue et des dizaines de liens de la navigation globale mènent à une erreur, ce qui contredit l'objectif n° 1 du SPEC (crédibiliser).
- Correction attendue (choisir une option, l'écrire dans un ADR court) :
  1. Tant que M3/M4 ne sont pas livrés, faire pointer ces liens vers `/formation` (hub existant) ou `/devis?type=formation-entreprise`, et masquer Compte / Panier dans `SiteHeaderBar` ; **ou**
  2. Un indicateur de disponibilité par route (ex. `availableRoutes` dans `src/lib/i18n/routing.ts`) consulté par `cmsHref()` et `PillarIndexBlock`, qui retire les liens vers des routes non livrées.
  Ajouter un test e2e qui parcourt tous les liens internes de l'accueil, de l'en-tête et du pied de page et exige un statut 200.

### MAJ-2 — Chiffres clés fictifs affichés sans marquage sur l'accueil
- Fichiers : `src/seed/globals.ts:12-17` (valeurs « 250 / 30 / 6 / 4 », libellés suffixés « (démo) »), `src/seed/pages.ts:76-78` (phrase du bloc `stats`), rendu `src/app/[locale]/(site)/_components/blocks/EditorialBlocks.tsx:39-50`.
- Reproduction : `/fr`, section sable sous l'index des pôles : « Depuis sa création, le cabinet a formé plus de 250 professionnels, mené 30 missions d'audit et de conseil, et intervient dans 4 pays de la zone CEMAC. » Seules les valeurs sont injectées dans la phrase ; le suffixe « (démo) » des libellés n'apparaît nulle part (capture `accueil-1440.png`, `accueil-390.png`).
- Pourquoi majeur : affirmation chiffrée inventée, présentée comme un fait, sur un site dont la promesse est « éthique, conformité ». Incohérent avec le reste du seed, où témoignage, équipe et comité sont explicitement marqués « (démo) » ou « fictif ». CLAUDE.md exige des placeholders « clairement marqués ».
- Correction attendue : tant que le client n'a pas fourni les chiffres, ne pas rendre le bloc `stats` (ex. drapeau `placeholder: true` sur les chiffres de démonstration → bloc masqué en production), ou marquer visiblement la phrase (« chiffres de démonstration »). Ajouter un test sur `key-figures` : une valeur marquée de démonstration n'est jamais rendue sans marquage.

### MAJ-3 — Un lien mal encodé saisi dans le back-office fait tomber tout le site (500)
- Fichier : `src/features/site/cms-href.ts:65` (`decodeURIComponent(result[index + 1] ?? '')` sans `try/catch`), appelé par `cmsHref()` (`src/app/[locale]/(site)/_lib/href.ts:16`) depuis `navItemsFrom` / `footerColumnsFrom` (`src/app/[locale]/(site)/_lib/chrome.ts:26,50`) dans le **gabarit** du site.
- Reproduction (vérifiée par un test jetable) : `createCmsPathMatcher(Object.keys(pathnames))('/audit-conformite/%E0%A4%A')` lève `URIError: URI malformed`. Dans l'admin, saisir ce lien (ou tout lien de forme `/[pôle]/…%` mal encodé) dans le global `navigation` ou `footer` : le layout `(site)` lève l'exception, **toutes** les pages du site affichent l'erreur 500. Même effet sur une page si le lien est dans un bloc ou un texte riche.
- Correction attendue : dans `match()`, entourer `decodeURIComponent` d'un `try/catch` et renvoyer `null` (lien ignoré, comme une route inconnue) ; ajouter une `validate` sur les champs `href` des globals `navigation`/`footer` et des blocs (format accepté par `cmsHref`) pour refuser la saisie dès l'admin. Test unitaire attendu : `match('/audit-conformite/%E0%A4%A')` renvoie `null` sans lever.

## Mineurs

| # | Problème | Fichier : ligne | Reproduction | Correction attendue |
|---|---|---|---|---|
| MIN-1 | Adresse IP lue dans des en-têtes falsifiables (`cf-connecting-ip`, puis premier élément de `x-forwarded-for`) : si l'origine est joignable sans passer par Cloudflare, chaque requête peut annoncer une IP différente et contourner la limitation de débit (Turnstile reste en place). | `src/app/[locale]/(site)/_actions/leads.ts:29-33` | `curl` direct sur l'origine avec `cf-connecting-ip: <aléatoire>` : le compteur `quote:<ip>` repart à zéro. | Centraliser l'extraction d'IP dans `src/lib` avec une liste de proxys de confiance (env `TRUSTED_PROXY=cloudflare`), n'accepter `cf-connecting-ip` que derrière Cloudflare ; prendre le **dernier** saut ajouté par le proxy de confiance pour `x-forwarded-for`. À traiter avec le limiteur partagé prévu en M6 (ADR 011). |
| MIN-2 | Pas de limite par adresse e-mail sur la newsletter : une inscription « en attente » renvoie un e-mail de confirmation à chaque demande ; seule la limite par IP (5 / 10 min) protège une boîte tierce d'un envoi répété. | `src/features/leads/newsletter.ts:113-133` | Soumettre 5 fois la même adresse depuis 5 IP : 25 e-mails de confirmation en 10 minutes. | Ne pas renvoyer si le dernier envoi date de moins de N minutes (horodatage `confirmationSentAt`), réponse identique côté client (pas d'énumération). |
| MIN-3 | Le jeton de confirmation n'est jamais renouvelé ni effacé : généré à la création seulement (`publicTokenField`), réutilisé après une désinscription puis une réinscription, et toujours valide après confirmation. | `src/payload/fields/public-token.ts:16-21`, `src/features/leads/newsletter.ts:113-121, 153-170` | S'inscrire, confirmer, se désinscrire, se réinscrire : le lien du tout premier e-mail confirme à nouveau. | Nouveau jeton à chaque `requestSubscription` (hors abonné confirmé) et `confirmToken: null` après confirmation ; adapter `publicTokenField` (option `rotatable`) ou utiliser un champ dédié. |
| MIN-4 | Webhook Cal.com : une replanification arrive avec un **nouvel** `uid` (l'ancien est dans `rescheduleUid`) ; la recherche par `uid` échoue et crée une deuxième demande. | `src/app/api/webhooks/calcom/route.ts:41-47`, `src/features/leads/calcom.ts:32-42` | Rejouer un `BOOKING_RESCHEDULED` dont `uid ≠` uid d'origine : nouveau lead au lieu d'une note. (À confirmer sur un payload réel de l'instance Cal.com.) | Lire `rescheduleUid` (et `fromReschedule`) dans le schéma, chercher le lead par l'ancien uid puis mettre à jour `appointment.bookingId`. Test unitaire avec un payload réel anonymisé. |
| MIN-5 | Webhook Cal.com : e-mail et nom non validés (pas de `z.email()`, pas de longueur max) ; une valeur invalide fait échouer `payload.create` (champ `email`) → 500 → nouvelles tentatives de Cal.com en boucle. Locale du lead toujours `fr`. | `src/features/leads/calcom.ts:24-28, 103-105`, `route.ts:85` | Corps signé avec `attendees[0].email = "x"` → exception non gérée. | Valider avec `emailField`/`requiredText` de `schemas.ts` ; renvoyer 202 `ignored` si invalide ; déduire la locale de `attendees[0].language` si présente. |
| MIN-6 | Avertissement « ni fatwa ni conseil » absent des sous-pages Ressources : glossaire (index et fiches), guides (index et fiche), webinaires. Il n'est que sur le hub, l'index des articles et chaque article. | `src/app/[locale]/(site)/ressources/{glossaire/page.tsx, glossaire/[term]/page.tsx, guides/page.tsx, guides/[slug]/page.tsx, webinaires/page.tsx}` | Ouvrir `/fr/ressources/glossaire/riba` : aucun encadré d'avertissement (seul le pied de page le porte). | Ajouter `<Disclaimer locale={locale} />` (ou `inline`) sur ces gabarits ; e2e : présence du texte sur toutes les routes `/ressources/**` et `/takaful-finance/**`. |
| MIN-7 | Numéro interne de la demande (identifiant séquentiel de `leads`) affiché au demandeur : révèle le volume de demandes du cabinet. | `src/app/[locale]/(site)/_components/forms/QuoteForm.tsx:209`, `src/features/leads/server/deps.ts:130` | Envoyer un devis : « référence n° 11 » (capture `devis-confirmation-390.png`). | Référence non séquentielle (ex. `publicTokenField` court ou `DEV-2026-XXXX` aléatoire) dans `leads`, utilisée à l'écran et dans l'accusé de réception. |
| MIN-8 | Le guide téléchargé est toujours la version française du fichier (champ `file` localisé, lecture forcée en `fr`). | `src/app/api/downloads/guide/route.ts:32` | Demander un guide depuis `/en/…` une fois un fichier anglais téléversé : PDF français. | Inclure la locale dans le sujet du jeton (`guide:<id>:<locale>`) et lire le document dans cette locale avec repli `fr`. |
| MIN-9 | `areaServed` du JSON-LD en français en dur pour toutes les locales. | `src/app/[locale]/(site)/layout.tsx:68` | `/en` : `"areaServed":["Cameroun","CEMAC","Afrique centrale"]`. | Lire depuis `messages` (`metadata.areaServed`) ou `site-settings`. |
| MIN-10 | Message d'erreur `tooShort` ne dit pas la longueur attendue ; appliqué au nom (2 caractères) il est incongru (« ajoutez quelques précisions »). | `messages/fr.json:962`, `src/features/leads/schemas.ts:21-22` | Nom « A » → « Un peu court : ajoutez quelques précisions. » | Code d'erreur paramétré (`tooShort` + `{min}`) ou message par champ (`name.tooShort`, `message.tooShort` : « au moins 20 caractères »). |
| MIN-11 | Bouton vague « Envoyer » sur le formulaire court (Contact, bloc CTA des pages de service). | `messages/fr.json:1122` | Capture `service-1440.png`, bloc « Parlons de votre besoin ». | « Envoyer ma question » / « Envoyer ma demande », aligné sur le devis. |
| MIN-12 | Pied de page : deux textes quasi identiques sur la lettre (« Une lettre par mois : … Désinscription en un clic » puis « Une lettre par mois au plus. Double confirmation… désinscription en un clic »). | `src/components/patterns/SiteFooter.tsx:60`, `src/app/[locale]/(site)/_components/forms/NewsletterForm.tsx:158` | Toutes les captures, colonne gauche du pied de page. | Garder une seule phrase (le texte du global) et réserver la note du formulaire à « Double confirmation par e-mail ». |
| MIN-13 | À propos : fiches du comité avec « Profil fictif de démonstration. TODO(client)… » répété deux fois (qualifications et bio). | `src/seed/team.ts` | Capture `a-propos-1440.png`, section comité. | Une seule mention par fiche. |
| MIN-14 | Événements de conversion du SPEC §4.5 (`lead_submitted`, `appointment_booked`, `guide_downloaded`, `newsletter_subscribed`) non implémentés ; aucune intégration Umami/Plausible. | `src/lib/analytics/.gitkeep` | — | Planifier explicitement (M6 ou avant mise en ligne de la vitrine) : contrat `trackEvent` dans `src/lib/analytics`, appels après succès des Server Actions. |
| MIN-15 | Pas d'en-têtes de sécurité (CSP à nonces, HSTS, Referrer-Policy, Permissions-Policy) ; `/styleguide` accessible publiquement (SPEC §2 : « protégé en production »). | `src/proxy.ts`, `next.config.ts`, `src/app/[locale]/styleguide/page.tsx` | `curl -I /fr` : aucun en-tête de sécurité. | Prévu M6.1 (security-devops) ; bloquant pour une mise en ligne de la vitrine avant M6. La CSP devra autoriser `challenges.cloudflare.com` et `app.cal.com`. |
| MIN-16 | Bouton WhatsApp flottant qui recouvre la fin des lignes du texte courant à 1440 px (« risque de réputatio… »). | `src/app/[locale]/(site)/_components/SiteChrome.tsx` | Capture `service-1440.png`, section « Votre situation ». | Marge de sécurité à droite (`pe-*`) sur `container-page` ≥ largeur du bouton au-delà de `lg`, ou bouton réduit à l'icône sur desktop au-dessus du texte. |
| MIN-17 | Accueil : bandeau « Ils nous font confiance » et section « Cours à la une » absents (DESIGN §9). | `EditorialBlocks.tsx:117, 268` | Capture `accueil-1440.png`. | Attendu (partenaires non autorisés, catalogue M3) : à vérifier de nouveau en M3 ; rien à corriger en M2. |
| MIN-18 | Captures incomplètes : seulement `fr` 390/1440 ; ni `ar` (RTL), ni 320/768/1024/1920. | `docs/qa/screenshots/m2` | — | Produire les captures `ar` 390/1440 au minimum (RTL) et 320 px (débordement horizontal) pour accueil, service, devis, article. |
| MIN-19 | *(2e passe)* Une colonne de pied de page dont tous les liens sont filtrés (route non livrée, lien invalide) s'affiche avec son seul titre. | `src/app/[locale]/(site)/_lib/chrome.ts:55-60` | Capture `accueil-1440.png` (9a46525) : titre « Formation » sans aucun lien dans le pied de page. | Dans `footerColumnsFrom`, retirer les colonnes dont `links` est vide après filtrage ; même règle pour une entrée de méga-menu sans offre (déjà gérée) ; test unitaire. |
| MIN-20 | *(2e passe)* Messages de `validateCmsHref` en français seulement, alors que l'admin est bilingue (`l(fr, en)` ailleurs). | `src/payload/fields/href.ts:37-42` | Admin en anglais, saisir `devis` dans un lien : message français. | Utiliser `req.i18n` / `req.locale` fournis à `validate`, ou un message bilingue court. |
| MIN-21 | *(2e passe)* Valeurs de démonstration conservées dans `site-settings.keyFigures` : tout bloc `stats` ajouté par un éditeur les afficherait comme des faits. | `src/seed/globals.ts:12-17`, `EditorialBlocks.tsx:39-50` | Ajouter un bloc « Chiffres clés » à une page dans l'admin. | Seeder des valeurs vides (ou marquées `placeholder`) et masquer le bloc tant qu'une valeur citée est vide ou marquée ; test sur `key-figures`. |
| MIN-22 | *(2e passe)* Le seed et les scripts hors requête Next écrivent avec `disableRevalidate: true` : le Data Cache (`unstable_cache` sans durée) continue de servir l'ancien contenu jusqu'à purge ou nouvelle publication dans l'admin. Cause probable des captures obsolètes (réserve R-1). | `src/seed/lib/upsert.ts:15`, `src/app/[locale]/(site)/_data/cache.ts:23` | Rejouer le seed avec un `next start` en cours : l'accueil garde l'ancienne mise en page. | Documenter dans la procédure d'exploitation la purge du cache après seed/migration (suppression de `.next/cache` ou route d'invalidation protégée par secret appelant `revalidateTag` pour toutes les étiquettes), et l'appliquer en CI avant les captures. |

### Mineurs à traiter avant une mise en ligne publique de la vitrine

À planifier avant toute ouverture publique (même si M3 n'est pas commencé) : **MIN-1** (IP falsifiable, contournement de la limite de débit), **MIN-2** (envois répétés de confirmation à une boîte tierce), **MIN-5** (webhook Cal.com en erreur 500 et nouvelles tentatives en boucle), **MIN-6** (avertissement « ni fatwa ni conseil » sur toutes les pages Ressources : garde-fou de CLAUDE.md), **MIN-14** (événements de conversion du SPEC §4.5), **MIN-15** (en-têtes de sécurité, CSP, `/styleguide` protégé), **MIN-19** (colonne vide dans le pied de page), **MIN-21** (chiffres de démonstration réaffichables), **MIN-22** (procédure de purge du cache).

Dette ordinaire (à traiter au fil des jalons) : MIN-3, MIN-4, MIN-7 à MIN-13, MIN-16 à MIN-18, MIN-20.

## Tests ajoutés pendant cette revue

- `tests/unit/features/m2-qa-security.test.ts` (21 tests, verts) : schémas dangereux refusés par les liens CMS (`javascript:`, casse, espace initial, `data:`, `vbscript:`, `file:`, URL relatives au protocole), absence d'opérateurs `tsquery` dans la requête de recherche (y compris tentative SQL et arabe), échappement JSON-LD (`</script>`, `<!--`), interprétation du webhook Cal.com (normalisation, déclencheurs ignorés, corps non conformes), relance de newsletter (désinscrit → en attente avec nouveau consentement ; confirmé → aucune écriture ni e-mail).
- Fichiers déjà présents et non commités, issus de la passe précédente : `tests/unit/features/leads-hardening.test.ts` (vert), `tests/e2e/a11y-keyboard.spec.ts` (à exécuter par l'orchestrateur).
- Test volontairement non ajouté en 1re passe (il aurait échoué) : `match('/audit-conformite/%E0%A4%A')` → `null`. **Ajouté avec la correction** dans `tests/unit/features/site.test.ts` (2e passe), avec les tests de `validateCmsHref` et de correspondance `unreleasedRoutes` ↔ pages livrées.

## Visuel (captures `docs/qa/screenshots/m2`, fr 390 et 1440)

Conformes à DESIGN.md dans l'ensemble : alignement à gauche, Trame or sur `green-900` limitée aux héros, index éditorial des pôles (pas de grille de cartes), méthode numérotée légitime, un seul témoignage en Baskerville italique sur sable, chiffres intégrés à une phrase, aucun sur-titre en capitales, aucune flèche dans les boutons, aucun point médian dans les métadonnées, aucune image interdite, bouton or uniquement sur fond vert, césure active sur le texte et pas sur les titres. Remarques : MIN-12, MIN-13, MIN-16, MIN-17 ; la Trame apparaît aussi en grand dans le héros d'À propos (DESIGN §1 la réserve à l'accueil en grand) — à arbitrer par design-system, non bloquant.

**2e passe (captures recommitées en 9a46525)** : le héros de l'accueil n'a plus que « Demander un audit » (l'ancien lien `/formation/cours`, encore en cache, est filtré par `cmsHref` comme le prévoit l'ADR 016), l'index des pôles ne propose plus que « Cours en ligne » → `/formation` et « Offre entreprises » → devis, et les icônes Compte et Panier ont disparu. En revanche, la phrase des chiffres clés et une colonne « Formation » vide sont encore visibles : capture prise sur un cache antérieur au nouveau seed (MIN-22). **Réserve R-1** : refaire les captures 390/1440 (fr, et ar au minimum pour l'accueil) après purge du cache et vérifier : l'absence du bloc chiffres, le bouton or « Voir les formations » → `/formation` dans le héros (seed 07153f7), le contenu de la colonne Formation (« Nos formations », « Former vos équipes ») et le méga-menu Formation (« Former vos équipes », « Guide gratuit »).

## e2e

Exécutés par l'orchestrateur après les corrections (résultats transmis à qa, non rejoués ici).

| Suite | Fichier | Résultat |
|---|---|---|
| Pages vitrine (statut 200, titres, fil d'Ariane) + liens internes de l'accueil, de l'en-tête (méga-menu compris) et du pied de page en 200, fr et ar (MAJ-1) | `tests/e2e/site-pages.spec.ts`, `tests/e2e/site-links.spec.ts` | **46/46 verts** |
| Accessibilité axe + parcours clavier (menu, devis, recherche « / », FAQ) | `tests/e2e/a11y-keyboard.spec.ts` | **36/36 verts** |
| Formulaires (devis 3 étapes, contact, guide, newsletter, erreurs, Turnstile de test) | `tests/e2e/site-forms.spec.ts` | **Verts** (un échec de lancement du navigateur, `spawn EPERM`, lié à l'environnement et non au code) |
| SEO (sitemap, robots, JSON-LD, hreflang, OG, manifeste) + styleguide | `tests/e2e/seo.spec.ts`, `tests/e2e/styleguide.spec.ts` | **21/21 verts** (SEO rejoué après l'échec d'environnement) |
| Avertissement présent sur `/ressources/**` et `/takaful-finance/**` (MIN-6) | à écrire | non couvert : à ajouter avec la correction de MIN-6 |
| RTL `ar` à 320 px (`dir="rtl"`, aucun débordement horizontal) | à écrire | partiellement couvert (`site-links` en ar à 1440 px) ; à ajouter avant mise en ligne d'`ar` (locale fermée, ADR 014) |
| Lighthouse mobile (accueil, service, article) : ≥ 95, JS vitrine < 120 Ko | — | **non mesuré** (contrainte mémoire) : à exécuter en CI ou en M6 ; obligatoire avant mise en ligne publique |

Remarque sur `site-links.spec.ts` : il vérifie l'absence de 404, mais pas la présence attendue des liens de repli. Les captures obsolètes (R-1) montrent que la suite passe aussi sur un cache ancien, puisque `cmsHref` filtre les liens. Ce n'est pas un défaut du test, mais il ne remplace pas la relecture des captures.
