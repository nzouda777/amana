import type { NumberField } from 'payload'

type XafFieldOptions = {
  name: string
  label: { fr: string; en: string }
  required?: boolean
  allowNegative?: boolean
  admin?: NumberField['admin']
}

/** Montant XAF entier (ADR 004). */
export function xafField({
  name,
  label,
  required = false,
  allowNegative = false,
  admin,
}: XafFieldOptions): NumberField {
  return {
    name,
    type: 'number',
    label,
    required,
    min: allowNegative ? undefined : 0,
    admin: {
      step: 1,
      description: { fr: 'Francs CFA (XAF), entier.', en: 'CFA francs (XAF), integer.' },
      ...admin,
    },
    validate: (value: number | null | undefined) => {
      if (value === null || value === undefined) return required ? 'Montant requis.' : true
      if (!Number.isSafeInteger(value)) return 'Le montant XAF doit être un entier.'
      if (!allowNegative && value < 0) return 'Le montant ne peut pas être négatif.'
      return true
    },
  }
}

/** Taux en points de base (1 % = 100, 19,25 % = 1925) : pas de flottant stocké. */
export function basisPointsField(name: string, label: { fr: string; en: string }): NumberField {
  return {
    name,
    type: 'number',
    label,
    min: 0,
    max: 10_000,
    admin: {
      step: 1,
      description: { fr: 'Points de base : 1 % = 100.', en: 'Basis points: 1% = 100.' },
    },
    validate: (value: number | null | undefined) =>
      value === null || value === undefined || Number.isInteger(value) || 'Entier attendu.',
  }
}
