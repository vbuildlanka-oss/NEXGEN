'use client'

import React from 'react'

import { gsap } from '@/lib/gsap'
import { useGsapEffect } from '@/hooks/useGsapEffect'

type Props = {
  children: React.ReactNode
  className?: string
  /** Stagger children instead of moving the wrapper as one block. */
  stagger?: boolean
  delay?: number
  /** Distance travelled, in pixels. */
  distance?: number
}

/**
 * Fades and lifts content into view once, when it first reaches the viewport.
 *
 * Used for the ordinary content on every page, so interior pages share the
 * homepage's motion language instead of appearing statically.
 */
export const Reveal: React.FC<Props> = ({
  children,
  className = '',
  stagger = false,
  delay = 0,
  distance = 28,
}) => {
  const ref = useGsapEffect<HTMLDivElement>(({ root, reduced }) => {
    const targets = stagger ? Array.from(root.children) : [root]

    if (reduced) {
      gsap.set(targets, { opacity: 1, y: 0 })
      return
    }

    gsap.fromTo(
      targets,
      { opacity: 0, y: distance },
      {
        opacity: 1,
        y: 0,
        duration: 0.85,
        delay,
        ease: 'power2.out',
        stagger: stagger ? 0.1 : 0,
        scrollTrigger: {
          trigger: root,
          start: 'top 88%',
          once: true,
        },
      },
    )
  }, [stagger, delay, distance])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
