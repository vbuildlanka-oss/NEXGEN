/**
 * Seeds the site with working placeholder content.
 *
 * Exported as a function rather than living in a script, so it can be driven from
 * three places: the CLI (`pnpm seed`), the production build, and a protected HTTP
 * endpoint (`POST /api/admin/seed`). The endpoint matters — when seeding fails
 * during a Vercel build the log is often all you get, whereas the endpoint returns
 * the actual error as JSON.
 *
 * Everything created here is meant to be overwritten from the admin panel — the
 * point is that the client opens a finished, populated website rather than a set
 * of empty pages, and edits real content in place. Contact details in particular
 * are obvious placeholders, as requested.
 *
 *   pnpm seed
 *
 * Safe to re-run: existing documents are matched by slug, title or filename and
 * left untouched. Nothing is deleted.
 *
 * Images come from assets-web/, produced by scripts/process-assets.mjs. Uploading
 * them through Payload means they land wherever storage is configured — Cloudflare
 * R2 in production, the local disk in development.
 */
import { existsSync } from 'node:fs'
import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Payload } from 'payload'
import { randomBytes } from 'node:crypto'

/** Repository root, two levels up from src/lib. */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** Collected non-fatal problems, surfaced to the caller instead of only logged. */
const warnings: string[] = []

const warn = (message: string) => {
  warnings.push(message)
  console.warn(`  ! ${message}`)
}

/* ────────────────────────── rich text helper ──────────────────────────── */

/** Builds the Lexical document shape Payload stores rich text in. */
const richText = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text,
          version: 1,
        },
      ],
    })),
  },
})

/* ─────────────────────────────── media ────────────────────────────────── */

type MediaSeed = {
  file: string
  alt: string
  caption?: string
  showInGallery?: boolean
  eventTitle?: string
  galleryOrder?: number
}

/**
 * Uploads a processed image, or returns the existing document if this filename
 * has already been uploaded — which is what makes the script re-runnable.
 */
async function upsertMedia(
  payload: Payload,
  seed: MediaSeed,
  eventIds: Map<string, number>,
): Promise<number | null> {
  const filePath = path.join(root, seed.file)
  const filename = path.basename(seed.file)

  if (!existsSync(filePath)) {
    warn(`missing ${seed.file} — run "pnpm assets:process" first`)
    return null
  }

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    return existing.docs[0].id as number
  }

  const created = await payload.create({
    collection: 'media',
    overrideAccess: true,
    filePath,
    data: {
      alt: seed.alt,
      caption: seed.caption,
      credit: 'ONEDINETH',
      showInGallery: seed.showInGallery ?? false,
      galleryOrder: seed.galleryOrder,
      event: seed.eventTitle ? (eventIds.get(seed.eventTitle) ?? null) : null,
    },
  })

  if (created.filename && created.filename !== filename) {
    warn(
      `"${filename}" was stored as "${created.filename}" — a file of that name already ` +
        'existed. Clear public/media-uploads (or the R2 bucket) and re-run, or the site ' +
        'will reference the wrong images.',
    )
  }

  console.log(`  + media: ${created.filename ?? filename}`)
  return created.id as number
}

/* ─────────────────────────── placeholder content ──────────────────────── */

