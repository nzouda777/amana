'use client'

import { Download, PanelLeft, PanelRight, PanelBottom } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { RemovableTag, ToggleTag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/Dialog'
import { ProgressBar } from '@/components/ui/Feedback'
import { IconButton } from '@/components/ui/IconButton'
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from '@/components/ui/Overlay'
import { Table, TBody, Td, Th, THead, Tr, type SortDirection } from '@/components/ui/Table'
import { toast, Toaster } from '@/components/ui/Toast'

/** Dialogue, panneaux, popover, infobulle et notifications : démonstrations interactives. */
export function OverlayDemos() {
  const t = useTranslations('styleguide.overlays')
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">{t('openDialog')}</Button>
          </DialogTrigger>
          <DialogContent
            title={t('dialogTitle')}
            description={t('dialogDescription')}
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="ghost">{t('cancel')}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="primary">{t('confirm')}</Button>
                </DialogClose>
              </>
            }
          >
            <p className="text-body text-ink">{t('dialogBody')}</p>
          </DialogContent>
        </Dialog>

        {(
          [
            [
              'start',
              t('sheetStart'),
              <PanelLeft key="s" aria-hidden="true" className="rtl-dir:-scale-x-100" />,
            ],
            [
              'end',
              t('sheetEnd'),
              <PanelRight key="e" aria-hidden="true" className="rtl-dir:-scale-x-100" />,
            ],
            ['bottom', t('sheetBottom'), <PanelBottom key="b" aria-hidden="true" />],
          ] as const
        ).map(([side, label, icon]) => (
          <Sheet key={side}>
            <SheetTrigger asChild>
              <Button variant="secondary" icon={icon}>
                {label}
              </Button>
            </SheetTrigger>
            <SheetContent
              side={side}
              title={t('sheetTitle')}
              footer={
                <Button variant="primary" fullWidth>
                  {t('confirm')}
                </Button>
              }
            >
              <p className="text-body text-ink-muted">{t('sheetBody')}</p>
            </SheetContent>
          </Sheet>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost">{t('popoverTrigger')}</Button>
          </PopoverTrigger>
          <PopoverContent label={t('popoverTitle')}>
            <p className="mb-1 font-semibold">{t('popoverTitle')}</p>
            <p className="text-ink-muted">{t('popoverBody')}</p>
          </PopoverContent>
        </Popover>

        <Tooltip content={t('tooltip')}>
          <IconButton
            variant="outline"
            label={t('tooltipLabel')}
            icon={<Download aria-hidden="true" />}
          />
        </Tooltip>

        <Button
          variant="secondary"
          onClick={() => toast({ title: t('toastTitle'), description: t('toastDescription') })}
        >
          {t('toastTrigger')}
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            toast({
              title: t('toastErrorTitle'),
              description: t('toastErrorDescription'),
              tone: 'danger',
            })
          }
        >
          {t('toastErrorTrigger')}
        </Button>
      </div>
      <Toaster />
    </div>
  )
}

/** Étiquettes filtrantes et filtres actifs retirables. */
export function TagDemos() {
  const t = useTranslations('styleguide.display')
  const themes = ['islamicFinance', 'takaful', 'compliance', 'accounting'] as const
  const [selected, setSelected] = useState<string[]>(['takaful'])
  const toggle = (theme: string) =>
    setSelected((current) =>
      current.includes(theme) ? current.filter((item) => item !== theme) : [...current, theme],
    )
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {themes.map((theme) => (
          <ToggleTag key={theme} pressed={selected.includes(theme)} onClick={() => toggle(theme)}>
            {t(`tagThemes.${theme}`)}
          </ToggleTag>
        ))}
      </div>
      <div className="flex min-h-11 flex-wrap gap-2">
        {selected.map((theme) => {
          const label = t(`tagThemes.${theme as (typeof themes)[number]}`)
          return (
            <RemovableTag
              key={theme}
              removeLabel={t('removeTag', { label })}
              onRemove={() => toggle(theme)}
            >
              {label}
            </RemovableTag>
          )
        })}
      </div>
    </div>
  )
}

type Row = {
  name: string
  team: 'compliance' | 'front' | 'back'
  capsules: number
  progress: number
  score: number
  activity: 'today' | 'yesterday' | 'lastWeek'
}

const rows: readonly Row[] = [
  {
    name: 'Aminatou Bello',
    team: 'compliance',
    capsules: 8,
    progress: 100,
    score: 92,
    activity: 'today',
  },
  {
    name: 'Ibrahim Ndiaye',
    team: 'front',
    capsules: 6,
    progress: 67,
    score: 78,
    activity: 'yesterday',
  },
  {
    name: 'Mariam Fotso',
    team: 'back',
    capsules: 6,
    progress: 33,
    score: 64,
    activity: 'lastWeek',
  },
  {
    name: 'Jean-Paul Mbarga',
    team: 'front',
    capsules: 4,
    progress: 50,
    score: 81,
    activity: 'today',
  },
]

type SortKey = 'name' | 'progress' | 'score'

/** Tableau triable (tri côté client pour la démonstration ; le catalogue trie par URL). */
export function SortableTableDemo() {
  const t = useTranslations('styleguide.display')
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'progress',
    direction: 'descending',
  })
  const sorted = useMemo(() => {
    const factor = sort.direction === 'ascending' ? 1 : -1
    return [...rows].sort((a, b) => {
      const left = a[sort.key]
      const right = b[sort.key]
      return typeof left === 'number' && typeof right === 'number'
        ? (left - right) * factor
        : String(left).localeCompare(String(right)) * factor
    })
  }, [sort])
  const sortFor = (key: SortKey) => ({
    direction: sort.key === key ? sort.direction : undefined,
    onSort: () =>
      setSort((current) => ({
        key,
        direction:
          current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending',
      })),
  })

  return (
    <Table label={t('tableLabel')} caption={t('tableCaption')}>
      <THead>
        <Tr>
          <Th sticky sort={sortFor('name')}>
            {t('columns.member')}
          </Th>
          <Th>{t('columns.team')}</Th>
          <Th numeric>{t('columns.capsules')}</Th>
          <Th sort={sortFor('progress')}>{t('columns.progress')}</Th>
          <Th numeric sort={sortFor('score')}>
            {t('columns.score')}
          </Th>
          <Th>{t('columns.activity')}</Th>
        </Tr>
      </THead>
      <TBody>
        {sorted.map((row) => (
          <Tr key={row.name}>
            <Th scope="row" sticky>
              {row.name}
            </Th>
            <Td>{t(`teams.${row.team}`)}</Td>
            <Td numeric>{row.capsules}</Td>
            <Td className="min-w-40">
              <span className="flex items-center gap-3">
                <ProgressBar
                  value={row.progress}
                  label={row.name}
                  hideLabel
                  size="sm"
                  className="flex-1"
                />
                <span className="text-small tabular">{row.progress}</span>
              </span>
            </Td>
            <Td numeric>{row.score}</Td>
            <Td className="whitespace-nowrap">{t(`activity.${row.activity}`)}</Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  )
}
