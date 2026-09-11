'use client'

import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap'

/**
 * Momentum scrolling for the whole site.
 *
 * The scroll-driven sections were mathematically correct but felt abrupt, because
 * a mouse wheel delivers scroll in coarse jumps and every animation inherited
 * that steppiness. Lenis interpolates between those jumps, so the hero shrink, the
 * photo canvas and every reveal glide instead of ratcheting.
 *
 * Three integration details matter, and all three are easy to get wrong:
 *
 *  1. ScrollTrigger must be driven by Lenis rather than the native scroll event,
 *     or the two disagree about the current position and pinned sections jitter.
 *  2. GSAP's ticker must advance Lenis, so both run on the same frame. Two
 *     independent loops means visible tearing between a pinned element and its
 *     content.
 *  3. `lagSmoothing(0)` stops GSAP from trying to compensate for frame drops,
 *     which fights the interpolation and produces a rubber-banding feel.
 *
 * Touch devices keep native scrolling. Momentum emulation on a phone competes with
 * the OS's own physics and ends up feeling heavy and slightly behind your finger,
 * which is worse than leaving it alone.
 */
export function SmoothScroll() {
  const pathname = usePathname()

  useIsomorphicLayoutEffect(() => {
    // Honour the OS setting: momentum is exactly the kind of motion people who
    // enable "reduce motion" are trying to avoid.
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      // Slightly longer than the default, which suits the deliberate pace of the
      // pinned sections without feeling sluggish on ordinary pages.
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native scrolling on touch — see the note above.
      syncTouch: false,
      touchMultiplier: 1.6,
    })

    setLenis(lenis)

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    const tick = (time: number) => {
      // GSAP's ticker reports seconds, Lenis expects milliseconds.
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  /**
   * On navigation, reset scroll position and re-measure.
   *
   * Lenis keeps its own idea of scroll position, so without this a client-side
   * navigation can land part-way down the new page, and any ScrollTrigger created
   * by the new page measures against stale boundaries.
   */
  useEffect(() => {
    const lenis = getLenis()
    lenis?.scrollTo(0, { immediate: true })

    // After the new page has laid out.
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  return null
}

/**
 * The active Lenis instance.
 *
 * Held at module scope rather than in context because the only other consumer is
 * the overlay menu, which needs to freeze scrolling while it is open — and
 * `overflow: hidden` on the body does not stop Lenis, since it maintains its own
 * scroll position.
 */
let instance: Lenis | null = null

const setLenis = (next: Lenis | null) => {
  instance = next
}

export const getLenis = (): Lenis | null => instance
