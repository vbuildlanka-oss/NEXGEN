'use client'

import Link from 'next/link'
import React, { useRef } from 'react'

import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
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
 * Where each panel's photograph leads.
 *
 * The panels are the site's argument for itself, so each one hands off to the page
 * that makes good on it: the floor to what is coming up, the booth to artist news,
 * the rooms to the story of why they are chosen that way, and so on. Seven distinct
 * destinations, which is why two of them are anchors within Events rather than a
 * second link to the same page.
 *
 * A default rather than a rule: a panel with its own link set in the admin panel
 * uses that instead, so the client can repoint any of them without touching code.
 * Keyed by position, and cycled if an eighth panel is ever added.
 */
const DESTINATIONS: { label: string; url: string }[] = [
  { label: 'See what’s on', url: '/events#upcoming' },
  { label: 'Artist news', url: '/updates' },
  { label: 'Why these rooms', url: '/our-story' },
  { label: 'Nights so far', url: '/events#past' },
  { label: 'Every line-up', url: '/events' },
  { label: 'Faces from the floor', url: '/gallery' },
  { label: 'Talk to us', url: '/contact' },
]

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
 *   • One scrubbed timeline across the whole section, giving each panel an equal
 *     segment of the scroll distance. The reference uses a separate trigger and a
 *     fixed-duration timeline per panel; that snapped when scrolled quickly, so
 *     this tracks scroll position directly instead.
 *   • The panel change is a vertical reel wipe, not a cross-fade: the incoming
 *     background travels `y: 110% → 0%` while its width goes `80% → 100%`, so it
 *     appears to widen into place as it arrives. The foreground photo scales up
 *     from zero and the heading's lines rise out of a mask.
 *   • A progress bar tracking scroll position through the whole section.
 *
 * The scroll length is `panels.length × 100svh`, so adding an eighth panel in the
 * admin panel lengthens the section automatically — nothing here is hard-coded
 * to seven, including the timeline, which is built from the panel count.
 */
