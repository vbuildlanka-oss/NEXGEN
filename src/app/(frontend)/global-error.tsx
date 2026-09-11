'use client'

import React, { useEffect } from 'react'

/**
 * Last-resort boundary, for a failure in the root layout itself.
 *
 * This replaces the entire document, so it must render its own `<html>` and
 * `<body>` and cannot rely on the site's stylesheet having loaded — hence the
 * inline styles and the hard-coded palette values.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('[global error]', error.digest, error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem clamp(1.25rem, 5vw, 5rem)',
          background: '#080808',
          color: '#999999',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#D93220',
            fontSize: '0.875rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          NexGen
        </p>
        <h1
          style={{
            margin: '1rem 0 0',
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            lineHeight: 1.05,
            textTransform: 'uppercase',
            color: '#cccccc',
          }}
        >
          The site is temporarily unavailable
        </h1>
        <p style={{ marginTop: '1.5rem', maxWidth: '46ch', lineHeight: 1.6 }}>
          We are looking into it. Please try again shortly.
        </p>
        {/* A plain anchor, not next/link, on purpose: this boundary replaces the
            whole document after a root-layout failure, so the client router
            cannot be trusted. A full page load is the recovery. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          style={{
            marginTop: '2rem',
            width: 'fit-content',
            background: '#D93220',
            color: '#080808',
            padding: '1rem 1.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Reload the homepage
        </a>
      </body>
    </html>
  )
}
