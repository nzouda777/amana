import { describe, expect, it } from 'vitest'

import { validateQuestionAnswers } from '@/features/lms/quiz'
import { NARROW_NBSP, NBSP } from '@/lib/typography'
import { categoriesSeed } from '@/seed/categories'
import {
  buildCourseData,
  buildLessonData,
  buildQuestionData,
  coursePdfs,
  DEMO_VIDEO_ID_PATTERN,
  demoLessonVideoId,
  demoTrailerVideoId,
  pdfDocumentLines,
} from '@/seed/formation/build'
import { CAPSULE_QUIZ_MINUTES, capsulesSeed } from '@/seed/formation/capsules'
import { catalogSeed, coursesSeed } from '@/seed/formation'
import { instructorsSeed } from '@/seed/formation/instructors'
import {
  courseProductSlug,
  coursePricesXaf,
  DEMO_PRICE_NOTICE,
  packsSeed,
  pathProductSlug,
  pathsSeed,
} from '@/seed/formation/offers'
import { DEMO_NOTICE, NO_FATWA } from '@/seed/formation/shared'
import type { CourseSeed, LessonSeed } from '@/seed/formation/types'
import type { IdMap } from '@/seed/lib/upsert'

/** Garde-fous du jeu de démonstration Formation (aucune base requise). */

const FORBIDDEN_SPELLINGS = /\b(murabaha|musharaka|mudaraba|sharia|shariah|ijarah)\b/i
/** Fausse urgence ou fausse rareté dans un texte commercial (CLAUDE.md). */
const FALSE_URGENCY =
  /offre limitée|dernières places|plus que \d|places limitées|expire|compte à rebours/i
const JOB_ROLES = ['compliance', 'front-office', 'back-office', 'management'] as const

function idMap(keys: readonly string[]): IdMap {
  return new Map(keys.map((key, index) => [key, index + 1]))
}

const refs = {
  themes: idMap(categoriesSeed.map((c) => c.slug)),
  instructors: idMap(instructorsSeed.map((i) => i.key)),
}

const lessonsOf = (course: CourseSeed): LessonSeed[] => course.modules.flatMap((m) => m.lessons)

function plainText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(plainText).join(' ')
  if (typeof value === 'object' && value !== null) {
    const node = value as { text?: unknown; children?: unknown; root?: unknown }
    return [node.text, node.children, node.root].map(plainText).join(' ')
  }
  return ''
}

function lessonRefs(course: CourseSeed) {
  return {
    moduleId: 1,
    order: 1,
    courseSlug: course.slug,
    quizzes: idMap(course.quizzes.map((q) => q.key)),
    pdfs: idMap(coursePdfs(course).map((pdf) => pdf.file)),
  }
}

describe('seed formation — inventaire', () => {
  it('6 cours pour particuliers et 12 capsules entreprises', () => {
    expect(coursesSeed).toHaveLength(6)
    expect(capsulesSeed).toHaveLength(12)
    for (const course of coursesSeed) {
      expect(course.format, course.slug).toBe('course')
      expect(course.audience, course.slug).toBe('individual')
    }
    for (const capsule of capsulesSeed) {
      expect(capsule.format, capsule.slug).toBe('capsule')
      expect(capsule.audience, capsule.slug).toBe('business')
    }
  })

  it('2 parcours et 3 packs', () => {
    expect(pathsSeed).toHaveLength(2)
    expect(packsSeed).toHaveLength(3)
  })

  it('slugs uniques : catalogue, produits', () => {
    const courseSlugs = catalogSeed.map((c) => c.slug)
    expect(new Set(courseSlugs).size).toBe(courseSlugs.length)
    const productSlugs = [
      ...coursesSeed.map((c) => courseProductSlug(c.slug)),
      ...pathsSeed.map((p) => pathProductSlug(p.slug)),
      ...packsSeed.map((p) => p.slug),
    ]
    expect(new Set(productSlugs).size).toBe(productSlugs.length)
  })

  it('thèmes et formateurs référencés existent', () => {
    for (const course of catalogSeed) {
      expect(course.themes.length, course.slug).toBeGreaterThan(0)
      for (const theme of course.themes)
        expect(refs.themes.has(theme), `${course.slug} → ${theme}`).toBe(true)
      expect(course.instructors.length, course.slug).toBeGreaterThan(0)
      for (const key of course.instructors)
        expect(refs.instructors.has(key), `${course.slug} → ${key}`).toBe(true)
    }
  })

  it('parcours et packs ne référencent que des cours et capsules semés', () => {
    const courses = new Set(coursesSeed.map((c) => c.slug))
    const capsules = new Set(capsulesSeed.map((c) => c.slug))
    for (const path of pathsSeed) {
      expect(path.courses.length).toBeGreaterThanOrEqual(2)
      for (const slug of path.courses) expect(courses, path.slug).toContain(slug)
    }
    for (const pack of packsSeed) {
      expect(pack.capsules.length).toBeGreaterThanOrEqual(3)
      for (const slug of pack.capsules) expect(capsules, pack.slug).toContain(slug)
    }
  })
})

