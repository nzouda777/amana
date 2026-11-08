# ADR 018 — Quiz corrigés côté serveur, tentatives et révélation des solutions

- Statut : accepté (2026-11-07, M3)

## Contexte
SPEC §3 et §4.1 : choix unique, multiple, vrai/faux ; retour par réponse ; seuil ; tentatives limitées ; quiz bloquant optionnel avant le module suivant ; certificat conditionné aux quiz requis. Les bonnes réponses ne doivent jamais atteindre le navigateur avant la soumission.

## Choix
- **Projection publique reconstruite champ par champ** (`toPublicQuiz`) : ni `isCorrect`, ni retour par réponse, ni explication. Les collections `quizzes` et `questions` restent illisibles via l'API hors personnel pédagogique.
- **Correction serveur** (`gradeQuiz`) : tout ou rien par question (choix multiple = exactement l'ensemble correct), points entiers, réussite comparée en entiers (`obtenus × 100 ≥ seuil × total`), score affiché arrondi à l'inférieur. Une soumission incohérente (question étrangère ou dupliquée, indice hors bornes ou répété) est rejetée.
- **Tentatives** : un quiz réussi ne se repasse pas ; `maxAttempts = 0` = illimité. Index **unique (utilisateur, quiz, numéro de tentative)** sur `quiz-attempts` : deux soumissions simultanées ne dépassent jamais la limite (migration `20261107_025308_unicite_tentatives_quiz`).
- **Révélation** : après chaque tentative, l'apprenant voit le score, juste/faux par question et le retour rédigé des réponses **qu'il a choisies**. Les bonnes réponses et l'explication ne sont révélées qu'une fois le quiz **réussi ou les tentatives épuisées** ; sinon la tentative suivante se ferait par recopie.
- **Accès** : `QuizService` vérifie l'accès au **cours du quiz** (`AccessService`) ; un quiz d'un autre cours que celui de l'URL répond `not-found` ; un extrait gratuit ne donne pas droit au quiz.
- **Complétion** : une leçon quiz n'est terminée que par une tentative réussie, jamais par un « terminé » envoyé par le client. Les quiz requis pour le certificat sont les quiz des leçons de type quiz et les quiz de passage des modules.

## Conséquences
- L'ordre des questions mélangées est déterministe par (utilisateur, quiz, numéro de tentative) : stable au rechargement.
- Les auteurs doivent rédiger des retours par réponse qui n'énoncent pas la solution d'une autre réponse.
