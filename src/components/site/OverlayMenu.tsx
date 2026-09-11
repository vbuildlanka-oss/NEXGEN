'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useRef } from 'react'

import { getLenis } from '@/components/motion/SmoothScroll'
import { SOCIAL_LABELS, type NavLink, type SocialLink } from './types'
import { Wordmark } from './Wordmark'

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
      className={`fixed inset-0 z-100 flex h-[100svh] w-full flex-col justify-between overflow-x-hidden overflow-y-auto bg-ink px-[clamp(1.25rem,5vw,5rem)] pt-[clamp(4.5rem,9vh,7rem)] pb-[clamp(2rem,6vh,4rem)] transition-[transform,opacity] duration-500 ease-[var(--ease-out-quint)] md:w-[min(34rem,90vw)] md:border-r-2 md:border-hairline ${
        open ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-full opacity-0'
      }`}
    >
      {/* Decorative colour blocks, echoing the graphic panels in the reference menu. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-10 h-52 w-52 rotate-12 bg-nexgen opacity-90"
        style={{ clipPath: 'polygon(0 0, 100% 12%, 78% 100%, 0 86%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-3rem] bottom-[18%] h-40 w-40 bg-ember opacity-70"
        style={{ clipPath: 'polygon(14% 0, 100% 8%, 86% 100%, 0 78%)' }}
      />

      <div className="relative mb-6 w-[min(44vw,10.5rem)]">
        <Wordmark asLink={false} variant="duotone" title="NexGen" />
      </div>

      <nav aria-label="Main" className="relative">
        <ul className="flex flex-col gap-1">
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
                  className={`group flex items-baseline gap-3 py-1.5 font-display text-[clamp(2rem,7vw,3.25rem)] uppercase leading-[1.02] transition-[opacity,transform,color] duration-400 ${
                    open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                  } ${active ? 'text-nexgen' : 'text-chrome-bright hover:text-ember'}`}
                >
                  <span
                    aria-hidden
                    className="h-[0.14em] w-0 bg-ember transition-all duration-300 ease-[var(--ease-out-quint)] group-hover:w-[0.6em]"
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
            <p className="eyebrow mb-3">Follow NexGen</p>
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
