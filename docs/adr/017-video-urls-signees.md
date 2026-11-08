# ADR 017 — URL vidéo signées : fournisseur par configuration, durée de validité, forme du jeton

- Statut : accepté (2026-11-07, M3)

## Contexte
SPEC §4.1 exige des URL de lecture signées à durée courte, sans lien de téléchargement direct, et un fournisseur remplaçable. Aucun compte Bunny n'existe encore (`TODO(client)`), mais le lecteur, les tests et les démonstrations doivent fonctionner. Le jeton HLS est vérifié par le CDN à **chaque segment** : trop court, il coupe une lecture en cours ; trop long, une URL copiée reste utilisable.

## Choix
1. **Fournisseur par configuration** : `VIDEO_PROVIDER=local | bunny` (`src/env.ts`), assemblé par `buildVideoProvider` (`src/features/lms/video/registry.ts`). `bunny` exige ses quatre variables dès le démarrage. `local` est refusé à l'usage en production réelle (hors `ALLOW_DEV_SERVICES`), pour ne pas bloquer le déploiement de la vitrine tant que le compte Bunny n'existe pas.
2. **Bunny : authentification par jeton « avancée » HMAC-SHA256** (`HS256-…`, documentation vérifiée le 2026-11-07), **jeton de répertoire `/{videoId}/` placé dans le chemin** (`/bcdn_token=…/{videoId}/playlist.m3u8`) : forme requise par Bunny en HLS, les segments relatifs héritent du jeton. `token_ignore_params=true` (paramètres ajoutés par le lecteur sans effet sur la vérification). Vignette et sous-titres sont signés avec le même répertoire.
3. **Durée** : `playbackTtlSeconds(durée)` = durée × 4/3 (lecture à 0,75×) + 15 min, bornée à **[15 min ; 4 h]**, 1 h si la durée est inconnue. À l'échéance (longue pause), le lecteur redemande une URL au serveur, qui **revérifie l'accès** avant de signer : une révocation prend effet au plus tard à l'échéance.
4. **Pas de verrouillage par IP** : sur les réseaux mobiles camerounais (CGNAT, bascule 3G/4G/Wi-Fi) l'adresse change en cours de lecture ; Bunny désactive aussi l'IPv6 avec le jeton.
5. **Économie de données** : manifeste d'un seul rendu (`/{videoId}/240p/video.m3u8`, réglable par `BUNNY_STREAM_DATA_SAVER_RENDITION`) au lieu du manifeste adaptatif.
6. **Fournisseur factice** : même forme d'URL que Bunny (`/api/dev-video/{jeton}/{videoId}/{fichier}`), jeton HMAC à durée courte vérifié par `verifyLocalVideoToken` ; secret dérivé de `PAYLOAD_SECRET`. Aucune URL non signée, même en développement.
7. **Webhooks Bunny** : `X-BunnyStream-Signature` = HMAC-SHA256 hexadécimal du corps brut, clé = clé d'API **en lecture seule** de la bibliothèque (`BUNNY_STREAM_WEBHOOK_SECRET`) ; bibliothèque contrôlée ; `EventId` remonté pour l'idempotence.

## Conséquences
- La route `/api/dev-video` (M3.6) et la route webhook vidéo restent à écrire ; elles s'appuient sur ces fonctions.
- À valider sur le compte réel (`TODO(client)`) : chemin exact des rendus et des sous-titres, activation du jeton sur la Pull Zone, désactivation du MP4 de repli.
- Changer de fournisseur = une classe `VideoProvider` et une branche du registre.
