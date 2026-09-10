import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrPublished } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection, revalidateCollectionAfterDelete } from '../hooks/revalidate'
import { buildPreviewUrl } from '../lib/preview'

const postPath = (doc: Record<string, unknown>) =>
  typeof doc.slug === 'string' && doc.slug ? `/updates/${doc.slug}` : null

/**
 * The six Updates subsections in the brief are categories on one collection
 * rather than six separate systems (brief §4). Adding a seventh section later is
 * a one-line change to `postCategories`.
 */
export const postCategories = [
  { label: 'Latest News', value: 'news' },
  { label: 'Artist Announcement', value: 'artist-announcement' },
  { label: 'Event Announcement', value: 'event-announcement' },
  { label: 'Collaboration', value: 'collaboration' },
  { label: 'NexGen Milestone', value: 'milestone' },
  { label: 'Live Recording', value: 'live-recording' },
] as const

export type PostCategoryValue = (typeof postCategories)[number]['value']

export const postCategoryLabels: Record<string, string> = Object.fromEntries(
  postCategories.map((category) => [category.value, category.label]),
)

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Update',
    plural: 'Updates',
  },
  defaultSort: '-publishedAt',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    description:
      'News, announcements, collaborations, milestones and live recordings. The category you pick decides which section of the Updates page the post appears under.',
    preview: (doc) => buildPreviewUrl(postPath(doc as Record<string, unknown>) ?? '/updates'),
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateCollection(['/', '/updates'], postPath)],
    afterDelete: [revalidateCollectionAfterDelete(['/', '/updates'], postPath)],
  },
  versions: {
    drafts: {
      autosave: { interval: 400 },
      schedulePublish: true,
    },
    maxPerDoc: 30,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description:
          'One or two sentences shown on the Updates page and in link previews. If left blank the opening of the post is used.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      admin: {
        description: 'The full post.',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Shown at the top of the post and on the Updates page card.',
      },
    },
    {
      name: 'relatedEvent',
      type: 'relationship',
      relationTo: 'events',
      admin: {
        description: 'Optional. Links the post to an event so readers can jump straight to it.',
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      label: 'External link',
      admin: {
        description:
          'Optional. For live recordings, paste the YouTube / SoundCloud / Spotify link here and the card gets a "Listen" button.',
      },
    },
    ...[slugField('title')],
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'news',
      options: [...postCategories],
      admin: {
        position: 'sidebar',
        description: 'Which Updates section this post belongs to.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Publish date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
        description: 'Controls the date shown on the post and the order posts are listed in.',
      },
      hooks: {
        // Stamp the publish date on first publish so the editor does not have to.
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData?._status === 'published' && !value) {
              return new Date()
            }

            return value
          },
        ],
      },
    },
  ],
}
