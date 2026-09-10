import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

/**
 * Reserved for a future Stripe checkout (brief §2 and §8).
 *
 * Nothing in this build writes to this collection and no payment gateway is
 * wired up. It exists now so that adding checkout later is purely additive: a
 * Stripe webhook route creates an `orders` row and its `tickets` rows, and no
 * migration of the events schema is required.
 *
 * Deliberately not public-readable — order data is private.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'Order',
    plural: 'Orders',
  },
  defaultSort: '-createdAt',
  admin: {
    group: 'Ticketing (not yet active)',
    useAsTitle: 'email',
    defaultColumns: ['email', 'event', 'quantity', 'amountTotal', 'status', 'createdAt'],
    description:
      'Empty by design. On-site ticket sales are not part of this build; this is the table a future checkout would write into.',
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'buyerName',
      type: 'text',
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
    },
    {
      name: 'amountTotal',
      type: 'number',
      label: 'Amount total (in minor units, e.g. cents)',
      min: 0,
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'LKR',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'paymentProvider',
      type: 'text',
      admin: {
        description: 'e.g. "stripe". Left blank until a gateway is connected.',
      },
    },
    {
      name: 'paymentReference',
      type: 'text',
      index: true,
      admin: {
        description: 'The provider’s session or payment intent id, for reconciliation.',
      },
    },
  ],
}
