import { Baskervville, IBM_Plex_Sans_Arabic, Noto_Naskh_Arabic, Open_Sans } from 'next/font/google'

/**
 * Polices auto-hébergées par next/font (aucune requête vers Google côté visiteur).
 * Chaque police expose une variable CSS ; `tokens.css` compose `--font-display` et
 * `--font-sans` à partir d'elles, et les résout autrement pour `:lang(ar)`.
 *
 * Préchargement : seules les graisses réellement utilisées sur les pages latines
 * (Baskervville 400 droit et italique, Open Sans 400–600) sont préchargées, pour le
 * sous-ensemble `latin`. Le sous-ensemble `latin-ext` reste déclaré (unicode-range) et
 * ne se télécharge que si un caractère l'exige (noms propres, translittérations).
 * Les polices arabes ne sont jamais préchargées : elles ne servent qu'à la locale `ar`.
 */

export const baskervville = Baskervville({
  weight: '400',
  style: ['normal', 'italic'],
  // Sous-ensembles préchargés ; latin-ext reste servi à la demande (unicode-range).
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-baskervville',
  adjustFontFallback: true,
})

export const openSans = Open_Sans({
  weight: ['400', '600'],
  // Sous-ensembles préchargés ; latin-ext reste servi à la demande (unicode-range).
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
})

export const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: '400',
  subsets: ['arabic'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-naskh-arabic',
})

export const plexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ['400', '600'],
  subsets: ['arabic'],
  display: 'swap',
  preload: false,
  variable: '--font-plex-arabic',
})

/** Classes à poser sur `<html>` : déclarent les variables de toutes les familles. */
export const fontVariables = [
  baskervville.variable,
  openSans.variable,
  notoNaskhArabic.variable,
  plexSansArabic.variable,
].join(' ')