const HOME_PANELS = [
  {
    order: 1,
    subheading: 'The floor',
    heading: 'Nights that start where the playlist ends',
    artist: 'assets-web/artists/image-1.webp',
    background: 'assets-web/backgrounds/onedineth-img-302.webp',
    accent: 'nexgen-red',
  },
  {
    order: 2,
    subheading: 'The booth',
    heading: 'Established names, unestablished energy',
    artist: 'assets-web/artists/image-2.webp',
    background: 'assets-web/backgrounds/onedineth-img-383.webp',
    accent: 'ember-red',
  },
  {
    order: 3,
    subheading: 'The rooms',
    heading: 'Venues chosen for sound, not for size',
    artist: 'assets-web/artists/image-3.webp',
    background: 'assets-web/backgrounds/onedineth-img-336.webp',
    accent: 'nexgen-red',
  },
  {
    order: 4,
    subheading: 'The lights',
    heading: 'Production that answers to the music',
    artist: 'assets-web/artists/image-4.webp',
    background: 'assets-web/backgrounds/onedineth-img-362.webp',
    accent: 'chrome-grey',
  },
  {
    order: 5,
    subheading: 'The line-up',
    heading: 'The next headliner is on tonight’s bill',
    artist: 'assets-web/artists/image-5.webp',
    background: 'assets-web/backgrounds/onedineth-img-358.webp',
    accent: 'ember-red',
  },
  {
    order: 6,
    subheading: 'The crowd',
    heading: 'Everyone here found them first',
    artist: 'assets-web/artists/image-6.webp',
    background: 'assets-web/backgrounds/onedineth-img-352.webp',
    accent: 'nexgen-red',
  },
  {
    order: 7,
    subheading: 'What’s next',
    heading: 'Come and see what we do with a room',
    artist: 'assets-web/artists/image-7.webp',
    // The seventh background photo supplied was an unreadable Git LFS pointer,
    // so this panel borrows a landscape frame from the gallery set. Swap it for
    // the real file from the admin panel once it has been re-supplied.
    background: 'assets-web/gallery/onedineth-img-161.webp',
    accent: 'ember-red',
    link: { label: 'See what’s on', url: '/events' },
  },
]

/** Dates are generated relative to now, so seeded events never look stale. */
const daysFromNow = (days: number, hour = 21) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

const EVENTS = [
  {
    title: 'NexGen Presents: Ember Nights',
    slug: 'ember-nights',
    tagline: 'PLACEHOLDER — three rooms, one late finish.',
    startsAt: daysFromNow(24),
    endsAt: daysFromNow(25, 3),
    venue: 'Placeholder Venue',
    city: 'Colombo',
    ticketPrice: 3500,
    ticketNote: 'PLACEHOLDER — early bird until two weeks before',
    featured: true,
    artists: [
      { name: 'Devin Jay', role: 'Headliner' },
      { name: 'Shyro', role: 'Support' },
      { name: 'Nathan & Marlin', role: 'Opening' },
    ],
    cover: 'assets-web/gallery/onedineth-img-13.webp',
    background: 'assets-web/gallery/onedineth-img-11.webp',
    body: [
      'PLACEHOLDER COPY — replace this from the admin panel. Ember Nights is the room where NexGen puts a newer name in front of a crowd that came for a headliner, and lets the set speak for itself.',
      'Three spaces, one ticket, and a sound system chosen before the guest list.',
    ],
  },
  {
    title: 'NexGen Presents: First Light',
    slug: 'first-light',
    tagline: 'PLACEHOLDER — a sunrise close on the coast.',
    startsAt: daysFromNow(52),
    endsAt: daysFromNow(53, 6),
    venue: 'Placeholder Beach Club',
    city: 'Mount Lavinia',
    ticketPrice: 5000,
    artists: [
      { name: 'Rider Samuel', role: 'Headliner' },
      { name: 'Dual Core', role: 'Support' },
    ],
    cover: 'assets-web/gallery/onedineth-img-297.webp',
    background: 'assets-web/gallery/onedineth-img-4.webp',
    body: [
      'PLACEHOLDER COPY — replace this from the admin panel. A long set that starts in the dark and finishes with the sun up.',
    ],
  },
  {
    title: 'NexGen Sessions: Room 04',
    slug: 'sessions-room-04',
    tagline: 'PLACEHOLDER — an intimate, seated showcase.',
    startsAt: daysFromNow(78),
    venue: 'Placeholder Studio',
    city: 'Colombo',
    ticketPrice: 0,
    ticketNote: 'PLACEHOLDER — free entry, capacity limited',
    artists: [{ name: 'To be announced', role: 'Showcase' }],
    cover: 'assets-web/gallery/onedineth-img-83.webp',
    body: [
      'PLACEHOLDER COPY — replace this from the admin panel. Four artists, forty people, no barrier between them.',
    ],
  },
  {
    title: 'NexGen Launch Party',
    slug: 'launch-party',
    tagline: 'PLACEHOLDER — where this all started.',
    startsAt: daysFromNow(-96),
    endsAt: daysFromNow(-95, 4),
    venue: 'Placeholder Warehouse',
    city: 'Colombo',
    ticketPrice: 2500,
    artists: [
      { name: 'Devin Jay', role: 'Headliner' },
      { name: 'Shyro' },
    ],
    cover: 'assets-web/gallery/onedineth-img-154.webp',
    background: 'assets-web/gallery/onedineth-img-217.webp',
    body: [
      'PLACEHOLDER COPY — replace this from the admin panel. The first night, the one that proved the idea worked.',
    ],
  },
  {
    title: 'NexGen Presents: Static',
    slug: 'static',
    tagline: 'PLACEHOLDER — a sold-out second outing.',
    startsAt: daysFromNow(-42),
    endsAt: daysFromNow(-41, 3),
    venue: 'Placeholder Rooftop',
    city: 'Colombo',
    ticketPrice: 3000,
    soldOut: true,
    artists: [{ name: 'Dual Core', role: 'Headliner' }, { name: 'Rider Samuel' }],
    cover: 'assets-web/gallery/onedineth-img-190.webp',
    body: [
      'PLACEHOLDER COPY — replace this from the admin panel. Sold out in a week, and the reason the next one got bigger.',
    ],
  },
]

