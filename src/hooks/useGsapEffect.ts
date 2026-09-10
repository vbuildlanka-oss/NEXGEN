'use client'

import { useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react'

import { gsap, prefersReducedMotion } from '@/lib/gsap'

type SetupArgs = {
  /** The scoped root element. */
  root: HTMLElement
  /** True when the visitor prefers reduced motion — set end states, don't animate. */
  reduced: boolean
}

/**
 * Runs a GSAP setup function scoped to a returned ref, and reverts everything on
 * unmount.
 *
 * `gsap.context` scoping matters with the App Router: navigating away unmounts
 * the component but ScrollTriggers would otherwise survive, keep measuring
 * detached nodes and corrupt the scroll positions of the next page. `revert()`
 * removes the tweens, the ScrollTriggers and any inline styles they applied.
 */
export function useGsapEffect<T extends HTMLElement = HTMLDivElement>(
  setup: (args: SetupArgs) => void,
  deps: DependencyList = [],
): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return

    const reduced = prefersReducedMotion()
    const ctx = gsap.context(() => setup({ root, reduced }), root)

    return () => ctx.revert()
    // The setup closure is intentionally not a dependency: callers pass an
    // inline function, which would re-run the effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
