import { Briefcase, FileDown, FileText, ListChecks, PlayCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Accordion, AccordionItem } from '@/components/ui/Disclosure'
import { Badge } from '@/components/ui/Badge'
import { isPreviewable, type PublicModule } from '@/features/lms/course-page'
import type { LessonType } from '@/features/lms/progress'
import type { Locale } from '@/lib/i18n/config'

import { PreviewButton } from './PreviewButton'

const icons: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  text: FileText,
  pdf: FileDown,
  quiz: ListChecks,
  'case-study': Briefcase,
}

/**
 * Programme dépliable (DESIGN §9) : modules en accordéon, leçons avec type et durée.
 * Les extraits gratuits s'ouvrent sur place ; aucun contenu de leçon n'est dans le HTML.
 */
export async function CourseOutline({
  courseId,
  modules,
  locale,
  formatDuration,
}: {
  courseId: number
  modules: readonly PublicModule[]
  locale: Locale
  formatDuration: (minutes: number) => string
}) {
  const t = await getTranslations({ locale, namespace: 'learn.course' })
  const tl = await getTranslations({ locale, namespace: 'learn' })
  if (modules.length === 0) return <p className="text-body text-ink-muted">{t('outlineEmpty')}</p>
  return (
    <Accordion type="multiple" defaultValue={modules[0] ? [String(modules[0].id)] : []}>
      {modules.map((module, index) => (
        <AccordionItem
          key={module.id}
          value={String(module.id)}
          headingLevel={3}
          title={
            <span className="flex flex-col gap-1">
              <span>{t('moduleTitle', { number: index + 1, title: module.title })}</span>
              <span className="text-small font-regular text-ink-muted">
                {t('moduleMeta', {
                  count: module.lessons.length,
                  duration: formatDuration(module.durationMinutes),
                })}
              </span>
            </span>
          }
        >
          {module.description ? <p className="mb-4">{module.description}</p> : null}
          <ol className="flex flex-col">
            {module.lessons.map((lesson) => {
              const Icon = icons[lesson.type]
              return (
                <li
                  key={lesson.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line py-3 first:border-t-0"
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-green-700" />
                  <span className="sr-only">{tl(`lessonTypes.${lesson.type}`)} :</span>
                  <span className="min-w-0 flex-1 text-body text-ink">{lesson.title}</span>
                  {lesson.isPreview ? <Badge tone="gold">{t('freePreview')}</Badge> : null}
                  {lesson.durationMinutes > 0 ? (
                    <span className="tabular text-small text-ink-muted">
                      {formatDuration(lesson.durationMinutes)}
                    </span>
                  ) : null}
                  {isPreviewable(lesson) ? (
                    <PreviewButton
                      target={{
                        kind: 'lesson',
                        courseId,
                        lessonId: lesson.id,
                        media: lesson.type === 'video' ? 'video' : 'text',
                      }}
                      title={lesson.title}
                      label={lesson.type === 'video' ? t('watchPreview') : t('readPreview')}
                    />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
