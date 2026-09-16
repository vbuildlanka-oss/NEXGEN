import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateCollection, revalidateCollectionAfterDelete } from '../hooks/revalidate'

/**
 * The homepage photo-canvas panels — the scroll-driven section where a centred
 * artist photo sits on a full-bleed background "canvas" and both change as the
 * page scrolls (brief §3).
 *
 * Modelled as a collection rather than hard-coded so the client can reorder,
 * reword, restyle or add panels without a developer. Seven ship by default.
 */
export const HomePanels: CollectionConfig = {
  slug: 'home-panels',
  labels: {
    singular: 'Homepage Panel',
    plural: 'Homepage Panels',
  },
  defaultSort: 'order',
  admin: {
    group: 'Homepage',
    useAsTitle: 'heading',
    defaultColumns: ['order', 'heading', 'artistImage', 'backgroundImage'],
    description:
      'The scrolling photo panels on the homepage. Each panel is one artist photo on top of one full-width background photo, with a heading. Use the "Order" number to arrange them.',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateCollection(['/'])],
    afterDelete: [revalidateCollectionAfterDelete(['/'])],
  },
  fields: [
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 1,
      admin: {
        description: 'Panel 1 shows first. Lower numbers come first.',
        step: 1,
        position: 'sidebar',
      },
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      admin: {
        description:
          'The large headline on the panel. Keep it to a handful of words — it is set in the big condensed display type.',
      },
    },
    {
      name: 'subheading',
      type: 'text',
      admin: {
        description: 'Optional smaller line above the heading.',
      },
    },
    {
      name: 'artistImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'The centred foreground photo. Portrait shots work best. This is the photo that scales up as the panel arrives.',
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'The full-width photo behind it, acting as the canvas. A wide landscape crowd or stage shot works best.',
      },
    },
    {
      name: 'accent',
      type: 'select',
      defaultValue: 'nexgen-red',
      options: [
        { label: 'NexGen Red', value: 'nexgen-red' },
        { label: 'Ember Red', value: 'ember-red' },
        { label: 'Chrome Silver', value: 'chrome-grey' },
      ],
      admin: {
        description: 'The colour of the block behind this panel’s heading.',
      },
    },
    {
      name: 'link',
      type: 'group',
      label: 'Optional button',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              admin: { width: '50%' },
            },
            {
              name: 'url',
              type: 'text',
              admin: {
                width: '50%',
                description: 'e.g. /events or a full https:// link.',
              },
            },
          ],
        },
      ],
    },
  ],
}
