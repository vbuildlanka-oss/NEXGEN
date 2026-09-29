'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

/**
 * Single place where GSAP plugins are registered.
 *
 * The reference site drives every scroll interaction with GSAP + ScrollTrigger
 * and splits headings with SplitType; SplitText ships free inside GSAP itself
 * since 3.13, so it replaces that extra dependency here.
 *
 * Registration is guarded because these modules are imported by components that
 * are still rendered on the server.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)

  /**
   * Stop mobile browser chrome from re-measuring everything mid-scroll.
   *
   * On a phone, scrolling down hides the address bar and scrolling up brings it
   * back. That changes the viewport height, which fires a resize, which makes
   * ScrollTrigger recalculate every trigger on the page — including the pinned
   * photo canvas. The visible result is a stutter or a small jump at exactly the
   * moment you start or stop scrolling, which is the worst possible timing.
   *
   * With this set, ScrollTrigger ignores resizes that are only the address bar
   * appearing. Genuine changes — rotating the device, resizing a desktop window —
   * still refresh normally. The layout uses `svh` units throughout, so the pinned
   * sections are already sized against the small viewport and do not need
   * re-measuring when the bar moves.
   */
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export { gsap, ScrollTrigger, SplitText }

/** True when the visitor has asked their OS to reduce animation. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
