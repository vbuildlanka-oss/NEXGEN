'use client'

import React, { useEffect } from 'react'

import { Button } from '@/components/ui/Button'

/**
 * Route-level error boundary.
 *
 * Without one, an unexpected failure — most likely the database being briefly
 * unreachable — shows Next.js's default grey error page, which looks broken and
 * off-brand. This keeps the visitor inside the site and offers a retry, since
 * `reset()` re-renders the segment without a full page reload.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surfaces in the Vercel runtime logs, with the digest to correlate against
    // the error the visitor saw.
    console.error('[route error]', error.digest, error)
  }, [error])

  return (
    <section
      className="container-site flex flex-col items-start justify-center"
      style={{ minHeight: '70svh', paddingTop: 'calc(var(--nav-height) + 3rem)' }}
    >
      <p className="eyebrow mb-4">Something went wrong</p>
      <h1 className="display-heading max-w-[22ch]">We dropped the needle</h1>
      <p className="mt-6 max-w-[48ch] text-body-lg text-chrome">
        This page failed to load. It is usually temporary — try again, and if it keeps happening
        let us know.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="chamfer inline-flex items-center justify-center bg-nexgen px-7 py-4 font-display text-[1.5rem] font-extrabold uppercase tracking-[0.02em] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-ember"
        >
          Try again
        </button>
        <Button href="/" variant="secondary" size="lg">
          Back to home
        </Button>
      </div>
      {error.digest && (
        <p className="mt-8 text-small text-chrome-dim">Reference: {error.digest}</p>
      )}
    </section>
  )
}
