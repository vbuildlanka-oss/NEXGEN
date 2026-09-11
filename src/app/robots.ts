import type { MetadataRoute } from 'next'

/**
 * Keeps crawlers out of the parts of the site that are not public content.
 *
 * `/admin` and the Payload REST/GraphQL endpoints return nothing useful to a
 * search engine, and `/next/preview` would hand a crawler a draft-mode cookie.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SERVER_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/next/preview'],
      },
    ],
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  }
}
