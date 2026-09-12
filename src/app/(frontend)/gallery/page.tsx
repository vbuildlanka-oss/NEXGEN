import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatShortDate } from '@/lib/format'
import { getGalleryPhotos } from '@/lib/queries'
import type { Event, Media } from '@/payload-types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photographs from NexGen events — the artists, the rooms and the crowds.',
}

type Group = {
  key: string
  event: Event | null
  photos: Media[]
}

export default async function GalleryPage() {
  const photos = await getGalleryPhotos()

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
        eyebrow="Gallery"
        heading="Nights worth remembering"
        image={photos[0]}
      />

      <section className="section-pad">
        <div className="container-site">
          {groups.length === 0 ? (
            <div className="border border-hairline bg-surface p-10 text-center">
              <p className="font-display text-[1.75rem] text-chrome-bright uppercase">
                The gallery is being put together
              </p>
              <p className="mt-3 text-chrome">
                Photos from recent events are on their way. In the meantime, see{' '}
                <Link href="/events" className="text-ember underline underline-offset-4">
                  what’s coming up
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[clamp(3rem,6vw,5rem)]">
              {groups.map((group) => (
                <div key={group.key}>
                  {group.event ? (
                    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="type-5">
                        {group.event.title}
                      </h2>
                      <div className="flex items-center gap-4 text-small text-chrome-dim">
                        <span>{formatShortDate(group.event.startsAt)}</span>
                        <Link
                          href={`/events/${group.event.slug}`}
                          className="font-display text-[1rem] text-nexgen uppercase transition-colors hover:text-ember"
                        >
                          Event →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <h2 className="mb-6 type-5">More from the floor</h2>
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
