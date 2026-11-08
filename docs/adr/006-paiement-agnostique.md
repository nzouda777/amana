# ADR 006 — Service de paiement agnostique, agrégateur choisi par le client

- Statut : accepté (2026-11-02, décision client) ; l'agrégateur reste à choisir — `TODO(client)`.

## Contexte
Le paiement doit couvrir MTN Mobile Money, Orange Money et la carte au Cameroun, plus le virement et la facture B2B. Plusieurs agrégateurs existent (NotchPay, CinetPay…), avec KYC marchand et délais d'ouverture. Le client n'a pas encore choisi.

## Choix
Un domaine `src/features/commerce/payments/` indépendant de tout agrégateur :
- **`PaymentProvider`** (`contracts.ts`) : `id`, `methods`, `createCheckout`, `verifyWebhook`, `getStatus`, `refund`. Montants `Xaf` entiers, statuts normalisés (`pending | succeeded | failed | cancelled | expired | refunded | partially-refunded`), erreurs typées `PaymentError(code)`.
- **`PaymentService`** : registre de fournisseurs construit depuis `PAYMENT_PROVIDERS` (`registry.ts`) ; **recalcul serveur** du montant depuis la commande en base ; reprise idempotente d'une tentative `pending` (même référence envoyée au fournisseur) ; **idempotence des webhooks par événement** (`PaymentStore.recordEvent`, adossé à la contrainte d'unicité de `payment-events.eventKey`) ; refus d'un montant différent ; événements tardifs contradictoires ignorés ; `onPaymentSucceeded` appelé une seule fois (→ `AccessService.grant`).
- **`ManualTransferProvider`** : instructions de virement + référence, validation manuelle (`confirmManualPayment`).
- **`SandboxProvider`** : simulateur local qui signe ses webhooks en HMAC-SHA256 ; **interdit en production** par le registre.
- Contrat transactionnel : `recordEvent`, mise à jour du paiement et attribution des accès dans **une même transaction** Postgres (implémentation Payload en M4).

Ajout au modèle de SPEC §3 : collection **`payment-events`** (journal immuable des événements traités).

## Conséquences
- Ajouter l'agrégateur choisi = un fichier `providers/<nom>.ts` + une branche dans `registry.ts` + ses variables d'environnement ; ni le panier ni l'UI ne changent.
- Les tests de bout en bout tournent contre le simulateur, sans compte marchand.
- Le `ManualTransferProvider` permet d'ouvrir les ventes avant la fin du KYC marchand.
- À la sélection : vérifier frais, délais de reversement, signature des webhooks, remboursements, récurrent carte (ADR 003) — consigner dans un ADR complémentaire.
