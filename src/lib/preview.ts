/**
 * Builds the URL the admin panel points its preview at.
 *
 * The preview route enables Next.js draft mode and then redirects to `path`,
 * which is what makes unpublished changes visible in the preview pane while
 * remaining invisible to the public.
 */
export function buildPreviewUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const params = new URLSearchParams({
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })

  return `${base}/next/preview?${params.toString()}`
}
