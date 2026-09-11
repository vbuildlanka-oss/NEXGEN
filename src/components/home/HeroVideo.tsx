'use client'

import React, { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/Button'
import { Wordmark } from '@/components/site/Wordmark'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { gsap, ScrollTrigger } from '@/lib/gsap'

type HeroButton = {
  label: string
  url: string
  style?: 'primary' | 'secondary' | null
}

type Props = {
  mp4Url: string
  webmUrl?: string | null
  posterUrl: string
  headline: string
  subheadline?: string | null
  scrollHint?: string | null
  buttons?: HeroButton[]
}

/**
 * The opening of the homepage: a full-screen looping video that shrinks into a
 * card as the page is scrolled, at which point the navigation bar appears.
 *
 * Technique matches the reference site's video section — a `scrub`bed GSAP
 * timeline driving transform, border-radius and opacity together, so the change
 * is tied to scroll position rather than being a hard cut at a threshold. The
 * reference runs it in the growing direction (small tilted card → full bleed);
 * the brief asks for the reverse, so the same timeline plays outward.
 *
 * There is no loading screen, per the brief. The poster frame is applied as a
 * CSS background on the `<video>` element itself, which is exactly what the
 * reference does: the first frame is painted before any video data arrives, so
 * the page opens on an image rather than a black box or a spinner.
 */
export const HeroVideo: React.FC<Props> = ({
  mp4Url,
  webmUrl,
  posterUrl,
  headline,
  subheadline,
  scrollHint,
  buttons = [],
}) => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const reduced = usePrefersReducedMotion()

  /* ── autoplay resilience ────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Safari and some mobile browsers ignore the `autoplay` attribute until
    // play() is called from script. A rejected promise is expected and harmless
    // — the poster frame simply remains visible.
    const attempt = () => {
      video.play().catch(() => {})
    }

    attempt()
    video.addEventListener('loadeddata', attempt)

    return () => video.removeEventListener('loadeddata', attempt)
  }, [])

  /* ── scroll-linked shrink ───────────────────────────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const frame = section.querySelector<HTMLElement>('[data-hero-frame]')
      const content = section.querySelector<HTMLElement>('[data-hero-content]')
      const hint = section.querySelector<HTMLElement>('[data-hero-hint]')
      const veil = section.querySelector<HTMLElement>('[data-hero-veil]')

      if (!frame) return

      const letters = section.querySelectorAll<SVGPathElement>('[data-hero-logo] [data-logo-letter]')

      if (reduced) {
        // Leave the video full-bleed and let the page scroll normally.
        gsap.set([frame, content], { clearProps: 'all' })
        gsap.set(hint, { autoAlpha: 0 })
        gsap.set(letters, { autoAlpha: 1, y: 0 })
        return
      }

      // The mark assembles itself as the page opens. This is an entrance, not a
      // preloader: the video and copy are already on screen behind it.
      if (letters.length > 0) {
        gsap.from(letters, {
          autoAlpha: 0,
          yPercent: 12,
          duration: 0.7,
          stagger: 0.07,
          ease: 'power3.out',
          delay: 0.15,
        })
      }

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      })

      timeline
        // Scaling rather than animating width/height keeps this on the compositor
        // — no layout work per frame, which is what makes it feel liquid.
        .to(frame, { scale: 0.6, borderRadius: '14px', rotateX: 6, y: '-4svh' }, 0)
        .to(content, { autoAlpha: 0, y: -48, duration: 0.45 }, 0)
        .to(veil, { autoAlpha: 0.75 }, 0)

      if (hint) {
        gsap.to(hint, {
          autoAlpha: 0,
          duration: 0.3,
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=15%',
            scrub: true,
          },
        })
      }

      // The video's intrinsic size is known immediately but the fonts in the
      // overlay are not; refresh once everything has settled so the trigger
      // boundaries are measured against the final layout.
      const refresh = () => ScrollTrigger.refresh()
      window.addEventListener('load', refresh, { once: true })

      return () => window.removeEventListener('load', refresh)
    }, section)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      data-hero
      aria-label="NexGen showreel"
      className="relative"
      // The extra height is the scroll distance the shrink is spread over.
      style={{ height: reduced ? '100svh' : '210svh' }}
    >
      <div
        className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden"
        // Perspective on the parent is what gives the frame's rotateX depth
        // instead of a flat squash.
        style={{ perspective: '1400px' }}
      >
        <div
          data-hero-frame
          className="relative h-full w-full origin-center overflow-hidden will-change-transform"
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            // Bias the crop upward: the source footage is portrait, so on a wide
            // screen the centre of interest sits above the geometric middle.
            style={{
              objectPosition: 'center 38%',
              backgroundImage: `url(${posterUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 38%',
            }}
            poster={posterUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden
            tabIndex={-1}
          >
            {webmUrl && <source src={webmUrl} type="video/webm" />}
            <source src={mp4Url} type="video/mp4" />
          </video>

          {/* Legibility scrim, weighted to the bottom where the copy sits. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, color-mix(in oklab, var(--color-ink) 88%, transparent) 0%, color-mix(in oklab, var(--color-ink) 30%, transparent) 45%, transparent 75%)',
            }}
          />
          {/* Deepens as the video shrinks, handing attention to what comes next. */}
          <div
            data-hero-veil
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-ink opacity-0"
          />
        </div>

        {/* Copy sits outside the frame so it fades on its own rather than
            shrinking with the video and becoming unreadable. */}
        <div
          data-hero-content
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 pb-[clamp(3.5rem,10vh,8rem)]"
        >
          <div className="container-site">
            {/* The mark itself opens the page, filled with the paint texture from
                the original logo artwork and drawn on letter by letter. */}
            <div data-hero-logo className="mb-5 w-[min(52vw,17rem)]">
              <Wordmark asLink={false} variant="texture" />
            </div>
            <h1 className="display-heading max-w-[24ch]">{headline}</h1>
            {subheadline && (
              <p className="mt-5 max-w-[52ch] text-body-lg text-chrome">{subheadline}</p>
            )}
            {buttons.length > 0 && (
              <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
                {buttons.map((button) => (
                  <Button
                    key={`${button.label}-${button.url}`}
                    href={button.url}
                    variant={button.style === 'secondary' ? 'secondary' : 'primary'}
                    size="lg"
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {scrollHint && (
          <div
            data-hero-hint
            aria-hidden
            className="absolute inset-x-0 bottom-5 z-10 hidden flex-col items-center gap-2 text-small font-semibold tracking-[0.2em] text-chrome uppercase sm:flex"
          >
            {scrollHint}
            <span className="h-8 w-[1px] bg-gradient-to-b from-chrome to-transparent" />
          </div>
        )}
      </div>
    </section>
  )
}
