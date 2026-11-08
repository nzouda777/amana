import createMiddleware from 'next-intl/middleware'

import { routing } from '@/lib/i18n/routing'

/**
 * Next.js 16 : le fichier `middleware.ts` est remplacé par `proxy.ts` (même rôle,
 * runtime Node.js). M0 : uniquement la négociation de locale. security-devops y
 * ajoutera la protection des routes et les en-têtes (M0.14 / M6.1).
 */
export default createMiddleware(routing)

export const config = {
  // Exclut l'admin Payload, les API, les fichiers internes Next et tout fichier avec extension.
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
}
