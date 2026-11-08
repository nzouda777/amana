# Kit Claude Code — Amana Conseil

## Contenu
```
CLAUDE.md                  mémoire du projet (stack, règles, jalons, garde-fous)
KICKOFF.md                 prompt de lancement à coller dans Claude Code
docs/SPEC.md               spécification fonctionnelle + modèle de données
docs/DESIGN.md             direction artistique + design system dérivé de la charte
.claude/agents/            9 sous-agents spécialisés
  architect.md             socle, schéma, contrats, ADR
  design-system.md         tokens, composants, Trame, relecture visuelle
  marketing-site.md        vitrine et pages de services
  lms.md                   catalogue, lecteur, quiz, certificats
  commerce.md              panier, Mobile Money, factures, accès
  b2b.md                   organisations, licences, tableau de bord
  content-seo-i18n.md      contenus de démo, SEO, traductions
  security-devops.md       sécurité, CI/CD, Docker, sauvegardes
  qa-reviewer.md           tests, a11y, perf, revue finale
```

## Mise en route
1. Crée un dossier vide pour le projet et copie-y tout le contenu de ce kit (attention au dossier caché `.claude/`).
2. Ajoute dans `docs/brief/` le brief client (.docx) et la charte (image) pour référence.
3. Si tu as le logo en SVG, place-le dans `public/brand/logo.svg`.
4. Lance `claude` dans ce dossier, vérifie avec `/agents` que les 9 agents apparaissent.
5. Colle le contenu de `KICKOFF.md` (à partir de la ligne « Tu es le lead developer… »).
6. Valide le plan, puis chaque jalon un par un.

## Conseil
Travaille jalon par jalon et relis les captures toi-même à chaque étape. Un jalon refusé tôt coûte beaucoup moins cher qu'une correction en fin de projet.
