import React from 'react'

import { ResponsiveImage } from '@/components/ui/ResponsiveImage'
import { Parallax } from '@/components/motion/Parallax'
import { SplitHeading } from '@/components/motion/SplitHeading'
import type { MediaLike } from '@/lib/media'

type Props = {
  eyebrow?: string | null
  heading: string
  standfirst?: string | null
  image?: MediaLike
  children?: React.ReactNode
}

/**
 * The header every interior page opens with.
 *
 * Keeps Our Story, Events, Updates, Gallery and Contact on the same rhythm as
 * the homepage — full-bleed dark photography, oversized condensed type sliding up
 * out of a mask — so the pages read as one design system rather than a template
 * bolted onto a bespoke homepage.
 */
export const PageHeader: React.FC<Props> = ({
  eyebrow,
  heading,
  standfirst,
  image,
  children,
}) => (
  <header className="relative grain overflow-hidden border-b border-hairline">
    {image && (
      <>
        {/* The backdrop drifts as the header scrolls away, which is what stops an
            interior page opening as a flat static image. */}
        <Parallax className="absolute inset-0" distance={16}>
          <ResponsiveImage
            media={image}
            sizes="100vw"
            priority
            reserveSpace={false}
            className="h-full w-full object-cover"
            alt=""
          />
        </Parallax>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, var(--color-ink) 8%, color-mix(in oklab, var(--color-ink) 72%, transparent) 55%, color-mix(in oklab, var(--color-ink) 45%, transparent))',
          }}
        />
      </>
    )}

    <div
      className="container-site relative flex flex-col justify-end"
      style={{
        paddingTop: 'calc(var(--nav-height) + clamp(3rem,8vh,7rem))',
        paddingBottom: 'clamp(2.5rem,6vh,5rem)',
        minHeight: image ? '62svh' : 'auto',
      }}
    >
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <SplitHeading as="h1" className="display-heading max-w-[22ch]">
        {heading}
      </SplitHeading>
      {standfirst && (
        <p className="mt-6 max-w-[60ch] text-body-lg text-chrome">{standfirst}</p>
      )}
      {children}
    </div>
  </header>
)
