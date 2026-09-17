import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'
import { GALLERY_PAGE_COPY as COPY } from './pageCopy'
import { callout, pageIntro, pageSeo } from './pageFields'

/**
 * The wording on the Gallery page.
 *
 * Which photographs appear is decided per-image in the media library — tick "Show
 * on the Gallery page" and choose an event. This is only the wording around them.
 *
 * Photographs tagged with an event are grouped under that event's title, which is
 * why there is no field for those headings: they are the event names, and typing
 * them twice would let them disagree. Only the heading for untagged photographs
 * needs writing, since nothing else supplies it.
 */
export const GalleryPage: GlobalConfig = {
  slug: 'gallery-page',
  label: 'Gallery page',
  admin: {
    group: 'Pages',
    description:
      'The wording on the Gallery page. Which photos appear is set per photo under Content → Images & Videos.',
    livePreview: { url: '/gallery' },
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateGlobal(['/gallery'])],
  },
  versions: {
    drafts: false,
    max: 20,
  },
  fields: [
    pageIntro({
      ...COPY.intro,
      imageFallback: 'the first photograph in the gallery',
    }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Photo groups',
          fields: [
            {
              name: 'groups',
              type: 'group',
              label: 'How photos are grouped',
              admin: {
                description:
                  'Photos tagged with an event are grouped under that event’s name automatically.',
              },
              fields: [
                {
                  name: 'untaggedHeading',
                  type: 'text',
                  defaultValue: COPY.groups.untaggedHeading,
                  admin: {
                    description:
                      'The heading over photos that have not been tagged with an event. Always shown last.',
                  },
                },
                {
                  name: 'eventLinkLabel',
                  type: 'text',
                  defaultValue: COPY.groups.eventLinkLabel,
                  admin: {
                    description:
                      'The link beside each event group, which opens that event’s page.',
                  },
                },
              ],
            },
            callout(
              'empty',
              'When there are no photos',
              COPY.empty,
              'Shown when no photographs have been tagged for the gallery yet.',
            ),
          ],
        },
        {
          label: 'Search & sharing',
          fields: [
            pageSeo(COPY.seo),
          ],
        },
      ],
    },
  ],
}
