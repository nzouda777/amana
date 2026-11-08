/**
 * Géométrie de la Trame (DESIGN §6) : réseau de khatams (étoiles à huit branches formées
 * de deux carrés, l'un tourné de 45°) reliés à leurs voisins par de courtes barres
 * orthogonales — entrelacs simplifié. Fonctions pures, testées : aucune dépendance au DOM.
 */

/** Pas du réseau dans l'espace du viewBox. */
export const CELL = 100
/**
 * Demi-diagonale du carré tourné. Volontairement inférieure à CELL / 2 : les étoiles
 * restent distinctes (essayé : pointes jointives, qui se lisaient comme une grille de
 * carrés et de losanges, voir docs/qa/design-journal.md).
 */
const R = CELL * 0.38
/** Demi-côté du carré droit (même carré que le tourné, pivoté de 45°). */
const A = R / Math.SQRT2
/** Nombre d'anneaux de délai pour le tracé radial. */
export const RINGS = 8

export type TrameStar = {
  /** Contour de l'étoile (deux carrés) puis barres vers les voisins de droite et du bas. */
  d: string
  /** Anneau de délai : 0 au coin supérieur de fin de ligne, RINGS − 1 au plus loin. */
  ring: number
}

export type TrameGeometry = {
  width: number
  height: number
  stars: TrameStar[]
}

const n = (value: number) => {
  const rounded = Math.round(value * 10) / 10
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

/**
 * Construit un réseau de `cols` × `rows` cellules. Les étoiles de bord débordent
 * volontairement d'une demi-cellule pour que le motif soit coupé net par le cadre.
 */
export function buildTrame(cols: number, rows: number): TrameGeometry {
  const safeCols = Math.max(1, Math.round(cols))
  const safeRows = Math.max(1, Math.round(rows))
  const width = safeCols * CELL
  const height = safeRows * CELL
  const stars: TrameStar[] = []
  // Origine du tracé : coin supérieur droit (fin de ligne en LTR ; miroir CSS en RTL).
  const maxDistance = Math.hypot(width + CELL / 2, height + CELL / 2)
  const bar = CELL - 2 * R

  for (let row = 0; row <= safeRows; row++) {
    for (let col = 0; col <= safeCols; col++) {
      const cx = col * CELL
      const cy = row * CELL
      const parts = [
        // Carré droit
        `M${n(cx - A)} ${n(cy - A)}h${n(2 * A)}v${n(2 * A)}h${n(-2 * A)}z`,
        // Carré tourné de 45°
        `M${n(cx)} ${n(cy - R)}l${n(R)} ${n(R)}l${n(-R)} ${n(R)}l${n(-R)} ${n(-R)}z`,
      ]
      // Barres vers le voisin de droite et celui du bas : l'entrelacs.
      if (col < safeCols) parts.push(`M${n(cx + R)} ${n(cy)}h${n(bar)}`)
      if (row < safeRows) parts.push(`M${n(cx)} ${n(cy + R)}v${n(bar)}`)
      const distance = Math.hypot(width - cx, cy)
      const ring = Math.min(RINGS - 1, Math.floor((distance / maxDistance) * RINGS))
      stars.push({ d: parts.join(''), ring })
    }
  }
  return { width, height, stars }
}
