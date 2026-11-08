# DESIGN.md — Direction artistique et design system Amana Conseil

Source : charte graphique fournie (logo bouclier + nœud entrelacé + flèche, palette Green / Gold / Sand / Black, Baskerville + Open Sans, motifs géométriques étoilés sur la brochure et les cartes de visite). Ce document traduit cette charte en système web. La charte gagne toujours ; ce document précise ce qu'elle ne dit pas.

## 1. Intention
Trois mots du brief : **rigueur, confiance, modernité**. La référence n'est ni une banque en ligne ni une startup : c'est un cabinet de conseil de haut niveau, avec un ancrage culturel assumé mais discret.

- **Rigueur** : grille stricte, alignement à gauche, hiérarchie typographique nette, peu de couleurs à la fois.
- **Confiance** : le vert profond domine les zones institutionnelles, le texte est parfaitement lisible, rien ne clignote.
- **Modernité** : grandes compositions typographiques, beaucoup d'air, interactions précises et rapides.

**Un seul élément mémorable : la Trame.** Un réseau géométrique à huit branches (khatam) tracé en fins traits or, dérivé des motifs de la brochure. Il apparaît en grand dans le héros de l'accueil, en petit dans quelques ruptures de section choisies, sur le certificat PDF et dans les états vides. Partout ailleurs l'interface reste sobre. Ne jamais disperser le motif en fond de toutes les sections.

## 2. Couleurs

### Couleurs de marque (charte, ne pas modifier)
| Token | Hex | Rôle |
|---|---|---|
| `green-700` (Amana Green) | `#1B5E20` | Couleur institutionnelle : boutons primaires, liens, pied de page |
| `gold-500` (Amana Gold) | `#D4AF37` | Accents : Trame, filets, chiffres décoratifs, bouton or sur fond vert |
| `sand-300` (Amana Sand) | `#F1E0C5` | Blocs chaleureux ponctuels : témoignage, encarts pédagogiques |
| `ink` (Charter Black) | `#1C1C1C` | Texte principal |

### Couleurs dérivées (accessibilité et profondeur)
| Token | Hex | Rôle |
|---|---|---|
| `green-900` | `#0F3A14` | Fond du héros et des zones « nuit » (aplat, jamais de dégradé) |
| `green-800` | `#164D1A` | Survol des boutons primaires |
| `green-50` | `#EEF4EE` | Sélection, état actif discret |
| `gold-700` | `#8B6914` | **Seul or autorisé pour du texte sur fond clair** (≈ 5:1 sur blanc) |
| `gold-200` | `#EFDFA6` | Progression, badges |
| `sand-100` | `#FAF4EA` | Fond d'encart léger |
| `paper` | `#FFFFFF` | Fond de page principal |
| `ink-muted` | `#4A4A45` | Texte secondaire |
| `ink-subtle` | `#6B6B63` | Métadonnées (jamais sous 14 px) |
| `line` | `#E4DDD0` | Filets et bordures |
| `danger` / `warning` / `info` | `#B42318` / `#B54708` / `#1E4E8C` | États système |

### Règles de contraste (à respecter strictement)
- `#D4AF37` sur blanc ≈ **2,4:1** → interdit pour tout texte et toute icône informative. Décor uniquement.
- `#D4AF37` sur `#1B5E20` ≈ **3,3:1** → autorisé pour titres ≥ 24 px et éléments graphiques, pas pour le texte courant.
- `#1C1C1C` sur `#D4AF37` ≈ **7:1** → bouton or à texte noir autorisé.
- Blanc sur `#1B5E20` ≈ **7,9:1** → AAA.
- Un test automatisé (`tests/a11y/contrast.test.ts`) lit les tokens et vérifie chaque paire déclarée dans `src/styles/pairs.ts`. Toute nouvelle combinaison y est ajoutée.

### Proportions
Sur une page type : blanc ~70 %, vert ~20 %, sable ~7 %, or ~3 %. Si l'or dépasse, c'est qu'il sert de fond ou de texte : corriger.

## 3. Typographie
- **Titres : Baskerville.** *Baskervville* (Google Fonts) si sa version variable est disponible, sinon *Libre Baskerville*. Auto-hébergée via `next/font`. Italique réservée aux citations et témoignages.
- **Texte et interface : Open Sans** variable. 400 pour le texte, 600 pour libellés et boutons.
- **Arabe (RTL, phase 2)** : *Noto Naskh Arabic* (titres), *IBM Plex Sans Arabic* (texte). Variables `--font-display` / `--font-sans` résolues par locale dès M0.
- Chiffres : `font-variant-numeric: tabular-nums lining-nums` dans prix, tableaux, scores, progression.

