# ADR 019 — Catalogue, fiche cours et authentification front (M3.4, M3.5, M3.11)

- Statut : accepté
- Date : 2026-11-07

## Contexte
Le catalogue, la fiche cours, les parcours et l'authentification arrivent avant le commerce (M4)
et l'espace apprenant (M3.10). Ils doivent rester légers en 3G, rendus côté serveur, sans fuite
de contenu payant, et sans énumération des comptes.

## Décisions
1. **Gabarit** : `(learn)/layout.tsx` réexporte le gabarit de `(site)` (en-tête, pied de page,
   avertissement). Un seul produit ; le lecteur de leçon (M3.6) aura son propre gabarit.
2. **Catalogue** : tout le catalogue publié est lu une fois (Local API, `overrideAccess: false`,
   mis en cache par tag), puis filtré, trié et paginé en mémoire par `features/lms/catalog.ts`
   (logique pure, testée). Le volume (dizaines de cours) ne justifie pas un SQL dynamique ; le
   prix vient des produits `course` en vente. La recherche `q` passe par Postgres FTS
   (`french` + `unaccent`, mêmes fonctions que la recherche globale), sans index dédié tant que
   le volume reste faible. Filtres en paramètres GET stables dans toutes les langues (`theme`,
   `niveau`, `format`, `duree`, `prix`, `langue`, `tri`, `page`) ; pages filtrées `noindex`.
3. **Fiche cours** : seul le plan (titres, types, durées) est rendu ; les champs protégés des
   leçons ne sont jamais sélectionnés. Les extraits gratuits (vidéo, texte, étude de cas) se
   chargent au clic par une Server Action qui revérifie `AccessService.canAccessLesson` puis
   signe une URL courte (ADR 017). La route `/api/dev-video` du fournisseur factice est livrée
   dès maintenant (prévue en M3.6) pour que les extraits soient jouables en démonstration.
4. **Action d'achat honnête avant M4** : « Demander l'accès » (contact) pour les particuliers,
   « Demander une démonstration » (devis formation entreprise) pour les capsules, avec la mention
   que le paiement en ligne ouvre prochainement. Ni panier, ni compte à rebours, ni rareté.
   La personnalisation « Continuer le cours » viendra avec le lecteur (îlot client, la fiche
   reste statique).
5. **Noms affichés** : formateurs (`firstName lastName`) et auteurs d'avis (« Prénom N. ») sont
   lus dans `users` avec privilège, en ne projetant que ces deux champs.
6. **Authentification** sur Payload auth (`users`, `verify: true`) : Server Actions zod +
   Turnstile + limitation de débit par IP et par adresse visée ; verrouillage Payload (5 échecs,
   15 min). Réponses sans énumération : inscription et oubli répondent toujours « consultez
   votre messagerie » (un titulaire déjà inscrit reçoit un e-mail « vous avez déjà un compte ») ;
   la connexion confond adresse inconnue, mot de passe faux et compte verrouillé. Confirmation
   d'adresse sur `/connexion?verification=…` par bouton (pas au simple chargement), lien de
   réinitialisation sur `/mot-de-passe?jeton=…` ; la réinitialisation confirme l'adresse et ouvre
   la session. Le cookie `payload-token` est posé par nos soins (`HttpOnly`, `SameSite=Lax`,
   `Secure` en production, échéance = `tokenExpiration`) : l'aide de `@payloadcms/next`
   additionne des secondes à des millisecondes. Déconnexion par `logout` de `@payloadcms/next`
   (session révoquée côté serveur). Chemin de retour `next` filtré par `safeNextPath`.
7. **En-tête** : l'icône Compte mène à `/connexion` tant que `/espace` n'est pas livré.

## Conséquences
- `CourseCard` et `StickyPurchase` acceptent l'absence de prix (`priceNote`).
- Les nouveaux noms de formateurs n'invalident pas le cache (pas de hook sur `users`) :
  republier le cours suffit.
- La lecture HLS hors Safari/Android attend hls.js (M3.6) ; le fournisseur factice sert du MP4.
