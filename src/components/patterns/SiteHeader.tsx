'use client'

import { ChevronDown, Menu, Search, ShoppingBag, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Accordion as AccordionPrimitive,
  Dialog as DialogPrimitive,
  NavigationMenu,
} from 'radix-ui'
import { useEffect, useState, type ReactNode } from 'react'

import { Logo } from '@/components/brand/Logo'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/components/ui/cn'
import { SheetContent } from '@/components/ui/Dialog'
import { IconButton } from '@/components/ui/IconButton'
import { Link, type Href } from '@/components/ui/Link'

export type NavOffer = {
  label: string
  href: Href
  /** Une ligne, affichée dans le méga-menu desktop. */
  description?: string
}

/** Contenu mis en avant dans le méga-menu d'un pôle (cours, guide, cas client). */
export type NavFeatured = {
  /** Nature du contenu, en casse normale (« Cours en ligne », « Guide »). */
  kind: string
  title: string
  description?: string
  href: Href
  /** Libellé du lien (« Voir le cours »). */
  cta: string
}

export type NavItem = {
  id: string
  /** Libellé court de la barre (« Audit »). */
  label: string
  href: Href
  /** Nom complet du pôle dans le méga-menu (« Audit et conformité »). */
  title?: string
  /** Une phrase de présentation du pôle. */
  summary?: string
  /** Offres du pôle : leur présence active le méga-menu. */
  offers?: readonly NavOffer[]
  featured?: NavFeatured
}

export type SiteHeaderProps = {
  items: readonly NavItem[]
  appointmentHref: Href
  searchHref: Href
  /** Absent : icône Compte masquée (route pas encore livrée, ADR 016). */
  accountHref?: Href | undefined
  /** Absent : icône Panier masquée (route pas encore livrée, ADR 016). */
  cartHref?: Href | undefined
  cartCount?: number
  /** Pôle de la page courante (soulignement + `aria-current`). */
  currentId?: string
  /**
   * `overlay` : transparent sur un héros green-900, devient opaque au défilement.
   * La première section de la page doit alors commencer par `pt-header`.
   * `solid` : blanc avec filet dès le départ.
   */
  variant?: 'overlay' | 'solid'
  /** Cible du lien d'évitement (identifiant du `<main>`). */
  mainId?: string
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > threshold)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [threshold])
  return scrolled
}

/**
 * En-tête du site (DESIGN §8) : logo, six entrées dont quatre pôles à méga-menu,
 * recherche, compte, panier, « Prendre rendez-vous ». Sous 1280 px : tiroir plein
 * écran, accordéon par pôle, CTA fixe en bas.
 */
