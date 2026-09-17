import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import React from 'react'

import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { EventCard } from '@/components/ui/EventCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { EVENTS_PAGE_COPY } from '@/globals/pageCopy'
import { asMedia } from '@/lib/media'
import { getEventsPage, getPastEvents, getUpcomingEvents } from '@/lib/queries'

export const revalidate = 3600

/**
 * The wording this page ships with, shared with the global that makes it editable.
 *
 * Used for every field, so a cleared field, a global that has never been saved, or a
 * database read that fails all render real copy rather than a blank heading. Defined
 * in one place with the field defaults — see the note in globals/pageCopy.ts.
 */
const COPY = EVENTS_PAGE_COPY

export async function generateMetadata(): Promise<Metadata> {
  const page = await getEventsPage()

  return {
    title: page?.seo?.title || COPY.seo.title,
    description: page?.seo?.description || COPY.seo.description,
  }
}

export default async function EventsPage() {
  const { isEnabled: draft } = await draftMode()

  const [upcoming, past, page] = await Promise.all([
    getUpcomingEvents({ draft }),
    getPastEvents({ draft }),
    getEventsPage({ draft }),
  ])

  // The chosen photo wins; otherwise use the next event's artwork, falling back to
  // the most recent past event so the header is never bare.
  const headerImage =
    asMedia(page?.intro?.image) ??
    asMedia(upcoming[0]?.backgroundImage) ??
    asMedia(upcoming[0]?.coverImage) ??
    asMedia(past[0]?.backgroundImage) ??
    asMedia(past[0]?.coverImage)

  return (
    <>
      <PageHeader
        eyebrow={page?.intro?.eyebrow || COPY.intro.eyebrow}
        heading={page?.intro?.heading || COPY.intro.heading}
        standfirst={page?.intro?.standfirst || COPY.intro.standfirst}
        image={headerImage}
      />

      <section id="upcoming" className="section-pad">
        <div className="container-site">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SplitHeading as="h2" className="type-3">
              {page?.upcoming?.heading || COPY.upcoming.heading}
            </SplitHeading>
            <p className="text-small tracking-[0.14em] text-chrome-dim uppercase">
              {upcoming.length} {page?.upcoming?.countLabel || COPY.upcoming.countLabel}
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
            <EmptyState
              heading={page?.upcomingEmpty?.heading || COPY.upcomingEmpty.heading}
              body={page?.upcomingEmpty?.body || COPY.upcomingEmpty.body}
              linkLabel={page?.upcomingEmpty?.linkLabel || COPY.upcomingEmpty.linkLabel}
              linkUrl={page?.upcomingEmpty?.linkUrl || COPY.upcomingEmpty.linkUrl}
            />
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section id="past" className="section-pad border-t border-hairline bg-surface">
          <div className="container-site">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-3">{page?.past?.eyebrow || COPY.past.eyebrow}</p>
                <SplitHeading as="h2" className="type-3">
                  {page?.past?.heading || COPY.past.heading}
                </SplitHeading>
              </div>
              <Link
                href="/gallery"
                className="font-display text-[1.25rem] text-nexgen uppercase transition-colors hover:text-ember"
              >
                {page?.past?.galleryLinkLabel || COPY.past.galleryLinkLabel} →
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
