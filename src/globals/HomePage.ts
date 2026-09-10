import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

/**
 * Editable copy for the homepage: the hero video section, the line that
 * introduces the photo-canvas panels, and the three teaser blocks.
 *
 * The hero video falls back to the bundled file in /public/hero when no video is
 * uploaded, so the page is never without one.
 */
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Homepage',
  admin: {
    group: 'Homepage',
    description: 'The text and video on the homepage.',
    livePreview: { url: '/' },
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateGlobal(['/'])],
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
          label: 'Hero',
          fields: [
            {
              name: 'heroVideo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'The full-screen looping video at the top of the page. Upload an MP4 (no sound is played). Leave blank to keep the video that ships with the site.',
              },
            },
            {
              name: 'heroPoster',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'A still image shown instantly while the video loads, so visitors never see a blank screen. Ideally the video’s first frame.',
              },
            },
            {
              name: 'heroHeadline',
              type: 'text',
              required: true,
              defaultValue: 'A new generation of entertainment',
              admin: {
                description: 'The main line over the video.',
              },
            },
            {
              name: 'heroSubheadline',
              type: 'textarea',
              admin: {
                description: 'One supporting sentence under the headline.',
              },
            },
            {
              name: 'heroScrollHint',
              type: 'text',
              defaultValue: 'Scroll',
              admin: {
                description: 'The small prompt at the bottom of the hero telling people to scroll.',
              },
            },
            {
              name: 'heroButtons',
              type: 'array',
              label: 'Hero buttons',
              maxRows: 2,
              admin: {
                description: 'Up to two buttons over the video. Drag to reorder.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                    {
                      name: 'url',
                      type: 'text',
                      required: true,
                      admin: { width: '50%', description: 'e.g. /events' },
                    },
                  ],
                },
                {
                  name: 'style',
                  type: 'select',
                  defaultValue: 'primary',
                  options: [
                    { label: 'Solid red', value: 'primary' },
                    { label: 'Outlined', value: 'secondary' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Panels intro',
          fields: [
            {
              name: 'panelsEyebrow',
              type: 'text',
              defaultValue: 'What is NexGen?',
              admin: {
                description: 'The small label above the intro line, before the photo panels start.',
              },
            },
            {
              name: 'panelsIntro',
              type: 'textarea',
              required: true,
              defaultValue:
                'A home for the artists shaping what comes next — and the crowds who find them first.',
              admin: {
                description:
                  'The large statement that fills the screen and lights up word by word as you scroll into the panels.',
              },
            },
          ],
        },
        {
          label: 'Teasers',
          fields: [
            {
              name: 'teasers',
              type: 'array',
              label: 'Homepage teasers',
              maxRows: 3,
              admin: {
                description:
                  'The three blocks near the bottom of the homepage that send people into Events, Updates and Gallery.',
              },
              fields: [
                { name: 'eyebrow', type: 'text' },
                { name: 'heading', type: 'text', required: true },
                { name: 'body', type: 'textarea' },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'linkLabel',
                      type: 'text',
                      required: true,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'linkUrl',
                      type: 'text',
                      required: true,
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
