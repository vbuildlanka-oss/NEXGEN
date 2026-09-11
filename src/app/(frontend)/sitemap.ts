import type { MetadataRoute } from 'next'

import { getEventSlugs, getPostSlugs, getPosts, getUpcomingEvents } from '@/lib/queries'

export const revalidate = 3600

/**
 * Generated from the database, so a new event or update is discoverable without
 * anyone remembering to update a list.
 *
 * Only published documents appear: the queries used here inherit the same access
 * rules as the public pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/events`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/updates`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/gallery`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/our-story`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.6 },
  ]

  const [eventSlugs, postSlugs, events, posts] = await Promise.all([
    getEventSlugs(),
    getPostSlugs(),
    getUpcomingEvents({ limit: 200 }),
    getPosts({ limit: 200 }),
  ])

  // Use each document's own updated timestamp where we have it, so crawlers can
  // tell what actually changed.
  const eventDates = new Map(events.map((event) => [event.slug, event.updatedAt]))
  const postDates = new Map(posts.map((post) => [post.slug, post.updatedAt]))

  return [
    ...staticRoutes,
    ...eventSlugs.map((slug) => ({
      url: `${base}/events/${slug}`,
      lastModified: eventDates.get(slug),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...postSlugs.map((slug) => ({
      url: `${base}/updates/${slug}`,
      lastModified: postDates.get(slug),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
