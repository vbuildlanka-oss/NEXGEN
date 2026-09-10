'use client'

import Link from 'next/link'
import React, { useEffect, useRef } from 'react'

import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '@/lib/gsap'
import { asMedia, buildSrcSet, mediaAlt, pickSrc } from '@/lib/media'
import type { HomePanel } from '@/payload-types'

type Props = {
  panels: HomePanel[]
}

const ACCENTS: Record<string, string> = {
  'nexgen-red': 'var(--color-nexgen)',
  'ember-red': 'var(--color-ember)',
  'chrome-grey': 'var(--color-chrome)',
}

/**
 * The scroll-driven photo canvas.
 *
 * Reproduces the reference site's "pillars" section, whose construction I read
 * off the live page rather than guessing at:
 *
 *   • A `position: sticky` stage, one viewport tall, pinned for the length of the
 *     section.
 *   • Two stacked layers inside it — every background photo absolutely
 *     positioned on top of one another, and every foreground photo plus heading
 *     likewise.
 *   • One invisible, viewport-tall trigger element per panel. Each has its own
 *     ScrollTrigger firing `onEnter` / `onLeaveBack`, and each of those builds a
 *     timeline that moves the outgoing and incoming panel at the same time.
 *   • The panel change is a vertical reel wipe, not a cross-fade: the incoming
 *     background travels `y: 110% → 0%` while its width goes `80% → 100%`, so it
 *     appears to widen into place as it arrives. The foreground photo scales up
 *     from zero and the heading's lines rise out of a mask.
 *   • A progress bar tracking scroll position through the whole section.
 *
 * The scroll length is `panels.length × 100svh`, so adding an eighth panel in the
 * admin panel lengthens the section automatically — nothing here is hard-coded
 * to seven.
 */
