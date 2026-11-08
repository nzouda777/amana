import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ImageResponse } from 'next/og'

import { buildTrame } from '@/components/brand/trame-geometry'
import { typographyFr } from '@/lib/typography'
import { palette } from '@/styles/palette'

import { OG_SIZE, SITE_NAME } from '../config'
import { clampText } from '../text'

/**
 * Images Open Graph aux couleurs de la marque (`next/og`) : fond vert profond, titre en
 * Baskervville, Trame simplifiée en or à droite, filet or en tête. Utilisées par les
 * fichiers `opengraph-image.tsx` (défaut/accueil sous `[locale]`, services, articles).
 *
 * Police : Baskervville Regular (SIL OFL 1.1, `fonts/OFL.txt`), copiée en TTF statique car
 * Satori ne lit ni le WOFF2 de `next/font` ni les polices variables. Lue depuis le disque
 * (runtime Node) : `process.cwd()` est la racine de l'application, en local comme en image
 * Docker (le fichier est suivi par le traçage de Next).
 */

let fontData: Promise<Buffer> | null = null

function loadFont(): Promise<Buffer> {
  fontData ??= readFile(join(process.cwd(), 'src/lib/seo/og/fonts/Baskervville-Regular.ttf'))
  return fontData
}

/** Trame 3 × 3 en SVG (traits or), en image de données pour Satori. */
function trameDataUri(): string {
  const { width, height, stars } = buildTrame(3, 3)
  const paths = stars.map((star) => `<path d="${star.d}"/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><g fill="none" stroke="${palette['gold-500']}" stroke-width="1.4" stroke-linejoin="miter">${paths}</g></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export type OgImageInput = {
  /** Titre principal (page, service, article). */
  title: string
  /** Surtitre : pôle, rubrique. */
  eyebrow?: string | null
  /** Ligne de signature sous le nom du cabinet. */
  tagline?: string | null
  locale: string
}

export async function renderOgImage(input: OgImageInput): Promise<ImageResponse> {
  const fr = (text: string) => (input.locale === 'fr' ? typographyFr(text) : text)
  const title = fr(clampText(input.title, 110))
  const size = title.length > 70 ? 56 : title.length > 40 ? 64 : 76
  const font = await loadFont()

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: palette['green-900'],
        color: palette.paper,
        fontFamily: 'Baskervville',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 8,
          backgroundColor: palette['gold-500'],
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori : pas de next/image */}
      <img
        alt=""
        src={trameDataUri()}
        width={OG_SIZE.height}
        height={OG_SIZE.height}
        style={{ position: 'absolute', top: 0, right: -120, opacity: 0.55 }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: 820,
          height: '100%',
          padding: '72px 0 64px 80px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {input.eyebrow ? (
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                letterSpacing: 1,
                color: palette['gold-200'],
              }}
            >
              {fr(input.eyebrow)}
            </div>
          ) : null}
          <div style={{ display: 'flex', fontSize: size, lineHeight: 1.15 }}>{title}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', fontSize: 40, color: palette.paper }}>{SITE_NAME}</div>
          {input.tagline ? (
            <div style={{ display: 'flex', fontSize: 24, color: palette['sand-300'] }}>
              {fr(clampText(input.tagline, 80))}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [{ name: 'Baskervville', data: font, weight: 400, style: 'normal' }],
    },
  )
}
