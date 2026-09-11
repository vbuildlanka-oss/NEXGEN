import type { NextRequest } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { runSeed } from '@/lib/seed'

/**
 * Loads the placeholder content on demand.
 *
 * The production build seeds automatically, but when that fails the Vercel build
 * log is the only diagnostic and it is easy to miss. This endpoint does the same
 * work and returns the real error as JSON, so a misconfigured R2 bucket can be
 * identified and fixed without triggering a fresh deployment each time.
 *
 * Idempotent, like the build-time seed: anything already present is left alone, so
 * calling this on a site whose content has been edited changes nothing.
 *
 *   curl -X POST https://your-site.com/api/admin/seed \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Uploading 27 photographs to R2 takes longer than the default limit allows.
export const maxDuration = 300

async function handle(request: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET

  // Without a configured secret this would be an unauthenticated write endpoint,
  // so refuse rather than fall open.
  if (!secret) {
    return Response.json(
      { ok: false, error: 'CRON_SECRET is not set, so this endpoint is disabled.' },
      { status: 503 },
    )
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'Unauthorised.' }, { status: 401 })
  }

  try {
    const payload = await getPayloadClient()
    const result = await runSeed(payload, { skipUser: true })

    return Response.json({
      ok: true,
      counts: result.counts,
      warnings: result.warnings,
      note:
        result.counts.users === 0
          ? 'No admin account exists yet — create one at /admin.'
          : undefined,
    })
  } catch (error) {
    console.error('[seed] failed', error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        hint:
          'Usually Cloudflare R2 credentials (uploads fail) or DATABASE_URI ' +
          '(unreachable). The full stack trace is in the runtime logs.',
      },
      { status: 500 },
    )
  }
}

export const POST = handle

/** GET is allowed too, so this can be triggered from a browser address bar. */
export const GET = handle