describe('seed formation — cours', () => {
  it.each(coursesSeed)('$slug : modules, leçons de tous types, extrait gratuit, quiz', (course) => {
    expect(course.modules.length).toBeGreaterThanOrEqual(3)
    const lessons = lessonsOf(course)
    const types = new Set(lessons.map((l) => l.type))
    for (const type of ['video', 'text', 'pdf', 'case-study', 'quiz'] as const)
      expect(types).toContain(type)
    expect(lessons.some((l) => l.preview === true)).toBe(true)
    // Les extraits sont au début du cours, pas une leçon d'évaluation.
    for (const lesson of lessons.filter((l) => l.preview)) expect(lesson.type).not.toBe('quiz')
    expect(course.objectives.length).toBeGreaterThanOrEqual(3)
    expect(course.certificateEnabled).toBe(true)
  })

  it('au moins trois cours à la une', () => {
    expect(coursesSeed.filter((c) => c.featured).length).toBeGreaterThanOrEqual(3)
  })

  it.each(catalogSeed)('$slug : slugs de leçons uniques et valides, durées positives', (course) => {
    const slugs = lessonsOf(course).map((l) => l.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    for (const lesson of lessonsOf(course)) expect(lesson.minutes, lesson.slug).toBeGreaterThan(0)
  })
})

describe('seed formation — capsules', () => {
  it.each(capsulesSeed)('$slug : une vidéo de 3 à 10 min et un mini-quiz', (capsule) => {
    expect(capsule.modules).toHaveLength(1)
    const lessons = lessonsOf(capsule)
    expect(lessons.map((l) => l.type)).toEqual(['video', 'quiz'])
    const total = lessons.reduce((sum, l) => sum + l.minutes, 0)
    expect(total).toBeGreaterThanOrEqual(3)
    expect(total).toBeLessThanOrEqual(10)
    expect(capsule.subtitle).toContain(`${total} minutes`)
    expect(capsule.jobRoles?.length ?? 0).toBeGreaterThan(0)
    expect(capsule.includedInPass).toBe(false)
  })

  it('le mini-quiz dure 2 minutes', () => {
    expect(CAPSULE_QUIZ_MINUTES).toBe(2)
  })

  it.each(JOB_ROLES)('au moins trois capsules pour le métier %s', (role) => {
    expect(capsulesSeed.filter((c) => c.jobRoles?.includes(role)).length).toBeGreaterThanOrEqual(3)
  })
})

describe('seed formation — quiz', () => {
  const quizzes = catalogSeed.flatMap((course) => course.quizzes.map((quiz) => ({ course, quiz })))

  it.each(quizzes.map(({ course, quiz }) => [`${course.slug}/${quiz.key}`, course, quiz] as const))(
    '%s : questions valides, une bonne réponse au moins, feedback partout',
    (_name, _course, quiz) => {
      expect(quiz.questions.length).toBeGreaterThanOrEqual(3)
      expect(quiz.passingScorePercent).toBeGreaterThan(0)
      expect(quiz.passingScorePercent).toBeLessThanOrEqual(100)
      expect(quiz.maxAttempts).toBeGreaterThanOrEqual(0)
      for (const question of quiz.questions) {
        const answers = question.answers.map((a) => ({ isCorrect: a.correct === true }))
        expect(validateQuestionAnswers(question.kind, answers), question.prompt).toBe(true)
        expect(question.explanation.length, question.prompt).toBeGreaterThan(0)
        for (const answer of question.answers)
          expect(answer.feedback.length, answer.text).toBeGreaterThan(0)
      }
    },
  )

  it.each(catalogSeed)(
    '$slug : chaque quiz est utilisé, chaque référence de quiz existe',
    (course) => {
      const keys = new Set(course.quizzes.map((q) => q.key))
      expect(keys.size).toBe(course.quizzes.length)
      const used = new Set<string>()
      for (const moduleSeed of course.modules) {
        if (moduleSeed.gateQuiz) used.add(moduleSeed.gateQuiz)
        for (const lesson of moduleSeed.lessons) if (lesson.type === 'quiz') used.add(lesson.quiz)
      }
      expect([...used].sort()).toEqual([...keys].sort())
      const titles = course.quizzes.map((q) => q.title)
      expect(new Set(titles).size).toBe(titles.length)
    },
  )

  it('les bonnes réponses sont stockées, avec leur retour', () => {
    const question = basesQuestion()
    const data = buildQuestionData(question, 7, 1)
    expect(data.quiz).toBe(7)
    expect(data.answers.filter((a) => a.isCorrect)).toHaveLength(1)
    expect(data.answers.every((a) => typeof a.feedback === 'string' && a.feedback.length > 0)).toBe(
      true,
    )
  })

  it('un gateQuiz est défini sur au moins deux cours', () => {
    expect(
      coursesSeed.filter((c) => c.modules.some((m) => m.gateQuiz)).length,
    ).toBeGreaterThanOrEqual(2)
  })
})

function basesQuestion() {
  const question = coursesSeed[0]?.quizzes[0]?.questions[0]
  if (!question) throw new Error('question attendue')
  return question
}

describe('seed formation — vidéos de démonstration', () => {
  it('identifiants `demo-…` uniques et au format attendu', () => {
    const ids: string[] = []
    for (const course of catalogSeed) {
      const trailer = buildCourseData(course, refs).trailer?.videoId
      expect(trailer).toBe(demoTrailerVideoId(course.slug))
      ids.push(trailer ?? '')
      for (const lesson of lessonsOf(course).filter((l) => l.type === 'video')) {
        const data = buildLessonData(lesson, lessonRefs(course))
        expect(data.video?.provider).toBe('bunny')
        expect(data.video?.videoId).toBe(demoLessonVideoId(course.slug, lesson.slug))
        expect(data.video?.durationSeconds).toBe(lesson.minutes * 60)
        ids.push(data.video?.videoId ?? '')
      }
    }
    for (const id of ids) {
      expect(id).toMatch(DEMO_VIDEO_ID_PATTERN)
      // Format accepté par le fournisseur local de dev (`src/features/lms/video/local.ts`).
      expect(id).toMatch(/^[A-Za-z0-9_-]{1,64}$/)
    }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('les leçons non vidéo n’ont pas d’identifiant vidéo', () => {
    for (const course of catalogSeed)
      for (const lesson of lessonsOf(course).filter((l) => l.type !== 'video'))
        expect(buildLessonData(lesson, lessonRefs(course)).video?.videoId ?? null).toBeNull()
  })
})

describe('seed formation — construction des documents', () => {
  it('résout PDF et quiz ; échoue sur une référence inconnue', () => {
    for (const course of coursesSeed) {
      for (const lesson of lessonsOf(course)) {
        const data = buildLessonData(lesson, lessonRefs(course))
        if (lesson.type === 'pdf') expect(typeof data.pdf).toBe('number')
        if (lesson.type === 'quiz') expect(typeof data.quiz).toBe('number')
        if (lesson.type === 'text' || lesson.type === 'case-study') expect(data.body).not.toBeNull()
        if (lesson.type === 'video') expect(data.transcript).not.toBeNull()
      }
    }
    const lesson: LessonSeed = { type: 'quiz', slug: 'x', title: 'X', minutes: 1, quiz: 'absent' }
    expect(() => buildLessonData(lesson, { ...lessonRefs(coursesSeed[0] as CourseSeed) })).toThrow(
      /absent/,
    )
  })

  it('n’attribue des métiers qu’aux capsules', () => {
    for (const course of coursesSeed) expect(buildCourseData(course, refs).jobRoles).toEqual([])
    for (const capsule of capsulesSeed)
      expect(buildCourseData(capsule, refs).jobRoles?.length ?? 0).toBeGreaterThan(0)
  })

  it('applique la typographie française', () => {
    const takaful = coursesSeed.find((c) => c.slug === 'takaful-assurance-islamique')
    if (!takaful) throw new Error('cours takaful attendu')
    const data = buildCourseData(takaful, refs)
    expect(data.title).toBe(`Takaful${NBSP}: comprendre l’assurance islamique`)
    const question = buildQuestionData(
      { kind: 'single', prompt: "Qu'est-ce que le riba ?", answers: [], explanation: 'x' },
      1,
      1,
    )
    expect(question.prompt).toBe(`Qu’est-ce que le riba${NARROW_NBSP}?`)
    expect(plainText(data.description)).toContain(`Au programme`)
  })

  it('les PDF provisoires sont en ASCII', () => {
    for (const course of catalogSeed)
      for (const pdf of coursePdfs(course))
        for (const line of pdfDocumentLines(course, pdf)) expect(line).toMatch(/^[\x20-\x7e]*$/)
  })
})

describe('seed formation — garde-fous et SEO', () => {
  it.each(catalogSeed)('$slug : SEO ≤ 60 / ≤ 155 après typographie', (course) => {
    const { seo } = buildCourseData(course, refs)
    expect(seo?.title?.length ?? 0).toBeLessThanOrEqual(60)
    expect(seo?.description?.length ?? 0).toBeLessThanOrEqual(155)
    expect(seo?.description?.length ?? 0).toBeGreaterThan(50)
  })

  it.each(pathsSeed)('parcours $slug : SEO ≤ 60 / ≤ 155', (path) => {
    expect(path.seo.title.length).toBeLessThanOrEqual(60)
    expect(path.seo.description.length).toBeLessThanOrEqual(155)
  })

  it.each(catalogSeed)(
    '$slug : avertissement « pas de fatwa » et contenu signalé TODO(client)',
    (course) => {
      const text = plainText(buildCourseData(course, refs).description)
      expect(text).toContain('Il ne délivre pas de fatwa')
      expect(text).toContain('TODO(client)')
    },
  )

  it('les mentions communes sont signalées', () => {
    expect(DEMO_NOTICE).toContain('TODO(client)')
    expect(DEMO_PRICE_NOTICE).toContain('TODO(client)')
    expect(NO_FATWA).toMatch(/fatwa/)
    for (const instructor of instructorsSeed) {
      expect(instructor.lastName).toContain('(démo)')
      expect(instructor.email).toMatch(/@amana-conseil\.example$/)
    }
  })

  it('prix XAF entiers, ronds, groupés moins chers que l’achat séparé', () => {
    const prices = [
      ...Object.values(coursePricesXaf),
      ...pathsSeed.map((p) => p.priceXaf),
      ...packsSeed.map((p) => p.priceXaf),
    ]
    for (const price of prices) {
      expect(Number.isSafeInteger(price)).toBe(true)
      expect(price).toBeGreaterThan(0)
      expect(price % 5_000).toBe(0)
    }
    for (const course of coursesSeed)
      expect(coursePricesXaf[course.slug], course.slug).toBeDefined()
    for (const path of pathsSeed) {
      const separately = path.courses.reduce((sum, slug) => sum + (coursePricesXaf[slug] ?? 0), 0)
      expect(path.priceXaf).toBeLessThan(separately)
    }
  })

  it('aucune fausse urgence ni fausse rareté dans les textes commerciaux', () => {
    const texts = [
      ...catalogSeed.flatMap((c) => [
        c.title,
        c.subtitle,
        c.summary,
        c.seo.title,
        c.seo.description,
      ]),
      ...pathsSeed.flatMap((p) => [p.title, p.summary, plainText(p.description)]),
      ...packsSeed.flatMap((p) => [p.title, p.description]),
    ]
    for (const text of texts) expect(text).not.toMatch(FALSE_URGENCY)
  })

  it('emploie la translittération française', () => {
    for (const course of catalogSeed) {
      const text = plainText([
        course.title,
        course.summary,
        course.description,
        course.objectives,
        course.modules.map((m) => [
          m.title,
          m.description,
          m.lessons.map((l) => [
            l.title,
            l.type === 'video' ? l.transcript : null,
            l.type === 'text' || l.type === 'case-study' ? l.body : null,
          ]),
        ]),
        course.quizzes.map((q) =>
          q.questions.map((qq) => [
            qq.prompt,
            qq.explanation,
            qq.answers.map((a) => [a.text, a.feedback]),
          ]),
        ),
      ])
      expect(text, course.slug).not.toMatch(FORBIDDEN_SPELLINGS)
    }
  })
})
