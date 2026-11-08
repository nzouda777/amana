import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

/** Utiliser ces helpers (et non `next/link`) pour toute navigation interne localisée. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
