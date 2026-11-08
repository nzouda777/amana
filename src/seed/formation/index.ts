/**
 * Seed du pôle Formation (M3.2) : formateurs, 6 cours, 12 capsules, 2 parcours, 3 packs
 * et leurs produits. Rejouable et idempotent :
 * - cours, parcours, produits : repérés par leur slug ;
 * - quiz : cours + titre ; questions : quiz + ordre ;
 * - modules : cours + ordre ; leçons : cours + slug ;
 * - ce qui a disparu du jeu de données (leçon, module, question, quiz) est supprimé, pour
 *   les seuls cours semés ici.
 * Ordre d'écriture : cours → supports PDF → quiz et questions → modules → leçons, puis
 * élagage. La durée du cours est recalculée par le hook des leçons.
 */
import { typographyFr } from '@/lib/typography'

import { ensurePlaceholderDocument } from '../lib/documents'
import { p } from '../lib/richtext'
import { type IdMap, idsOf, prune, type Seeder, upsert, upsertWhere } from '../lib/upsert'
import {
  buildCourseData,
  buildLessonData,
  buildModuleData,
  buildQuestionData,
  buildQuizData,
  coursePdfs,
  pdfDocumentLines,
  pdfDocumentTitle,
  pdfFileName,
  richFr,
} from './build'
import { capsulesSeed } from './capsules'
import {
  banqueParticipative,
  basesFinanceIslamique,
  ethiqueDesAffaires,
} from './courses-fondamentaux'
import { auditConformiteCharia, sukuk, takaful } from './courses-specialises'
import { seedInstructors } from './instructors'
import {
  courseProductSlug,
  coursePricesXaf,
  DEMO_PRICE_NOTICE,
  packsSeed,
  pathProductSlug,
  pathsSeed,
} from './offers'
import { DEMO_NOTICE } from './shared'
import type { CourseSeed } from './types'

/** Cours pour particuliers, dans l'ordre d'affichage. */
export const coursesSeed: CourseSeed[] = [
  basesFinanceIslamique,
  takaful,
  banqueParticipative,
  ethiqueDesAffaires,
  auditConformiteCharia,
  sukuk,
]

/** Tout le catalogue semé : cours et capsules. */
export const catalogSeed: CourseSeed[] = [...coursesSeed, ...capsulesSeed]

export type FormationRefs = { courses: IdMap; paths: IdMap; products: IdMap }

