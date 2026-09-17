/**
 * The wording the three listing pages ship with.
 *
 * One source of truth, read from two places that both need it:
 *
 *   • the globals, as each field's `defaultValue`, so the admin form opens showing
 *     what is already on the site rather than empty boxes;
 *   • the pages themselves, as the fallback for every field, so a cleared field, an
 *     unsaved global or a failed database read renders real copy instead of a blank
 *     heading.
 *
 * Those two needs are why this file exists rather than the strings living inline in
 * either place. Written twice they would drift, and the failure would be invisible:
 * the admin panel would show one sentence and the live page another, with nobody
 * able to say which was intended.
 *
 * It also means these globals need no seeding. Payload shows `defaultValue` for a
 * global that has never been saved, and the pages fall back to the same constants,
 * so the site reads correctly from the moment the tables exist — with no third copy
 * of every sentence in the seed script.
 */

export const EVENTS_PAGE_COPY = {
  intro: {
    eyebrow: 'Events',
    heading: 'Where to find us next',
    standfirst:
      'Every NexGen night, in one place — the ones ahead and the ones worth remembering.',
  },
  upcoming: {
    heading: 'Upcoming events',
    countLabel: 'scheduled',
  },
  upcomingEmpty: {
    heading: 'Nothing announced just yet',
    body: 'The next line-up is being locked in.',
    linkLabel: 'Ask us what’s coming',
    linkUrl: '/contact',
  },
  past: {
    eyebrow: 'The archive',
    heading: 'Past events',
    galleryLinkLabel: 'Photos from the floor',
  },
  seo: {
    title: 'Events',
    description: 'Upcoming NexGen events and the archive of everything that came before.',
  },
} as const

export const UPDATES_PAGE_COPY = {
  intro: {
    eyebrow: 'Updates',
    heading: 'Everything new',
    standfirst: 'Announcements, collaborations, milestones and recordings — as they happen.',
  },
  filters: {
    allLabel: 'Everything',
  },
  empty: {
    heading: 'Nothing here yet',
    body: 'The first announcements are on their way.',
  },
  outro: {
    heading: 'Never miss an announcement',
    body: 'Follow NexGen on social, or get in touch to join the mailing list.',
    linkLabel: 'Drop us a message',
    linkUrl: '/contact',
  },
  seo: {
    title: 'Updates',
    description:
      'News, artist and event announcements, collaborations, milestones and live recordings from NexGen.',
  },
} as const

export const GALLERY_PAGE_COPY = {
  intro: {
    eyebrow: 'Gallery',
    heading: 'Nights worth remembering',
  },
  groups: {
    untaggedHeading: 'More from the floor',
    eventLinkLabel: 'Event',
  },
  empty: {
    heading: 'The gallery is being put together',
    body: 'Photos from recent events are on their way.',
    linkLabel: 'See what’s coming up',
    linkUrl: '/events',
  },
  seo: {
    title: 'Gallery',
    description: 'Photographs from NexGen events — the artists, the rooms and the crowds.',
  },
} as const