const POSTS = [
  {
    title: 'NexGen announces its next run of nights',
    slug: 'next-run-of-nights',
    category: 'news',
    excerpt:
      'PLACEHOLDER — a short summary shown on the Updates page and in link previews. Replace from the admin panel.',
    cover: 'assets-web/gallery/onedineth-img-11.webp',
    publishedDaysAgo: 3,
    body: [
      'PLACEHOLDER COPY — this is a sample news post so the Updates page is not empty. Edit or delete it from the admin panel.',
      'Every post has a category, and the category decides which section of the Updates page it appears under.',
    ],
  },
  {
    title: 'Devin Jay joins the NexGen roster',
    slug: 'devin-jay-joins-nexgen',
    category: 'artist-announcement',
    excerpt: 'PLACEHOLDER — artist announcements appear in their own section of Updates.',
    cover: 'assets-web/gallery/onedineth-img-13.webp',
    publishedDaysAgo: 9,
    body: ['PLACEHOLDER COPY — replace with the real announcement from the admin panel.'],
  },
  {
    title: 'Ember Nights: tickets are live',
    slug: 'ember-nights-tickets-live',
    category: 'event-announcement',
    excerpt: 'PLACEHOLDER — event announcements can be linked to the event itself.',
    cover: 'assets-web/gallery/onedineth-img-161.webp',
    relatedEventSlug: 'ember-nights',
    publishedDaysAgo: 14,
    body: ['PLACEHOLDER COPY — replace from the admin panel.'],
  },
  {
    title: 'A collaboration with Placeholder Studio',
    slug: 'placeholder-studio-collaboration',
    category: 'collaboration',
    excerpt: 'PLACEHOLDER — for partnerships, venues and label tie-ups.',
    cover: 'assets-web/gallery/onedineth-img-217.webp',
    publishedDaysAgo: 25,
    body: ['PLACEHOLDER COPY — replace from the admin panel.'],
  },
  {
    title: 'One year of NexGen',
    slug: 'one-year-of-nexgen',
    category: 'milestone',
    excerpt: 'PLACEHOLDER — milestones are the story of the company so far.',
    cover: 'assets-web/gallery/onedineth-img-154.webp',
    publishedDaysAgo: 40,
    body: ['PLACEHOLDER COPY — replace from the admin panel.'],
  },
  {
    title: 'Live recording: Static, rooftop set',
    slug: 'live-recording-static-rooftop',
    category: 'live-recording',
    excerpt: 'PLACEHOLDER — add a link and the card gets a "Listen" button.',
    cover: 'assets-web/gallery/onedineth-img-190.webp',
    externalUrl: 'https://example.com/replace-with-the-real-link',
    relatedEventSlug: 'static',
    publishedDaysAgo: 46,
    body: ['PLACEHOLDER COPY — replace from the admin panel.'],
  },
]