export function SiteHeader({
  items,
  appointmentHref,
  searchHref,
  accountHref,
  cartHref,
  cartCount = 0,
  currentId,
  variant = 'solid',
  mainId = 'contenu',
}: SiteHeaderProps) {
  const t = useTranslations('header')
  const tc = useTranslations('common')
  const scrolled = useScrolled()
  const [menuValue, setMenuValue] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const transparent = variant === 'overlay' && !scrolled && menuValue === ''

  const iconVariant = transparent ? 'light' : 'ghost'
  const cartLabel = t('cart', { count: cartCount })

  return (
    <header
      data-transparent={transparent || undefined}
      className={cn(
        'group/header sticky top-0 z-40 h-header border-b',
        'transition-colors duration-(--duration-menu) ease-standard',
        transparent ? 'on-dark border-transparent bg-transparent' : 'border-line bg-paper text-ink',
        variant === 'overlay' && '-mb-header',
      )}
    >
      <a
        href={`#${mainId}`}
        className="sr-only z-50 rounded-control bg-paper font-semibold text-green-700 focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:px-4 focus:py-3"
      >
        {tc('skipToContent')}
      </a>

      <div className="container-page flex h-full items-center gap-6">
        <Link
          href="/"
          variant="quiet"
          tone="inherit"
          className="me-auto inline-flex min-h-11 shrink-0 items-center xl:me-4"
          aria-label={t('home')}
        >
          <Logo variant={transparent ? 'inverse' : 'color'} size="md" alt="" priority />
        </Link>

        {/* Navigation desktop (≥ 1280 px) : méga-menu Radix. */}
        <NavigationMenu.Root
          aria-label={t('mainNav')}
          value={menuValue}
          onValueChange={setMenuValue}
          className="static hidden flex-1 xl:block"
        >
          <NavigationMenu.List className="flex items-center gap-1">
            {items.map((item) => {
              const isCurrent = item.id === currentId
              const triggerClasses = cn(
                'relative inline-flex h-11 cursor-pointer items-center gap-1 rounded-control px-3 text-small font-semibold',
                'transition-colors duration-(--duration-hover) ease-standard',
                transparent
                  ? 'text-paper is-hover:text-sand-300'
                  : 'text-ink is-hover:text-green-700 data-[state=open]:text-green-700',
                isCurrent &&
                  'after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-current',
              )
              return (
                <NavigationMenu.Item key={item.id} value={item.id}>
                  {item.offers?.length ? (
                    <>
                      <NavigationMenu.Trigger className={cn('group', triggerClasses)}>
                        {item.label}
                        <ChevronDown
                          aria-hidden="true"
                          className="size-4 transition-transform duration-(--duration-menu) ease-standard group-data-[state=open]:rotate-180"
                        />
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content className="data-[motion]:animate-fade-in">
                        <MegaPanel item={item} />
                      </NavigationMenu.Content>
                    </>
                  ) : (
                    <NavigationMenu.Link asChild active={isCurrent}>
                      <Link
                        href={item.href}
                        variant="quiet"
                        tone="inherit"
                        className={triggerClasses}
                        aria-current={isCurrent ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    </NavigationMenu.Link>
                  )}
                </NavigationMenu.Item>
              )
            })}
          </NavigationMenu.List>

          <div className="absolute inset-x-0 top-full">
            <NavigationMenu.Viewport
              className={cn(
                'relative h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden border-b border-line bg-paper text-ink shadow-float',
                'transition-[height] duration-(--duration-menu) ease-standard',
                'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
              )}
            />
          </div>
        </NavigationMenu.Root>

        <div className="flex items-center gap-1">
          <HeaderIconLink
            href={searchHref}
            label={t('search')}
            transparent={transparent}
            hideOnMobile
          >
            <Search aria-hidden="true" />
          </HeaderIconLink>
          {accountHref ? (
            <HeaderIconLink
              href={accountHref}
              label={t('account')}
              transparent={transparent}
              hideOnMobile
            >
              <UserRound aria-hidden="true" />
            </HeaderIconLink>
          ) : null}
          {cartHref ? (
            <HeaderIconLink href={cartHref} label={cartLabel} transparent={transparent}>
              <ShoppingBag aria-hidden="true" />
              {cartCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute end-1 top-1 inline-grid min-w-5 place-items-center rounded-pill bg-gold-500 px-1 text-caption font-semibold text-ink tabular"
                >
                  {cartCount}
                </span>
              ) : null}
            </HeaderIconLink>
          ) : null}
          <div className="ms-3 hidden xl:block">
            <ButtonLink href={appointmentHref} variant={transparent ? 'gold' : 'primary'} size="md">
              {t('appointment')}
            </ButtonLink>
          </div>

          {/* Tiroir mobile (< 1280 px). */}
          <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DialogPrimitive.Trigger asChild>
              <IconButton
                variant={iconVariant}
                label={t('openMenu')}
                icon={<Menu aria-hidden="true" />}
                className="xl:hidden"
              />
            </DialogPrimitive.Trigger>
            <SheetContent
              side="full"
              title={t('menu')}
              header={
                <Link href="/" variant="quiet" tone="inherit" aria-label={t('home')}>
                  <Logo variant="color" size="sm" alt="" />
                </Link>
              }
              footer={
                <ButtonLink href={appointmentHref} variant="primary" fullWidth>
                  {t('appointment')}
                </ButtonLink>
              }
            >
              <MobileNav
                items={items}
                currentId={currentId}
                searchHref={searchHref}
                accountHref={accountHref}
                onNavigate={() => setDrawerOpen(false)}
              />
            </SheetContent>
          </DialogPrimitive.Root>
        </div>
      </div>
    </header>
  )
}

function HeaderIconLink({
  href,
  label,
  transparent,
  hideOnMobile = false,
  children,
}: {
  href: Href
  label: string
  transparent: boolean
  hideOnMobile?: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      variant="quiet"
      tone="inherit"
      aria-label={label}
      className={cn(
        'relative size-11 place-items-center rounded-control [&_svg.lucide]:size-5',
        hideOnMobile ? 'hidden sm:inline-grid' : 'inline-grid',
        transparent
          ? 'text-paper is-hover:bg-paper/10'
          : 'text-ink is-hover:bg-green-50 is-hover:text-green-800',
      )}
    >
      {children}
    </Link>
  )
}

