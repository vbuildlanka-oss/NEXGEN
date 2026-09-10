import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

/**
 * Contact details and social links.
 *
 * Seeded with obvious placeholders (see scripts/seed.ts) so the site is complete
 * on day one and the client can replace them from the admin panel without a
 * developer, as requested.
 */
export const ContactInfo: GlobalConfig = {
  slug: 'contact-info',
  label: 'Contact details & socials',
  admin: {
    group: 'Pages',
    description:
      'Your contact details, the Contact Us page wording, and the social links used across the whole site including the footer.',
    livePreview: { url: '/contact' },
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateGlobal(['/contact', '/'])],
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
          label: 'Page wording',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              defaultValue: 'Contact Us',
            },
            {
              name: 'heading',
              type: 'text',
              required: true,
              defaultValue: 'Get in touch',
            },
            {
              name: 'standfirst',
              type: 'textarea',
              admin: {
                description: 'The line under the heading, above the form.',
              },
            },
            {
              name: 'formSuccessMessage',
              type: 'text',
              defaultValue: 'Thanks — your message is on its way. We’ll come back to you shortly.',
              admin: {
                description: 'Shown once someone successfully sends the form.',
              },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Wide photo behind the page header.',
              },
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            {
              name: 'email',
              type: 'text',
              admin: {
                description: 'The public enquiries address shown on the page.',
              },
            },
            {
              name: 'bookingEmail',
              type: 'text',
              label: 'Bookings email',
              admin: {
                description: 'Optional second address for artist and booking enquiries.',
              },
            },
            {
              name: 'phone',
              type: 'text',
            },
            {
              name: 'address',
              type: 'textarea',
              admin: {
                description: 'Shown as written, so use line breaks how you want them to appear.',
              },
            },
            {
              name: 'openingHours',
              type: 'text',
              admin: {
                description: 'Optional, e.g. "Mon–Fri, 9am–6pm".',
              },
            },
          ],
        },
        {
          label: 'Social links',
          fields: [
            {
              name: 'socials',
              type: 'array',
              label: 'Social links',
              admin: {
                description:
                  'Shown in the footer, the menu and on the Contact page. Drag to reorder. Delete a row to remove that platform.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      admin: { width: '40%' },
                      options: [
                        { label: 'Instagram', value: 'instagram' },
                        { label: 'TikTok', value: 'tiktok' },
                        { label: 'Facebook', value: 'facebook' },
                        { label: 'YouTube', value: 'youtube' },
                        { label: 'X / Twitter', value: 'x' },
                        { label: 'Spotify', value: 'spotify' },
                        { label: 'SoundCloud', value: 'soundcloud' },
                        { label: 'WhatsApp', value: 'whatsapp' },
                        { label: 'Other', value: 'other' },
                      ],
                    },
                    {
                      name: 'label',
                      type: 'text',
                      admin: { width: '25%', description: 'Optional override, e.g. "@nexgen.lk".' },
                    },
                    {
                      name: 'url',
                      type: 'text',
                      required: true,
                      admin: { width: '35%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