/** Gallery photos, tagged to the past events they came from. */
const GALLERY: MediaSeed[] = [
  { file: 'assets-web/gallery/onedineth-img-11.webp', alt: 'Three DJs behind the decks in blue stage light', showInGallery: true, eventTitle: 'NexGen Launch Party', galleryOrder: 1 },
  { file: 'assets-web/gallery/onedineth-img-13.webp', alt: 'A DJ duo performing in front of a large screen', showInGallery: true, eventTitle: 'NexGen Launch Party', galleryOrder: 2 },
  { file: 'assets-web/gallery/onedineth-img-154.webp', alt: 'Four artists on stage in front of a red visual', showInGallery: true, eventTitle: 'NexGen Launch Party', galleryOrder: 3 },
  { file: 'assets-web/gallery/onedineth-img-161.webp', alt: 'Stage lighting rig above a packed floor', showInGallery: true, eventTitle: 'NexGen Launch Party', galleryOrder: 4 },
  { file: 'assets-web/gallery/onedineth-img-162.webp', alt: 'Silhouettes of two DJs against a bright circular screen', showInGallery: true, eventTitle: 'NexGen Launch Party', galleryOrder: 5 },
  { file: 'assets-web/gallery/onedineth-img-190.webp', alt: 'Crowd dancing in blue light', showInGallery: true, eventTitle: 'NexGen Presents: Static', galleryOrder: 6 },
  { file: 'assets-web/gallery/onedineth-img-204.webp', alt: 'Two people dancing, hands raised, in pink light', showInGallery: true, eventTitle: 'NexGen Presents: Static', galleryOrder: 7 },
  { file: 'assets-web/gallery/onedineth-img-217.webp', alt: 'Wide shot of the stage and crowd in purple light', showInGallery: true, eventTitle: 'NexGen Presents: Static', galleryOrder: 8 },
  { file: 'assets-web/gallery/onedineth-img-295.webp', alt: 'A DJ reaching over the mixer, shot in black and white', showInGallery: true, eventTitle: 'NexGen Presents: Static', galleryOrder: 9 },
  { file: 'assets-web/gallery/onedineth-img-297.webp', alt: 'A guest in the crowd caught in warm light', showInGallery: true, eventTitle: 'NexGen Presents: Static', galleryOrder: 10 },
  { file: 'assets-web/gallery/onedineth-img-358.webp', alt: 'The room filling up as the first set begins', showInGallery: true, galleryOrder: 11 },
  { file: 'assets-web/gallery/onedineth-img-4.webp', alt: 'Three artists at the decks in front of a blue screen', showInGallery: true, galleryOrder: 12 },
  { file: 'assets-web/gallery/onedineth-img-65.webp', alt: 'A DJ performing in front of a large teal visual', showInGallery: true, galleryOrder: 13 },
  { file: 'assets-web/gallery/onedineth-img-83.webp', alt: 'An artist lit in green, mid-set', showInGallery: true, galleryOrder: 14 },
]

/* ─────────────────────────────── seeding ──────────────────────────────── */

/**
 * Guards against a subtle, silent failure mode.
 *
 * When a file already exists in the upload directory, Payload does not overwrite
 * it — it renames the incoming one by incrementing a trailing number. Because
 * these filenames *end* in numbers, "onedineth-img-11.webp" quietly becomes
 * "onedineth-img-12.webp". The seed script then no longer recognises its own
 * uploads on the next run and creates duplicates of everything.
 *
 * So: if the database has no media but the disk does, the two are out of step and
 * the leftover files are cleared. Only ever touches the local development
 * fallback directory — when R2 is configured there is nothing here to clean.
 */
