import { NextResponse, type NextRequest } from 'next/server'

import { resolveAllowedOrigins } from '@/lib/serverUrl'

/**
 * Lets the admin panel save from whatever domain it is served on.
 *
 * Payload accepts the login cookie on a write only if the browser's `Origin`
 * header is on its `csrf` list. That list is fixed when the server starts, from
 * environment variables, so a domain connected after the last deploy — or one
 * the variables simply do not name — is missing from it. Every save from that
 * domain is then treated as logged out and refused, and the admin shows "This
 * page couldn't load". Opening pages still works, because page loads send no
 * `Origin` header, which is what makes the failure so confusing.
 *
 * The rule that actually matters for CSRF is whether the request came from the
 * same site it was sent to. Next.js applies exactly that rule to its own server
 * actions: `Origin` must match `x-forwarded-host` (or `host`). This does the
 * same for Payload. When the two match, the `Origin` header is removed before
 * Payload sees it, and Payload falls back to `Sec-Fetch-Site`, which it accepts
 * only when the browser says `same-origin`, `same-site` or `none`. Browsers set
 * that header themselves and scripts cannot forge it.
 *
 * A request from a different site keeps its `Origin` and is checked against the
 * `csrf` list as before, so nothing that was blocked is now allowed. Since only
 * same-origin requests are touched, Next's own server action check could not
 * have rejected them either.
 */
export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin || origin === 'null') return NextResponse.next()

  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host'))
    ?.split(',')[0]
    ?.trim()
    .toLowerCase()

  let originHost: string
  try {
    originHost = new URL(origin).host.toLowerCase()
  } catch {
    return NextResponse.next()
  }

  if (!host || originHost !== host) return NextResponse.next()

  // Already allowed: leave the request exactly as the browser sent it.
  if (resolveAllowedOrigins().includes(origin)) return NextResponse.next()

  const headers = new Headers(request.headers)
  headers.delete('origin')

  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Only the admin panel and Payload's API carry the login cookie.
  matcher: ['/admin/:path*', '/api/:path*'],
}
