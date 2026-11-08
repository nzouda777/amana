# Journal de design — M1 Design system

Ce journal consigne ce qui a été essayé, gardé et retiré pendant la construction du design system, et pourquoi. Il complète `docs/DESIGN.md` (source de vérité) sans le contredire.

## Tokens

- **Palettes Tailwind neutralisées.** `--color-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--container-*`, `--ease-*`, `--animate-*`, `--font-*` et `--font-weight-*` sont remis à `initial` dans `@theme`. Une classe hors charte (`bg-blue-500`, `text-xl`, `rounded-lg`, `shadow-md`, `max-w-4xl`) ne génère donc rien : l'erreur se voit tout de suite à l'écran au lieu de passer en revue. Les quelques utilitaires de taille arbitraires restants (`max-h-[calc(100dvh-2rem)]`, `w-[calc(100%-3rem)]`) sont des contraintes de mise en page, pas des valeurs de design.
- **Échelle fluide.** Interpolation linéaire entre 390 px et 1440 px (les deux tailles de capture) : `pente = (max − min) / 1050`. Les interlignages des titres basculent à 64rem (1,05 → 1,02 pour `display`, etc.) via des variables `--leading-*`, référencées par `--text-*--line-height`. Essayé : interlignage fluide en `clamp()` de longueurs ; retiré, illisible et sans gain perceptible.
- **Espacement.** `--spacing: 0.25rem` donne exactement la base 4 de DESIGN §4 (`p-4` = 16 px, `p-24` = 96 px). Ajouts nommés : `section` (96 / 144 px), `gutter` (16 / 24 px), `margin` (20 / 40 / 64 px), `header` (64 / 72 px). Seuls les pas 1, 2, 3, 4, 6, 8, 12, 16, 24, 32 sont utilisés dans les composants.
- **Conteneurs.** `page` (1280 px de contenu), `measure` (68ch), puis `xs` 20rem, `sm` 28rem, `md` 36rem, `lg` 48rem, `xl` 64rem pour dialogues, panneaux, citation. L'utilitaire `container-page` ajoute les marges latérales autour des 1280 px.
- **Durées.** Tailwind v4 n'a pas d'espace de noms de thème pour les durées : `--duration-hover|menu|panel|trame` sont déclarées dans `:root` et utilisées via `duration-(--duration-hover)`.

### Couleurs ajoutées (hors tableau DESIGN §2)

