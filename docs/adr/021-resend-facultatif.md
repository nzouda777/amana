# ADR 021 — Resend facultatif au démarrage en production

- Statut : accepté
- Date : 2026-11-08

## Contexte

`src/env.ts` exigeait `RESEND_API_KEY` et `EMAIL_FROM` à l'exécution en production. Sans
eux, toute lecture de la configuration levait une erreur : la connexion échouait, alors
qu'elle n'envoie aucun e-mail. Le client veut pouvoir utiliser un compte de démonstration
avant d'avoir configuré Resend, l'inscription restant fermée tant que les e-mails ne partent
pas.

## Décision

- Resend n'est plus exigé au démarrage. Seule règle restante : une `RESEND_API_KEY` impose
  un `EMAIL_FROM`.
- `isEmailConfigured()` (`src/env.ts`) : vrai si Resend est configuré, ou hors production, ou
  avec `ALLOW_DEV_SERVICES=1` (e-mails écrits en fichier).
- En production sans Resend, `getEmailSender()` renvoie `UnconfiguredEmailSender`, qui échoue
  explicitement à chaque envoi. Rien n'est jamais écrit sur disque en production.
- Authentification : l'inscription, le nouvel envoi du lien de confirmation et la demande de
  mot de passe oublié répondent `email-unavailable` **avant toute écriture** (aucun compte
  créé sans e-mail de confirmation). La connexion, la confirmation par lien et la
  réinitialisation avec un jeton déjà reçu restent ouvertes.
- Demandes (devis, contact) : déjà tolérantes, la demande est enregistrée dans `leads` et
  l'échec de notification est journalisé.

## Conséquences

- Un compte de démonstration ou administrateur (`pnpm create-admin`, compte déjà vérifié)
  peut se connecter dès le premier déploiement.
- Tant que Resend n'est pas configuré : pas d'inscription en ligne, pas de mot de passe oublié,
  pas d'accusé de réception ni de notification d'équipe pour les demandes (à consulter dans
  l'admin, collection `leads`), pas de confirmation de newsletter ni d'envoi de guide.