async function seedCourse(
  seeder: Seeder,
  course: CourseSeed,
  refs: { themes: IdMap; instructors: IdMap },
): Promise<number> {
  const { id: courseId } = await upsert(
    seeder,
    'courses',
    { field: 'slug', value: course.slug },
    buildCourseData(course, refs),
  )

  const pdfs: IdMap = new Map()
  for (const pdf of coursePdfs(course)) {
    const id = await ensurePlaceholderDocument(seeder, {
      title: pdfDocumentTitle(course, pdf),
      kind: 'lesson-resource',
      fileName: pdfFileName(course, pdf),
      lines: pdfDocumentLines(course, pdf),
    })
    pdfs.set(pdf.file, id)
  }

  const quizzes: IdMap = new Map()
  for (const quiz of course.quizzes) {
    const data = buildQuizData(quiz, courseId)
    const { id: quizId } = await upsertWhere(
      seeder,
      'quizzes',
      { and: [{ course: { equals: courseId } }, { title: { equals: data.title } }] },
      data,
    )
    quizzes.set(quiz.key, quizId)
    const questionIds: number[] = []
    for (const [index, question] of quiz.questions.entries()) {
      const order = index + 1
      const { id } = await upsertWhere(
        seeder,
        'questions',
        { and: [{ quiz: { equals: quizId } }, { order: { equals: order } }] },
        buildQuestionData(question, quizId, order),
      )
      questionIds.push(id)
    }
    await prune(seeder, 'questions', { field: 'quiz', id: quizId }, questionIds)
  }

  const moduleIds: number[] = []
  const lessonIds: number[] = []
  for (const [moduleIndex, moduleSeed] of course.modules.entries()) {
    const order = moduleIndex + 1
    const gateQuizId =
      moduleSeed.gateQuiz === undefined ? null : (idsOf(quizzes, [moduleSeed.gateQuiz])[0] ?? null)
    const { id: moduleId } = await upsertWhere(
      seeder,
      'modules',
      { and: [{ course: { equals: courseId } }, { order: { equals: order } }] },
      buildModuleData(moduleSeed, courseId, order, gateQuizId),
    )
    moduleIds.push(moduleId)
    for (const [lessonIndex, lesson] of moduleSeed.lessons.entries()) {
      const { id } = await upsertWhere(
        seeder,
        'lessons',
        { and: [{ course: { equals: courseId } }, { slug: { equals: lesson.slug } }] },
        buildLessonData(lesson, {
          moduleId,
          order: lessonIndex + 1,
          courseSlug: course.slug,
          quizzes,
          pdfs,
        }),
      )
      lessonIds.push(id)
    }
  }

  // Élagage : leçons d'abord (elles référencent modules et quiz), puis modules, puis quiz.
  await prune(seeder, 'lessons', { field: 'course', id: courseId }, lessonIds)
  await prune(seeder, 'modules', { field: 'course', id: courseId }, moduleIds)
  const staleQuizzes = await seeder.payload.find({
    collection: 'quizzes',
    where: { and: [{ course: { equals: courseId } }, { id: { not_in: [...quizzes.values()] } }] },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  for (const stale of staleQuizzes.docs)
    await prune(seeder, 'questions', { field: 'quiz', id: stale.id }, [])
  await prune(seeder, 'quizzes', { field: 'course', id: courseId }, [...quizzes.values()])

  return courseId
}

export async function seedFormation(seeder: Seeder, themes: IdMap): Promise<FormationRefs> {
  const instructors = await seedInstructors(seeder)

  const courses: IdMap = new Map()
  for (const course of catalogSeed) {
    courses.set(course.slug, await seedCourse(seeder, course, { themes, instructors }))
  }

  const paths: IdMap = new Map()
  for (const path of pathsSeed) {
    const doc = await upsert(
      seeder,
      'paths',
      { field: 'slug', value: path.slug },
      {
        title: typographyFr(path.title),
        slug: path.slug,
        summary: typographyFr(path.summary),
        description: richFr([...path.description, p(`_${DEMO_NOTICE}_`)]),
        courses: idsOf(courses, path.courses),
        certificateEnabled: true,
        seo: {
          title: typographyFr(path.seo.title),
          description: typographyFr(path.seo.description),
          noIndex: false,
        },
        _status: 'published',
      },
    )
    paths.set(path.slug, doc.id)
  }

  const products: IdMap = new Map()
  const productDescription = (text: string) => typographyFr(`${text} ${DEMO_PRICE_NOTICE}`)

  for (const course of coursesSeed) {
    const price = coursePricesXaf[course.slug]
    if (price === undefined)
      throw new Error(`Seed : prix manquant pour le cours « ${course.slug} ».`)
    const slug = courseProductSlug(course.slug)
    const doc = await upsert(
      seeder,
      'products',
      { field: 'slug', value: slug },
      {
        title: typographyFr(course.title),
        slug,
        kind: 'course',
        active: true,
        audience: 'individual',
        description: productDescription(course.summary),
        course: idsOf(courses, [course.slug])[0] ?? null,
        price,
        compareAtPrice: null,
      },
    )
    products.set(slug, doc.id)
  }

  for (const path of pathsSeed) {
    const slug = pathProductSlug(path.slug)
    const doc = await upsert(
      seeder,
      'products',
      { field: 'slug', value: slug },
      {
        title: typographyFr(path.title),
        slug,
        kind: 'path',
        active: true,
        audience: 'individual',
        description: productDescription(path.summary),
        path: paths.get(path.slug) ?? null,
        price: path.priceXaf,
        compareAtPrice: null,
      },
    )
    products.set(slug, doc.id)
  }

  for (const pack of packsSeed) {
    const doc = await upsert(
      seeder,
      'products',
      { field: 'slug', value: pack.slug },
      {
        title: typographyFr(pack.title),
        slug: pack.slug,
        kind: 'capsule-pack',
        active: true,
        audience: 'business',
        description: productDescription(pack.description),
        courses: idsOf(courses, pack.capsules),
        price: pack.priceXaf,
        compareAtPrice: null,
      },
    )
    products.set(pack.slug, doc.id)
  }

  return { courses, paths, products }
}