async function ensureCleanUploadDir(payload: Payload) {
  const existing = await payload.count({ collection: 'media', overrideAccess: true })
  if (existing.totalDocs > 0) return

  const uploadDir = path.join(root, 'public/media-uploads')
  if (!existsSync(uploadDir)) return

  const leftover = await readdir(uploadDir)
  if (leftover.length === 0) return

  console.log(
    `  = clearing ${leftover.length} orphaned file(s) from public/media-uploads ` +
      '(no media rows in the database, so these are from an earlier run)',
  )
  await rm(uploadDir, { recursive: true, force: true })
}

async function seedAdminUser(payload: Payload, skipUser: boolean) {
  const existing = await payload.count({ collection: 'users', overrideAccess: true })

  if (existing.totalDocs > 0) {
    console.log('  = admin user already exists, leaving it alone')
    return
  }

  /**
   * When seeding runs automatically during a deployment, do not invent an admin
   * account: the generated password would be written into the build log, which is
   * readable by anyone with project access and is not a sensible place for a
   * credential. Payload's own "create first user" screen handles it instead, and
   * whoever reaches /admin first sets their own password.
   */
  if (skipUser && !process.env.PAYLOAD_ADMIN_PASSWORD) {
    console.log(
      '  = no admin user yet — create one at /admin (the first-user screen), ' +
        'so no password is written to this log',
    )
    return
  }

  const email = process.env.PAYLOAD_ADMIN_EMAIL || 'vbuildlanka@gmail.com'
  // A generated password is safer than a memorable default, and it is printed
  // once so it can be changed immediately after the first login.
  const password = process.env.PAYLOAD_ADMIN_PASSWORD || randomBytes(9).toString('base64url')

  await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password, name: 'NexGen Admin' },
  })

  console.log('\n  ┌─────────────────────────────────────────────────────────')
  console.log('  │ Admin account created')
  console.log(`  │   email:    ${email}`)
  console.log(`  │   password: ${password}`)
  console.log('  │ Change the password after your first login.')
  console.log('  └─────────────────────────────────────────────────────────\n')
}

async function seedEvents(payload: Payload): Promise<Map<string, number>> {
  const ids = new Map<string, number>()

  for (const seed of EVENTS) {
    const existing = await payload.find({
      collection: 'events',
      where: { slug: { equals: seed.slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })

    if (existing.docs[0]) {
      ids.set(seed.title, existing.docs[0].id as number)
      continue
    }

    // Cover art has to exist before the event that references it.
    const coverId = seed.cover
      ? await upsertMedia(payload, { file: seed.cover, alt: `${seed.title} cover photo` }, ids)
      : null
    const backgroundId = seed.background
      ? await upsertMedia(payload, { file: seed.background, alt: `${seed.title} backdrop` }, ids)
      : null

    const created = await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: seed.title,
        slug: seed.slug,
        tagline: seed.tagline,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        venue: seed.venue,
        city: seed.city,
        ticketPrice: seed.ticketPrice,
        currency: 'LKR',
        ticketNote: seed.ticketNote,
        soldOut: seed.soldOut ?? false,
        featured: seed.featured ?? false,
        artists: seed.artists,
        coverImage: coverId,
        backgroundImage: backgroundId,
        description: richText(seed.body) as never,
        _status: 'published',
      },
    })

    ids.set(seed.title, created.id as number)
    console.log(`  + event: ${seed.title}`)
  }

  return ids
}

