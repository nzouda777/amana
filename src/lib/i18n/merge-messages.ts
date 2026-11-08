export type Messages = { [key: string]: string | Messages }

function isRecord(value: unknown): value is Messages {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Fusion profonde : les clés de `primary` l'emportent, les clés absentes sont
 * reprises de `fallback`. Sert au repli sur le français pour les messages d'interface.
 */
export function mergeMessages(fallback: Messages, primary: Messages): Messages {
  const result: Messages = { ...fallback }
  for (const [key, value] of Object.entries(primary)) {
    const base = result[key]
    result[key] = isRecord(base) && isRecord(value) ? mergeMessages(base, value) : value
  }
  return result
}
