'use client'

import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { OverlayMenu } from './OverlayMenu'
import { Wordmark } from './Wordmark'
import type { ChromeData } from './types'

/**
 * Where the bar's fade starts and finishes, as fractions of the viewport height.
 *
 * The bar is invisible when any page loads, on every device, and fades in with
 * the scroll rather than switching on at a threshold: halfway through the range
 * it is half there, and scrolling back up fades it out the same way. Lenis
 * smooths the scroll position, so the fade is smooth too.
 *
 * On the homepage the range follows the hero video as it shrinks away from the
 * edges of the screen. Other pages have no hero to wait for, so they start at
 * the first movement of the wheel and use a shorter range.
 */
const HERO_RANGE = { start: 0.08, end: 0.45 }
const PAGE_RANGE = { start: 0, end: 0.3 }

/** Eases both ends, so the bar neither pops in nor stops abruptly. */
const smoothstep = (t: number) => t * t * (3 - 2 * t)

export const Navbar: React.FC<ChromeData> = ({ navItems, cta, tagline, socials }) => {
  const pathname = usePathname()
  const range = pathname === '/' ? HERO_RANGE : PAGE_RANGE

  const [menuOpen, setMenuOpen] = useState(false)
  // Whether the bar is more than half visible. Changes only when the fade
  // crosses the middle, so scrolling does not re-render the component; the fade
  // itself is written straight to the element's style every frame.
  const [revealed, setRevealed] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuToggledRef = useRef(false)

  /* ── fade the bar in with the scroll, on every page ─────────────────────── */
  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    let frame = 0

    const paint = () => {
      frame = 0
      const viewport = window.innerHeight || 1
      const from = viewport * range.start
      const to = viewport * range.end
      const raw = Math.min(1, Math.max(0, (window.scrollY - from) / Math.max(1, to - from)))
      // An open menu needs the bar, whatever the scroll position: the close
      // button sits on it.
      const amount = menuOpen ? 1 : smoothstep(raw)

      header.style.opacity = String(amount)
      // A short drop into place as it fades in, rather than a full slide.
      header.style.transform = `translate3d(0, ${(amount - 1) * 40}%, 0)`
      header.style.pointerEvents = amount > 0.5 ? 'auto' : 'none'
      setRevealed(amount > 0.5)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(paint)
    }

    // Opening or closing the menu changes the bar without any scrolling, so that
    // one change is eased instead of jumping. Scroll-driven changes never are.
    let settle = 0
    if (menuToggledRef.current) {
      menuToggledRef.current = false
      header.style.transition = 'opacity 400ms var(--ease-out-quint), transform 400ms var(--ease-out-quint)'
      settle = window.setTimeout(() => {
        header.style.transition = ''
      }, 420)
    }

    // Measured once on mount too: the visitor may arrive already scrolled down
    // (a refresh, or a restored scroll position).
    paint()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      if (settle) window.clearTimeout(settle)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [range.start, range.end, menuOpen])

  const toggleMenu = useCallback((open: boolean) => {
    // Marks the next paint as a menu change, the only kind that is eased.
    menuToggledRef.current = true
    setMenuOpen(open)
  }, [])

  const closeMenu = useCallback(() => {
    toggleMenu(false)
    // Return focus to the button that opened the menu.
    triggerRef.current?.focus()
  }, [toggleMenu])

  const visible = revealed || menuOpen

  return (
    <>
      <header
        ref={headerRef}
        data-navbar
        /* `backdrop-blur-md` used to sit here, behind `bg-ink/95`. At 95% opacity
           there is almost nothing left to blur, so it was an invisible effect that
           still cost a full-screen backdrop filter on every frame of every scroll —
           the bar is fixed, so the content moving underneath it forced the blur to be
           recomputed continuously. Removing it is free on the eye and noticeable on a
           phone. */
        /* No CSS transition on opacity or transform: both follow the scroll
           position directly (see the effect above), and a transition would make
           the bar trail behind the scroll instead of moving with it. */
        className={`fixed inset-x-0 top-0 z-110 border-b bg-ink/95 will-change-[opacity,transform] ${
          menuOpen ? 'border-transparent' : 'border-hairline'
        }`}
        /* Invisible in the server-rendered HTML as well, so the bar never flashes
           on before the script has loaded. */
        style={{
          height: 'var(--nav-height)',
          opacity: 0,
          transform: 'translate3d(0, -40%, 0)',
          pointerEvents: 'none',
        }}
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
        the menu in the top-left corner from the moment the site loads, and every
        page deliberately withholds the navigation bar until the visitor scrolls. A button inside the bar cannot satisfy both — it inherits
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
            onClick={() => (menuOpen ? closeMenu() : toggleMenu(true))}
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