### Échelle fluide (`clamp`)
| Token | Mobile | Desktop | Usage |
|---|---|---|---|
| `display` | 44 / 1.05 | 88 / 1.02, `-0.02em` | Titre du héros uniquement |
| `h1` | 36 / 1.1 | 60 / 1.08 | Titre de page |
| `h2` | 28 / 1.15 | 42 / 1.12 | Section |
| `h3` | 22 / 1.25 | 28 / 1.2 | Sous-section, titre de carte |
| `h4` | 18 / 1.35 | 20 / 1.35 | Open Sans 600 |
| `body-lg` | 18 / 1.65 | 20 / 1.65 | Chapeau |
| `body` | 17 / 1.6 | 18 / 1.6 | Texte |
| `small` | 15 / 1.5 | 15 / 1.5 | Métadonnées |
| `caption` | 13 / 1.4 | 13 / 1.4 | Mentions, légendes |

- Longueur de ligne : `max-width: 68ch` pour le texte courant.
- Césure automatique en français sur le texte (jamais sur les titres). Espaces insécables avant `: ; ! ?` et dans « » via une fonction `typographyFr()` appliquée aux contenus CMS.
- **Interdits** (marqueurs de page générée) : sur-titre en capitales espacées au-dessus de chaque titre ; un seul mot en couleur ou en italique dans un titre ; métadonnées séparées par des points médians ; flèche « → » ajoutée au texte des boutons ; police monospace pour les petites données. Le slogan en capitales de la charte reste réservé au logo.

