'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { buildSrcSet, mediaAlt, pickSrc } from '@/lib/media'
import type { Media } from '@/payload-types'

type Props = {
  photos: Media[]
  /** Group heading, e.g. the event these photos came from. */
  label?: string
}

/**
 * Masonry photo grid with a keyboard-navigable lightbox.
 *
 * A column-based masonry (rather than a fixed grid) because the client's
 * photography is a deliberate mix of portrait and landscape — forcing both into
 * one aspect ratio would crop the subject out of half of them.
 */
export const GalleryGrid: React.FC<Props> = ({ photos, label }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const close = useCallback(() => setActiveIndex(null), [])

  const step = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        if (current === null) return current
        // Wrap around so arrow keys never dead-end.
        return (current + direction + photos.length) % photos.length
      })
    },
    [photos.length],
  )

  /* ── keyboard controls and scroll lock while the lightbox is open ───────── */
  useEffect(() => {
    if (activeIndex === null) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, close, step])

  if (photos.length === 0) return null

  const active = activeIndex === null ? null : photos[activeIndex]

  return (
    <>
      {label && (
        <h2 className="mb-6 flex items-baseline gap-4 type-5">
          {label}
          <span aria-hidden className="h-[2px] flex-1 bg-hairline" />
          <span className="font-body text-small font-normal tracking-[0.14em] text-chrome-dim uppercase">
            {photos.length} photo{photos.length === 1 ? '' : 's'}
          </span>
        </h2>
      )}

      {/* CSS multi-column is the lightest way to get masonry that reflows
          responsively without measuring anything in JavaScript. */}
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
        {photos.map((photo, index) => {
          const src = pickSrc(photo)
          if (!src) return null

          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative block w-full overflow-hidden border border-transparent transition-colors duration-300 hover:border-nexgen focus-visible:border-nexgen"
              aria-label={`Open photo${photo.caption ? `: ${photo.caption}` : ''}`}
            >
              <img
                src={photo.sizes?.card?.url ?? src}
                srcSet={buildSrcSet(photo)}
                sizes="(max-width: 768px) 48vw, (max-width: 1100px) 32vw, 24vw"
                alt={mediaAlt(photo)}
                width={photo.width ?? undefined}
                height={photo.height ?? undefined}
                loading={index < 8 ? 'eager' : 'lazy'}
                decoding="async"
                className="w-full transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.03]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-ink opacity-0 transition-opacity duration-300 group-hover:opacity-20"
              />
            </button>
          )
        })}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-200 flex flex-col bg-ink/97 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <p className="text-small tracking-[0.14em] text-chrome-dim uppercase">
              {(activeIndex ?? 0) + 1} / {photos.length}
            </p>
            <button
              type="button"
              onClick={close}
              className="font-display text-[1.25rem] text-chrome-bright uppercase transition-colors hover:text-ember"
            >
              Close ✕
            </button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-4 pb-4"
            // Clicks on the image itself should not dismiss the viewer.
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-2 z-10 px-3 py-6 font-display text-[2rem] text-chrome transition-colors hover:text-ember md:left-6"
            >
              ‹
            </button>

            <figure className="flex max-h-full flex-col items-center gap-3">
              <img
                src={pickSrc(active)}
                srcSet={buildSrcSet(active)}
                sizes="90vw"
                alt={mediaAlt(active)}
                className="max-h-[76svh] w-auto object-contain"
              />
              {(active.caption || active.credit) && (
                <figcaption className="text-center text-small text-chrome">
                  {active.caption}
                  {active.credit && (
                    <span className="text-chrome-dim"> — {active.credit}</span>
                  )}
                </figcaption>
              )}
            </figure>

            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-2 z-10 px-3 py-6 font-display text-[2rem] text-chrome transition-colors hover:text-ember md:right-6"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  )
}
