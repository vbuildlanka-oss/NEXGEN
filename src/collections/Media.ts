import path from 'path'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'url'

import { anyone, authenticated } from '../access'
import { revalidateCollection, revalidateCollectionAfterDelete } from '../hooks/revalidate'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Every image and video in the system lives here exactly once.
 *
 * Files themselves go to Cloudflare R2 (or the local disk when R2 env vars are
 * absent — see payload.config.ts); the database only ever stores the filename,
 * dimensions and the metadata below.
 *
 * The Gallery page and each event's photo set are both driven from the `event`
 * and `showInGallery` fields here, rather than from separate lists elsewhere.
 * That means adding photos to the site is a single action: drag the files in,
 * tag them with their event, tick the box.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Image / Video',
    plural: 'Images & Videos',
  },
  admin: {
    group: 'Content',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'caption', 'event', 'showInGallery', 'updatedAt'],
    description:
      'All photos and videos used anywhere on the site. You can drag in several files at once. Tick "Show on the Gallery page" and choose an event to make a photo appear in the public gallery.',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    // A newly tagged photo should show up in the gallery straight away.
    afterChange: [revalidateCollection(['/', '/gallery', '/events'])],
    afterDelete: [revalidateCollectionAfterDelete(['/', '/gallery', '/events'])],
  },
  upload: {
    /**
     * Only used when R2 is not configured — the development fallback. Set
     * explicitly rather than left to Payload's default (`./media` at the project
     * root) so the location is obvious, is covered by .gitignore, and matches the
     * `localPatterns` entry in next.config.ts.
     *
     * Note that Payload renames a file if one of the same name already exists on
     * disk, and it does so by incrementing a trailing number — which turns
     * "onedineth-img-11.webp" into "onedineth-img-12.webp". Clear this directory
     * when reseeding from scratch, or filenames drift out of step with the
     * database.
     */
    staticDir: path.resolve(dirname, '../../public/media-uploads'),
    // Focal point + crop give the editor control over how a photo is framed
    // when it is used in a shape that does not match its own aspect ratio.
    focalPoint: true,
    crop: true,
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'video/mp4', 'video/webm'],
    // Responsive variants, generated once on upload by sharp and stored
    // alongside the original. WebP keeps them small without a visible quality
    // cost on photography this dark.
    imageSizes: [
      {
        name: 'thumbnail',
        width: 480,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 72 } },
      },
      {
        name: 'card',
        width: 960,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 78 } },
      },
      {
        name: 'wide',
        width: 1600,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'hero',
        width: 2400,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'A short description of what is in the photo, read aloud by screen readers. Example: "DJ performing to a packed crowd at NexGen Live".',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption shown under the photo in the gallery lightbox.',
      },
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Photographer credit, if one is required.',
      },
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      admin: {
        description:
          'Which event this photo is from. Used to group photos on the Gallery page and to fill the photo strip on the event page.',
      },
    },
    {
      name: 'showInGallery',
      type: 'checkbox',
      label: 'Show on the Gallery page',
      defaultValue: false,
      index: true,
      admin: {
        description:
          'Only ticked photos appear in the public Gallery. Leave unticked for photos you only want to use elsewhere, such as an event cover.',
      },
    },
    {
      name: 'galleryOrder',
      type: 'number',
      label: 'Gallery order',
      admin: {
        description:
          'Optional. Lower numbers appear first in the gallery. Leave blank to sort by newest.',
        step: 1,
      },
    },
  ],
}
