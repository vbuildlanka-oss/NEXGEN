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
}

export { gsap, ScrollTrigger, SplitText }

/** True when the visitor has asked their OS to reduce animation. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
