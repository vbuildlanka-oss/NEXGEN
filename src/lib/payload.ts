import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

/**
 * Shared Payload instance.
 *
 * `getPayload` memoises internally, so calling this per request is cheap and
 * keeps one connection pool for the whole server — important on serverless,
 * where a new pool per request would exhaust Postgres connections.
 */
export const getPayloadClient = async (): Promise<Payload> =>
  getPayload({ config: configPromise })

/**
 * Runs a query and degrades gracefully instead of taking a page down.
 *
 * The public site should still render (with empty sections) if the database is
 * briefly unreachable — most likely on a Supabase free-tier project that has
 * just woken up, or on a first deploy before migrations have run. The failure is
 * logged loudly on the server so it is never silent.
 */
export async function safeQuery<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  } catch (error) {
    console.error(`[data] "${label}" failed — rendering fallback content instead.`, error)
    return fallback
  }
}
