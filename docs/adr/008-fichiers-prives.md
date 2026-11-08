# ADR 008 — Fichiers privés séparés des médias publics

- Statut : accepté (2026-11-02, M0)

## Contexte
SPEC §3 prévoit une collection `media`, publique. Or plusieurs fichiers ne doivent pas être accessibles par URL directe : guides téléchargeables contre e-mail, ressources et PDF de leçons, certificats, factures, bons de commande.

## Choix
Ajout de la collection d'upload **`documents`** (PDF et formats bureautiques) : lecture via l'API réservée au personnel. Le public y accède uniquement par des routes serveur qui vérifient le droit (consentement enregistré pour un guide, `AccessService` pour une leçon, propriétaire pour une facture) puis servent le fichier. `media` reste publique, limitée aux images (JPEG, PNG, WebP, AVIF ; **pas de SVG**, risque XSS — le logo vectoriel est servi depuis `public/brand`).

## Conséquences
- Une URL de fichier privé partagée ne fonctionne pas sans session ou jeton.
- Le stockage objet de production (ADR 005) devra conserver ce cloisonnement (bucket privé ou préfixe non public).
