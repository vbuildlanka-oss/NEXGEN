import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

/**
 * The Our Story page: the four sections named in the brief (§4), each with a
 * heading, rich text and an optional photo.
 *
 * Modelled as a fixed group per section rather than a free-form block list,
 * because the client asked for these four specific sections and a fixed shape is
 * far less intimidating to edit than an empty page builder.
 */
export const OurStory: GlobalConfig = {
  slug: 'our-story',
  label: 'Our Story page',
  admin: {
    group: 'Pages',
    description: 'The four sections of the Our Story page.',
    livePreview: { url: '/our-story' },
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateGlobal(['/our-story'])],
  },
  versions: {
    drafts: false,
    max: 20,
  },
  fields: [
    {
      name: 'intro',
      type: 'group',
      label: 'Page header',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'Our Story',
        },
        {
          name: 'heading',
          type: 'text',
          required: true,
          defaultValue: 'Built for what comes next',
        },
        {
          name: 'standfirst',
          type: 'textarea',
          admin: {
            description: 'The opening paragraph, set larger than the rest.',
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
      type: 'tabs',
      tabs: [
        {
          label: 'What is NexGen?',
          fields: [storySection('whatIsNexGen', 'What is NexGen?')],
        },
        {
          label: 'Why We Started',
          fields: [storySection('whyWeStarted', 'Why We Started')],
        },
        {
          label: 'What We Stand For',
          fields: [storySection('whatWeStandFor', 'What We Stand For')],
        },
        {
          label: 'The NexGen Community',
          fields: [storySection('community', 'The NexGen Community')],
        },
      ],
    },
  ],
}

/**
 * One Our Story section. Kept as a helper so all four stay identical in shape —
 * if a field is added here it appears in every section at once.
 */
function storySection(name: string, defaultHeading: string) {
  return {
    name,
    type: 'group' as const,
    label: defaultHeading,
    fields: [
      {
        name: 'heading',
        type: 'text' as const,
        required: true,
        defaultValue: defaultHeading,
      },
      {
        name: 'body',
        type: 'richText' as const,
      },
      {
        name: 'image',
        type: 'upload' as const,
        relationTo: 'media' as const,
        admin: {
          description: 'Optional photo shown alongside this section.',
        },
      },
      {
        name: 'pullQuote',
        type: 'text' as const,
        admin: {
          description:
            'Optional short line pulled out in large type — good for a value or a statement of intent.',
        },
      },
    ],
  }
}