function MegaPanel({ item }: { item: NavItem }) {
  const t = useTranslations('header')
  return (
    <div className="container-page grid grid-cols-12 gap-gutter py-12">
      <div className="col-span-4 flex flex-col gap-4 pe-8">
        <p className="font-display text-h3 text-ink">{item.title ?? item.label}</p>
        {item.summary ? <p className="text-body text-ink-muted">{item.summary}</p> : null}
        <NavigationMenu.Link asChild>
          <Link href={item.href} variant="standalone" className="mt-2 self-start">
            {t('pillarOverview', { pillar: item.title ?? item.label })}
          </Link>
        </NavigationMenu.Link>
      </div>
      <ul className={cn('flex flex-col', item.featured ? 'col-span-5' : 'col-span-8')}>
        {item.offers?.map((offer) => (
          <li key={offer.label} className="border-t border-line first:border-t-0">
            <NavigationMenu.Link asChild>
              <Link
                href={offer.href}
                variant="quiet"
                tone="ink"
                className="group/offer flex flex-col gap-1 rounded-control px-3 py-3 is-hover:bg-green-50"
              >
                <span className="font-semibold group-hover/offer:text-green-700">
                  {offer.label}
                </span>
                {offer.description ? (
                  <span className="text-small text-ink-muted">{offer.description}</span>
                ) : null}
              </Link>
            </NavigationMenu.Link>
          </li>
        ))}
      </ul>
      {item.featured ? (
        <div className="col-span-3 flex flex-col gap-3 rounded-panel bg-sand-100 p-6">
          <p className="font-display text-h4 text-ink">{item.featured.title}</p>
          {item.featured.description ? (
            <p className="text-small text-ink-muted">{item.featured.description}</p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
            <Badge tone="gold">{item.featured.kind}</Badge>
            <NavigationMenu.Link asChild>
              <Link href={item.featured.href} variant="standalone" className="text-small">
                {item.featured.cta}
              </Link>
            </NavigationMenu.Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MobileNav({
  items,
  currentId,
  searchHref,
  accountHref,
  onNavigate,
}: {
  items: readonly NavItem[]
  currentId?: string
  searchHref: Href
  accountHref?: Href | undefined
  onNavigate: () => void
}) {
  const t = useTranslations('header')
  const rowClasses =
    'flex min-h-14 w-full items-center justify-between gap-4 py-3 text-start text-h4 font-semibold text-ink'

  return (
    <nav aria-label={t('mainNav')} className="flex flex-col gap-8">
      <AccordionPrimitive.Root
        type="single"
        collapsible
        defaultValue={currentId}
        className="border-b border-line"
      >
        {items.map((item) =>
          item.offers?.length ? (
            <AccordionPrimitive.Item
              key={item.id}
              value={item.id}
              className="border-t border-line first:border-t-0"
            >
              <AccordionPrimitive.Header asChild>
                <h2 className="font-sans">
                  <AccordionPrimitive.Trigger className={cn('group cursor-pointer', rowClasses)}>
                    {item.title ?? item.label}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-5 transition-transform duration-(--duration-menu) ease-standard group-data-[state=open]:rotate-180"
                    />
                  </AccordionPrimitive.Trigger>
                </h2>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <ul className="flex flex-col pb-4">
                  <li>
                    <Link
                      href={item.href}
                      variant="quiet"
                      tone="default"
                      onClick={onNavigate}
                      className="flex min-h-11 items-center font-semibold"
                    >
                      {t('pillarOverview', { pillar: item.title ?? item.label })}
                    </Link>
                  </li>
                  {item.offers.map((offer) => (
                    <li key={offer.label}>
                      <Link
                        href={offer.href}
                        variant="quiet"
                        tone="ink"
                        onClick={onNavigate}
                        className="flex min-h-11 items-center"
                      >
                        {offer.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ) : (
            <div key={item.id} className="border-t border-line">
              <Link
                href={item.href}
                variant="quiet"
                tone="ink"
                onClick={onNavigate}
                aria-current={item.id === currentId ? 'page' : undefined}
                className={rowClasses}
              >
                {item.label}
              </Link>
            </div>
          ),
        )}
      </AccordionPrimitive.Root>

      <ul className="flex flex-col gap-1">
        <li>
          <Link
            href={searchHref}
            variant="quiet"
            tone="ink"
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-3"
          >
            <Search aria-hidden="true" className="size-5" />
            {t('search')}
          </Link>
        </li>
        {accountHref ? (
          <li>
            <Link
              href={accountHref}
              variant="quiet"
              tone="ink"
              onClick={onNavigate}
              className="flex min-h-11 items-center gap-3"
            >
              <UserRound aria-hidden="true" className="size-5" />
              {t('account')}
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
