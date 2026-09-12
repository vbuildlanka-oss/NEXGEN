import Link from 'next/link'
import React from 'react'

import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { ResponsiveImage } from '@/components/ui/ResponsiveImage'
import type { MediaLike } from '@/lib/media'

export type Teaser = {
  eyebrow?: string | null
  heading: string
  body?: string | null
  linkLabel: string
  linkUrl: string
  image?: MediaLike
}

type Props = {
  teasers: Teaser[]
}

/**
 * The three blocks at the foot of the homepage that hand visitors on to Events,
 * Updates and Gallery.
 */
export const Teasers: React.FC<Props> = ({ teasers }) => {
  if (teasers.length === 0) return null

  return (
    <section className="section-pad bg-ink">
      <div className="container-site">
        <div className="grid gap-6 md:grid-cols-3">
          {teasers.map((teaser, index) => (
            <Reveal key={`${teaser.heading}-${index}`} delay={index * 0.08}>
              <Link
                href={teaser.linkUrl}
                className="group relative flex h-full flex-col overflow-hidden border border-hairline bg-surface transition-colors duration-300 hover:border-nexgen"
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
                  {teaser.image ? (
                    <ResponsiveImage
                      media={teaser.image}
                      sizes="(max-width: 768px) 92vw, 31vw"
                      reserveSpace={false}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.05]"
                      alt=""
                    />
                  ) : (
                    <div className="h-full w-full bg-surface-raised" />
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, color-mix(in oklab, var(--color-ink) 85%, transparent), transparent 65%)',
                    }}
                  />
                </div>

                <div className="flex flex-1 flex-col gap-3 p-6">
                  {teaser.eyebrow && <p className="eyebrow">{teaser.eyebrow}</p>}
                  <SplitHeading as="h2" className="type-5">
                    {teaser.heading}
                  </SplitHeading>
                  {teaser.body && <p className="text-chrome">{teaser.body}</p>}
                  <span className="mt-auto inline-flex items-center gap-2 pt-2 font-display text-[1.15rem] text-nexgen uppercase transition-colors group-hover:text-ember">
                    {teaser.linkLabel}
                    <span
                      aria-hidden
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