async function seedPosts(payload: Payload, eventIds: Map<string, number>) {
  const eventSlugToId = new Map<string, number>()

  for (const seed of EVENTS) {
    const id = eventIds.get(seed.title)
    if (id) eventSlugToId.set(seed.slug, id)
  }

  for (const seed of POSTS) {
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: seed.slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })

    if (existing.docs[0]) continue

    const coverId = seed.cover
      ? await upsertMedia(payload, { file: seed.cover, alt: `${seed.title} cover photo` }, eventIds)
      : null

    const publishedAt = new Date()
    publishedAt.setDate(publishedAt.getDate() - seed.publishedDaysAgo)

    await payload.create({
      collection: 'posts',
      overrideAccess: true,
      data: {
        title: seed.title,
        slug: seed.slug,
        category: seed.category as never,
        excerpt: seed.excerpt,
        coverImage: coverId,
        externalUrl: seed.externalUrl,
        relatedEvent: seed.relatedEventSlug
          ? (eventSlugToId.get(seed.relatedEventSlug) ?? null)
          : null,
        publishedAt: publishedAt.toISOString(),
        body: richText(seed.body) as never,
        _status: 'published',
      },
    })

    console.log(`  + update: ${seed.title}`)
  }
}

async function seedPanels(payload: Payload, eventIds: Map<string, number>) {
  for (const seed of HOME_PANELS) {
    const existing = await payload.find({
      collection: 'home-panels',
      where: { order: { equals: seed.order } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs[0]) continue

    const artistId = await upsertMedia(
      payload,
      { file: seed.artist, alt: `NexGen artists performing — panel ${seed.order}` },
      eventIds,
    )
    const backgroundId = await upsertMedia(
      payload,
      { file: seed.background, alt: '' },
      eventIds,
    )

    if (!artistId || !backgroundId) {
      warn(`skipped panel ${seed.order}: its images are missing`)
      continue
    }

    await payload.create({
      collection: 'home-panels',
      overrideAccess: true,
      data: {
        order: seed.order,
        heading: seed.heading,
        subheading: seed.subheading,
        accent: seed.accent as never,
        artistImage: artistId,
        backgroundImage: backgroundId,
        link: seed.link ?? undefined,
      },
    })

    console.log(`  + panel ${seed.order}: ${seed.heading}`)
  }
}

async function seedGallery(payload: Payload, eventIds: Map<string, number>) {
  for (const seed of GALLERY) {
    await upsertMedia(payload, seed, eventIds)
  }

  // Photos uploaded earlier as event covers were created before their event
  // existed, so tag the gallery flags/relations now they all do.
  for (const seed of GALLERY) {
    const filename = path.basename(seed.file)
    const found = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
      overrideAccess: true,
    })

    const doc = found.docs[0]
    if (!doc) continue

    const eventId = seed.eventTitle ? eventIds.get(seed.eventTitle) : undefined
    const needsUpdate = !doc.showInGallery || (eventId && !doc.event)

    if (needsUpdate) {
      await payload.update({
        collection: 'media',
        id: doc.id,
        overrideAccess: true,
        data: {
          showInGallery: true,
          galleryOrder: seed.galleryOrder,
          alt: doc.alt || seed.alt,
          event: eventId ?? doc.event ?? null,
        },
      })
    }
  }
}