| Token | Valeur | Raison |
|---|---|---|
| `line-strong` | `#8A8478` | `line` (#E4DDD0) ne fait que 1,3:1 sur blanc : insuffisant pour la limite d'un champ (WCAG 1.4.11, 3:1). `line-strong` = 3,72:1. `line` reste pour les filets décoratifs. |
| `danger-50`, `warning-50`, `info-50` | `#FEF3F2`, `#FFFAEB`, `#EFF4FB` | Fonds des alertes et de l'encadré « Avertissement » ; texte d'état ≥ 5,2:1 dessus. |

### Contraste : écarts avec les valeurs citées par la charte

La charte cite des ratios arrondis ; les valeurs exactes (formule WCAG 2.x) sont : or sur blanc **2,10** (cité 2,4), or sur vert **3,74** (cité 3,3), noir sur or **8,10** (cité 7), blanc sur vert **7,87** (cité 7,9). Les règles restent valides (or interdit en texte sur clair, titres ≥ 24 px seulement sur vert). Le test vérifie les règles, pas les arrondis. Deux constats utiles : `gold-500` sur `green-900` atteint **6,11:1**, donc l'or est lisible en texte courant sur le héros (chiffres, filets, focus) ; `ink-subtle` sur `sand-100` = 4,91:1, juste au-dessus du seuil : ne jamais l'éclaircir.

## Polices

- Baskervville (Google, variable 400–700) retenue plutôt que Libre Baskerville : graisse 400 seule, droit et italique. Open Sans en instances statiques 400 et 600 (deux fichiers plus légers que l'axe variable complet).
- Préchargement limité au sous-ensemble `latin` ; `latin-ext` reste déclaré par `unicode-range` et n'est téléchargé qu'à la demande (vérifié dans le code de `next/font` : tous les `@font-face` sont conservés, seuls les sous-ensembles listés sont préchargés).
- Noto Naskh Arabic (400) et IBM Plex Sans Arabic (400, 600) : jamais préchargées. `--font-display` et `--font-sans` sont redéfinies sous `:lang(ar)`.
- Limite : les variables de police sont posées sur `<html>` pour toutes les locales ; le CSS `@font-face` arabe est présent sur les pages françaises mais aucun fichier n'est téléchargé tant qu'aucun glyphe arabe n'est affiché.

## Composants : décisions

- **Contrôles de formulaire natifs** (Input, Textarea, Select, Checkbox, Radio, Switch) plutôt que Radix Select / Checkbox / Switch. Raisons : sélecteur système sur Android (cible majoritaire), aucune hydratation nécessaire pour un formulaire de Server Action, JS de la vitrine sous 120 Ko. Radix est réservé à ce qui exige une gestion de focus ou de calque (Dialog, Sheet, Popover, Tooltip, Tabs, Accordion, Toast, NavigationMenu). Seule la case « mixte » demande l'hydratation (propriété DOM `indeterminate`, pas d'`aria-checked` sur un contrôle natif). **Proposition d'ADR** (docs/adr appartient à architect) : « Contrôles de formulaire natifs stylés ».
- **États forcés.** Variantes personnalisées `is-hover`, `is-active`, `is-focus`, `group-is-hover` : elles acceptent `data-force="hover|focus|active"`, ce qui permet à /styleguide d'afficher chaque état statiquement. Le survol réel reste sous `@media (hover: hover)` (pas d'état collant sur mobile).
- **Zones tactiles.** Les boutons de 40 px (taille `md`, DESIGN §8) et les petites croix reçoivent `hit-area` : un `::after` absolu porte la zone à 44 × 44 px sans changer l'encombrement visuel.
- **Focus.** Contour 2 px décalé de 2 px, couleur `--focus-color` : `green-700` par défaut, `gold-500` dans toute surface `on-dark` (héros, bandeau CTA, pied de page, bouton or).
- **Button** : pas d'`asChild`. La navigation stylée en bouton passe par `ButtonLink` (lien localisé). Évite Radix Slot dans un composant serveur.
- **Skeleton statique.** Essayé : reflet animé. Retiré : « rien ne clignote » (DESIGN §1) et il aurait fait une seconde animation automatique sur les pages de liste.
- **Alert.** Essayé : bordure latérale épaisse + coins arrondis ; retiré (motif d'interface générée). Remplacé par un cadre 1 px de la couleur d'état sur fond teinté.
- **ProgressBar** : élément `<progress>` natif (rôle et valeur exposés sans ARIA), stylé par pseudo-éléments ; la transition de largeur ne joue que quand la valeur change (fin de leçon), jamais au chargement.
- **Table** : défilement horizontal dans une région focalisable et nommée ; première colonne collante côté début (`start-0`, donc à droite en arabe) avec filet de séparation.
- **Price** : chiffres latins dans toutes les locales (`ar-u-nu-latn`), `Intl.NumberFormat` via `formatXaf`. « Gratuit » pour 0. Prix barré annoncé (« Prix initial : »).
- **EmptyState** : la Trame sur fond clair à 12 % (règle DESIGN §6) est invisible à 64 px. Plutôt que d'enfreindre la règle, le fragment est posé sur une tuile `green-900` où l'or est à pleine opacité.

## Trame

- Géométrie : khatams (carré droit + carré à 45°) au pas de 100 unités, pointes jointives, reliés par des diagonales vers les voisins du bas. Chemins en coordonnées relatives arrondies au dixième : 5 × 4 étoiles ≈ 3,5 Ko de SVG.
- `vector-effect: non-scaling-stroke` : l'épaisseur (0,75–1,25 px) est en pixels écran, quelle que soit la mise à l'échelle.
- Tracé : `pathLength=1`, `stroke-dashoffset` 1 → 0, 8 anneaux de délai calculés depuis le coin supérieur droit, 700 ms par anneau, 100 ms de décalage : 1 400 ms au total. Uniquement sous `prefers-reduced-motion: no-preference`, uniquement avec `animate`.
- RTL : miroir CSS (`scale: -1 1` sous `:dir(rtl)`) : le motif est symétrique, seul l'ordre du tracé s'inverse et part du coin supérieur gauche.
- Aucun JS : composant serveur, CSS dans `src/styles/components.css`.

## /styleguide

- La comparaison fr / ar « côte à côte » se fait dans `/[locale]/styleguide/comparer` avec deux iframes. Essayé d'abord : deux colonnes dans le même document avec `dir` local. Abandonné : les composants serveur traduisent selon la locale de la requête (impossible d'afficher l'arabe dans une page française sans tout passer en client), et les portails Radix (dialogue, menu) s'ouvrent dans `<body>`, donc dans le mauvais sens. Chaque iframe est un vrai document (lang, dir, polices).
- Le lien vers `comparer` est construit à la main : la route n'existe pas dans `pathnames` (`src/lib/i18n/routing.ts`, hors de mon périmètre). À ajouter par l'architecte si on veut un lien typé.
- Une seule animation automatique : la Trame du héros. La Trame du bandeau CTA est statique.

## Retiré à la relecture des captures

Passe 1 (1440 px, fr) :
- **Trame illisible comme khatam.** Avec des pointes d'étoile jointives et des diagonales entre carrés, le réseau se lisait comme une grille de carrés et de losanges. Retiré : diagonales. Rayon de l'étoile ramené à 0,38 cellule, étoiles reliées par de courtes barres orthogonales. L'étoile à huit branches se lit désormais au premier regard.
- **Trame sous la navigation et sous le chapeau du héros.** La Trame occupait 60 % de la largeur depuis le haut ; elle passait derrière « À propos » et derrière la fin du chapeau. Désormais : moitié de fin, sous l'en-tête (`top-header`). Sur mobile elle reste en fond à 40 % (les lignes fines n'entrent pas en concurrence avec le texte blanc).
- **Mot-symbole du logo tronqué** (« Amana Consei ») : le texte SVG dépassait le viewBox. Largeur portée à 236 et `textLength` fixé.
- **Bouton or souligné** : `ButtonLink` héritait de la variante `inline` du lien. Ajout d'une variante `bare`.
- **Boutons qui se chevauchent** dans les grilles d'états : colonnes minimales passées de 11 à 14rem.
- **Pagination** : libellé et chevron empilés (conflit `inline-grid` / `flex`). Classes séparées pour précédent/suivant.
- **Tableau** : en-têtes numériques alignés au début alors que les valeurs sont alignées à la fin (conflit `text-start` / `text-end`).
- **Logo du pied de page centré** dans sa colonne (image étirée par le flex) : `self-start`.
- **Phrase des chiffres clés** : césure (« profession-nels ») et chiffres elzéviriens (« 2019 ») à côté de chiffres alignés (« 1 200 »). `hyphens: manual` et chiffres alignés tabulaires sur toute la phrase.
- **Ratios de contraste au format anglais** (« 4.5:1 ») sur la page française : formatés par `Intl.NumberFormat` selon la locale.
- **Deux badges « En attente »** identiques avec deux tons : le second devient « Échéance proche ».

