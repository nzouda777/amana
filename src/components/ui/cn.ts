/**
 * Concaténation conditionnelle de classes. Pas de fusion « intelligente » : les
 * composants n'acceptent `className` que pour la mise en page (marges, largeur,
 * placement), jamais pour réécrire leurs couleurs ou leur typographie.
 */
export { cx as cn } from 'class-variance-authority'
export type { VariantProps } from 'class-variance-authority'
