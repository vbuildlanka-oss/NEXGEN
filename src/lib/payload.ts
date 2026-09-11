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
    /**
     * During a production build, a database failure must stop the deploy.
     *
     * Degrading gracefully is right at runtime — a visitor should still get a
     * page. It is quite wrong at build time: a mistyped `DATABASE_URI` would
     * otherwise sail through and publish a live site with no events, no updates
     * and an empty gallery, which is far worse than a failed build.
     */
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.error(
        `[data] "${label}" failed during the production build. Refusing to build a site ` +
          'with missing content — check DATABASE_URI and that migrations have run.',
      )
      throw error
    }

    console.error(`[data] "${label}" failed — rendering fallback content instead.`, error)
    return fallback
  }
}
