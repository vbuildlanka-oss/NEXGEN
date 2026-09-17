import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'
import { UPDATES_PAGE_COPY as COPY } from './pageCopy'
import { callout, pageIntro, pageSeo } from './pageFields'

/**
 * The wording on the Updates listing page.
 *
 * The posts are the Posts collection; this is the page around them — header,
 * the "Everything" filter label, the empty state, and the closing band.
 *
 * The category filter labels are deliberately absent. They come from the category
 * list in the Posts collection, so a post's category and the filter that finds it
 * are guaranteed to read the same; splitting them would let the two drift.
 */
export const UpdatesPage: GlobalConfig = {
  slug: 'updates-page',
  label: 'Updates page',
  admin: {
    group: 'Pages',
    description:
      'The wording on the Updates page. The posts themselves are under Content → Updates.',
    livePreview: { url: '/updates' },
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateGlobal(['/updates'])],
  },
  versions: {
    drafts: false,
    max: 20,
  },
  fields: [
    pageIntro({
      ...COPY.intro,
      imageFallback: "the newest post's cover photo",
    }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Filters & empty state',
          fields: [
            {
              name: 'filters',
              type: 'group',
              label: 'Category filters',
              admin: {
                description:
                  'The category buttons themselves come from the categories on each post, so they always match.',
              },
              fields: [
                {
                  name: 'allLabel',
                  type: 'text',
                  defaultValue: COPY.filters.allLabel,
                  admin: {
                    description: 'The first button, which clears the filter.',
                  },
                },
              ],
            },
            callout(
              'empty',
              'When there are no posts',
              COPY.empty,
              'Shown when no posts have been published yet.',
            ),
          ],
        },
        {
          label: 'Closing band',
          fields: [
            callout(
              'outro',
              'Closing band',
              COPY.outro,
              'The strip at the foot of the page, under the posts.',
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
