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

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/**
 * Cloudflare R2 is S3-compatible, so the standard S3 storage adapter drives it.
 *
 * When the R2 variables are absent the adapter is simply not registered and
 * Payload falls back to writing files to `public/media-uploads`. That keeps local
 * development working with zero external accounts — but note that Vercel's
 * filesystem is read-only, so R2 is required in production. See docs/SETUP.md.
 */
const r2Configured = Boolean(
  process.env.R2_BUCKET &&
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
        bucket: process.env.R2_BUCKET!,
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
  serverURL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · NexGen Admin',
      description: 'Manage the NexGen Entertainment website.',
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo#AdminLogo',
        Icon: '@/components/admin/Logo#AdminIcon',
      },
      beforeDashboard: ['@/components/admin/Welcome#Welcome'],
    },
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
  cors: [serverURL],
  csrf: [serverURL],
  sharp,
  plugins: [...storagePlugins],
})
