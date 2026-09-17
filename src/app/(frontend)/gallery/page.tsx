import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatShortDate } from '@/lib/format'
import { GALLERY_PAGE_COPY } from '@/globals/pageCopy'
import { asMedia } from '@/lib/media'
import { getGalleryPage, getGalleryPhotos } from '@/lib/queries'
import type { Event, Media } from '@/payload-types'

export const revalidate = 3600

/**
 * The wording this page ships with, shared with the global that makes it editable.
 *
 * Used for every field, so a cleared field, a global that has never been saved, or a
 * database read that fails all render real copy rather than a blank heading. Defined
 * in one place with the field defaults — see the note in globals/pageCopy.ts.
 */
const COPY = GALLERY_PAGE_COPY

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGalleryPage()

  return {
    title: page?.seo?.title || COPY.seo.title,
    description: page?.seo?.description || COPY.seo.description,
  }
}

type Group = {
  key: string
  event: Event | null
  photos: Media[]
}

export default async function GalleryPage() {
  const [photos, page] = await Promise.all([getGalleryPhotos(), getGalleryPage()])

  /**
   * Group by event where the photo has been tagged with one, keeping the order
   * the query returned so the client's manual `galleryOrder` still decides which
   * group appears first. Untagged photos collect into a final group rather than
   * being dropped.
   */
  const groups: Group[] = []
  const index = new Map<string, Group>()

  for (const photo of photos) {
    const event = typeof photo.event === 'object' && photo.event ? photo.event : null
    const key = event ? `event-${event.id}` : 'unsorted'

    let group = index.get(key)

    if (!group) {
      group = { key, event, photos: [] }
      index.set(key, group)
      groups.push(group)
    }

    group.photos.push(photo)
  }

  // Untagged photos always last, however early one of them happens to sort.
  groups.sort((a, b) => Number(a.key === 'unsorted') - Number(b.key === 'unsorted'))

  return (
    <>
      <PageHeader
        eyebrow={page?.intro?.eyebrow || COPY.intro.eyebrow}
        heading={page?.intro?.heading || COPY.intro.heading}
        standfirst={page?.intro?.standfirst}
        image={asMedia(page?.intro?.image) ?? photos[0]}
      />

      <section className="section-pad">
        <div className="container-site">
          {groups.length === 0 ? (
            <EmptyState
              heading={page?.empty?.heading || COPY.empty.heading}
              body={page?.empty?.body || COPY.empty.body}
              linkLabel={page?.empty?.linkLabel || COPY.empty.linkLabel}
              linkUrl={page?.empty?.linkUrl || COPY.empty.linkUrl}
            />
          ) : (
            <div className="flex flex-col gap-[clamp(3rem,6vw,5rem)]">
              {groups.map((group) => (
                <div key={group.key}>
                  {group.event ? (
                    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="type-5">{group.event.title}</h2>
                      <div className="flex items-center gap-4 text-small text-chrome-dim">
                        <span>{formatShortDate(group.event.startsAt)}</span>
                        <Link
                          href={`/events/${group.event.slug}`}
                          className="font-display text-[1rem] text-nexgen uppercase transition-colors hover:text-ember"
                        >
                          {page?.groups?.eventLinkLabel || COPY.groups.eventLinkLabel} →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <h2 className="mb-6 type-5">
                      {page?.groups?.untaggedHeading || COPY.groups.untaggedHeading}
                    </h2>
                  )}

                  <GalleryGrid photos={group.photos} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
