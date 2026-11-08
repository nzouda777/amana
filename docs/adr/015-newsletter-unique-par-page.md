# ADR 015 — Un seul formulaire de lettre par page, aucune case précochée

- Statut : accepté (2026-11-03, M2)

## Contexte
Les pages article et hub Formation proposent une inscription contextuelle à la lettre, en plus de celle du pied de page : deux formulaires identiques sur la même page. Le formulaire de fin d'article précochait l'intérêt « Actualité réglementaire ».

## Choix
- La section d'inscription de la page porte l'attribut `data-page-newsletter` ; le bloc lettre du pied de page est masqué par CSS (`body:has([data-page-newsletter])`) sur ces pages. La version contextuelle est gardée : elle a un titre propre et, sur les articles, le choix des centres d'intérêt. Aucune logique de route dans le gabarit ; toute future page peut adopter la règle avec l'attribut.
- `NewsletterForm` ne précoche plus aucune case : avec `chooseInterests`, la personne coche elle-même ; sans, les intérêts implicites de la page (`interests`) sont envoyés tels quels.

## Conséquences
- Le consentement aux centres d'intérêt est toujours un acte explicite.
- Navigateurs sans `:has()` (très anciens) : les deux formulaires restent visibles, sans perte de fonction.
