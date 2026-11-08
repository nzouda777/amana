'use client'

import { ChevronDown } from 'lucide-react'
import { Accordion as AccordionPrimitive, Tabs as TabsPrimitive } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from './cn'

/* ---------------------------------------------------------------------- Tabs */

export const Tabs = TabsPrimitive.Root

export type TabsListProps = {
  /** Nom accessible de la liste d'onglets. */
  label: string
  children: ReactNode
  className?: string
}

export function TabsList({ label, children, className }: TabsListProps) {
  return (
    <TabsPrimitive.List
      aria-label={label}
      className={cn(
        'flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]',
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  )
}

export type TabsTriggerProps = Omit<
  ComponentProps<typeof TabsPrimitive.Trigger>,
  'className' | 'asChild'
> & { className?: string }

export function TabsTrigger({ className, children, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative -mb-px inline-flex min-h-11 shrink-0 cursor-pointer items-center px-4 text-small font-semibold whitespace-nowrap text-ink-muted',
        'transition-colors duration-(--duration-hover) ease-standard',
        'is-hover:text-ink',
        'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent',
        'data-[state=active]:text-green-700 data-[state=active]:after:bg-green-700',
        'disabled:cursor-not-allowed disabled:text-ink-subtle',
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

export type TabsContentProps = Omit<
  ComponentProps<typeof TabsPrimitive.Content>,
  'className' | 'asChild'
> & { className?: string }

export function TabsContent({ className, ...props }: TabsContentProps) {
  return <TabsPrimitive.Content className={cn('pt-6', className)} {...props} />
}

/* ----------------------------------------------------------------- Accordion */

export type AccordionProps = {
  children: ReactNode
  /** Plusieurs panneaux ouverts à la fois (FAQ) ou un seul (méga-menu mobile). */
  type?: 'single' | 'multiple'
  defaultValue?: string[]
  tone?: 'default' | 'light'
  className?: string
}

export function Accordion({
  children,
  type = 'multiple',
  defaultValue,
  tone = 'default',
  className,
}: AccordionProps) {
  const classes = cn('border-b', tone === 'light' ? 'border-paper/20' : 'border-line', className)
  return type === 'single' ? (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      defaultValue={defaultValue?.[0]}
      className={classes}
    >
      {children}
    </AccordionPrimitive.Root>
  ) : (
    <AccordionPrimitive.Root type="multiple" defaultValue={defaultValue} className={classes}>
      {children}
    </AccordionPrimitive.Root>
  )
}

export type AccordionItemProps = {
  value: string
  /** Libellé de l'en-tête (question, nom du pôle). */
  title: ReactNode
  children: ReactNode
  /** Niveau du titre qui enveloppe le bouton (hiérarchie de la page). */
  headingLevel?: 2 | 3 | 4
  tone?: 'default' | 'light'
  disabled?: boolean
  className?: string
}

export function AccordionItem({
  value,
  title,
  children,
  headingLevel = 3,
  tone = 'default',
  disabled,
  className,
}: AccordionItemProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <AccordionPrimitive.Item
      value={value}
      disabled={disabled}
      className={cn('border-t', tone === 'light' ? 'border-paper/20' : 'border-line', className)}
    >
      <AccordionPrimitive.Header asChild>
        <Heading className="font-sans">
          <AccordionPrimitive.Trigger
            className={cn(
              'group flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 py-4 text-start text-h4 font-semibold',
              'transition-colors duration-(--duration-hover) ease-standard',
              tone === 'light'
                ? 'text-paper is-hover:text-sand-300'
                : 'text-ink is-hover:text-green-700',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            <span>{title}</span>
            <ChevronDown
              aria-hidden="true"
              className="size-5 transition-transform duration-(--duration-menu) ease-standard group-data-[state=open]:rotate-180"
            />
          </AccordionPrimitive.Trigger>
        </Heading>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div
          className={cn(
            'max-w-measure pb-6 text-body',
            tone === 'light' ? 'text-green-50' : 'text-ink-muted',
          )}
        >
          {children}
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}