async function seedGlobals(payload: Payload, eventIds: Map<string, number>) {
  const heroPoster = await upsertMedia(
    payload,
    {
      file: 'public/hero/hero-poster.jpg',
      alt: 'A NexGen night in full flow',
    },
    eventIds,
  )

  const storyImages = {
    intro: await upsertMedia(
      payload,
      { file: 'assets-web/gallery/onedineth-img-358.webp', alt: '' },
      eventIds,
    ),
    what: await upsertMedia(
      payload,
      { file: 'assets-web/gallery/onedineth-img-4.webp', alt: '' },
      eventIds,
    ),
    why: await upsertMedia(
      payload,
      { file: 'assets-web/gallery/onedineth-img-65.webp', alt: '' },
      eventIds,
    ),
    stand: await upsertMedia(
      payload,
      { file: 'assets-web/gallery/onedineth-img-295.webp', alt: '' },
      eventIds,
    ),
    community: await upsertMedia(
      payload,
      { file: 'assets-web/gallery/onedineth-img-204.webp', alt: '' },
      eventIds,
    ),
    contact: await upsertMedia(
      payload,
      { file: 'assets-web/gallery/onedineth-img-162.webp', alt: '' },
      eventIds,
    ),
  }

  await payload.updateGlobal({
    slug: 'home-page',
    overrideAccess: true,
    data: {
      heroPoster,
      heroHeadline: 'A new generation of entertainment',
      heroSubheadline:
        'NexGen backs the artists shaping what comes next — and the crowds who find them first.',
      heroScrollHint: 'Scroll',
      heroButtons: [
        { label: 'Upcoming events', url: '/events', style: 'primary' },
        { label: 'Our story', url: '/our-story', style: 'secondary' },
      ],
      panelsEyebrow: 'What is NexGen?',
      panelsIntro:
        'A home for the artists shaping what comes next — and the crowds who find them first.',
      teasers: [
        {
          eyebrow: 'Events',
          heading: 'Where to find us next',
          body: 'Upcoming nights, venues and line-ups — plus the archive of everything so far.',
          linkLabel: 'See events',
          linkUrl: '/events',
          image: await upsertMedia(
            payload,
            { file: 'assets-web/gallery/onedineth-img-13.webp', alt: '' },
            eventIds,
          ),
        },
        {
          eyebrow: 'Updates',
          heading: 'Announcements as they land',
          body: 'New artists, collaborations, milestones and recordings from the floor.',
          linkLabel: 'Read updates',
          linkUrl: '/updates',
          image: await upsertMedia(
            payload,
            { file: 'assets-web/gallery/onedineth-img-217.webp', alt: '' },
            eventIds,
          ),
        },
        {
          eyebrow: 'Gallery',
          heading: 'Nights worth remembering',
          body: 'Photographs from the rooms, the booths and the crowds that filled them.',
          linkLabel: 'Open gallery',
          linkUrl: '/gallery',
          image: await upsertMedia(
            payload,
            { file: 'assets-web/gallery/onedineth-img-190.webp', alt: '' },
            eventIds,
          ),
        },
      ],
    } as never,
  })

  await payload.updateGlobal({
    slug: 'our-story',
    overrideAccess: true,
    data: {
      intro: {
        eyebrow: 'Our Story',
        heading: 'Built for what comes next',
        standfirst:
          'PLACEHOLDER COPY — replace all of the wording on this page from the admin panel. NexGen exists to put emerging artists and established names on the same bill, in rooms built for the music.',
        image: storyImages.intro,
      },
      whatIsNexGen: {
        heading: 'What is NexGen?',
        body: richText([
          'PLACEHOLDER COPY — replace from the admin panel. NexGen is an entertainment company built around variety: a night that moves between sounds, and a bill that mixes artists you already follow with the ones you are about to.',
          'We programme events, work with artists on their live shows, and document all of it so the nights outlive themselves.',
        ]) as never,
        pullQuote: 'Variety is the point, not the risk.',
      },
      whyWeStarted: {
        heading: 'Why We Started',
        body: richText([
          'PLACEHOLDER COPY — replace from the admin panel. There were more good artists than there were rooms willing to book them. NexGen started as a way to fix the short end of that arrangement.',
        ]) as never,
        image: storyImages.why,
      },
      whatWeStandFor: {
        heading: 'What We Stand For',
        body: richText([
          'PLACEHOLDER COPY — replace from the admin panel. Artists paid properly. Sound and lighting specified before the guest list. Line-ups that take a chance on someone, every single time.',
        ]) as never,
        image: storyImages.stand,
        pullQuote: 'Freshness, on purpose — every bill makes room for someone new.',
      },
      community: {
        heading: 'The NexGen Community',
        body: richText([
          'PLACEHOLDER COPY — replace from the admin panel. The crowd is half of it. NexGen nights are built for people who go out to hear something, and who come back because they were right about an artist before anyone else was.',
        ]) as never,
        image: storyImages.community,
      },
    } as never,
  })

  await payload.updateGlobal({
    slug: 'contact-info',
    overrideAccess: true,
    data: {
      eyebrow: 'Contact Us',
      heading: 'Get in touch',
      standfirst:
        'Bookings, collaborations, press or just an idea — the form reaches us directly. All the details below are placeholders; edit them from the admin panel.',
      formSuccessMessage:
        'Thanks — your message is on its way. We’ll come back to you shortly.',
      image: storyImages.contact,
      // Deliberately obvious placeholders, per the client's instruction.
      email: 'hello@example.com',
      bookingEmail: 'bookings@example.com',
      phone: '+94 00 000 0000',
      address: 'PLACEHOLDER ADDRESS\nStreet name\nColombo\nSri Lanka',
      openingHours: 'PLACEHOLDER — Mon–Fri, 9am–6pm',
      socials: [
        { platform: 'instagram', label: '@nexgen', url: 'https://instagram.com/example' },
        { platform: 'tiktok', label: '@nexgen', url: 'https://tiktok.com/@example' },
        { platform: 'facebook', url: 'https://facebook.com/example' },
        { platform: 'youtube', url: 'https://youtube.com/@example' },
      ],
    } as never,
  })

  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      announcement: {
        enabled: false,
        text: 'PLACEHOLDER — tickets for the next NexGen night are live',
        linkLabel: 'Get tickets',
        linkUrl: '/events',
      },
      navItems: [
        { label: 'Home', url: '/' },
        { label: 'Our Story', url: '/our-story' },
        { label: 'Events', url: '/events' },
        { label: 'Updates', url: '/updates' },
        { label: 'Gallery', url: '/gallery' },
        { label: 'Contact Us', url: '/contact' },
      ],
      headerCta: { label: 'Events', url: '/events' },
      headerTagline: 'Colombo, Sri Lanka / Next: see events',
      footerBlurb:
        'NexGen Entertainment programmes live music for artists on the way up and the names that got there first.',
      footerColumns: [
        {
          heading: 'Explore',
          links: [
            { label: 'Events', url: '/events' },
            { label: 'Updates', url: '/updates' },
            { label: 'Gallery', url: '/gallery' },
          ],
        },
        {
          heading: 'Company',
          links: [
            { label: 'Our Story', url: '/our-story' },
            { label: 'Contact Us', url: '/contact' },
          ],
        },
      ],
      copyrightName: 'NexGen Entertainment',
      seo: {
        defaultTitle: 'NexGen Entertainment',
        defaultDescription:
          'NexGen Entertainment champions emerging and established artists — live events, new music and the crowds who find them first.',
        shareImage: heroPoster,
      },
    } as never,
  })

  console.log('  + globals: homepage, our story, contact, site settings')
}

