import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { RichText } from '@/components/ui/RichText'
import {
  formatArtists,
  formatEventDate,
  formatEventTime,
  formatPrice,
} from '@/lib/format'
import { asMedia, pickSrc } from '@/lib/media'
import { getEventBySlug, getEventPhotos, getEventSlugs, getUpcomingEvents } from '@/lib/queries'

export const revalidate = 3600

type Params = { params: Promise<{ slug: string }> }

/** Pre-render every event at build time; new ones are generated on first visit. */
export async function generateStaticParams() {
  const slugs = await getEventSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) return { title: 'Event not found' }

  const image = pickSrc(asMedia(event.coverImage))
  const description =
    event.tagline ||
    `${formatEventDate(event.startsAt)} at ${event.venue}${event.city ? `, ${event.city}` : ''}.`

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()

  const event = await getEventBySlug(slug, { draft })
  if (!event) notFound()

  const [photos, upcoming] = await Promise.all([
    getEventPhotos(event.id),
    getUpcomingEvents({ limit: 4, draft }),
  ])

  const artists = formatArtists(event.artists)
  const date = formatEventDate(event.startsAt)
  const time = formatEventTime(event.startsAt)
  const endTime = formatEventTime(event.endsAt)
  const isPast = new Date(event.endsAt ?? event.startsAt).getTime() < Date.now()

  const others = upcoming.filter((other) => other.id !== event.id).slice(0, 3)

  return (
    <>
      <PageHeader
        eyebrow={isPast ? 'Past event' : 'Upcoming event'}
        heading={event.title}
        standfirst={event.tagline}
        image={asMedia(event.backgroundImage) ?? asMedia(event.coverImage)}
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-body text-chrome-bright">
          {date && (
            <span className="font-display text-[1.4rem] uppercase">
              {date}
              {time ? ` · ${time}${endTime ? `–${endTime}` : ''}` : ''}
            </span>
          )}
          <span className="text-chrome">
            {event.venue}
            {event.city ? `, ${event.city}` : ''}
          </span>
        </div>
      </PageHeader>

      <section className="section-pad">
        <div className="container-site grid gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            {artists && (
              <div className="mb-10">
                <p className="eyebrow mb-4">Line-up</p>
                <ul className="flex flex-col gap-2">
                  {(event.artists ?? []).map((artist, index) => (
                    <li key={`${artist.name}-${index}`} className="flex items-baseline gap-4">
                      <span className="font-display text-[clamp(1.4rem,3vw,2.25rem)] leading-none text-chrome-bright uppercase">
                        {artist.name}
                      </span>
                      {artist.role && (
                        <span className="text-small tracking-[0.14em] text-nexgen uppercase">
                          {artist.role}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Reveal>
              <RichText data={event.description as never} />
            </Reveal>
          </div>

          {/* Ticket panel. Display only — there is no checkout in this build. */}
          <aside className="h-fit border border-hairline bg-surface p-6 lg:sticky lg:top-[calc(var(--nav-height)+1.5rem)]">
            <p className="eyebrow mb-4">{isPast ? 'This one has been and gone' : 'Tickets'}</p>

            {!isPast ? (
              <>
                <p className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-none text-chrome-bright">
                  {formatPrice(event.ticketPrice, event.currency)}
                </p>
                {event.ticketNote && (
                  <p className="mt-2 text-small text-chrome-dim">{event.ticketNote}</p>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  {event.soldOut ? (
                    <p className="border-2 border-hairline px-4 py-3 text-center font-display text-[1.25rem] text-chrome uppercase">
                      Sold out
                    </p>
                  ) : event.externalTicketUrl ? (
                    <Button href={event.externalTicketUrl} size="lg">
                      Get tickets
                    </Button>
                  ) : (
                    <>
                      <p className="text-small text-chrome">
                        Tickets are not on sale through this site yet. Message us and we will point
                        you to the door list or the on-sale link.
                      </p>
                      <Button href="/contact" variant="secondary">
                        Ask about tickets
                      </Button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-chrome">
                Have a look at{' '}
                <Link href="/gallery" className="text-ember underline underline-offset-4">
                  the photos
                </Link>
                , or see{' '}
                <Link href="/events" className="text-ember underline underline-offset-4">
                  what’s coming next
                </Link>
                .
              </p>
            )}

            <dl className="mt-8 flex flex-col gap-4 border-t border-hairline pt-6 text-small">
              <div>
                <dt className="tracking-[0.14em] text-chrome-dim uppercase">When</dt>
                <dd className="mt-1 text-chrome-bright">
                  {date}
                  {time ? `, ${time}` : ''}
                </dd>
              </div>
              <div>
                <dt className="tracking-[0.14em] text-chrome-dim uppercase">Where</dt>
                <dd className="mt-1 text-chrome-bright">
                  {event.venue}
                  {event.city ? `, ${event.city}` : ''}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="section-pad border-t border-hairline bg-surface">
          <div className="container-site">
            <GalleryGrid photos={photos} label="From the night" />
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="section-pad border-t border-hairline">
          <div className="container-site">
            <SplitHeading as="h2" className="mb-10 text-[clamp(1.7rem,3.4vw,2.5rem)]">
              While you’re here
            </SplitHeading>
            <ul className="flex flex-col divide-y divide-[color-mix(in_oklab,var(--color-chrome)_22%,transparent)] border-y border-hairline">
              {others.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`/events/${other.slug}`}
                    className="group flex flex-wrap items-baseline justify-between gap-3 py-5 transition-colors"
                  >
                    <span className="font-display text-[clamp(1.3rem,2.6vw,2rem)] text-chrome-bright uppercase transition-colors group-hover:text-ember">
                      {other.title}
                    </span>
                    <span className="text-small text-chrome">
                      {formatEventDate(other.startsAt)} · {other.venue}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
