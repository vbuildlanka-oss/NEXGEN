import type { Event, HomePanel, Media, Post } from '@/payload-types'

import { getPayloadClient, safeQuery } from './payload'

/**
 * All reads used by the public site.
 *
 * Every function takes an optional `draft` flag. When the admin panel opens a
 * page in live preview, Next.js draft mode is on and these reads include
 * unpublished changes; for ordinary visitors they never do.
 *
 * Each read is wrapped in `safeQuery`, so a database hiccup renders an empty
 * section rather than a 500 page.
 */
type QueryOptions = { draft?: boolean }

const emptyGlobal = null

/* ────────────────────────────── globals ────────────────────────────────── */

export async function getSiteSettings({ draft = false }: QueryOptions = {}) {
  return safeQuery(
    'site-settings',
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'site-settings', depth: 2, draft, overrideAccess: draft })
    },
    emptyGlobal,
  )
}

export async function getHomePage({ draft = false }: QueryOptions = {}) {
  return safeQuery(
    'home-page',
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'home-page', depth: 2, draft, overrideAccess: draft })
    },
    emptyGlobal,
  )
}

export async function getOurStory({ draft = false }: QueryOptions = {}) {
  return safeQuery(
    'our-story',
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'our-story', depth: 2, draft, overrideAccess: draft })
    },
    emptyGlobal,
  )
}

export async function getContactInfo({ draft = false }: QueryOptions = {}) {
  return safeQuery(
    'contact-info',
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'contact-info', depth: 2, draft, overrideAccess: draft })
    },
    emptyGlobal,
  )
}

/**
 * The wording on the three listing pages.
 *
 * Each returns null if the read fails or the global has never been saved, and every
 * page supplies its own fallback for each field — so a missing global degrades to
 * the wording the page shipped with rather than to blank headings.
 */
export async function getEventsPage({ draft = false }: QueryOptions = {}) {
  return safeQuery(
    'events-page',
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'events-page', depth: 2, draft, overrideAccess: draft })
    },
    emptyGlobal,
  )
}

export async function getUpdatesPage({ draft = false }: QueryOptions = {}) {
  return safeQuery(
    'updates-page',
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'updates-page', depth: 2, draft, overrideAccess: draft })
    },
    emptyGlobal,
  )
}

export async function getGalleryPage({ draft = false }: QueryOptions = {}) {
  return safeQuery(
    'gallery-page',
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'gallery-page', depth: 2, draft, overrideAccess: draft })
    },
    emptyGlobal,
  )
}

/* ─────────────────────────── homepage panels ───────────────────────────── */

export async function getHomePanels({ draft = false }: QueryOptions = {}): Promise<HomePanel[]> {
  return safeQuery(
    'home-panels',
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'home-panels',
        sort: 'order',
        limit: 20,
        depth: 2,
        draft,
        overrideAccess: draft,
      })

      return result.docs
    },
    [],
  )
}

/* ───────────────────────────────  events  ──────────────────────────────── */

/**
 * Upcoming events: those the editor has labelled "Upcoming".
 *
 * The label is set in the admin (Events → sidebar → "Upcoming or past"), not
 * worked out from the dates. Dates decided this before, and one mistyped end
 * date was enough to show an event months away as finished.
 */
export async function getUpcomingEvents({
  limit = 50,
  draft = false,
}: QueryOptions & { limit?: number } = {}): Promise<Event[]> {
  return safeQuery(
    'upcoming-events',
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'events',
        where: { eventStatus: { equals: 'upcoming' } },
        // Soonest first.
        sort: 'startsAt',
        limit,
        depth: 2,
        draft,
        overrideAccess: draft,
      })

      return result.docs
    },
    [],
  )
}

/** Past events: those the editor has labelled "Past". Most recent first. */
export async function getPastEvents({
  limit = 50,
  draft = false,
}: QueryOptions & { limit?: number } = {}): Promise<Event[]> {
  return safeQuery(
    'past-events',
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'events',
        where: { eventStatus: { equals: 'past' } },
        sort: '-startsAt',
        limit,
        depth: 2,
        draft,
        overrideAccess: draft,
      })

      return result.docs
    },
    [],
  )
}

/**
 * Whether an event is over, according to its "Upcoming or past" label.
 *
 * Reads only the event's own data, so rendering stays a pure function of it.
 */
export function isEventPast(event: Pick<Event, 'eventStatus'>): boolean {
  return event.eventStatus === 'past'
}

export async function getEventBySlug(
  slug: string,
  { draft = false }: QueryOptions = {},
): Promise<Event | null> {
  return safeQuery(
    `event:${slug}`,
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'events',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 2,
        draft,
        overrideAccess: draft,
      })

      return result.docs[0] ?? null
    },
    null,
  )
}

export async function getEventSlugs(): Promise<string[]> {
  return safeQuery(
    'event-slugs',
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'events',
        limit: 500,
        depth: 0,
        pagination: false,
        select: { slug: true },
      })

      return result.docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
    },
    [],
  )
}

/* ────────────────────────────────  posts  ──────────────────────────────── */

export async function getPosts({
  category,
  limit = 100,
  draft = false,
}: QueryOptions & { category?: string; limit?: number } = {}): Promise<Post[]> {
  return safeQuery(
    `posts:${category ?? 'all'}`,
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'posts',
        where: category ? { category: { equals: category } } : undefined,
        // Newest first, falling back to creation date for posts never given an
        // explicit publish date.
        sort: ['-publishedAt', '-createdAt'],
        limit,
        depth: 2,
        draft,
        overrideAccess: draft,
      })

      return result.docs
    },
    [],
  )
}

export async function getPostBySlug(
  slug: string,
  { draft = false }: QueryOptions = {},
): Promise<Post | null> {
  return safeQuery(
    `post:${slug}`,
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'posts',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 2,
        draft,
        overrideAccess: draft,
      })

      return result.docs[0] ?? null
    },
    null,
  )
}

export async function getPostSlugs(): Promise<string[]> {
  return safeQuery(
    'post-slugs',
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'posts',
        limit: 500,
        depth: 0,
        pagination: false,
        select: { slug: true },
      })

      return result.docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
    },
    [],
  )
}

/* ───────────────────────────────  gallery  ─────────────────────────────── */

/**
 * Gallery photos, newest first, with an optional manual override.
 *
 * `galleryOrder` sorts ahead of the upload date so the client can pin a hero
 * shot to the front without re-uploading anything.
 */
export async function getGalleryPhotos({ limit = 300 } = {}): Promise<Media[]> {
  return safeQuery(
    'gallery-photos',
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'media',
        where: {
          and: [{ showInGallery: { equals: true } }, { mimeType: { like: 'image' } }],
        },
        sort: ['galleryOrder', '-createdAt'],
        limit,
        depth: 1,
      })

      return result.docs
    },
    [],
  )
}

/** Photos tagged with a given event, used on the event page. */
export async function getEventPhotos(eventId: number | string, { limit = 60 } = {}): Promise<Media[]> {
  return safeQuery(
    `event-photos:${eventId}`,
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'media',
        where: {
          and: [{ event: { equals: eventId } }, { mimeType: { like: 'image' } }],
        },
        sort: ['galleryOrder', '-createdAt'],
        limit,
        depth: 0,
      })

      return result.docs
    },
    [],
  )
}
