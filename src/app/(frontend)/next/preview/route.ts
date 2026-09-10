import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

/**
 * Turns on Next.js draft mode for a logged-in editor, then redirects to the page
 * being previewed.
 *
 * Two independent checks, because draft mode exposes unpublished content:
 *   1. the shared preview secret must match, and
 *   2. the request must carry a valid Payload admin session.
 *
 * The `path` parameter is validated as a site-relative path so this cannot be
 * turned into an open redirect.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  const expectedSecret = process.env.PREVIEW_SECRET

  if (!expectedSecret) {
    return new Response('Preview is not configured: PREVIEW_SECRET is missing.', { status: 500 })
  }

  if (previewSecret !== expectedSecret) {
    return new Response('Invalid preview secret.', { status: 403 })
  }

  // Reject protocol-relative ("//evil.com") and absolute URLs.
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return new Response('Invalid preview path.', { status: 400 })
  }

  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return new Response('You must be logged in to the admin panel to preview drafts.', {
      status: 403,
    })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(path)
}
