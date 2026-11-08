/**
 * Vérification structurelle des données structurées émises par le site : propriétés
 * requises ou recommandées par Google pour chaque type (Organization, ProfessionalService,
 * WebSite, BreadcrumbList, Article, Event, FAQPage, Course). Utilisée par les tests
 * unitaires et e2e ; ne remplace pas l'outil de test des résultats enrichis.
 */

type Node = Record<string, unknown>

const isObject = (value: unknown): value is Node =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
const isUrl = (value: unknown) => isText(value) && /^https?:\/\/[^\s]+$/.test(value)
const isIsoDate = (value: unknown) =>
  isText(value) && /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(value)
const isRef = (value: unknown) => isObject(value) && isText(value['@id'])

function checkNode(node: Node, path: string, errors: string[]): void {
  const type = node['@type']
  const need = (condition: boolean, message: string) => {
    if (!condition) errors.push(`${path} (${String(type)}) : ${message}`)
  }
  switch (type) {
    case 'Organization':
    case 'ProfessionalService':
      need(isText(node.name), 'name requis')
      need(isUrl(node.url), 'url absolue requise')
      if (type === 'Organization') need(isUrl(node.logo), 'logo absolu requis')
      if (node.address !== undefined)
        need(isObject(node.address) && isText(node.address.addressLocality), 'adresse incomplète')
      break
    case 'WebSite':
      need(isText(node.name), 'name requis')
      need(isUrl(node.url), 'url absolue requise')
      break
    case 'BreadcrumbList': {
      const items = node.itemListElement
      need(Array.isArray(items) && items.length > 0, 'itemListElement requis')
      if (Array.isArray(items))
        items.forEach((item: unknown, index) => {
          const last = index === items.length - 1
          need(
            isObject(item) && item['@type'] === 'ListItem' && item.position === index + 1,
            `étape ${index + 1} : ListItem à la position ${index + 1}`,
          )
          need(isObject(item) && isText(item.name), `étape ${index + 1} : name requis`)
          if (!last) need(isObject(item) && isUrl(item.item), `étape ${index + 1} : item absolu`)
        })
      break
    }
    case 'Article':
      need(isText(node.headline) && node.headline.length <= 110, 'headline ≤ 110 requis')
      need(isIsoDate(node.datePublished), 'datePublished ISO 8601 requis')
      need(Array.isArray(node.image) && node.image.every(isUrl), 'image absolue requise')
      need(
        Array.isArray(node.author) &&
          node.author.length > 0 &&
          node.author.every(
            (author: unknown) => isRef(author) || (isObject(author) && isText(author.name)),
          ),
        'author requis',
      )
      need(isRef(node.publisher), 'publisher requis')
      break
    case 'Event':
      need(isText(node.name), 'name requis')
      need(isIsoDate(node.startDate), 'startDate ISO 8601 requis')
      if (node.endDate !== undefined) need(isIsoDate(node.endDate), 'endDate ISO 8601')
      need(
        isObject(node.location) &&
          (node.location['@type'] === 'VirtualLocation'
            ? isUrl(node.location.url)
            : isText(node.location.name)),
        'location requise',
      )
      need(isText(node.eventAttendanceMode), 'eventAttendanceMode requis')
      break
    case 'FAQPage': {
      const questions = node.mainEntity
      need(Array.isArray(questions) && questions.length > 0, 'mainEntity requis')
      if (Array.isArray(questions))
        questions.forEach((question: unknown, index) =>
          need(
            isObject(question) &&
              question['@type'] === 'Question' &&
              isText(question.name) &&
              isObject(question.acceptedAnswer) &&
              isText(question.acceptedAnswer.text),
            `question ${index + 1} incomplète`,
          ),
        )
      break
    }
    case 'Course':
      need(isText(node.name), 'name requis')
      need(isText(node.description), 'description requise')
      need(isObject(node.provider), 'provider requis')
      break
    default:
      errors.push(`${path} : type inattendu ${String(type)}`)
  }
}

/** Liste des erreurs (vide si le document est valide). */
export function validateJsonLd(document: unknown): string[] {
  const errors: string[] = []
  if (!isObject(document) || document['@context'] !== 'https://schema.org')
    return ['@context https://schema.org requis']
  const graph = document['@graph']
  if (graph !== undefined) {
    if (!Array.isArray(graph) || graph.length === 0) return ['@graph vide']
    graph.forEach((node: unknown, index) => {
      if (isObject(node)) checkNode(node, `@graph[${index}]`, errors)
      else errors.push(`@graph[${index}] : objet attendu`)
    })
    return errors
  }
  checkNode(document, 'racine', errors)
  return errors
}
