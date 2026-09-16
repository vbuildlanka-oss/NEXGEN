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

/** Database faults that are worth retrying rather than failing on. */
const TRANSIENT_PATTERNS = [
  'EMAXCONNSESSION', // Supabase's pooler momentarily out of client slots
  'max clients reached',
  'ECONNRESET',
  'Connection terminated',
  'timeout expired',
  'too many clients',
]

const isTransient = (error: unknown): boolean => {
  const message =
    error instanceof Error ? `${error.message} ${String(error.cause ?? '')}` : String(error)

  return TRANSIENT_PATTERNS.some((pattern) => message.includes(pattern))
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Runs a query, retrying transient connection failures and then degrading rather
 * than taking a page down.
 *
 * Three behaviours, for three different situations:
 *
 *  1. A transient pooler error is retried with backoff. A production build
 *     prerenders every page in quick succession and can briefly exhaust the
 *     connection pooler's client slots — the query is fine and the database is up,
 *     so asking again a moment later succeeds. Without this, one unlucky moment
 *     fails an entire deployment.
 *  2. A hard failure during a production build aborts the build. Degrading is
 *     wrong here: a mistyped `DATABASE_URI` would otherwise publish a live site
 *     with no events, no updates and an empty gallery.
 *  3. A hard failure at runtime renders an empty section instead of an error page,
 *     logged loudly so it is never silent. A visitor should still get a page.
 */
export async function safeQuery<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  const attempts = 3

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run()
    } catch (error) {
      if (attempt < attempts && isTransient(error)) {
        const backoff = attempt * 750
        console.warn(
          `[data] "${label}" hit a transient database error, retrying in ${backoff}ms ` +
            `(attempt ${attempt} of ${attempts})`,
        )
        await wait(backoff)
        continue
      }

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

  return fallback
}
