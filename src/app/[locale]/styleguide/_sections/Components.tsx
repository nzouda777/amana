import { CalendarDays, PlayCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Avatar } from '@/components/ui/Avatar'
import { Badge, Tag } from '@/components/ui/Badge'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ButtonLink } from '@/components/ui/Button'
import {
  Accordion,
  AccordionItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/Disclosure'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert, ProgressBar, Skeleton } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { Price } from '@/components/ui/Price'
import { Callout, Prose, ProseTable } from '@/components/ui/Prose'
import { toXaf } from '@/lib/money'

import { GuideSection, Specimen } from '../_components/Specimen'
import { OverlayDemos, SortableTableDemo, TagDemos } from '../_demos/InteractiveDemos'

export function OverlaysSection() {
  const t = useTranslations('styleguide.sections.overlays')
  return (
    <GuideSection id="superpositions" title={t('title')} lead={t('lead')} tone="sand">
      <OverlayDemos />
    </GuideSection>
  )
}

export function NavigationSection() {
  const t = useTranslations('styleguide')
  const tn = useTranslations('styleguide.navigation')
  const tf = useTranslations('styleguide.demo.faq')
  const ts = useTranslations('styleguide.demo.service')
  const tabs = ['transcript', 'resources', 'notes'] as const

  return (
    <GuideSection
      id="navigation"
      title={t('sections.navigation.title')}
      lead={t('sections.navigation.lead')}
    >
      <Specimen title={tn('tabsLabel')}>
        <Tabs defaultValue="transcript">
          <TabsList label={tn('tabsLabel')}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tn(`tabs.${tab}`)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="disabled" disabled>
              {t('states.disabled')}
            </TabsTrigger>
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab} value={tab}>
              <p className="max-w-measure text-body text-ink-muted">{tn(`tabPanels.${tab}`)}</p>
            </TabsContent>
          ))}
        </Tabs>
      </Specimen>
      <Specimen title={tn('accordion')}>
        <Accordion type="multiple" defaultValue={['q1']}>
          {(['q1', 'q2', 'q3'] as const).map((q, index) => (
            <AccordionItem key={q} value={q} title={tf(q)} headingLevel={4}>
              <p>{tf(`a${index + 1}` as 'a1' | 'a2' | 'a3').split('\n\n')[0]}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </Specimen>
      <div className="grid gap-12 lg:grid-cols-2">
        <Specimen title={tn('breadcrumb')}>
          <Breadcrumb
            label={tn('breadcrumbDemo')}
            items={[
              { label: ts('breadcrumbHome'), href: '/' },
              { label: ts('breadcrumbPillar'), href: '/audit-conformite' },
              { label: ts('breadcrumbPage') },
            ]}
          />
        </Specimen>
        <Specimen title={tn('pagination')}>
          <Pagination
            page={4}
            pageCount={12}
            hrefFor={(page) => ({ pathname: '/formation/cours', query: { page: String(page) } })}
          />
        </Specimen>
      </div>
    </GuideSection>
  )
}

export function DisplaySection() {
  const t = useTranslations('styleguide')
  const td = useTranslations('styleguide.display')
  const ti = useTranslations('styleguide.demo.instructors')

  return (
    <GuideSection
      id="affichage"
      title={t('sections.display.title')}
      lead={t('sections.display.lead')}
    >
      <div className="grid gap-12 lg:grid-cols-2">
        <Specimen title={td('badges')}>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="gold" icon={<PlayCircle aria-hidden="true" />}>
              {td('badge.freePreview')}
            </Badge>
            <Badge tone="green">{td('badge.new')}</Badge>
            <Badge tone="green">{td('badge.paid')}</Badge>
            <Badge tone="neutral">{td('badge.pending')}</Badge>
            <Badge tone="danger">{td('badge.overdue')}</Badge>
            <Badge tone="warning">{td('badge.dueSoon')}</Badge>
            <Badge tone="info" icon={<CalendarDays aria-hidden="true" />}>
              {td('badge.webinar')}
            </Badge>
            <span className="rounded-control bg-green-700 p-2">
              <Badge tone="light">{td('badge.onGreen')}</Badge>
            </span>
          </div>
        </Specimen>
        <Specimen title={td('tags')}>
          <div className="flex flex-wrap gap-2">
            <Tag>{td('tagThemes.islamicFinance')}</Tag>
            <Tag>{td('tagThemes.compliance')}</Tag>
          </div>
          <TagDemos />
        </Specimen>
        <Specimen title={td('avatars')}>
          <div className="flex items-center gap-4">
            <Avatar name={ti('one')} size="sm" />
            <Avatar name={ti('two')} size="md" />
            <Avatar name={ti('three')} size="lg" />
          </div>
        </Specimen>
        <Specimen title={td('skeleton')}>
          <div
            aria-busy="true"
            aria-label={td('skeletonLabel')}
            role="status"
            className="flex gap-4"
          >
            <Skeleton shape="block" className="aspect-video w-40" />
            <div className="flex flex-1 flex-col gap-3 pt-1">
              <Skeleton shape="text" className="w-1/3" />
              <Skeleton shape="text" className="w-full text-h3" />
              <Skeleton shape="text" className="w-1/2" />
            </div>
          </div>
        </Specimen>
        <Specimen title={td('progress')}>
          <div className="flex flex-col gap-6">
            <ProgressBar value={62} label={td('progressCourse')} />
            <ProgressBar value={68} label={td('progressLicenses')} size="sm" />
            <div className="on-dark rounded-panel bg-green-900 p-4">
              <ProgressBar value={62} label={td('progressCourse')} tone="light" />
            </div>
          </div>
        </Specimen>
        <Specimen title={td('prices')}>
          <div className="flex flex-col gap-4">
            <Price amount={toXaf(45_000)} size="lg" />
            <Price amount={toXaf(35_000)} compareAt={toXaf(45_000)} size="md" />
            <Price amount={toXaf(0)} size="sm" />
          </div>
        </Specimen>
      </div>
      <Specimen title={td('empty')}>
        <EmptyState
          title={td('emptyTitle')}
          description={td('emptyDescription')}
          action={<ButtonLink href="/formation/cours">{td('emptyAction')}</ButtonLink>}
        />
      </Specimen>
      <Specimen title={td('alerts')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Alert tone="info" title={td('alert.infoTitle')}>
            {td('alert.infoText')}
          </Alert>
          <Alert tone="success" title={td('alert.successTitle')}>
            {td('alert.successText')}
          </Alert>
          <Alert tone="warning" title={td('alert.warningTitle')}>
            {td('alert.warningText')}
          </Alert>
          <Alert tone="danger" title={td('alert.dangerTitle')}>
            {td('alert.dangerText')}
          </Alert>
        </div>
      </Specimen>
      <Specimen title={td('table')}>
        <SortableTableDemo />
      </Specimen>
    </GuideSection>
  )
}

export function ProseSection() {
  const t = useTranslations('styleguide')
  const tp = useTranslations('styleguide.prose')
  return (
    <GuideSection
      id="article"
      title={t('sections.prose.title')}
      lead={t('sections.prose.lead')}
      tone="sand"
    >
      <article className="rounded-panel bg-paper px-6 py-12 md:px-12">
        <Prose className="mx-auto">
          <h2>{tp('title')}</h2>
          <p>{tp('intro')}</p>
          <h3>{tp('h2')}</h3>
          <p>{tp('p1')}</p>
          <ul>
            <li>{tp('li1')}</li>
            <li>{tp('li2')}</li>
            <li>{tp('li3')}</li>
          </ul>
          <Callout variant="key">
            <p>{tp('keyPoint')}</p>
          </Callout>
          <h3>{tp('h3')}</h3>
          <ol>
            <li>{tp('ol1')}</li>
            <li>{tp('ol2')}</li>
            <li>{tp('ol3')}</li>
          </ol>
          <blockquote>
            <p>{tp('quote')}</p>
            <cite>{tp('quoteCite')}</cite>
          </blockquote>
          <ProseTable label={tp('tableLabel')}>
            <thead>
              <tr>
                <th scope="col">{tp('tableHead1')}</th>
                <th scope="col">{tp('tableHead2')}</th>
                <th scope="col">{tp('tableHead3')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{tp('row1')}</th>
                <td>{tp('row1a')}</td>
                <td>{tp('row1b')}</td>
              </tr>
              <tr>
                <th scope="row">{tp('row2')}</th>
                <td>{tp('row2a')}</td>
                <td>{tp('row2b')}</td>
              </tr>
            </tbody>
          </ProseTable>
          <Callout variant="warning">
            <p>{tp('warning')}</p>
          </Callout>
        </Prose>
      </article>
    </GuideSection>
  )
}