export const PhotoCanvas: React.FC<Props> = ({ panels }) => {
  const sectionRef = useRef<HTMLElement | null>(null)

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current
    if (!section || panels.length === 0) return

    const ctx = gsap.context(() => {
      const backgrounds = gsap.utils.toArray<HTMLElement>('[data-canvas-bg]', section)
      const foregrounds = gsap.utils.toArray<HTMLElement>('[data-canvas-fg]', section)
      const headings = gsap.utils.toArray<HTMLElement>('[data-canvas-heading]', section)
      const blocks = gsap.utils.toArray<HTMLElement>('[data-canvas-block]', section)
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


      if (reduced) {
        // No scroll animation: show the first panel and leave it. The remaining
        // panels' headings stay in the document for screen readers.
        gsap.set(backgrounds, { autoAlpha: 0 })
        gsap.set(backgrounds[0], { autoAlpha: 1, yPercent: 0, width: '100%' })
        // `pointerEvents` matters even here: all seven photographs are stacked, and
        // the six invisible ones would otherwise still intercept the click meant for
        // the one on show.
        gsap.set(foregrounds, { autoAlpha: 0, scale: 1, pointerEvents: 'none' })
        gsap.set(foregrounds[0], { autoAlpha: 1, pointerEvents: 'auto' })
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

      /* ── one scrubbed timeline across the whole section ────────────────── */
      /**
       * Previously each panel had its own ScrollTrigger firing a fixed 0.6s
       * timeline on entry. That plays at its own pace regardless of how fast you
       * are scrolling, so a flick of the wheel left the animation catching up and
       * the section felt like it was snapping between states.
       *
       * Now there is a single timeline scrubbed against scroll position, so the
       * panels track the scroll exactly — scroll slowly and they move slowly;
       * stop halfway and they stay halfway. `scrub: 1` adds a one-second catch-up
       * so the motion glides rather than tracking the wheel one-to-one.
       *
       * Each panel gets a segment one unit long: it holds still for the first
       * part, then hands over to the next panel. The hold is what stops the
       * section feeling like a continuous blur.
       */
      const HOLD = 0.55
      const MOVE = 0.45

      const master = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      })

      panels.forEach((_, index) => {
        if (index === 0) return

        const at = index - 1 + HOLD
        const outgoing = index - 1

        master
          // Outgoing panel leaves upward and narrows again.
          .to(
            backgrounds[outgoing],
            { yPercent: -110, width: restingWidth, duration: MOVE },
            at,
          )
          .to(foregrounds[outgoing], { scale: 0, autoAlpha: 0, duration: MOVE }, at)
          .to(lines[outgoing], { yPercent: -100, autoAlpha: 0, duration: MOVE * 0.8 }, at)
          // Incoming panel arrives from below, widening as it lands.
          .fromTo(
            backgrounds[index],
            { yPercent: 110, width: restingWidth },
            { yPercent: 0, width: '100%', duration: MOVE },
            at,
          )
          .fromTo(
            foregrounds[index],
            { scale: 0, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: MOVE },
            at,
          )
          .fromTo(
            lines[index],
            { yPercent: 100, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: MOVE * 0.8 },
            at + MOVE * 0.2,
          )
      })

      /**
       * Only the panel currently on screen should be clickable, and that cannot
       * come from the timeline — a scrubbed tween has no notion of "arrived".
       */
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const active = Math.min(
            panels.length - 1,
            Math.round(self.progress * (panels.length - 1)),
          )

          foregrounds.forEach((foreground, index) => {
            foreground.style.pointerEvents = index === active ? 'auto' : 'none'
          })
        },
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
                    /* A touch more contrast and light, so the stage detail in
                       these very dark frames survives being a background. */
                    style={{ filter: 'brightness(1.18) contrast(1.06)' }}
                  />
                )}
                {/* Darkens the canvas so the foreground photo and heading hold. */}
                {/* Legibility scrim. Kept deliberately light: the client's
                    photography is already low-key nightclub imagery, and the
                    original three-stop gradient (55%/25%/80% ink) crushed it to
                    the point the background was barely visible. Now it only
                    darkens the very top and bottom, where the progress bar and
                    the heading block sit, and leaves the middle of the frame
                    alone. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, color-mix(in oklab, var(--color-ink) 30%, transparent) 0%, transparent 22%, transparent 62%, color-mix(in oklab, var(--color-ink) 55%, transparent) 100%)',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* foreground photo + heading layer */}
        <div className="absolute inset-0">
          {panels.map((panel, index) => {
            const artist = asMedia(panel.artistImage)
            const src = pickSrc(artist)
            const accent = ACCENTS[panel.accent ?? 'nexgen-red'] ?? ACCENTS['nexgen-red']
            const destination =
              panel.link?.url && panel.link.url.trim().length > 0
                ? { label: panel.link.label || 'Find out more', url: panel.link.url }
                : DESTINATIONS[index % DESTINATIONS.length]

            /**
             * Whether this panel already shows a written link of its own, in the
             * heading block below the photograph.
             *
             * Only panels with a Link set in the admin panel do — currently just the
             * seventh — and on those the arrow on the photograph was a second arrow
             * saying the same thing twice. So the photograph keeps its link but drops
             * its cue, and the written link speaks for the panel.
             *
             * Derived rather than hardcoded to the seventh panel: the duplication
             * follows the CMS field, so filling that field in on another panel would
             * otherwise reintroduce exactly this bug there.
             */
            const hasWrittenLink = Boolean(panel.link?.label && panel.link?.url)

            return (
              <div
                key={`fg-${panel.id}`}
                data-canvas-fg
                className="absolute inset-0 flex flex-col items-center justify-center px-[clamp(1rem,4vw,3rem)] will-change-transform"
              >
                {src && (
                  /**
                   * The photograph itself is the link. Only the photograph — the
                   * heading block below it carries its own link, and nesting one
                   * anchor inside another is invalid HTML that browsers resolve by
                   * silently closing the outer one.
                   *
                   * `pointer-events` is not set here: the containing
                   * `[data-canvas-fg]` layer is toggled by the ScrollTrigger above,
                   * so only the panel currently on screen is clickable. Without
                   * that, all seven photographs are stacked on top of one another
                   * and every click would land on the last one.
                   */
                  <Link
                    href={destination.url}
                    aria-label={`${panel.heading} — ${destination.label}`}
                    className="group/photo relative block w-[min(78vw,23rem)] overflow-hidden rounded-[12px] border-2 border-ink/70 shadow-[0_30px_60px_-20px_rgba(8,8,8,0.9)] transition-[border-color,box-shadow] duration-300 hover:border-nexgen focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nexgen"
                    style={{ aspectRatio: '3 / 4' }}
                  >
                    <img
                      src={src}
                      srcSet={buildSrcSet(artist)}
                      sizes="(max-width: 768px) 78vw, 23rem"
                      alt={mediaAlt(artist, panel.heading)}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover/photo:scale-[1.04]"
                    />
                    {/*
                      The cue that this is clickable, shown rather than hidden behind
                      a hover: half of the traffic here is on a phone, where hover
                      does not exist and an invisible link is simply an image.
                      
                      An arrow and nothing else, on instruction. It used to carry the
                      destination's name — "See what's on", "Faces from the floor" —
                      which needed a gradient behind it to stay legible over the
                      photograph. With the words gone the gradient went too: a bare
                      arrow reads over any frame given a shadow, and a full-width band
                      to carry one glyph was more furniture than the panel wants.
                      
                      The name has not been lost, only made invisible. It is still in
                      the link's `aria-label` below, which matters more now than it did
                      before — a screen reader announcing "link, arrow" would be
                      useless, so it announces the heading and the destination instead.
                      
                      `bottom-10` clears the heading block, which deliberately overlaps
                      the foot of the photograph by 2rem.
                    */}
                    {!hasWrittenLink && (
                      <span
                        aria-hidden
                        className="absolute right-4 bottom-10 text-chrome-bright transition-colors duration-300 group-hover/photo:text-nexgen"
                        // A shadow rather than a surface, the same reasoning as the menu
                        // button: it darkens what is behind the stroke without drawing a
                        // shape of its own.
                        style={{ filter: 'drop-shadow(0 1px 4px rgba(8,8,8,0.95))' }}
                      >
                        {/* Drawn rather than typed: the display face has no arrow
                            glyph, and an "→" in it renders as a missing-character box. */}
                        <svg
                          viewBox="0 0 24 12"
                          className="h-3.5 w-7 transition-transform duration-300 group-hover/photo:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M0 6h22M17 1l5 5-5 5" />
                        </svg>
                      </span>
                    )}
                  </Link>
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
                      className="type-4 leading-[1.04] text-ink"
                    >
                      {panel.heading}
                    </h2>
                    {hasWrittenLink && panel.link?.url && (
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

    </section>
  )
}
