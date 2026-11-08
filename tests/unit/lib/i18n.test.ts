import { describe, expect, it } from 'vitest'

import ar from '../../../messages/ar.json'
import en from '../../../messages/en.json'
import fr from '../../../messages/fr.json'
import { getDirection, isLocale, locales } from '@/lib/i18n/config'
import { mergeMessages, type Messages } from '@/lib/i18n/merge-messages'
import { pathnames } from '@/lib/i18n/routing'

function keys(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
  )
}

describe('locales', () => {
  it('fr par défaut, ar en RTL', () => {
    expect(locales).toEqual(['fr', 'en', 'ar'])
    expect(getDirection('ar')).toBe('rtl')
    expect(getDirection('fr')).toBe('ltr')
    expect(getDirection('en')).toBe('ltr')
    expect(isLocale('de')).toBe(false)
  })
})

describe('messages', () => {
  it('le français couvre toutes les clés des autres langues', () => {
    const frKeys = new Set(keys(fr))
    for (const key of [...keys(en), ...keys(ar)]) expect(frKeys.has(key), key).toBe(true)
  })

  it('aucune clé manquante en anglais ni en arabe par rapport au français', () => {
    const frKeys = keys(fr)
    const enKeys = new Set(keys(en))
    const arKeys = new Set(keys(ar))
    expect(frKeys.filter((key) => !enKeys.has(key))).toEqual([])
    expect(frKeys.filter((key) => !arKeys.has(key))).toEqual([])
  })

  it('anglais traduit : aucune valeur à traduire, mêmes variables ICU qu’en français', () => {
    const flat = (messages: Messages, prefix = ''): Array<[string, string]> =>
      Object.entries(messages).flatMap(([key, value]) =>
        typeof value === 'string' ? [[`${prefix}${key}`, value]] : flat(value, `${prefix}${key}.`),
      )
    const frValues = new Map(flat(fr))
    // Arguments ICU : une accolade ouvrante à profondeur paire ouvre un argument ({name} ou
    // {name, plural, …}) ; à profondeur impaire, un sous-message (« one {…} »), ignoré.
    const args = (text: string) => {
      const names: string[] = []
      let depth = 0
      for (let index = 0; index < text.length; index++) {
        const char = text[index]
        if (char === '{') {
          if (depth % 2 === 0) names.push(/^\{\s*(\w+)/.exec(text.slice(index))?.[1] ?? '')
          depth++
        } else if (char === '}') depth--
      }
      return names.sort()
    }
    for (const [key, value] of flat(en)) {
      expect(value, key).not.toMatch(/TODO\(translation\)/)
      expect(args(value), key).toEqual(args(frValues.get(key) ?? ''))
    }
  })

  it('repli sur le français pour les clés manquantes', () => {
    const merged = mergeMessages(
      { a: 'fr-a', nested: { b: 'fr-b', c: 'fr-c' } },
      { nested: { b: 'en-b' } },
    )
    expect(merged).toEqual({ a: 'fr-a', nested: { b: 'en-b', c: 'fr-c' } })
  })
})

describe('pathnames', () => {
  it('traduit chaque route en anglais et garde les mêmes paramètres', () => {
    for (const [internal, value] of Object.entries(pathnames)) {
      if (typeof value === 'string') continue
      const params = (path: string) => (path.match(/\[[^\]]+\]/g) ?? []).join()
      expect(value.fr, internal).toBe(internal)
      expect(params(value.en), internal).toBe(params(internal))
      expect(params(value.ar), internal).toBe(params(internal))
    }
  })

  it('n’a pas deux routes anglaises identiques', () => {
    const english = Object.values(pathnames).map((value) =>
      typeof value === 'string' ? value : value.en,
    )
    expect(new Set(english).size).toBe(english.length)
  })
})
