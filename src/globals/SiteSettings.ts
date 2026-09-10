import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

/**
 * Everything that appears on every page: the announcement bar, the navigation
 * labels, the header call-to-action, footer wording and the default SEO values.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    group: 'Settings',
    description:
      'The announcement bar, navigation menu, header button, footer text and the default title/description search engines show.',
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    // The header and footer appear on every page, so all of them refresh.
    afterChange: [revalidateGlobal(['/', '/our-story', '/events', '/updates', '/gallery', '/contact'])],
  },
  versions: {
    drafts: false,
    max: 20,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Announcement bar',
          fields: [
            {
              name: 'announcement',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  label: 'Show the announcement bar',
                  defaultValue: false,
                },
                {
                  name: 'text',
                  type: 'text',
                  admin: {
                    description: 'The strip across the very top of every page.',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'linkLabel', type: 'text', admin: { width: '50%' } },
                    { name: 'linkUrl', type: 'text', admin: { width: '50%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Navigation',
          fields: [
            {
              name: 'navItems',
              type: 'array',
              label: 'Menu links',
              admin: {
                description:
                  'The links in the pop-out menu, in order. Drag to reorder, or delete a row to hide a page from the menu.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                    { name: 'url', type: 'text', required: true, admin: { width: '50%' } },
                  ],
                },
              ],
            },
            {
              name: 'headerCta',
              type: 'group',
              label: 'Header button',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      defaultValue: 'Events',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'url',
                      type: 'text',
                      defaultValue: '/events',
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'headerTagline',
              type: 'text',
              admin: {
                description:
                  'The small stacked text next to the logo in the header, e.g. the next event and city. Use " / " to split it across lines.',
              },
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'footerBlurb',
              type: 'textarea',
              admin: {
                description: 'A short line about NexGen shown in the footer.',
              },
            },
            {
              name: 'footerColumns',
              type: 'array',
              label: 'Footer link columns',
              maxRows: 3,
              fields: [
                { name: 'heading', type: 'text', required: true },
                {
                  name: 'links',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                        { name: 'url', type: 'text', required: true, admin: { width: '50%' } },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'copyrightName',
              type: 'text',
              defaultValue: 'NexGen Entertainment',
            },
          ],
        },
        {
          label: 'Search engines',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'defaultTitle',
                  type: 'text',
                  defaultValue: 'NexGen Entertainment',
                  admin: {
                    description: 'Shown in the browser tab and in search results.',
                  },
                },
                {
                  name: 'defaultDescription',
                  type: 'textarea',
                  admin: {
                    description: 'One or two sentences describing NexGen. Around 155 characters.',
                  },
                },
                {
                  name: 'shareImage',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description:
                      'The picture that appears when someone shares a link to the site on social media. 1200×630 works best.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
