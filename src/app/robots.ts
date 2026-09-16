import type { MetadataRoute } from 'next'

import { resolveServerURL } from '@/lib/serverUrl'

/**
 * Keeps crawlers out of the parts of the site that are not public content.
 *
 * `/admin` and the Payload REST/GraphQL endpoints return nothing useful to a
 * search engine, and `/next/preview` would hand a crawler a draft-mode cookie.
 */
export default function robots(): MetadataRoute.Robots {
  const base = resolveServerURL()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/next/preview'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
