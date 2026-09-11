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

const explicitURL = (): string | undefined =>
  process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') || undefined

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
      [explicitURL(), vercelProductionURL(), vercelDeploymentURL(), 'http://localhost:3000'].filter(
        (origin): origin is string => Boolean(origin),
      ),
    ),
  )
}
