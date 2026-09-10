import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrPublished } from '../access'
import { slugField } from '../fields/slug'
import { revalidateCollection, revalidateCollectionAfterDelete } from '../hooks/revalidate'
import { buildPreviewUrl } from '../lib/preview'

const eventPath = (doc: Record<string, unknown>) =>
  typeof doc.slug === 'string' && doc.slug ? `/events/${doc.slug}` : null

/**
 * Events.
 *
 * "Upcoming" versus "Past" is derived from `startsAt` rather than being a flag
 * the editor has to remember to flip — an event moves itself into the archive
 * the moment it finishes.
 *
 * `ticketPrice` is plain data. Nothing in this build charges anyone; the
 * `orders` and `tickets` collections exist so a Stripe checkout can be added
 * later without touching this schema (brief §2).
 */
export const Events: CollectionConfig = {
  slug: 'events',
  labels: {
    singular: 'Event',
    plural: 'Events',
  },
  defaultSort: '-startsAt',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'startsAt', 'venue', 'ticketPrice', '_status'],
    description:
      'Every NexGen event. Events with a date in the future show under "Upcoming"; once the date passes they move to "Past Events" automatically.',
    preview: (doc) => buildPreviewUrl(eventPath(doc as Record<string, unknown>) ?? '/events'),
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    // Homepage and events listing both show event data, so both are refreshed
    // alongside the event's own page.
    afterChange: [revalidateCollection(['/', '/events'], eventPath)],
    afterDelete: [revalidateCollectionAfterDelete(['/', '/events'], eventPath)],
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
      type: 'tabs',
      tabs: [
        {
          label: 'Details',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              admin: {
                description: 'The event name, e.g. "NexGen Presents: Ember Nights".',
              },
            },
            {
              name: 'tagline',
              type: 'text',
              admin: {
                description: 'One short line shown under the title on cards and the event page.',
              },
            },
            {
              name: 'artists',
              type: 'array',
              labels: { singular: 'Artist', plural: 'Artists' },
              admin: {
                description: 'Drag to reorder. The first artist is treated as the headliner.',
              },
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'role',
                  type: 'text',
                  admin: {
                    description: 'Optional, e.g. "Headliner", "Support", "Resident DJ".',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'startsAt',
                  type: 'date',
                  required: true,
                  label: 'Starts',
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
                    description: 'Decides whether this is an upcoming or a past event.',
                  },
                },
                {
                  name: 'endsAt',
                  type: 'date',
                  label: 'Ends',
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'venue',
                  type: 'text',
                  required: true,
                  admin: { width: '50%' },
                },
                {
                  name: 'city',
                  type: 'text',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'description',
              type: 'richText',
              admin: {
                description: 'The full write-up shown on the event page.',
              },
            },
          ],
        },
        {
          label: 'Tickets',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'ticketPrice',
                  type: 'number',
                  min: 0,
                  admin: {
                    width: '50%',
                    description:
                      'Displayed on the site. Leave blank for a free event, or if tickets are not on sale yet.',
                  },
                },
                {
                  name: 'currency',
                  type: 'select',
                  defaultValue: 'LKR',
                  options: [
                    { label: 'Sri Lankan Rupee (Rs.)', value: 'LKR' },
                    { label: 'US Dollar ($)', value: 'USD' },
                    { label: 'Pound Sterling (£)', value: 'GBP' },
                    { label: 'Euro (€)', value: 'EUR' },
                  ],
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'ticketNote',
              type: 'text',
              admin: {
                description:
                  'Optional line shown next to the price, e.g. "Early bird until 30 June" or "At the door only".',
              },
            },
            {
              name: 'externalTicketUrl',
              type: 'text',
              label: 'External ticket link',
              admin: {
                description:
                  'Optional. If you sell tickets through another site, paste the link and the button will point there. On-site checkout is not part of this build.',
              },
            },
            {
              name: 'soldOut',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
        {
          label: 'Images',
          fields: [
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'The main photo, used on event cards and at the top of the event page.',
              },
            },
            {
              name: 'backgroundImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Optional wide photo used as the full-width backdrop on the event page. A landscape shot works best.',
              },
            },
            {
              type: 'ui',
              name: 'galleryHint',
              admin: {
                components: {
                  Field: '@/components/admin/GalleryHint#GalleryHint',
                },
              },
            },
          ],
        },
      ],
    },
    ...[slugField('title')],
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Feature on the homepage',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Featured events are pulled out first in the homepage events teaser.',
      },
    },
  ],
}