Passe 1 (390 px) :
- **Débordement horizontal de 364 px.** Cause : la piste implicite d'une grille prenait la largeur min-content du titre tronqué (`white-space: nowrap`) de la barre d'achat mobile. Correction : `grid-cols-1` (minmax(0, 1fr)) et `min-w-0`. Le test e2e vérifie désormais l'absence de défilement horizontal.
- **Débordement résiduel (364 px fr, 294 px ar), invisible à l'écran.** Trouvé par bissection (masquage des nœuds un à un) : les libellés `sr-only` des en-têtes triables du tableau sont en position absolue ; la zone défilante `overflow-x: auto` n'étant pas positionnée, leur bloc conteneur était hors d'elle et ils débordaient la page à leur position statique. Correction : zone défilante `relative` (Table et `.prose-table`). Règle retenue : tout conteneur `overflow-x: auto` qui peut contenir du `sr-only` est positionné.

Arabe (RTL) :
- Codes hexadécimaux alignés à gauche dans les colonnes arabes à cause de `dir="ltr"` sur le bloc : isolés dans `<bdi dir="ltr">`, le bloc garde l'alignement du sens de lecture.
- Vérifié : en-tête inversé (logo à droite, actions à gauche), Trame miroir (ancrée côté fin, tracé depuis le coin supérieur gauche), chevrons du fil d'Ariane et de la pagination retournés, colonne collante du tableau à droite, bouton WhatsApp à gauche, tiroir côté début à droite.

Passe 2 (build de production, suite Playwright) :
- **axe, best-practice** : deux fils d'Ariane de même nom de repère (démo Navigation + extrait de gabarit) → prop `label` sur `Breadcrumb` ; bouton WhatsApp hors repère → enveloppé dans un `<aside>` nommé.
- **axe, `label-content-name-mismatch` (arabe)** : le nom du lien panier au duel (« السلة، منتجان ») ne contenait pas le chiffre visible du badge. Toutes les formes plurielles arabes affichent désormais le nombre.
- **Cibles tactiles** relevées par le test : liens autonomes (27 px), lien logo (40 px), titres de pôles (36 px) et de capsules (24 px) portés à 44 px ; lien d'évitement qui gardait son remplissage hors focus (le remplissage ne s'applique plus qu'au focus).

Conservé malgré l'hésitation :
- Le pied de page vert `green-700` sous un bandeau CTA `green-900` : la charte attribue `green-700` au pied de page ; les deux verts superposés se lisent comme deux plans distincts, pas comme une erreur.
- Les trois cartes de cours de démonstration sans visuel : aplat sable + Trame à 12 % (DESIGN §5). Pas d'ombre, pas de survol de carte ; seul le titre se souligne.
