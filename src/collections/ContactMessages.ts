import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

/**
 * Contact form submissions.
 *
 * Every submission is stored here as well as emailed via Resend, so a bounced
 * or rate-limited email never means a lost enquiry. Created server-side only —
 * the public cannot read or write this collection directly; the form posts to
 * /api/contact, which writes with elevated access.
 */
export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: {
    singular: 'Contact Message',
    plural: 'Contact Messages',
  },
  defaultSort: '-createdAt',
  admin: {
    group: 'Inbox',
    useAsTitle: 'subject',
    defaultColumns: ['name', 'email', 'subject', 'handled', 'createdAt'],
    description:
      'Messages sent through the Contact Us form. These are also emailed to you — this is the backup copy, so nothing is ever lost.',
  },
  access: {
    read: authenticated,
    // Created by the /api/contact route handler using Payload's local API,
    // which bypasses access control. Nothing else may create rows.
    create: () => false,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'email', type: 'email', required: true, admin: { width: '50%' } },
      ],
    },
    {
      name: 'subject',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'handled',
      type: 'checkbox',
      label: 'Replied / dealt with',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'emailDelivered',
      type: 'checkbox',
      label: 'Email notification sent',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Unticked means Resend was unavailable — read the message here instead.',
      },
    },
  ],
}
