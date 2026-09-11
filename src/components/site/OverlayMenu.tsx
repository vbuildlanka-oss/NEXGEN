'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useRef } from 'react'

import { getLenis } from '@/components/motion/SmoothScroll'
import { SOCIAL_LABELS, type NavLink, type SocialLink } from './types'

type Props = {
  open: boolean
  onClose: () => void
  navItems: NavLink[]
  socials: SocialLink[]
}

/**
 * Full-height slide-in menu, following the reference site's pattern: a panel
 * covering the viewport from the left, oversized navigation type, and graphic
 * colour blocks bleeding off the edges.
 *
 * Opening and closing is pure CSS, driven by the `open` prop.
 *
 * It used to be a GSAP timeline, and that was a mistake. The panel's visibility
 * depended on JavaScript completing an animation, so when the timeline stalled
 * — a throttled requestAnimationFrame in a backgrounded tab is enough — the menu
 * was left translated off-screen with its links at zero opacity. Reported as "the
 * menu doesn't show the pages", and it was: the links existed, correctly, 800px
 * to the left of the viewport.
 *
 * A CSS transition cannot get stuck half-played, and if it is never applied at all
 * the menu is simply open with no animation. Navigation is too important to hang
 * off an animation library.
 */
export const OverlayMenu: React.FC<Props> = ({ open, onClose, navItems, socials }) => {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()

  /* ── scroll lock ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return

    const { overflow, paddingRight } = document.body.style
    // Compensate for the disappearing scrollbar so the page behind does not jump.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    // `overflow: hidden` alone does not stop momentum scrolling — Lenis keeps its
    // own scroll position and would carry on behind the open menu.
    const lenis = getLenis()
    lenis?.stop()

    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      lenis?.start()
    }
  }, [open])

  /* ── focus management and keyboard handling ─────────────────────────────── */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [open, onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!open) return
    // Move focus to the first link so keyboard and screen-reader users land
    // inside the menu rather than continuing behind it.
    const first = panelRef.current?.querySelector<HTMLElement>('[data-menu-link]')
    const frame = requestAnimationFrame(() => first?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  return (
    <div
      ref={panelRef}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      // Hidden from assistive tech and from the tab order while closed.
      {...(!open ? { inert: true } : {})}
      className={`fixed inset-0 z-100 flex h-[100svh] w-full flex-col overflow-x-hidden overflow-y-auto bg-ink px-[clamp(1.25rem,5vw,5rem)] pt-[calc(var(--nav-height)+clamp(1.5rem,4vh,2.5rem))] pb-[clamp(2rem,6vh,4rem)] transition-[transform,opacity] duration-500 ease-[var(--ease-out-quint)] md:w-[min(34rem,90vw)] md:border-r-2 md:border-hairline ${
        open ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-full opacity-0'
      }`}
    >
      {/*
        No decorative colour blocks here.

        The reference site fills its menu with graphic panels, and an early version
        copied that: a solid NexGen Red shape at the top-left. But that is the exact
        colour the active menu item uses, sitting directly above the first link, so
        it read as a selected item. Moving it and fading it stopped the confusion but
        left shapes clipped against the panel edge that looked like rendering
        artefacts. A plain panel puts the attention on the navigation, which is what
        the menu is for.
      */}

      <nav aria-label="Main" className="relative">
        <ul className="flex flex-col gap-2">
          {navItems.map((item, index) => {
            const active = pathname === item.url

            return (
              <li key={`${item.label}-${item.url}`}>
                <Link
                  data-menu-link
                  href={item.url}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  /* Each link eases in slightly after the one above it. A CSS
                     delay, so a stalled frame cannot leave a link invisible. */
                  style={{ transitionDelay: open ? `${120 + index * 45}ms` : '0ms' }}
                  className={`group flex items-baseline gap-3 py-1.5 font-display text-[clamp(1.35rem,4vw,2rem)] uppercase leading-[1.02] transition-[opacity,transform,color] duration-400 ${
                    open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                  } ${active ? 'text-nexgen' : 'text-chrome-bright hover:text-ember'}`}
                >
                  {/*
                    The page you are on and the item under your cursor were told
                    apart only by NexGen Red against Ember Red — two reds close
                    enough to be effectively the same colour. The current page now
                    keeps this marker permanently, so "you are here" is a shape
                    rather than a shade.
                  */}
                  <span
                    aria-hidden
                    className={`h-[0.14em] transition-all duration-300 ease-[var(--ease-out-quint)] ${
                      active ? 'w-[0.6em] bg-nexgen' : 'w-0 bg-ember group-hover:w-[0.6em]'
                    }`}
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div
        className={`relative mt-10 flex flex-col gap-6 transition-opacity duration-500 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDelay: open ? '320ms' : '0ms' }}
      >
        {socials.length > 0 && (
          <div>
            {/*
              Not `.eyebrow` here: that is NexGen Red, and a red label sitting in
              the same column as the red current-page link read as another
              navigation item. Grey keeps it a label.
            */}
            <p className="mb-3 text-small font-semibold tracking-[0.18em] text-chrome-dim uppercase">
              Follow NexGen
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {socials.map((social) => (
                <li key={social.url}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body text-chrome underline decoration-transparent underline-offset-4 transition-colors duration-200 hover:text-ember hover:decoration-current"
                  >
                    {social.label || SOCIAL_LABELS[social.platform] || social.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-small text-chrome-dim">
          © {new Date().getFullYear()} NexGen Entertainment
        </p>
      </div>
    </div>
  )
}
