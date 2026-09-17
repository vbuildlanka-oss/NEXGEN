import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'
import { EVENTS_PAGE_COPY as COPY } from './pageCopy'
import { callout, pageIntro, pageSeo } from './pageFields'

/**
 * The wording on the Events listing page.
 *
 * Not the events themselves — those are the Events collection. This is everything
 * around them: the header, the two section headings, and what the page says when
 * there is nothing coming up.
 *
 * It exists because all of it was hardcoded in the page component, so the client
 * could add and edit events but could not change a single word of the page they sat
 * on. Every field defaults to the wording that was previously in the code, and the
 * page falls back to that same wording if a field is cleared — so the page can
 * never end up with a blank heading.
 */
export const EventsPage: GlobalConfig = {
  slug: 'events-page',
  label: 'Events page',
  admin: {
    group: 'Pages',
    description:
      'The wording on the Events page. The events themselves are under Content → Events.',
    livePreview: { url: '/events' },
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateGlobal(['/events'])],
  },
  versions: {
    drafts: false,
    max: 20,
  },
  fields: [
    pageIntro({
      ...COPY.intro,
      imageFallback: "the next event's own artwork",
    }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Upcoming',
          fields: [
            {
              name: 'upcoming',
              type: 'group',
              label: 'Upcoming events section',
              fields: [
                {
                  name: 'heading',
                  type: 'text',
                  defaultValue: COPY.upcoming.heading,
                },
                {
                  name: 'countLabel',
                  type: 'text',
                  defaultValue: COPY.upcoming.countLabel,
                  admin: {
                    description:
                      'The word after the number, as in "3 scheduled". The number is counted automatically.',
                  },
                },
              ],
            },
            callout(
              'upcomingEmpty',
              'When nothing is scheduled',
              COPY.upcomingEmpty,
              'Shown in place of the list when there are no upcoming events.',
            ),
          ],
        },
        {
          label: 'Past events',
          fields: [
            {
              name: 'past',
              type: 'group',
              label: 'Past events section',
              admin: {
                description: 'This section hides itself automatically until there is a past event.',
              },
              fields: [
                {
                  name: 'eyebrow',
                  type: 'text',
                  defaultValue: COPY.past.eyebrow,
                },
                {
                  name: 'heading',
                  type: 'text',
                  defaultValue: COPY.past.heading,
                },
                {
                  name: 'galleryLinkLabel',
                  type: 'text',
                  defaultValue: COPY.past.galleryLinkLabel,
                  admin: {
                    description: 'The link across from the heading, which opens the Gallery page.',
                  },
                },
              ],
            },
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
