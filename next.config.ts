import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/**
 * Remote image hosts. Cloudflare R2 serves uploaded media in production, so the
 * public R2 bucket URL has to be allow-listed for next/image. It is read from the
 * environment so the same config works for a custom domain in front of R2.
 */
const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = []

if (process.env.R2_PUBLIC_URL) {
  try {
    const url = new URL(process.env.R2_PUBLIC_URL)
    remotePatterns.push({
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      hostname: url.hostname,
      pathname: '/**',
    })
  } catch {
    // An unparseable R2_PUBLIC_URL should not take the build down; next/image
    // will simply refuse that host until the value is corrected.
    console.warn('[next.config] R2_PUBLIC_URL is not a valid URL, skipping remote pattern')
  }
}

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/media-uploads/**' }],
    remotePatterns,
  },
  // Vercel serves the site over HTTPS with HSTS already; these cover the rest of
  // the low-cost, high-value headers.
  //
  // Note the deliberate absence of a Content-Security-Policy: the admin panel
  // injects inline styles and the site inlines critical CSS, so a CSP needs a
  // nonce pipeline to avoid breaking either. Worth adding, but it must be done
  // properly rather than shipped half-configured.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Stops browsers guessing content types, which is how a stray upload
          // becomes an XSS vector.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // `SAMEORIGIN` rather than `DENY`: the admin panel's live preview loads
          // the public site in an iframe on this same origin.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
