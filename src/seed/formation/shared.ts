/** Mentions communes aux contenus de formation de démonstration. */
import { p } from '../lib/richtext'

/** Signalement du contenu fictif (fiche cours, admin). */
export const DEMO_NOTICE =
  'Contenu de démonstration. TODO(client) : programme, textes, vidéos et formateurs définitifs.'

/** Garde-fou métier (CLAUDE.md) : le site informe et forme, il ne délivre pas de fatwa. */
export const NO_FATWA =
  'Ce cours informe et forme. Il ne délivre pas de fatwa et ne remplace ni l’avis du comité de conformité de votre établissement ni un conseil financier personnalisé.'

/** Pied de description commun à tous les cours et capsules. */
export const descriptionFooter = () => [p(`_${NO_FATWA}_`), p(`_${DEMO_NOTICE}_`)]

/** Réponses d'une question vrai/faux. */
export function trueFalse(
  answer: boolean,
  feedback: { onTrue: string; onFalse: string },
): Array<{ text: string; correct: boolean; feedback: string }> {
  return [
    { text: 'Vrai', correct: answer, feedback: feedback.onTrue },
    { text: 'Faux', correct: !answer, feedback: feedback.onFalse },
  ]
}
