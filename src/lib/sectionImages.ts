/**
 * Which photograph belongs to which part of the site.
 *
 * Every section gets its own image — no photograph appears twice — chosen by
 * looking at all thirty and matching subject to context rather than filling slots
 * in order. Landscape frames get landscape photographs so nothing important is
 * cropped away; the portraits that do sit in wide frames carry a focal point so
 * the crop keeps faces in shot.
 *
 * The homepage panels are deliberately absent. Those seven pairs were signed off
 * and are not touched by any of this.
 *
 * `focalY` is the vertical point the crop protects, as a percentage from the top.
 * The default of 50 centres the crop, which decapitates a standing subject in a
 * wide frame; most of these need something nearer 30.
 */

export type SectionImage = {
  /** Filename inside assets-web/site. */
  file: string
  alt: string
  /** 0–100, from the top. Lower keeps heads in frame when cropped to a wide box. */
  focalY?: number
}

const image = (file: string, alt: string, focalY?: number): SectionImage => ({
  file: `assets-web/site/${file}`,
  alt,
  focalY,
})

/* ─────────────────────────────── events ────────────────────────────────── */
/**
 * Covers sit in a 4:3 frame and backdrops run full width, so both take
 * landscape photographs. Each event gets a visually distinct pairing — magenta,
 * teal, monochrome, brand, green — so the listing does not read as one long
 * blur of the same night.
 */
export const EVENT_IMAGES: Record<
  string,
  { cover: SectionImage; background?: SectionImage }
> = {
  'ember-nights': {
    cover: image('onedineth-img-167.webp', 'DJ mid-set under deep magenta light'),
    background: image('onedineth-img-186.webp', 'Crowd filling a lantern-lit courtyard in pink light'),
  },
  'first-light': {
    cover: image('onedineth-img-286.webp', 'DJ facing a packed floor in teal light'),
    background: image('onedineth-img-278.webp', 'Silhouetted crowd against a huge circular screen'),
  },
  // No backdrop, as originally: two of the thirty could not be used here (see the
  // note at the foot of this file) and this page reads perfectly well on its cover
  // photograph alone, which is how it was signed off.
  'sessions-room-04': {
    cover: image('onedineth-img-345.webp', 'Guests together on a low couch between sets'),
  },
  'launch-party': {
    cover: image('onedineth-img-133.webp', 'The crew on the steps outside before doors'),
    background: image('onedineth-img-229.webp', 'Group of friends together on the floor, lit green'),
  },
  static: {
    cover: image('onedineth-img-372.webp', 'Two guests lit green, arms around each other'),
    background: image('onedineth-img-371.webp', 'Two DJs working the decks in blue light'),
  },
}

/* ─────────────────────────────── updates ───────────────────────────────── */
/**
 * Post covers are 3:2, so the portraits here all carry a focal point. Each one
 * matches its category: an artist portrait for the artist announcement, a
 * detail shot for the live recording, and so on.
 */
export const POST_IMAGES: Record<string, SectionImage> = {
  'next-run-of-nights': image(
    'onedineth-img-58.webp',
    'DJ reaching across the mixer mid-transition',
    30,
  ),
  'devin-jay-joins-nexgen': image(
    'onedineth-img-141.webp',
    'Two artists in headphones against a neon backdrop',
    28,
  ),
  'ember-nights-tickets-live': image(
    'onedineth-img-213.webp',
    'DJ under hanging lanterns in warm pink light',
    30,
  ),
  'placeholder-studio-collaboration': image(
    'onedineth-img-385.webp',
    'Two engineers over the decks, in black and white',
    32,
  ),
  'one-year-of-nexgen': image(
    'onedineth-img-357.webp',
    'NexGen banners lit magenta above the floor',
    40,
  ),
  'live-recording-static-rooftop': image(
    'onedineth-img-294.webp',
    'Hands on the mixer, the artist reflected in the screen',
    35,
  ),
}

/* ────────────────────────────── our story ──────────────────────────────── */
/**
 * The one page where the photograph carries the argument, so these are the most
 * deliberate choices of the set: the crew under their own sign for how it
 * started, the "underground will live forever" banner for what they stand for,
 * and faces at the front for the community.
 */
export const STORY_IMAGES = {
  intro: image('onedineth-img-306.webp', 'The NexGen crew together beneath their sign', 40),
  whatIsNexGen: image('onedineth-img-34.webp', 'Artist locked into a set behind the decks', 28),
  whyWeStarted: image('onedineth-img-353.webp', 'A banner reading “underground will live forever”', 45),
  whatWeStandFor: image('onedineth-img-88.webp', 'Guest standing alone in front of the main screen', 30),
  community: image('onedineth-img-188.webp', 'The crowd from the booth, arms raised behind', 40),
} as const

/* ──────────────────────────── everything else ──────────────────────────── */
export const CONTACT_IMAGE = image(
  'onedineth-img-40.webp',
  'Guests talking at the bar early in the night',
  35,
)

/** The three blocks at the foot of the homepage. */
export const TEASER_IMAGES = {
  events: image('onedineth-img-61.webp', 'Two DJs sharing the booth mid-set', 30),
  updates: image('onedineth-img-418.webp', 'Artist in a visor lit from behind', 30),
  gallery: image('onedineth-img-205.webp', 'Two guests dancing, hands up, in magenta light', 28),
} as const

/** Shown when a link to the site is shared on social media. */
export const SHARE_IMAGE = image(
  'onedineth-img-346.webp',
  'Two guests greeting each other on the floor',
  30,
)

/**
 * The remainder go to the Gallery, which is the one place extra photographs are
 * always welcome. Listed explicitly so it stays obvious that every one of the
 * thirty has a home and none is used twice.
 */
export const GALLERY_ADDITIONS: SectionImage[] = [
  image('onedineth-img-222.webp', 'Green beams over a crowd watching the screen'),
  image('onedineth-img-23.webp', 'The far end of the room under hanging lanterns'),
  image('onedineth-img-289.webp', 'Three friends behind the decks, in black and white'),
]

/**
 * Two of the thirty are deliberately not assigned anywhere.
 *
 * `onedineth-img-336.webp` and `onedineth-img-383.webp` process to the same
 * filenames as two photographs already used as homepage panel backdrops, and a
 * media document is unique by filename — so referencing them here would not add a
 * new image, it would silently point a section at a panel's photograph. Worse, on a
 * fresh install the order of upload decides which version wins, which would change
 * the homepage panels. Those seven pairs are signed off and must not move, so these
 * two are left out and the affected slots were re-cut from the rest of the set.
 *
 * They stay in assets-web/site: harmless there, and available from the admin panel
 * if the client ever wants them somewhere.
 */
export const UNASSIGNED = ['onedineth-img-336.webp', 'onedineth-img-383.webp']

/** Every filename this module claims, for the duplicate check in the tests. */
export function allSectionImageFiles(): string[] {
  const files = [
    ...Object.values(EVENT_IMAGES).flatMap((entry) =>
      entry.background ? [entry.cover.file, entry.background.file] : [entry.cover.file],
    ),
    ...Object.values(POST_IMAGES).map((entry) => entry.file),
    ...Object.values(STORY_IMAGES).map((entry) => entry.file),
    CONTACT_IMAGE.file,
    ...Object.values(TEASER_IMAGES).map((entry) => entry.file),
    SHARE_IMAGE.file,
    ...GALLERY_ADDITIONS.map((entry) => entry.file),
  ]

  return files
}
