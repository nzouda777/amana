import { notFound } from 'next/navigation'

/**
 * Toute URL inconnue sous une locale affiche la 404 du site (dans le gabarit, avec
 * en-tête et pied de page) plutôt que la page 404 brute de Next.
 */
export default function CatchAll(): never {
  notFound()
}
