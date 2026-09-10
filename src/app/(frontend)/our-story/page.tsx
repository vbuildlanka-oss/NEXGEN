import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import React from 'react'

import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { PageHeader } from '@/components/ui/PageHeader'
import { ResponsiveImage } from '@/components/ui/ResponsiveImage'
import { RichText } from '@/components/ui/RichText'
import { Button } from '@/components/ui/Button'
import type { MediaLike } from '@/lib/media'
import { getOurStory } from '@/lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Our Story',
  description:
    'Why NexGen exists, what it stands for, and the community of artists and audiences built around it.',
}

type Section = {
  heading?: string | null
  body?: unknown
  image?: MediaLike
  pullQuote?: string | null
}

export default async function OurStoryPage() {
  const { isEnabled: draft } = await draftMode()
  const story = await getOurStory({ draft })

  const sections: Section[] = [
    story?.whatIsNexGen,
    story?.whyWeStarted,
    story?.whatWeStandFor,
    story?.community,
  ].filter(Boolean) as Section[]

  return (
    <>
      <PageHeader
        eyebrow={story?.intro?.eyebrow ?? 'Our Story'}
        heading={story?.intro?.heading ?? 'Built for what comes next'}
        standfirst={story?.intro?.standfirst}
        image={story?.intro?.image}
      />

      {sections.map((section, index) => {
        // Alternate which side the photograph sits on, so a page of four text
        // blocks still has a rhythm to scroll through.
        const imageFirst = index % 2 === 1

        return (
          <section
            key={section.heading ?? index}
            className={`section-pad ${index > 0 ? 'border-t border-hairline' : ''}`}
          >
            <div className="container-site">
              <div
                className={`grid items-start gap-[clamp(2rem,5vw,5rem)] ${
                  section.image ? 'lg:grid-cols-2' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]'
                }`}
              >
                {section.image && imageFirst && (
                  <Reveal className="lg:order-first">
                    <ResponsiveImage
                      media={section.image}
                      sizes="(max-width: 1024px) 92vw, 46vw"
                      className="w-full object-cover"
                      alt=""
                    />
                  </Reveal>
                )}

                <div className={imageFirst ? 'lg:order-last' : ''}>
                  <span
                    aria-hidden
                    className="mb-6 block h-[3px] w-16 bg-nexgen"
                  />
                  {section.heading && (
                    <SplitHeading as="h2" className="text-[clamp(1.9rem,4vw,3rem)]">
                      {section.heading}
                    </SplitHeading>
                  )}

                  <Reveal className="mt-6">
                    <RichText data={section.body as never} />
                  </Reveal>

                  {section.pullQuote && (
                    <Reveal className="mt-8">
                      <p className="border-l-[3px] border-ember pl-5 font-display text-[clamp(1.4rem,2.6vw,2rem)] leading-[1.1] text-chrome-bright uppercase">
                        {section.pullQuote}
                      </p>
                    </Reveal>
                  )}
                </div>

                {section.image && !imageFirst && (
                  <Reveal>
                    <ResponsiveImage
                      media={section.image}
                      sizes="(max-width: 1024px) 92vw, 46vw"
                      className="w-full object-cover"
                      alt=""
                    />
                  </Reveal>
                )}
              </div>
            </div>
          </section>
        )
      })}

      <section className="border-t border-hairline bg-surface">
        <div className="container-site flex flex-col items-start gap-6 py-[clamp(3rem,7vw,6rem)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow mb-3">Come and see for yourself</p>
            <SplitHeading as="h2" className="text-[clamp(1.8rem,3.6vw,2.75rem)]">
              The next one is already in motion
            </SplitHeading>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/events" size="lg">
              See events
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Work with us
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
