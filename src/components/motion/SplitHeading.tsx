'use client'

import React, { type ElementType } from 'react'

import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap'
import { useGsapEffect } from '@/hooks/useGsapEffect'

type Props = {
  children: string
  as?: ElementType
  className?: string
  /** Delay before the reveal starts, in seconds. */
  delay?: number
}

/**
 * Heading whose lines rise into place from behind a mask when scrolled into view.
 *
 * This is the reference site's heading treatment: split into lines, wrap each
 * line in an `overflow: hidden` box, then animate `y: 100% -> 0%`. The mask is
 * what makes it read as type sliding up out of nothing rather than merely fading.
 */
export const SplitHeading: React.FC<Props> = ({
  children,
  as: Tag = 'h2',
  className = '',
  delay = 0,
}) => {
  const ref = useGsapEffect<HTMLDivElement>(({ root, reduced }) => {
    const target = root.querySelector<HTMLElement>('[data-split-target]')
    if (!target) return

    if (reduced) return

    // Hidden here rather than in the markup. If this code never runs — a failed
    // GSAP chunk, a JavaScript error, an old browser — the heading is simply
    // visible and unanimated, instead of the page appearing blank. The hide
    // happens before paint, so there is no flash of unsplit text.
    gsap.set(target, { autoAlpha: 0 })

    const split = new SplitText(target, {
      type: 'lines',
      linesClass: 'split-line',
      // Wrapping each line in its own masking element is what SplitText's
      // `mask` option does for us — no manual DOM surgery needed.
      mask: 'lines',
    })

    gsap.set(target, { autoAlpha: 1 })

    const tween = gsap.from(split.lines, {
      yPercent: 110,
      duration: 0.9,
      delay,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: root,
        start: 'top 85%',
        once: true,
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      split.revert()
      ScrollTrigger.refresh()
    }
  }, [children])

  return (
    <div ref={ref}>
      {/* Starts invisible so the un-split text never flashes before SplitText
          has measured it, but stays in the DOM for search engines and for
          visitors with JavaScript disabled (see the <noscript> rule below). */}
      <Tag data-split-target className={className}>
        {children}
      </Tag>
    </div>
  )
}
