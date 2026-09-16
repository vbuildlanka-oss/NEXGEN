import type { CollectionConfig } from 'payload'

import { authenticated, isLoggedIn } from '../access'

/**
 * Admin users. Single role by design (see brief §8), so simply having an account
 * here grants full edit access.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Admin User',
    plural: 'Admin Users',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'updatedAt'],
    group: 'Settings',
    description:
      'People who can log in and edit the website. Invite a colleague by creating an account here and sending them the password you set.',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // stay logged in for a week
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
    admin: isLoggedIn,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Shown in the top-right of the admin panel.',
      },
    },
  ],
}
