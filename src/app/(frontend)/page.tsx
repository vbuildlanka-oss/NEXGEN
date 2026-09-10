import { draftMode } from 'next/headers'
import Link from 'next/link'
import React from 'react'

import { HeroVideo } from '@/components/home/HeroVideo'
import { PanelsIntro } from '@/components/home/PanelsIntro'
import { PhotoCanvas } from '@/components/home/PhotoCanvas'
import { Teasers, type Teaser } from '@/components/home/Teasers'
import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { EventCard } from '@/components/ui/EventCard'
import { PostCard } from '@/components/ui/PostCard'
import { asMedia, pickSrc } from '@/lib/media'
import { getHomePage, getHomePanels, getPosts, getUpcomingEvents } from '@/lib/queries'

/* Rebuilt on demand when content is saved (see src/hooks/revalidate.ts), with an
   hourly safety net in case a revalidation call is ever missed. */
export const revalidate = 3600

/** Fallbacks so the hero is never empty, even before the CMS is seeded. */
const DEFAULT_HERO = {
  mp4: '/hero/hero.mp4',
  webm: '/hero/hero.webm',
  poster: '/hero/hero-poster.jpg',
}

export default async function HomePage() {
  const { isEnabled: draft } = await draftMode()

  const [home, panels, upcoming, posts] = await Promise.all([
    getHomePage({ draft }),
    getHomePanels({ draft }),
    getUpcomingEvents({ limit: 3, draft }),
    getPosts({ limit: 2, draft }),
  ])

  const heroVideo = asMedia(home?.heroVideo)
  const heroPoster = asMedia(home?.heroPoster)

  const teasers: Teaser[] = (home?.teasers ?? []).map((teaser) => ({
    eyebrow: teaser.eyebrow,
    heading: teaser.heading,
    body: teaser.body,
    linkLabel: teaser.linkLabel,
    linkUrl: teaser.linkUrl,
    image: teaser.image,
  }))

  return (
    <>
      <HeroVideo
        mp4Url={heroVideo?.url ?? DEFAULT_HERO.mp4}
        webmUrl={heroVideo?.url ? null : DEFAULT_HERO.webm}
        posterUrl={pickSrc(heroPoster) ?? DEFAULT_HERO.poster}
        headline={home?.heroHeadline ?? 'A new generation of entertainment'}
        subheadline={home?.heroSubheadline}
        scrollHint={home?.heroScrollHint}
        buttons={(home?.heroButtons ?? []).map((button) => ({
          label: button.label,
          url: button.url,
          style: button.style,
        }))}
      />

      <PanelsIntro
        eyebrow={home?.panelsEyebrow}
        statement={
          home?.panelsIntro ??
          'A home for the artists shaping what comes next — and the crowds who find them first.'
        }
      />

      <PhotoCanvas panels={panels} />

      {upcoming.length > 0 && (
        <section className="section-pad border-t border-hairline bg-ink">
          <div className="container-site">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-3">What’s coming</p>
                <SplitHeading as="h2" className="text-[clamp(2rem,4.5vw,3.5rem)]">
                  Upcoming events
                </SplitHeading>
              </div>
              <Link
                href="/events"
                className="font-display text-[1.25rem] text-nexgen uppercase transition-colors hover:text-ember"
              >
                All events →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, index) => (
                <Reveal key={event.id} delay={index * 0.08}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="section-pad border-t border-hairline bg-ink">
          <div className="container-site">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-3">From the newsroom</p>
                <SplitHeading as="h2" className="text-[clamp(2rem,4.5vw,3.5rem)]">
                  Latest updates
                </SplitHeading>
              </div>
              <Link
                href="/updates"
                className="font-display text-[1.25rem] text-nexgen uppercase transition-colors hover:text-ember"
              >
                All updates →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post, index) => (
                <Reveal key={post.id} delay={index * 0.08}>
                  <PostCard post={post} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <Teasers teasers={teasers} />
    </>
  )
}
