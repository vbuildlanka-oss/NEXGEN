import Script from 'next/script'
import React from 'react'

/**
 * Microsoft Clarity: session recordings, heatmaps and scroll depth.
 *
 * Rendered by the public site's layout only. The admin panel lives in the separate
 * `(payload)` route group with its own layout, so editors working in /admin are not
 * recorded.
 *
 * Loaded with `afterInteractive`, so it runs once the page is usable and never
 * competes with the hero video or the first paint.
 *
 * Only active on the live site. Local development and Vercel preview deployments
 * would otherwise record developers' own clicks and test pages as if they were
 * visitors. `VERCEL_ENV` is "production" only on the production deployment; it is
 * unset outside Vercel, where `NODE_ENV` decides instead.
 *
 * The project ID is public by design (it is visible in the page source of every
 * site that uses Clarity), so it lives here rather than in an environment variable.
 */
const CLARITY_PROJECT_ID = 'yy4n44kqar'

export const Analytics: React.FC = () => {
  const isLive = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === 'production'
    : process.env.NODE_ENV === 'production'

  if (!isLive) return null

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
    </Script>
  )
}
