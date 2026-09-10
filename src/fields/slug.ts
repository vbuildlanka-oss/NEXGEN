import type { Field, FieldHook } from 'payload'

/** Turn a human title into a URL-safe slug. */
export const formatSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Fills the slug from the source field when the editor has not typed one.
 *
 * Deliberately only auto-fills when the slug is empty: once a page is live its
 * URL should not silently change because someone fixed a typo in the title.
 */
const generateSlug =
  (sourceField: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string' && value.length > 0) {
      return formatSlug(value)
    }

    if (operation === 'create' || operation === 'update') {
      const source = data?.[sourceField]

      if (typeof source === 'string' && source.length > 0) {
        return formatSlug(source)
      }
    }

    return value
  }

/**
 * A slug field that auto-generates from `sourceField`, lives in the sidebar and
 * explains itself to a non-technical editor.
 */
export const slugField = (sourceField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description:
      'The web address for this page. Leave blank and it will be created from the title automatically. Avoid changing it once the page is live, or existing links will break.',
  },
  hooks: {
    beforeValidate: [generateSlug(sourceField)],
  },
})
