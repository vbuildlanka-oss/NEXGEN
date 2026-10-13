import type { NextRequest } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

/**
 * Keeps the Supabase project awake.
 *
 * Supabase pauses a *free-tier* project after roughly seven days without
 * activity, which would take the site's content offline until someone logged in
 * and resumed it. This endpoint performs the cheapest possible read so that a
 * scheduled ping counts as activity.
 *
 * NexGen moved from Supabase Pro to the free plan, so this is scheduled again:
 * the `crons` entry in vercel.json calls it every third day at 06:00 UTC, well
 * inside the seven-day window.
 *
 * It is also a useful uptime probe: it returns 200 only if the database answered.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET

  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without this check
  // the endpoint would be an open, if harmless, database ping.
  if (secret) {
    const provided = request.headers.get('authorization')

    if (provided !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorised.' }, { status: 401 })
    }
  }

  try {
    const payload = await getPayloadClient()

    // A single-row count is enough to register as activity.
    const result = await payload.count({ collection: 'events' })

    return Response.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      events: result.totalDocs,
    })
  } catch (error) {
    console.error('[keep-alive] database ping failed', error)

    return Response.json(
      { ok: false, error: 'Database ping failed.', checkedAt: new Date().toISOString() },
      { status: 500 },
    )
  }
}