export const PhotoCanvas: React.FC<Props> = ({ panels }) => {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || panels.length === 0) return

    const ctx = gsap.context(() => {
      const backgrounds = gsap.utils.toArray<HTMLElement>('[data-canvas-bg]', section)
      const foregrounds = gsap.utils.toArray<HTMLElement>('[data-canvas-fg]', section)
      const headings = gsap.utils.toArray<HTMLElement>('[data-canvas-heading]', section)
      const blocks = gsap.utils.toArray<HTMLElement>('[data-canvas-block]', section)
      const triggers = gsap.utils.toArray<HTMLElement>('[data-canvas-trigger]', section)
      const progress = section.querySelector<HTMLElement>('[data-canvas-progress]')

      if (backgrounds.length === 0) return

      const reduced = prefersReducedMotion()
      const isDesktop = window.matchMedia('(min-width: 992px)').matches
      // The width the outgoing/incoming background narrows to. On phones the
      // narrowing reads as a glitch rather than a flourish, so it is skipped.
      const restingWidth = isDesktop ? '80%' : '100%'

      /* ── split each heading into masked lines ───────────────────────────── */
      const splits = headings.map(
        (heading) =>
          new SplitText(heading, {
            type: 'lines',
            linesClass: 'canvas-line',
            mask: 'lines',
          }),
      )
      const lines = splits.map((split) => split.lines)

      headings.forEach((heading) => gsap.set(heading, { autoAlpha: 1 }))

      if (reduced) {
        // No scroll animation: show the first panel and leave it. The remaining
        // panels' headings stay in the document for screen readers.
        gsap.set(backgrounds, { autoAlpha: 0 })
        gsap.set(backgrounds[0], { autoAlpha: 1, yPercent: 0, width: '100%' })
        gsap.set(foregrounds, { autoAlpha: 0, scale: 1 })
        gsap.set(foregrounds[0], { autoAlpha: 1 })
        gsap.set(blocks, { autoAlpha: 0 })
        gsap.set(blocks[0], { autoAlpha: 1 })
        lines.flat().forEach((line) => gsap.set(line, { yPercent: 0 }))
        return () => splits.forEach((split) => split.revert())
      }

      /* ── initial state ─────────────────────────────────────────────────── */
      gsap.set(backgrounds.slice(1), { yPercent: 110, width: restingWidth })
      gsap.set(backgrounds[0], { yPercent: 0, width: '100%' })
      gsap.set(foregrounds, { scale: 0, autoAlpha: 0, pointerEvents: 'none' })
      gsap.set(foregrounds[0], { pointerEvents: 'auto' })
      lines.forEach((panelLines, index) => {
        gsap.set(panelLines, { yPercent: index === 0 ? 0 : 100 })
      })

      /* ── entrance of the first panel, scrubbed as the section arrives ──── */
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            end: 'top 5%',
            scrub: 1,
          },
        })
        .fromTo(backgrounds[0], { yPercent: 8, autoAlpha: 0.25 }, { yPercent: 0, autoAlpha: 1 }, 0)
        .fromTo(foregrounds[0], { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1 }, 0)

      /* ── one trigger per panel ─────────────────────────────────────────── */
      const move = (outgoing: number, incoming: number, direction: 1 | -1) => {
        const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' } })

        timeline
          // Outgoing panel leaves in the direction of travel and narrows again.
          .to(
            backgrounds[outgoing],
            { yPercent: -110 * direction, width: restingWidth, duration: 0.6 },
            0,
          )
          .to(foregrounds[outgoing], { scale: 0, autoAlpha: 0, duration: 0.6 }, 0)
          .to(lines[outgoing], { yPercent: -100 * direction, autoAlpha: 0, duration: 0.4 }, 0)
          // Incoming panel arrives from the opposite edge, widening as it lands.
          .fromTo(
            backgrounds[incoming],
            { yPercent: 110 * direction },
            { yPercent: 0, width: '100%', duration: 0.6 },
            0,
          )
          .to(foregrounds[incoming], { scale: 1, autoAlpha: 1, duration: 0.6 }, 0)
          .fromTo(
            lines[incoming],
            { yPercent: 100 * direction },
            { yPercent: 0, autoAlpha: 1, duration: 0.4 },
            0,
          )
          .set(foregrounds[outgoing], { pointerEvents: 'none' }, 0)
          .set(foregrounds[incoming], { pointerEvents: 'auto' }, 0)

        return timeline
      }

      triggers.forEach((trigger, index) => {
        // Panel 0 is the initial state; its trigger sits at the very top of the
        // track and would fire before the section is even pinned.
        if (index === 0) return

        ScrollTrigger.create({
          trigger,
          start: 'top 30%',
          end: 'top top',
          onEnter: () => move(index - 1, index, 1),
          onLeaveBack: () => move(index, index - 1, -1),
        })
      })

      /* ── progress bar ──────────────────────────────────────────────────── */
      if (progress) {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            gsap.to(progress, { scaleX: self.progress, ease: 'none', duration: 0.15 })
          },
        })
      }

      /* ── re-measure once the photography has decoded ───────────────────── */
      const images = Array.from(section.querySelectorAll('img'))
      let pending = images.filter((image) => !image.complete).length
      const settle = () => {
        pending -= 1
        if (pending <= 0) ScrollTrigger.refresh()
      }

      if (pending > 0) {
        images
          .filter((image) => !image.complete)
          .forEach((image) => {
            image.addEventListener('load', settle, { once: true })
            image.addEventListener('error', settle, { once: true })
          })
      }

      return () => splits.forEach((split) => split.revert())
    }, section)

    return () => ctx.revert()
  }, [panels])

  if (panels.length === 0) return null

  return (
    <section
      ref={sectionRef}
      aria-label="Inside a NexGen night"
      className="relative bg-ink"
      style={{ height: `${panels.length * 100}svh` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* background canvas layer */}
        <div className="absolute inset-0">
          {panels.map((panel, index) => {
            const background = asMedia(panel.backgroundImage)
            const src = pickSrc(background)

            return (
              <div
                key={`bg-${panel.id}`}
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
              >
                {src && (
                  <img
                    data-canvas-bg
                    src={src}
                    srcSet={buildSrcSet(background)}
                    sizes="100vw"
                    alt=""
                    aria-hidden
                    // The first two panels are needed almost immediately; the
                    // rest can wait until the visitor scrolls toward them.
                    loading={index < 2 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    className="h-full w-full object-cover"
                  />
                )}
                {/* Darkens the canvas so the foreground photo and heading hold. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, color-mix(in oklab, var(--color-ink) 55%, transparent), color-mix(in oklab, var(--color-ink) 25%, transparent) 40%, color-mix(in oklab, var(--color-ink) 80%, transparent))',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* foreground photo + heading layer */}
        <div className="absolute inset-0">
          {panels.map((panel) => {
            const artist = asMedia(panel.artistImage)
            const src = pickSrc(artist)
            const accent = ACCENTS[panel.accent ?? 'nexgen-red'] ?? ACCENTS['nexgen-red']

            return (
              <div
                key={`fg-${panel.id}`}
                data-canvas-fg
                className="absolute inset-0 flex flex-col items-center justify-center px-[clamp(1rem,4vw,3rem)] will-change-transform"
              >
                {src && (
                  <div
                    className="relative w-[min(78vw,23rem)] overflow-hidden rounded-[12px] border-2 border-ink/70 shadow-[0_30px_60px_-20px_rgba(8,8,8,0.9)]"
                    style={{ aspectRatio: '3 / 4' }}
                  >
                    <img
                      src={src}
                      srcSet={buildSrcSet(artist)}
                      sizes="(max-width: 768px) 78vw, 23rem"
                      alt={mediaAlt(artist, panel.heading)}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Heading block, overlapping the photo above it — the reference
                    lets the two collide rather than stacking them politely. */}
                <div
                  data-canvas-block
                  className="relative z-10 -mt-8 w-[min(90vw,34rem)]"
                >
                  {/* Torn top edge, cut from the same accent colour. */}
                  <svg
                    aria-hidden
                    viewBox="0 0 1200 26"
                    preserveAspectRatio="none"
                    className="block h-[16px] w-full"
                    style={{ marginBottom: '-1px' }}
                  >
                    <path
                      d="M0 26 L0 12 L64 18 L142 6 L226 16 L312 4 L398 14 L486 5 L574 15 L662 3 L748 13 L836 5 L924 16 L1010 7 L1098 17 L1200 9 L1200 26 Z"
                      fill={accent}
                    />
                  </svg>
                  <div className="px-6 pt-2 pb-6 text-center" style={{ backgroundColor: accent }}>
                    {panel.subheading && (
                      <p className="mb-1 text-small font-semibold tracking-[0.18em] text-ink/80 uppercase">
                        {panel.subheading}
                      </p>
                    )}
                    <h2
                      data-canvas-heading
                      className="text-[clamp(1.6rem,4.2vw,2.6rem)] leading-[1.04] text-ink"
                      style={{ visibility: 'hidden' }}
                    >
                      {panel.heading}
                    </h2>
                    {panel.link?.label && panel.link?.url && (
                      <Link
                        href={panel.link.url}
                        className="mt-3 inline-flex items-center gap-2 border-b-2 border-ink/40 pb-0.5 font-display text-[1.1rem] uppercase text-ink transition-colors hover:border-ink"
                      >
                        {panel.link.label}
                        <span aria-hidden>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* progress bar */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-20 h-[5px] bg-ink/60"
          style={{ marginTop: 'var(--nav-height)' }}
        >
          <div
            data-canvas-progress
            className="h-full w-full origin-left bg-nexgen"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>

      {/* One viewport-tall trigger per panel, aligned to the top of the track. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full">
        {panels.map((panel) => (
          <div key={`trigger-${panel.id}`} data-canvas-trigger className="h-[100svh] w-full" />
        ))}
      </div>
    </section>
  )
}
