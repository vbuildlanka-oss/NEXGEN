import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import React from 'react'

import { Parallax } from '@/components/motion/Parallax'
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
        const number = String(index + 1).padStart(2, '0')

        return (
          <section
            key={section.heading ?? index}
            className={`section-pad ${index > 0 ? 'border-t border-hairline' : ''}`}
          >
            <div className="container-site">
              {/*
                Only split into two columns when there is actually a photograph to
                put in the second one. Previously the grid was always two columns,
                so a section without an image — "What is NexGen?" — rendered its
                text in the left column and left the right half of the screen
                empty.
              */}
              <div
                className={`grid items-start gap-[clamp(2rem,5vw,4.5rem)] ${
                  section.image ? 'lg:grid-cols-2' : ''
                }`}
              >
                {section.image && (
                  <Reveal className={imageFirst ? 'lg:order-first' : 'lg:order-last'}>
                    <div className="relative lg:sticky lg:top-[calc(var(--nav-height)+2rem)]">
                      {/* Offset colour block, so the photograph sits on the page
                          rather than floating in it. */}
                      <span
                        aria-hidden
                        className={`absolute inset-0 -z-10 ${
                          imageFirst ? '-translate-x-3 -translate-y-3' : 'translate-x-3 translate-y-3'
                        } ${index % 2 === 0 ? 'bg-nexgen' : 'bg-ember'} opacity-30`}
                      />
                      {/*
                        A fixed aspect frame. The source photographs are a mix of
                        portrait and landscape, and rendering them at their natural
                        ratio made the portrait ones absurdly tall — a single image
                        ran longer than the text beside it. Cropping to a
                        consistent landscape frame keeps the page rhythm, and
                        `sticky` means a short caption never leaves dead space
                        alongside a long one.
                      */}
                      <Parallax
                        className="chamfer aspect-[4/3] w-full lg:aspect-[5/4]"
                        distance={10}
                      >
                        <ResponsiveImage
                          media={section.image}
                          sizes="(max-width: 1024px) 92vw, 46vw"
                          reserveSpace={false}
                          className="h-full w-full object-cover"
                          alt=""
                        />
                      </Parallax>
                    </div>
                  </Reveal>
                )}

                <div className={section.image ? '' : 'max-w-[68ch]'}>
                  {/* Numbered like chapters, which gives the four sections a
                      sense of sequence and fills the space a missing image
                      would otherwise leave. */}
                  <div className="mb-6 flex items-center gap-4">
                    <span
                      aria-hidden
                      className="font-display type-2 leading-none text-chrome"
                      style={{ opacity: 0.35 }}
                    >
                      {number}
                    </span>
                    <span aria-hidden className="h-[3px] flex-1 bg-nexgen" />
                  </div>

                  {section.heading && (
                    <SplitHeading as="h2" className="type-3">
                      {section.heading}
                    </SplitHeading>
                  )}

                  <Reveal className="mt-6">
                    <RichText data={section.body as never} />
                  </Reveal>

                  {section.pullQuote && (
                    <Reveal className="mt-8">
                      <p className="border-l-[3px] border-ember pl-5 font-display type-5 leading-[1.1] text-chrome-bright uppercase">
                        {section.pullQuote}
                      </p>
                    </Reveal>
                  )}
                </div>
              </div>
            </div>
          </section>
        )
      })}

      <section className="border-t border-hairline bg-surface">
        <div className="container-site flex flex-col items-start gap-6 py-[clamp(3rem,7vw,6rem)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow mb-3">Come and see for yourself</p>
            <SplitHeading as="h2" className="type-3">
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
