import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/**
 * Client Payload (Local API) pour les Server Components, Server Actions et routes :
 * aucun appel HTTP vers soi-même. `getPayload` met l'instance en cache par processus.
 */
export function getPayloadClient(): Promise<Payload> {
  return getPayload({ config })
}
