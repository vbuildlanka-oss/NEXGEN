import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <section
      className="container-site flex flex-col items-start justify-center"
      style={{ minHeight: '70svh', paddingTop: 'calc(var(--nav-height) + 3rem)' }}
    >
      <p className="eyebrow mb-4">Error 404</p>
      <h1 className="display-heading textured-type max-w-[20ch]">This page has left the building</h1>
      <p className="mt-6 max-w-[46ch] text-body-lg text-chrome">
        The link may be out of date, or the event may have finished and moved into the archive.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/" size="lg">
          Back to home
        </Button>
        <Button href="/events" variant="secondary" size="lg">
          See events
        </Button>
      </div>
      <p className="mt-8 text-small text-chrome-dim">
        Still stuck?{' '}
        <Link href="/contact" className="text-ember underline underline-offset-4">
          Tell us what you were looking for
        </Link>
        .
      </p>
    </section>
  )
}
