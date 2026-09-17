'use client'

import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { OverlayMenu } from './OverlayMenu'
import { Wordmark } from './Wordmark'
import type { ChromeData } from './types'

type Props = ChromeData & {
  /**
   * Override the automatic behaviour. By default the bar is withheld on the
   * homepage until the hero video has begun to shrink, so the opening frame is
   * uninterrupted video — the reveal called for in the brief. Every other page
   * shows it immediately.
   */
  revealOnScroll?: boolean
}

export const Navbar: React.FC<Props> = ({ navItems, cta, tagline, socials, revealOnScroll }) => {
  const pathname = usePathname()
  // Decided here rather than passed down from the layout, because the layout is
  // shared by every route and would otherwise need to know which one is the hero.
  const shouldReveal = revealOnScroll ?? pathname === '/'

  const [menuOpen, setMenuOpen] = useState(false)
  // Tracks only the scroll position. Whether the bar is *visible* is derived
  // below, so this never needs seeding from an effect.
  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  /* ── reveal the bar as the hero shrinks ─────────────────────────────────── */
  useEffect(() => {
    if (!shouldReveal) return

    let frame = 0

    const measure = () => {
      frame = 0
      // Roughly a third of the way through the hero's scroll track, which is
      // when the video has visibly detached from the edges of the screen.
      setScrolledPastHero(window.scrollY > window.innerHeight * 0.35)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    // Deferred to the next frame rather than called inline: the visitor may
    // already be scrolled down (a refresh, or a restored scroll position), so an
    // initial measurement is needed — but taking it synchronously here would
    // trigger a second render pass on every mount.
    frame = requestAnimationFrame(measure)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [shouldReveal])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    // Return focus to the button that opened the menu.
    triggerRef.current?.focus()
  }, [])

  // Derived, not stored: the bar shows unless this route hides it behind the
  // hero, and it must be present while the menu is open even if the page has not
  // been scrolled — otherwise the close button would vanish with it.
  const visible = !shouldReveal || scrolledPastHero || menuOpen

  return (
    <>
      <header
        data-navbar
        className={`fixed inset-x-0 top-0 z-110 border-b bg-ink/95 backdrop-blur-md transition-[transform,opacity] duration-500 ease-[var(--ease-out-quint)] ${
          visible
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-full opacity-0'
        } ${menuOpen ? 'border-transparent' : 'border-hairline'}`}
        style={{ height: 'var(--nav-height)' }}
      >
        <div className="container-site grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/*
            left — intentionally empty.

            The menu trigger used to live here, but it has to be on screen from the
            moment the page loads, and this bar is withheld until the hero has
            shrunk. It is now a sibling of the header (below), positioned on the
            same grid so it lands in this cell once the bar catches up with it.
          */}
          <div aria-hidden />

          {/* centre — the mark, and nothing else */}
          <div className="flex justify-center">
            <Wordmark className="w-[calc(var(--nav-height)*0.86)] shrink-0 text-chrome-bright" />
          </div>

          {/* right — single call to action */}
          {/*
            right — the optional tagline, then the call to action.

            The tagline sits here rather than beside the wordmark on purpose: in the
            centre cell it would push the mark off-centre whenever it had content.
            Here the mark stays centred against the viewport whether the tagline is
            set or not.
          */}
          <div className="flex items-center justify-end gap-4">
            {tagline && (
              <span className="hidden border-r border-hairline pr-4 text-right text-small leading-tight text-chrome lg:block">
                {/* " / " in the CMS field becomes a line break, so the client can
                    stack two lines without needing to write HTML. */}
                {tagline.split(' / ').map((line, index) => (
                  <span key={index} className="block">
                    {line}
                  </span>
                ))}
              </span>
            )}
            {cta?.label && cta.url && (
              <Button href={cta.url} variant="primary" size="md" className="shrink-0">
                {cta.label}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/*
        The menu trigger, outside the bar.

        Two requirements that pull against each other: the client wants a way into
        the menu in the top-left corner from the moment the site loads, and the
        homepage deliberately withholds the navigation bar until the hero video has
        begun to shrink. A button inside the bar cannot satisfy both — it inherits
        the bar's `opacity-0 pointer-events-none`.

        So it sits in its own fixed layer above the bar, using the same
        `container-site` gutter and `--nav-height` row, which puts it at exactly the
        pixel the bar's left cell would have. When the bar fades in underneath, the
        button does not move: it simply stops floating over the video and starts
        reading as the bar's first item. That is the "seamlessly blend" the client
        asked for, and it costs no animation at all — the seam is hidden by the two
        being in the same place.

        Chromeless, on instruction: no background, no border, no pill. Only the
        three solid rules. Over video they would be unreadable on a bright frame, so
        they carry a shadow instead of a surface — a shadow darkens what is behind
        the lines without drawing a shape of its own, and it is faded out once the
        opaque bar is there to do the same job.

        `z-120` puts it above both the bar (110) and the open menu panel (100), so
        the same control closes what it opened.
      */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-120"
        style={{ height: 'var(--nav-height)' }}
      >
        <div className="container-site flex h-full items-center">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            className="group pointer-events-auto -ml-1 flex w-fit cursor-pointer items-center gap-3 border-0 bg-transparent p-1 text-chrome-bright transition-colors hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
          >
            <span
              className="relative flex h-5 w-7 flex-col justify-between transition-[filter] duration-500"
              aria-hidden
              style={{
                // Only while the button is floating over the hero. Once the bar is
                // behind it the shadow is redundant, and on the dark bar it would
                // read as a smudge.
                filter: visible ? 'none' : 'drop-shadow(0 1px 5px rgba(8,8,8,0.9))',
              }}
            >
              <span
                className={`h-[2px] w-full origin-center bg-current transition-transform duration-300 ease-[var(--ease-out-quint)] ${
                  menuOpen ? 'translate-y-[9px] rotate-45' : ''
                }`}
              />
              <span
                className={`h-[2px] w-full bg-current transition-opacity duration-200 ${
                  menuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`h-[2px] w-full origin-center bg-current transition-transform duration-300 ease-[var(--ease-out-quint)] ${
                  menuOpen ? '-translate-y-[9px] -rotate-45' : ''
                }`}
              />
            </span>
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            {/*
              The word appears with the bar, not before it. Over the opening video
              the corner should be three lines and nothing else; as part of the bar
              a label is worth having. Width and opacity are both animated so the
              lines do not jump sideways when it arrives.
            */}
            <span
              className={`hidden overflow-hidden text-small font-semibold tracking-[0.18em] whitespace-nowrap uppercase transition-[max-width,opacity] duration-500 ease-[var(--ease-out-quint)] sm:inline-block ${
                visible ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              {menuOpen ? 'Close' : 'Menu'}
            </span>
          </button>
        </div>
      </div>

      <OverlayMenu open={menuOpen} onClose={closeMenu} navItems={navItems} socials={socials} />
    </>
  )
}
