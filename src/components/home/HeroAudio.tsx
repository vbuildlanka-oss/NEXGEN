'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  /** 0–1. A background bed, not a foreground track. */
  targetVolume?: number
  /**
   * Scroll progress through the hero, 0 at the top and 1 once it has gone. The
   * track fades out across this and stops before the next section arrives.
   */
  fadeProgress: number
}

type SoundState = 'starting' | 'playing' | 'blocked' | 'muted'

const STORAGE_KEY = 'nexgen:hero-sound'

/**
 * The hero soundtrack.
 *
 * A necessary word on autoplay: **no browser will play audible sound on page load
 * without permission.** Chrome, Safari and Firefox all block it unless the visitor
 * has already interacted with the page, or has a history of playing media on the
 * domain. It is not a setting that can be turned off, and the video itself only
 * autoplays because it is muted — unmuting it would stop the video playing too.
 *
 * So this does the most that is actually possible, in three stages:
 *
 *  1. Try to play immediately. This succeeds for returning visitors, and for anyone
 *     whose browser has decided the domain is trusted.
 *  2. If the browser refuses, start on the visitor's *first* interaction of any
 *     kind — a click, a tap, a key, even a scroll. For most people that is within a
 *     second or two of arriving, so it feels like it started on its own.
 *  3. Until then, show a prompt. It doubles as the control, which is not optional:
 *     sound that a visitor cannot immediately silence is hostile, and a page that
 *     plays audio must always offer a way to stop it.
 *
 * Volume follows scroll position rather than switching off at a threshold, so the
 * track thins out as the hero shrinks and is silent by the time the next section
 * arrives.
 */
export const HeroAudio: React.FC<Props> = ({ src, targetVolume = 0.55, fadeProgress }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<SoundState>('starting')

  // Whether the visitor has deliberately silenced it. Kept in a ref so the scroll
  // handler can read it without re-subscribing.
  const mutedByChoice = useRef(false)

  /** Volume for a given scroll position. Silent well before the hero has gone. */
  const volumeFor = useCallback(
    (progress: number) => {
      const remaining = Math.max(0, 1 - progress / 0.7)
      return Number((targetVolume * remaining).toFixed(3))
    },
    [targetVolume],
  )

  /* ── attempt playback, and fall back to the first interaction ───────────── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volumeFor(0)

    let cleanup = () => {}

    const start = async () => {
      try {
        await audio.play()
        setState('playing')
        return true
      } catch {
        return false
      }
    }

    /**
     * Kept inside an async function rather than run straight in the effect body:
     * setting state synchronously there costs an extra render pass on every mount.
     */
    const init = async () => {
      // A visitor who silenced it earlier in this session stays silenced.
      if (sessionStorage.getItem(STORAGE_KEY) === 'off') {
        mutedByChoice.current = true
        setState('muted')
        return
      }

      if (await start()) return

      setState('blocked')

      // Any gesture counts as permission. `wheel` and `touchstart` are included
      // because scrolling is how most visitors first touch this page.
      const events = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const

      const onFirstGesture = async () => {
        if (mutedByChoice.current) return
        if (await start()) cleanup()
      }

      events.forEach((event) =>
        window.addEventListener(event, onFirstGesture, { passive: true }),
      )

      cleanup = () => {
        events.forEach((event) => window.removeEventListener(event, onFirstGesture))
      }
    }

    void init()

    return () => {
      cleanup()
      audio.pause()
    }
  }, [volumeFor])

  /* ── volume follows the hero's scroll position ──────────────────────────── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || mutedByChoice.current) return

    const volume = volumeFor(fadeProgress)
    audio.volume = volume

    // Stop entirely once inaudible, rather than leaving a silent track running.
    if (volume <= 0.005) {
      if (!audio.paused) audio.pause()
    } else if (audio.paused && state === 'playing') {
      void audio.play().catch(() => {})
    }
  }, [fadeProgress, state, volumeFor])

  /* ── be polite when the tab is hidden ──────────────────────────────────── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onVisibility = () => {
      if (document.hidden) {
        audio.pause()
      } else if (state === 'playing' && !mutedByChoice.current && audio.volume > 0.005) {
        void audio.play().catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [state])

  const toggle = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (state === 'playing') {
      mutedByChoice.current = true
      audio.pause()
      sessionStorage.setItem(STORAGE_KEY, 'off')
      setState('muted')
      return
    }

    mutedByChoice.current = false
    sessionStorage.removeItem(STORAGE_KEY)
    audio.volume = volumeFor(fadeProgress)

    try {
      await audio.play()
      setState('playing')
    } catch {
      setState('blocked')
    }
  }, [fadeProgress, state, volumeFor])

  const label =
    state === 'playing' ? 'Sound on' : state === 'blocked' ? 'Tap for sound' : 'Sound off'

  return (
    <>
      {/* `loop` because the track is shorter than a visitor's stay; the video loops
          independently and they are not meant to stay in sync. */}
      <audio ref={audioRef} src={src} loop preload="auto" aria-hidden tabIndex={-1} />

      <button
        type="button"
        onClick={toggle}
        aria-pressed={state === 'playing'}
        className="chamfer-sm pointer-events-auto inline-flex items-center gap-2 bg-ink/70 px-3 py-2 text-small font-semibold tracking-[0.14em] text-chrome uppercase backdrop-blur-sm transition-colors duration-200 hover:text-ember"
      >
        {/* Three bars that animate while playing and sit flat when not — the state
            is legible without reading the label. */}
        <span aria-hidden className="flex h-3 items-end gap-[2px]">
          {[0, 1, 2].map((bar) => (
            <span
              key={bar}
              className={`w-[2px] bg-current ${
                state === 'playing' ? 'animate-sound-bar' : 'h-[3px]'
              }`}
              style={
                state === 'playing'
                  ? { animationDelay: `${bar * 0.15}s`, height: '100%' }
                  : undefined
              }
            />
          ))}
        </span>
        {label}
      </button>
    </>
  )
}
