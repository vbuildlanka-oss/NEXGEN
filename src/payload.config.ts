import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig, type Plugin } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { ContactMessages } from './collections/ContactMessages'
import { Events } from './collections/Events'
import { HomePanels } from './collections/HomePanels'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Posts } from './collections/Posts'
import { Tickets } from './collections/Tickets'
import { Users } from './collections/Users'
import { ContactInfo } from './globals/ContactInfo'
import { HomePage } from './globals/HomePage'
import { OurStory } from './globals/OurStory'
import { SiteSettings } from './globals/SiteSettings'
import { buildPreviewUrl } from './lib/preview'
import { resolveAllowedOrigins } from './lib/serverUrl'

/** Maps an admin document to the public page that shows it. */
function previewPathFor({
  data,
  collectionSlug,
  globalSlug,
}: {
  data?: Record<string, unknown>
  collectionSlug?: string
  globalSlug?: string
}): string {
  if (globalSlug === 'our-story') return '/our-story'
  if (globalSlug === 'contact-info') return '/contact'
  if (globalSlug === 'home-page') return '/'

  const slug = typeof data?.slug === 'string' ? data.slug : ''

  if (collectionSlug === 'posts') return slug ? `/updates/${slug}` : '/updates'
  if (collectionSlug === 'events') return slug ? `/events/${slug}` : '/events'
  if (collectionSlug === 'home-panels') return '/'

  return '/'
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const allowedOrigins = resolveAllowedOrigins()

/**
 * Cloudflare R2 is S3-compatible, so the standard S3 storage adapter drives it.
 *
 * When the R2 variables are absent the adapter is simply not registered and
 * Payload falls back to writing files to `public/media-uploads`. That keeps local
 * development working with zero external accounts — but note that Vercel's
 * filesystem is read-only, so R2 is required in production. See docs/SETUP.md.
 */
/**
 * Normalises `R2_BUCKET` to a bare bucket name.
 *
 * The first deployment failed with "Bucket name shouldn't contain '/'" after
 * uploading had already begun, because the value had been entered as a full URL.
 * A bucket name is not a URL, so anything URL-shaped is reduced to its last path
 * segment and stray slashes and whitespace are trimmed. Better to accept the
 * near-miss than to fail deep inside the AWS SDK.
 */
function normaliseBucketName(value: string | undefined): string | undefined {
  if (!value) return undefined

  let bucket = value.trim()

  // "https://account.r2.cloudflarestorage.com/nexgen-media" -> "nexgen-media"
  if (/^https?:\/\//i.test(bucket)) {
    try {
      const parsed = new URL(bucket)
      bucket = parsed.pathname.replace(/^\/+/, '')
    } catch {
      // Fall through to the generic slash handling below.
    }
  }

  bucket = bucket.replace(/^\/+|\/+$/g, '')

  // A remaining slash means we cannot guess the intent; take the last segment.
  if (bucket.includes('/')) {
    const segments = bucket.split('/').filter(Boolean)
    bucket = segments[segments.length - 1] ?? ''
  }

  return bucket || undefined
}

const r2Bucket = normaliseBucketName(process.env.R2_BUCKET)

if (process.env.R2_BUCKET && r2Bucket !== process.env.R2_BUCKET.trim()) {
  console.warn(
    `[storage] R2_BUCKET was "${process.env.R2_BUCKET}" — using "${r2Bucket}". ` +
      'Set it to just the bucket name to remove this warning.',
  )
}

const r2Configured = Boolean(
  r2Bucket &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT,
)

const storagePlugins: Plugin[] = r2Configured
  ? [
      s3Storage({
        collections: {
          media: {
            disableLocalStorage: true,
            // Serve files straight from the R2 public URL rather than proxying
            // them through the Next.js server: R2 egress is free and this keeps
            // image delivery off the serverless function.
            generateFileURL: ({ filename }) =>
              `${(process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')}/${filename}`,
          },
        },
        bucket: r2Bucket!,
        config: {
          endpoint: process.env.R2_ENDPOINT,
          // R2 ignores the region but the S3 client insists on one.
          region: 'auto',
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        },
      }),
    ]
  : []

export default buildConfig({
  /**
   * `serverURL` is deliberately NOT set.
   *
   * When it is set, Payload uses it as the absolute base for the admin panel's own
   * API calls. A wrong value — a placeholder, an old domain, http instead of https
   * — therefore points the admin panel at a host that does not answer, and it
   * renders as a blank page with no error in the console. That is exactly what
   * happened on the first deployment.
   *
   * Omitted, Payload uses relative URLs and the admin panel works on whatever host
   * is serving it: the .vercel.app domain, a custom domain and preview deployments
   * alike. Absolute URLs are still needed for live preview, sitemaps and metadata,
   * and those come from resolveServerURL() where a wrong value is cosmetic rather
   * than fatal.
   */
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · NexGen Admin',
      description: 'Manage the NexGen Entertainment website.',
    },
    /**
     * Custom admin components are disabled for now.
     *
     * The deployed admin panel renders as a blank page: the server sends complete,
     * correct HTML (105 KB, stream terminated, identical to local), every JS chunk
     * returns 200, and no error is raised — React simply never hydrates. The only
     * non-standard thing about this admin is the branding overrides below, and the
     * logo renders on precisely the screen that comes up blank.
     *
     * Removed as an isolation step rather than a fix. If the panel renders after
     * this, the cause is in these components or in how the generated import map
     * resolves them on Vercel, and they can be reinstated carefully. The branding
     * is cosmetic; being able to edit the site is not.
     */
    // components: {
    //   graphics: {
    //     Logo: '@/components/admin/Logo#AdminLogo',
    //     Icon: '@/components/admin/Logo#AdminIcon',
    //   },
    //   beforeDashboard: ['@/components/admin/Welcome#Welcome'],
    // },
    // Side-by-side editing: the real page renders next to the form and updates
    // as the editor types. This is the single biggest ease-of-use win in the
    // admin panel, so every editable surface opts in.
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 834, height: 1112 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
      url: ({ data, collectionConfig, globalConfig }) =>
        buildPreviewUrl(previewPathFor({ data, collectionSlug: collectionConfig?.slug, globalSlug: globalConfig?.slug })),
    },
  },
  collections: [
    Events,
    Posts,
    Media,
    HomePanels,
    ContactMessages,
    Orders,
    Tickets,
    Users,
  ],
  globals: [HomePage, OurStory, ContactInfo, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Schema is pushed automatically while developing; production changes go
    // through committed migrations in src/migrations.
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  cors: allowedOrigins,
  csrf: allowedOrigins,
  sharp,
  plugins: [...storagePlugins],
})
