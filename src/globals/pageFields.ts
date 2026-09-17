import type { Field } from 'payload'

/**
 * The field groups the three listing pages — Events, Updates, Gallery — have in
 * common.
 *
 * Kept here rather than repeated in each global for the same reason `storySection`
 * exists in OurStory: if a field is added to a page header it should appear on
 * every page header at once, and the three should stay recognisably the same thing
 * to edit. The alternative is three files that drift apart.
 *
 * Every `defaultValue` is the wording that used to be hardcoded in the page
 * component, so the admin form opens showing what is already on the site rather
 * than a set of empty boxes the client has to guess at.
 */

type IntroDefaults = {
  eyebrow: string
  heading: string
  standfirst?: string
  /** What the automatic photo is, so the client knows what leaving it empty does. */
  imageFallback: string
}

/**
 * The header every interior page opens with — eyebrow, oversized heading, opening
 * paragraph, and the photograph behind it.
 */
export function pageIntro({
  eyebrow,
  heading,
  standfirst,
  imageFallback,
}: IntroDefaults): Field {
  return {
    name: 'intro',
    type: 'group',
    label: 'Page header',
    admin: {
      description: 'The band at the top of the page, over a full-width photograph.',
    },
    fields: [
      {
        name: 'eyebrow',
        type: 'text',
        defaultValue: eyebrow,
        admin: {
          description: 'The small line above the heading.',
        },
      },
      {
        name: 'heading',
        type: 'text',
        defaultValue: heading,
        admin: {
          description: 'The large heading. Keep it short — it is set very big.',
        },
      },
      {
        name: 'standfirst',
        type: 'textarea',
        ...(standfirst ? { defaultValue: standfirst } : {}),
        admin: {
          description: 'The opening paragraph, set larger than body text. Optional.',
        },
      },
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        admin: {
          description: `Optional. Leave empty and the page uses ${imageFallback}.`,
        },
      },
    ],
  }
}

type SeoDefaults = {
  title: string
  description: string
}

/**
 * What search engines and link previews show for this page.
 *
 * The title is joined to the site name by the template in the root layout, so
 * "Events" becomes "Events · NexGen Entertainment" — the client writes the short
 * half only.
 */
export function pageSeo({ title, description }: SeoDefaults): Field {
  return {
    name: 'seo',
    type: 'group',
    label: 'Search & sharing',
    fields: [
      {
        name: 'title',
        type: 'text',
        defaultValue: title,
        admin: {
          description:
            'Shown in the browser tab and in search results. The site name is added automatically.',
        },
      },
      {
        name: 'description',
        type: 'textarea',
        defaultValue: description,
        admin: {
          description: 'The sentence under the title in search results. Aim for 1–2 lines.',
        },
      },
    ],
  }
}

type CalloutDefaults = {
  heading: string
  body?: string
  linkLabel?: string
  linkUrl?: string
}

/**
 * A heading, a paragraph and an optional link.
 *
 * Used for the "nothing here yet" panels and for the closing band on Updates. The
 * link is a label/URL pair rather than rich text with an embedded anchor, matching
 * how the homepage teasers and hero buttons already work — it is far easier to
 * explain and impossible to get half-right.
 */
export function callout(
  name: string,
  label: string,
  { heading, body, linkLabel, linkUrl }: CalloutDefaults,
  description?: string,
): Field {
  return {
    name,
    type: 'group',
    label,
    ...(description ? { admin: { description } } : {}),
    fields: [
      {
        name: 'heading',
        type: 'text',
        defaultValue: heading,
      },
      {
        name: 'body',
        type: 'textarea',
        ...(body ? { defaultValue: body } : {}),
      },
      {
        name: 'linkLabel',
        type: 'text',
        ...(linkLabel ? { defaultValue: linkLabel } : {}),
        admin: {
          description: 'Optional link shown after the paragraph.',
        },
      },
      {
        name: 'linkUrl',
        type: 'text',
        ...(linkUrl ? { defaultValue: linkUrl } : {}),
        admin: {
          description: 'Where that link goes, for example /contact.',
          condition: (_data, siblingData) => Boolean(siblingData?.linkLabel),
        },
      },
    ],
  }
}