## 4. Grille, espacement, formes
- Grille 12 colonnes, gouttière 24 px (16 px mobile), conteneur max 1280 px, marges latérales 20 / 40 / 64 px.
- Espacement base 4 (`4, 8, 12, 16, 24, 32, 48, 64, 96, 128`). Sections : 96 px mobile, 144 px desktop.
- **Alignement à gauche partout.** Le centré est réservé au certificat et aux états vides.
- Rayons hiérarchisés : contrôles 6 px, médias 2 px, panneaux et dialogues 10 px, étiquettes 999 px.
- Ombres : aucune sur les éléments posés. Seulement ce qui flotte (menus, dialogues, panneau d'achat collant) : `0 12px 32px -12px rgb(15 58 20 / 0.25)`.
- Bordures 1 px `line`. Un filet or 1 px réservé aux séparateurs éditoriaux majeurs (un par écran au plus).

## 5. Iconographie et images
- Icônes Lucide, trait 1,5 px, 20/24 px. Jamais d'icône seule sans libellé accessible.
- Photos : personnes réelles au travail (Douala, Yaoundé, Afrique centrale), lumière naturelle, cadrages serrés, traitement uniforme légèrement désaturé pour s'harmoniser avec le vert. En attendant les vraies photos : aplats `sand-100` avec la Trame en filigrane, jamais d'image de banque générique.
- Interdits : billets, pièces, lingots, courbes boursières, poignées de main génériques, lieux de culte utilisés comme décor.
- Logo : fourni en image matricielle → `src/components/brand/Logo.tsx` charge `public/brand/logo.svg` (`TODO(client)`), trois variantes : couleur sur clair, blanc sur vert, symbole seul (favicon, icône d'app, PWA).

## 6. La Trame (spécification)
- Composant `<Trame />` en SVG pur généré par code (khatam : deux carrés tournés de 45°, répétés en réseau, entrelacs simplifiés). Paramètres : `density`, `strokeWidth` (0,75–1,25 px), `opacity`, `animate`.
- `gold-500` sur `green-900` dans le héros ; `gold-500` à 12 % d'opacité sur fond clair.
- Animation unique de l'accueil : au chargement, les lignes se tracent (`stroke-dashoffset`) en ~1 400 ms, ordre radial depuis le coin supérieur droit (côté « fin de ligne », inversé en RTL), puis tout est statique. Désactivée si `prefers-reduced-motion`.
- Poids < 6 Ko, aucun JS pour l'affichage statique.

## 7. Mouvement
- Durées : 120 ms (survol), 200 ms (menu, accordéon), 280 ms (dialogue, panneau). Courbe `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- Le mouvement répond à une action. Pas d'apparition en fondu-glissé sur chaque section au défilement, pas d'effet de survol sur chaque carte.
- Moments signature autorisés : tracé de la Trame (accueil), remplissage de la progression après une leçon, apparition du certificat obtenu.
- `prefers-reduced-motion` respecté partout.

## 8. Composants clés (tous visibles dans `/styleguide`)
- **Boutons** : primaire (vert, texte blanc), secondaire (contour vert), or (fond or, texte noir, uniquement sur fond vert), lien. Hauteurs 40 / 48 px. Focus : anneau 2 px `gold-500` décalé de 2 px sur fond vert, `green-700` sur fond clair.
- **En-tête** : logo ; Formation, Audit et conformité, Conseil et accompagnement, Takaful et finance, Ressources, À propos ; recherche, compte, panier ; bouton « Prendre rendez-vous ». Méga-menu par pôle (offres + un contenu mis en avant). Transparent sur le héros vert, blanc avec filet après défilement. Mobile : tiroir plein écran, accordéons par pôle, CTA fixe en bas.
- **Index des pôles** (accueil) : pas de grille de cartes identiques. Liste éditoriale verticale : nom du pôle en Baskerville h2, une phrase, trois offres en liens, séparés par des filets ; au survol la ligne se teinte `green-50` et un fragment de Trame apparaît en marge.
- **Carte de cours** : visuel 16:9, thème, titre (Baskerville h3), formateur, durée, niveau, prix ; badge « Extrait gratuit ». Les capsules s'affichent en liste compacte, pas en cartes, pour marquer la différence d'usage.
- **Panneau d'achat** collant sur la fiche cours (desktop), barre fixe en bas (mobile).
- **Lecteur de leçon** : sommaire rétractable, vidéo, transcription, ressources, notes, leçon suivante, mode concentration.
- **Formulaires** : libellés au-dessus, aide sous le champ, erreurs qui disent ce qui ne va pas et comment corriger ; devis en 2–3 étapes avec indicateur de progression.
- **États vides** : petite Trame, une phrase utile, une action.
- **Toasts** : même verbe que le bouton (« Ajouter au panier » → « Ajouté au panier »).
- **Bouton WhatsApp** flottant, masqué dans le lecteur de leçon et pendant un quiz.

## 9. Gabarits

### Accueil
```
┌───────────────────────────────────────────────────────────────┐
│ [logo]  Formation  Audit  Conseil  Takaful  Ressources   [RDV]│ ← transparent
│                                                                │
│  La finance islamique,                         ╱╲ Trame or     │ green-900
│  maîtrisée et conforme.                       ╳  ╳ tracée      │
│  Chapeau 1–2 lignes (sand-300)                 ╲╱ une fois     │
│  [Voir les formations]  [Demander un audit]                    │
├───────────────────────────────────────────────────────────────┤
│ Ils nous font confiance : logos monochromes                    │ paper
├───────────────────────────────────────────────────────────────┤
│ Formation ───────────────────────────── 3 offres en liens      │
│ Audit et conformité ─────────────────── 3 offres en liens      │ index éditorial
│ Conseil et accompagnement ───────────── 3 offres en liens      │
│ Takaful et solutions financières ────── 3 offres en liens      │
├───────────────────────────────────────────────────────────────┤
│ Cours à la une : 3 cartes + lien catalogue                     │
├───────────────────────────────────────────────────────────────┤
│ Chiffres clés intégrés à une phrase, pas en grille de compteurs│
├───────────────────────────────────────────────────────────────┤
│ Méthode (vraie séquence → numérotation légitime) 1 2 3 4       │
├───────────────────────────────────────────────────────────────┤
│ Un seul témoignage en grand, Baskerville italique   sand-300   │
├───────────────────────────────────────────────────────────────┤
│ Ressources récentes                                            │
├───────────────────────────────────────────────────────────────┤
│ Bandeau final vert « Parlons de votre projet »  [RDV] [Devis]  │
│ Pied de page : plan, coordonnées, newsletter, avertissement    │
└───────────────────────────────────────────────────────────────┘
```

### Page de service (Audit, Conseil, Accompagnement, Takaful) — gabarit commun
```
Fil d'Ariane · H1 + chapeau · [CTA principal du pôle]
Le problème du client
Notre offre (liste d'offres avec ancres)
Méthode (étapes numérotées)
Livrables types
Cas clients / références (1–3)
FAQ (accordéon + données structurées FAQPage)
Bloc CTA + formulaire en ligne
```

### Fiche cours
```
┌───────────────────────────────────────────┬─────────────────┐
│ Thème, niveau                             │ Visuel / extrait│
│ H1 titre du cours                         │ Prix            │
│ Chapeau, formateur, durée, nb de leçons   │ [Acheter]       │ ← collant
│ Ce que vous saurez faire                  │ [Ajouter]       │
│ Programme (modules dépliables, extraits)  │ Inclus : …      │
│ Formateur, avis, FAQ, cours associés      │                 │
└───────────────────────────────────────────┴─────────────────┘
```

### Lecteur de leçon
```
┌──────────────┬────────────────────────────────────────────┐
│ Sommaire     │ Module 2, leçon 4                          │
│ ✓ Leçon 1    │ ┌────────────────────────────────────────┐ │
│ ✓ Leçon 2    │ │ Vidéo HLS (qualité auto, 240p minimum)  │ │
│ ● Leçon 4    │ └────────────────────────────────────────┘ │
│ ○ Quiz       │ Transcription | Ressources | Notes         │
│ ▓▓▓▓░░ 62 %  │ [Leçon précédente]        [Leçon suivante] │
└──────────────┴────────────────────────────────────────────┘
Mobile : vidéo en haut, sommaire en tiroir, navigation fixe en bas.
```

### Tableau de bord entreprise
```
Organisation — licences utilisées 34 / 50 — [Inviter des collaborateurs]
Indicateurs : taux de complétion, score moyen, collaborateurs en retard
Tableau : collaborateur | capsules assignées | progression | score | dernière activité
Filtres équipe / métier — [Relancer] — [Exporter]
```

## 10. Contrôle qualité visuel (à chaque jalon)
Responsive de 320 à 1920 px sans défilement horizontal ; focus visible partout ; cibles tactiles ≥ 44 px ; contrastes AA minimum ; aucune casse en RTL ; aucun texte tronqué en anglais (chaînes ~30 % plus longues). Avant de valider un écran, relire la capture et retirer un élément décoratif superflu.
