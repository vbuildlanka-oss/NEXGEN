'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

/**
 * Makes the admin panel's side-by-side preview update as the editor types.
 *
 * Payload's live preview loads the real page in an iframe; this listens for the
 * "document changed" message the admin posts and asks Next.js to re-render the
 * route with the latest draft data. Without it the preview pane would only
 * change on a manual reload.
 */
export const LivePreviewRefresh: React.FC<{ serverURL: string }> = ({ serverURL }) => {
  const router = useRouter()

  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={serverURL} />
}
