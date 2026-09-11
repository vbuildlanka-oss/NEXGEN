'use client'

import React from 'react'

import { gsap } from '@/lib/gsap'
import { useGsapEffect } from '@/hooks/useGsapEffect'

type Props = {
  children: React.ReactNode
  className?: string
  /** How far the content drifts across the whole scroll, as a percentage. */
  distance?: number
  /** Scale the content up slightly, so the drift never exposes an edge. */
  overscan?: boolean
}

/**
 * Drifts its content as the section passes through the viewport.
 *
 * This is what makes the interior pages feel like they belong to the homepage
 * rather than being a static template behind the same header. The movement is
 * scrubbed, so it is tied to scroll position rather than playing on a timer, and
 * `ease: 'none'` keeps it linear — anything else reads as lag.
 *
 * The content is scaled slightly by default: a parallax that moves an image within
 * a fixed frame will otherwise pull its own edge into view.
 */
export const Parallax: React.FC<Props> = ({
  children,
  className = '',
  distance = 12,
  overscan = true,
}) => {
  const ref = useGsapEffect<HTMLDivElement>(({ root, reduced }) => {
    const target = root.firstElementChild
    if (!target) return

    if (reduced) {
      gsap.set(target, { clearProps: 'all' })
      return
    }

    gsap.fromTo(
      target,
      { yPercent: -distance / 2, scale: overscan ? 1.08 : 1 },
      {
        yPercent: distance / 2,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    )
  }, [distance, overscan])

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {children}
    </div>
  )
}
