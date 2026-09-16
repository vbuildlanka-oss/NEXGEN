'use client'

import React, { useRef } from 'react'

import { Wordmark } from '@/components/site/Wordmark'
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
import { gsap, SplitText, prefersReducedMotion } from '@/lib/gsap'

type Props = {
  eyebrow?: string | null
  statement: string
}

/**
 * The statement that bridges the hero and the photo canvas.
 *
 * The reference site pins this section and scrubs a per-character colour tween
 * across it, so the sentence lights up word by word as you scroll and then fades
 * out. Same technique here, with the palette's two greys standing in for their
 * grey-to-white ramp.
 */
export const PanelsIntro: React.FC<Props> = ({ eyebrow, statement }) => {
  const sectionRef = useRef<HTMLElement | null>(null)

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const target = section.querySelector<HTMLElement>('[data-intro-statement]')
      const stage = section.querySelector<HTMLElement>('[data-intro-stage]')
      if (!target) return

      if (prefersReducedMotion()) {
        gsap.set(target, { color: 'var(--color-chrome-bright)' })
        return
      }

      const split = new SplitText(target, { type: 'chars,words', charsClass: 'intro-char' })

      gsap.set(split.chars, { color: 'var(--color-chrome-dim)' })

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom 60%',
            scrub: 1,
          },
        })
        .to(split.chars, {
          color: 'var(--color-chrome-bright)',
          stagger: { each: 0.08 },
          ease: 'none',
        })
        .to(stage, { autoAlpha: 0, duration: 1.5 })

      return () => split.revert()
    }, section)

    return () => ctx.revert()
  }, [statement])

  return (
    <section
      ref={sectionRef}
      className="relative bg-ink"
      // Extra height gives the character-by-character reveal room to breathe.
      style={{ height: '230svh' }}
    >
      <div
        data-intro-stage
        className="sticky top-0 flex h-[100svh] items-center overflow-hidden"
      >
        {/* The mark, oversized and almost invisible, anchoring the statement. */}
        <div
          aria-hidden
          className="logo-watermark right-[-10%] bottom-[-14%] z-0 w-[min(58vw,42rem)]"
        >
          <Wordmark asLink={false} />
        </div>

        <div className="container-site relative z-10">
          {eyebrow && <p className="eyebrow mb-6">{eyebrow}</p>}
          <p
            data-intro-statement
            className="max-w-[46ch] font-display type-1 leading-[1.06] uppercase"
          >
            {statement}
          </p>
        </div>
      </div>
    </section>
  )
}
