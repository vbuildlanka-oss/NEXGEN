import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import React from 'react'

import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { EventCard } from '@/components/ui/EventCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { asMedia } from '@/lib/media'
import { getPastEvents, getUpcomingEvents } from '@/lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming NexGen events and the archive of everything that came before.',
}

export default async function EventsPage() {
  const { isEnabled: draft } = await draftMode()

  const [upcoming, past] = await Promise.all([
    getUpcomingEvents({ draft }),
    getPastEvents({ draft }),
  ])

  // Use the next event's artwork as the page's backdrop, falling back to the
  // most recent past event so the header is never bare.
  const headerImage =
    asMedia(upcoming[0]?.backgroundImage) ??
    asMedia(upcoming[0]?.coverImage) ??
    asMedia(past[0]?.backgroundImage) ??
    asMedia(past[0]?.coverImage)

  return (
    <>
      <PageHeader
        eyebrow="Events"
        heading="Where to find us next"
        standfirst="Every NexGen night, in one place — the ones ahead and the ones worth remembering."
        image={headerImage}
      />

      <section id="upcoming" className="section-pad">
        <div className="container-site">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SplitHeading as="h2" className="type-3">
              Upcoming events
            </SplitHeading>
            <p className="text-small tracking-[0.14em] text-chrome-dim uppercase">
              {upcoming.length} scheduled
            </p>
          </div>

          {upcoming.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, index) => (
                <Reveal key={event.id} delay={index * 0.06}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="border border-hairline bg-surface p-10 text-center">
              <p className="font-display text-[1.75rem] text-chrome-bright uppercase">
                Nothing announced just yet
              </p>
              <p className="mt-3 text-chrome">
                The next line-up is being locked in.{' '}
                <Link href="/contact" className="text-ember underline underline-offset-4">
                  Ask us what’s coming
                </Link>{' '}
                or check the{' '}
                <Link href="/updates" className="text-ember underline underline-offset-4">
                  latest updates
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section id="past" className="section-pad border-t border-hairline bg-surface">
          <div className="container-site">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-3">The archive</p>
                <SplitHeading as="h2" className="type-3">
                  Past events
                </SplitHeading>
              </div>
              <Link
                href="/gallery"
                className="font-display text-[1.25rem] text-nexgen uppercase transition-colors hover:text-ember"
              >
                Photos from the floor →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {past.map((event, index) => (
                <Reveal key={event.id} delay={Math.min(index, 6) * 0.05}>
                  <EventCard event={event} variant="past" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
