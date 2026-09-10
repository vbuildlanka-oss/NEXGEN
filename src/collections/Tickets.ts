import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

/**
 * Individual tickets belonging to an order. Reserved for future use — see the
 * note on the `orders` collection.
 */
export const Tickets: CollectionConfig = {
  slug: 'tickets',
  labels: {
    singular: 'Ticket',
    plural: 'Tickets',
  },
  admin: {
    group: 'Ticketing (not yet active)',
    useAsTitle: 'code',
    defaultColumns: ['code', 'event', 'order', 'status'],
    description:
      'Empty by design. One row per admitted person, created by a future checkout flow.',
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The unique code that would be scanned on the door.',
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'holderName',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'valid',
      options: [
        { label: 'Valid', value: 'valid' },
        { label: 'Checked in', value: 'checked-in' },
        { label: 'Void', value: 'void' },
      ],
    },
  ],
}