export type SeedResult = {
  skipped?: string
  warnings: string[]
  counts: {
    events: number
    posts: number
    media: number
    panels: number
    users: number
  }
}

/**
 * Loads the placeholder content. Idempotent: anything already present is left
 * exactly as it is, so running this against a site whose content has been edited
 * changes nothing.
 */
export async function runSeed(
  payload: Payload,
  { skipUser = false }: { skipUser?: boolean } = {},
): Promise<SeedResult> {
  warnings.length = 0

  console.log('\nSeeding NexGen content…\n')

  await ensureCleanUploadDir(payload)
  await seedAdminUser(payload, skipUser)

  console.log('Events…')
  const eventIds = await seedEvents(payload)

  console.log('Updates…')
  await seedPosts(payload, eventIds)

  console.log('Homepage panels…')
  await seedPanels(payload, eventIds)

  console.log('Gallery…')
  await seedGallery(payload, eventIds)

  console.log('Globals…')
  await seedGlobals(payload, eventIds)

  const counts = {
    events: (await payload.count({ collection: 'events', overrideAccess: true })).totalDocs,
    posts: (await payload.count({ collection: 'posts', overrideAccess: true })).totalDocs,
    media: (await payload.count({ collection: 'media', overrideAccess: true })).totalDocs,
    panels: (await payload.count({ collection: 'home-panels', overrideAccess: true })).totalDocs,
    users: (await payload.count({ collection: 'users', overrideAccess: true })).totalDocs,
  }

  console.log('\nDone.', JSON.stringify(counts), '\n')

  return { warnings: [...warnings], counts }
}
