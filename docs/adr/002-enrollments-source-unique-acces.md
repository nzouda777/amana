# ADR 002 — `enrollments`, source unique des droits d'accès

- Statut : accepté (2026-11-02, M0)

## Contexte
Un apprenant peut accéder à un cours parce qu'il l'a acheté, parce qu'il possède un pass d'accès, parce que son entreprise lui a attribué un siège de licence, parce qu'on le lui a offert ou parce qu'un administrateur l'a ajouté. Si chaque origine porte sa propre logique d'accès, les règles divergent (lecteur, certificats, espace apprenant) et les remboursements oublient des accès.

## Options
1. Calculer l'accès à la volée depuis commandes, licences et pass.
2. Une table d'accès unique alimentée par toutes les origines.

## Choix
Option 2. La collection `enrollments` est la seule chose que lit `AccessService` :
- `scope: course` (un cours) ou `catalog` (pass : tous les cours marqués `includedInPass`) ;
- `source: purchase | pass | license | gift | admin` + liens d'origine (`order`, `license`, `product`, `grantedBy`) pour l'idempotence et la révocation ;
- `status: active | suspended | revoked` ; **l'expiration n'est pas un statut** : elle se déduit de `endsAt` (jamais de statut périmé en base).

Écriture uniquement par les services serveur : le webhook de paiement vérifié (jamais la page de retour), l'attribution de siège de licence, l'admin. Lecture via l'API : propriétaire, super-admin, sales.

La décision est une fonction pure testée (`src/features/lms/access.ts` → `evaluateEnrollments`) qui renvoie aussi **la raison** (accordé : enrollment / preview / staff ; refusé : no-enrollment, not-started, expired, suspended, revoked). Le contenu protégé des leçons (vidéo, texte, PDF, ressources, transcription) n'est lisible via l'API que par l'équipe pédagogique ; le lecteur le charge côté serveur après décision d'`AccessService`.

## Conséquences
- Un remboursement ou une licence retirée = `revokeByOrigin` : aucun accès orphelin.
- La progression (`lesson-progress`) et les certificats sont indépendants de l'origine de l'accès.
- Un pass ne crée pas une ligne par cours : un nouveau cours inclus dans le pass est immédiatement accessible aux détenteurs.
