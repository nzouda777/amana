# ADR 010 — Chiffres clés : jetons `{{cle}}` dans une phrase

- Statut : accepté (2026-11-02, avant M2)

## Contexte
DESIGN §9 demande des chiffres clés « intégrés à une phrase, pas en grille de compteurs ». Les chiffres vivent dans `site-settings.keyFigures` ; une phrase écrite en dur dans un bloc de page dupliquerait les valeurs et se périmerait.

## Options
1. Phrase libre (valeurs recopiées) : simple, mais deux sources de vérité.
2. Sélection de chiffres + gabarit généré : rigide, mauvaise typographie selon la langue.
3. Phrase localisée avec jetons `{{cle}}` résolus au rendu contre `keyFigures`.

## Choix
Option 3.
- `keyFigures[]` reçoit un champ `key` obligatoire (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`), unique dans le tableau (validation au niveau du tableau, pas d'index SQL).
- Logique pure : `src/features/content/key-figures.ts` — `parseStatsSentence`, `resolveStatsSentence(sentence, figures, mode)`, `findUnknownFigureKeys`, `findDuplicateFigureKeys`, `statsSentenceToText`. Le rendu reçoit des segments `text` / `figure` et peut styliser les chiffres (or, `tabular-nums`).
- Jeton inconnu :
  - **à l'enregistrement** : le bloc `stats` refuse la phrase (message listant les clés inconnues) ;
  - **au rendu** (clé supprimée depuis) : en développement, le jeton reste visible tel quel ; en production, `resolveStatsSentence` renvoie `null` et le bloc n'est pas rendu. Retirer le chiffre seul laisserait une phrase fausse (« plus de  professionnels »), pire que pas de phrase.

## Conséquences
- Un chiffre se met à jour à un seul endroit.
- Supprimer ou renommer une clé masque silencieusement en production les phrases qui la citent : le rendu doit le journaliser (avertissement serveur).
