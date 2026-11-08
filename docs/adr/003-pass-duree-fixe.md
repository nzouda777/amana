# ADR 003 — Pass d'accès à durée fixe plutôt qu'abonnement récurrent

- Statut : accepté (2026-11-02, M0)

## Contexte
La majorité des paiements se feront en Mobile Money (MTN, Orange). Le prélèvement récurrent automatique n'y est pas fiable (autorisation à chaque débit, solde insuffisant fréquent). Le client souhaite pourtant une formule « abonnement ». L'éthique de l'activité exclut toute pénalité ou frais de retard.

## Options
1. Abonnement récurrent par carte uniquement.
2. Pass à durée fixe (30 / 90 / 365 jours), payé en une fois, renouvelable en un clic, avec rappels.

## Choix
Option 2 : produit `access-pass` (`durationDays`), qui crée une inscription `scope: catalog`, `source: pass`, `endsAt = début + durée`. Renouvellement = nouvel achat qui prolonge à partir de la fin du pass en cours. Rappels J-7, J-1 et J+1 (jobs Payload, M4). Si la passerelle choisie gère le récurrent par carte, il s'ajoute comme option de paiement **sans changer le modèle**.

## Conséquences
- Aucun état « impayé » à gérer, aucun frais ni intérêt.
- L'accès expire naturellement (déduit de `endsAt`) ; aucune tâche de coupure à exécuter.
- Le renouvellement dépend des rappels : leur délivrabilité (e-mail, éventuellement WhatsApp) devient importante.
