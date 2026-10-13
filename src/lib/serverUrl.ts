/**
 * Resolving the site's own origin, in one place.
 *
 * Three consumers need this and they must agree: Payload's config (for CSRF and
 * live preview), the page metadata (canonical and Open Graph URLs), and
 * robots.txt / sitemap.xml.
 *
 * `NEXT_PUBLIC_SERVER_URL` takes priority because it is the only value that can
 * name a custom domain. Vercel's own variables are the fallback, and they matter:
 * that hand-set variable was a placeholder on the first deploy, which pointed the
 * sitemap at a domain that did not exist and — because Payload validates the
 * request origin against it — left the admin panel rendering as a blank page.
 */

/** Vercel's stable production domain for the project. Server-side only. */
const vercelProductionURL = (): string | undefined =>
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined

/** The URL of this specific deployment; differs on every preview build. */
const vercelDeploymentURL = (): string | undefined =>
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined

/**
 * The hand-set origin, unless it is still a placeholder.
 *
 * The live deployment was found with `https://placeholder.vercel.app` here,
 * which pointed the sitemap, canonical URLs and live preview at a site that does
 * not exist. A placeholder is treated as unset, so the platform's real production
 * domain (the custom domain, once one is attached in Vercel) is used instead.
 */
const explicitURL = (): string | undefined => {
  const value = process.env.NEXT_PUBLIC_SERVER_URL?.trim().replace(/\/$/, '')
  if (!value) return undefined

  try {
    const { hostname } = new URL(value)
    if (/placeholder|your-?(site|domain)|example\.(com|lk)$/i.test(hostname)) return undefined
  } catch {
    return undefined
  }

  return value
}

/**
 * The canonical origin, with no trailing slash.
 *
 * Used for anything a visitor or a crawler sees, so it prefers the operator's
 * chosen domain over the platform's generated one.
 */
export function resolveServerURL(): string {
  return explicitURL() || vercelProductionURL() || vercelDeploymentURL() || 'http://localhost:3000'
}

/**
 * Every origin the admin panel may legitimately call its own API from.
 *
 * Deliberately broader than the canonical URL: including the Vercel-provided
 * hosts means the admin panel keeps working on `*.vercel.app` and on preview
 * deployments, and survives `NEXT_PUBLIC_SERVER_URL` being wrong. These are
 * injected by the platform, so they cannot be mistyped.
 */
export function resolveAllowedOrigins(): string[] {
  return Array.from(
    new Set(
      [explicitURL(), vercelProductionURL(), vercelDeploymentURL(), 'http://localhost:3000']
        .filter((origin): origin is string => Boolean(origin))
        .flatMap(withWwwVariant),
    ),
  )
}

/**
 * An origin plus its `www.` twin (or bare twin, if it already has `www.`).
 *
 * Payload matches the browser's `Origin` header against this list character for
 * character, and a custom domain is usually reachable both ways. If the setting
 * says `https://example.lk` and an editor opens `https://www.example.lk/admin`,
 * every save arrives from an origin that is not on the list: Payload drops the
 * login for that request, the save is refused as unauthenticated, and the admin
 * shows "This page couldn't load". Both spellings are the same site, so both are
 * allowed. Platform hosts (`*.vercel.app`) and localhost are left as they are.
 */
function withWwwVariant(origin: string): string[] {
  try {
    const url = new URL(origin)

    if (url.hostname === 'localhost' || url.hostname.endsWith('.vercel.app')) return [origin]

    const twin = url.hostname.startsWith('www.')
      ? url.hostname.slice(4)
      : `www.${url.hostname}`

    return [origin, `${url.protocol}//${twin}${url.port ? `:${url.port}` : ''}`]
  } catch {
    return [origin]
  }
}
