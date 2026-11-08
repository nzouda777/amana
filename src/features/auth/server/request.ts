import { headers } from 'next/headers'

/** Adresse IP du client derrière Cloudflare ou un proxy (limitation de débit uniquement). */
export async function getClientIp(): Promise<string | undefined> {
  const list = await headers()
  return (
    list.get('cf-connecting-ip') ??
    list.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    list.get('x-real-ip') ??
    undefined
  )
}
