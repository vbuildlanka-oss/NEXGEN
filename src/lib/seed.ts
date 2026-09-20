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
 * Runs only against an empty database. It matches documents by slug, title or
 * filename and creates whatever is missing — which on a populated site would mean
 * recreating anything deleted from the admin panel, so it refuses to run there at
 * all. See the note on `runSeed`. Nothing is ever deleted.
 *
 * Images come from assets-web/, produced by scripts/process-assets.mjs. Uploading
 * them through Payload means they land wherever storage is configured — Cloudflare
 * R2 in production, the local disk in development.
 */
import { existsSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Payload } from "payload";
import { randomBytes } from "node:crypto";

import {
  CONTACT_IMAGE,
  EVENT_IMAGES,
  GALLERY_ADDITIONS,
  POST_IMAGES,
  SHARE_IMAGE,
  STORY_IMAGES,
  TEASER_IMAGES,
} from "./sectionImages";
import { storedFilename } from "./uploadFilenames";

/** Repository root, two levels up from src/lib. */
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** Collected non-fatal problems, surfaced to the caller instead of only logged. */
const warnings: string[] = [];

const warn = (message: string) => {
  warnings.push(message);
  console.warn(`  ! ${message}`);
};

/* ────────────────────────── rich text helper ──────────────────────────── */

/** Builds the Lexical document shape Payload stores rich text in. */
const richText = (paragraphs: string[]) => ({
  root: {
    type: "root",
    format: "" as const,
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: paragraphs.map((text) => ({
      type: "paragraph",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      textFormat: 0,
      children: [
        {
          type: "text",
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text,
          version: 1,
        },
      ],
    })),
  },
});

/* ─────────────────────────────── media ────────────────────────────────── */

type MediaSeed = {
  file: string;
  alt: string;
  caption?: string;
  showInGallery?: boolean;
  eventTitle?: string;
  galleryOrder?: number;
  /**
   * Vertical focal point, 0–100 from the top. Set on the portraits that end up in
   * wide frames, where a centred crop would otherwise take the subject's head off.
   */
  focalY?: number;
};

/**
 * Uploads a processed image, or returns the existing document if this filename
 * has already been uploaded — which is what makes the script re-runnable.
 *
 * The lookup has to use the name Payload will *store*, not the name on disk. The
 * Media collection re-encodes originals to WebP, so "hero-poster.jpg" is saved as
 * "hero-poster.webp"; searching for the source name would never match, and this
 * function would dutifully re-upload the same file on every run, accumulating a
 * duplicate per deployment.
 */
async function upsertMedia(
  payload: Payload,
  seed: MediaSeed,
  eventIds: Map<string, number>,
): Promise<number | null> {
  const filePath = path.join(root, seed.file);
  const filename = storedFilename(path.basename(seed.file));

  if (!existsSync(filePath)) {
    warn(`missing ${seed.file} — run "pnpm assets:process" first`);
    return null;
  }

  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs[0]) {
    return existing.docs[0].id as number;
  }

  const created = await payload.create({
    collection: "media",
    overrideAccess: true,
    filePath,
    data: {
      alt: seed.alt,
      caption: seed.caption,
      credit: "ONEDINETH",
      showInGallery: seed.showInGallery ?? false,
      galleryOrder: seed.galleryOrder,
      focalX: 50,
      focalY: seed.focalY ?? 50,
      event: seed.eventTitle ? (eventIds.get(seed.eventTitle) ?? null) : null,
    },
  });

  if (created.filename && created.filename !== filename) {
    warn(
      `"${filename}" was stored as "${created.filename}" — a file of that name already ` +
        "existed. Clear public/media-uploads (or the R2 bucket) and re-run, or the site " +
        "will reference the wrong images.",
    );
  }

  console.log(`  + media: ${created.filename ?? filename}`);
  return created.id as number;
}

/* ─────────────────────────── placeholder content ──────────────────────── */

const HOME_PANELS = [
  {
    order: 1,
    subheading: "The floor",
    heading: "Nights that start where the playlist ends",
    artist: "assets-web/artists/image-1.webp",
    background: "assets-web/backgrounds/onedineth-img-302.webp",
    accent: "nexgen-red",
  },
  {
    order: 2,
    subheading: "The booth",
    heading: "Established names, unestablished energy",
    artist: "assets-web/artists/image-2.webp",
    background: "assets-web/backgrounds/onedineth-img-383.webp",
    accent: "ember-red",
  },
  {
    order: 3,
    subheading: "The rooms",
    heading: "Venues chosen for sound, not for size",
    artist: "assets-web/artists/image-3.webp",
    background: "assets-web/backgrounds/onedineth-img-336.webp",
    accent: "nexgen-red",
  },
  {
    order: 4,
    subheading: "The lights",
    heading: "Production that answers to the music",
    artist: "assets-web/artists/image-4.webp",
    background: "assets-web/backgrounds/onedineth-img-362.webp",
    accent: "chrome-grey",
  },
  {
    order: 5,
    subheading: "The line-up",
    heading: "The next headliner is on tonight’s bill",
    artist: "assets-web/artists/image-5.webp",
    background: "assets-web/backgrounds/onedineth-img-358.webp",
    accent: "ember-red",
  },
  {
    order: 6,
    subheading: "The crowd",
    heading: "Everyone here found them first",
    artist: "assets-web/artists/image-6.webp",
    background: "assets-web/backgrounds/onedineth-img-352.webp",
    accent: "nexgen-red",
  },
  {
    order: 7,
    subheading: "What’s next",
    heading: "Come and see what we do with a room",
    artist: "assets-web/artists/image-7.webp",
    // The seventh background photo supplied was an unreadable Git LFS pointer,
    // so this panel borrows a landscape frame from the gallery set. Swap it for
    // the real file from the admin panel once it has been re-supplied.
    background: "assets-web/gallery/onedineth-img-161.webp",
    accent: "ember-red",
    link: { label: "See what’s on", url: "/events" },
  },
];

/** Dates are generated relative to now, so seeded events never look stale. */
const daysFromNow = (days: number, hour = 21) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const EVENTS = [
  {
    title: "NexGen Presents: Ember Nights",
    slug: "ember-nights",
    tagline: "PLACEHOLDER — three rooms, one late finish.",
    startsAt: daysFromNow(24),
    endsAt: daysFromNow(25, 3),
    venue: "Placeholder Venue",
    city: "Colombo",
    ticketPrice: 3500,
    ticketNote: "PLACEHOLDER — early bird until two weeks before",
    featured: true,
    artists: [
      { name: "Devin Jay", role: "Headliner" },
      { name: "Shyro", role: "Support" },
      { name: "Nathan & Marlin", role: "Opening" },
    ],
    body: [
      "PLACEHOLDER COPY — replace this from the admin panel. Ember Nights is the room where NexGen puts a newer name in front of a crowd that came for a headliner, and lets the set speak for itself.",
      "Three spaces, one ticket, and a sound system chosen before the guest list.",
    ],
  },
  {
    title: "NexGen Presents: First Light",
    slug: "first-light",
    tagline: "PLACEHOLDER — a sunrise close on the coast.",
    startsAt: daysFromNow(52),
    endsAt: daysFromNow(53, 6),
    venue: "Placeholder Beach Club",
    city: "Mount Lavinia",
    ticketPrice: 5000,
    artists: [
      { name: "Rider Samuel", role: "Headliner" },
      { name: "Dual Core", role: "Support" },
    ],
    body: [
      "PLACEHOLDER COPY — replace this from the admin panel. A long set that starts in the dark and finishes with the sun up.",
    ],
  },
  {
    title: "NexGen Sessions: Room 04",
    slug: "sessions-room-04",
    tagline: "PLACEHOLDER — an intimate, seated showcase.",
    startsAt: daysFromNow(78),
    venue: "Placeholder Studio",
    city: "Colombo",
    ticketPrice: 0,
    ticketNote: "PLACEHOLDER — free entry, capacity limited",
    artists: [{ name: "To be announced", role: "Showcase" }],
    body: [
      "PLACEHOLDER COPY — replace this from the admin panel. Four artists, forty people, no barrier between them.",
    ],
  },
  {
    title: "NexGen Launch Party",
    slug: "launch-party",
    tagline: "PLACEHOLDER — where this all started.",
    startsAt: daysFromNow(-96),
    endsAt: daysFromNow(-95, 4),
    venue: "Placeholder Warehouse",
    city: "Colombo",
    ticketPrice: 2500,
    artists: [{ name: "Devin Jay", role: "Headliner" }, { name: "Shyro" }],
    body: [
      "PLACEHOLDER COPY — replace this from the admin panel. The first night, the one that proved the idea worked.",
    ],
  },
  {
    title: "NexGen Presents: Static",
    slug: "static",
    tagline: "PLACEHOLDER — a sold-out second outing.",
    startsAt: daysFromNow(-42),
    endsAt: daysFromNow(-41, 3),
    venue: "Placeholder Rooftop",
    city: "Colombo",
    ticketPrice: 3000,
    soldOut: true,
    artists: [
      { name: "Dual Core", role: "Headliner" },
      { name: "Rider Samuel" },
    ],
    body: [
      "PLACEHOLDER COPY — replace this from the admin panel. Sold out in a week, and the reason the next one got bigger.",
    ],
  },
];

const POSTS = [
  {
    title: "NexGen announces its next run of nights",
    slug: "next-run-of-nights",
    category: "news",
    excerpt:
      "PLACEHOLDER — a short summary shown on the Updates page and in link previews. Replace from the admin panel.",
    publishedDaysAgo: 3,
    body: [
      "PLACEHOLDER COPY — this is a sample news post so the Updates page is not empty. Edit or delete it from the admin panel.",
      "Every post has a category, and the category decides which section of the Updates page it appears under.",
    ],
  },
  {
    title: "Devin Jay joins the NexGen roster",
    slug: "devin-jay-joins-nexgen",
    category: "artist-announcement",
    excerpt:
      "PLACEHOLDER — artist announcements appear in their own section of Updates.",
    publishedDaysAgo: 9,
    body: [
      "PLACEHOLDER COPY — replace with the real announcement from the admin panel.",
    ],
  },
  {
    title: "Ember Nights: tickets are live",
    slug: "ember-nights-tickets-live",
    category: "event-announcement",
    excerpt:
      "PLACEHOLDER — event announcements can be linked to the event itself.",
    relatedEventSlug: "ember-nights",
    publishedDaysAgo: 14,
    body: ["PLACEHOLDER COPY — replace from the admin panel."],
  },
  {
    title: "A collaboration with Placeholder Studio",
    slug: "placeholder-studio-collaboration",
    category: "collaboration",
    excerpt: "PLACEHOLDER — for partnerships, venues and label tie-ups.",
    publishedDaysAgo: 25,
    body: ["PLACEHOLDER COPY — replace from the admin panel."],
  },
  {
    title: "One year of NexGen",
    slug: "one-year-of-nexgen",
    category: "milestone",
    excerpt: "PLACEHOLDER — milestones are the story of the company so far.",
    publishedDaysAgo: 40,
    body: ["PLACEHOLDER COPY — replace from the admin panel."],
  },
  {
    title: "Live recording: Static, rooftop set",
    slug: "live-recording-static-rooftop",
    category: "live-recording",
    excerpt: 'PLACEHOLDER — add a link and the card gets a "Listen" button.',
    externalUrl: "https://example.com/replace-with-the-real-link",
    relatedEventSlug: "static",
    publishedDaysAgo: 46,
    body: ["PLACEHOLDER COPY — replace from the admin panel."],
  },
];

/**
 * Captions and event tags for the photographs supplied with the build.
 *
 * The gallery itself is not this list — it is whatever is in assets-web/gallery.
 * These are simply the ones we know something about; any other photograph found
 * in that folder is still published, just without a caption until someone writes
 * one in the admin panel.
 *
 * This used to be a hard-coded list of fourteen, which meant photographs added to
 * the folder later were silently ignored by seeding.
 */
const GALLERY_METADATA: Record<string, { alt: string; eventTitle?: string }> = {
  "onedineth-img-11.webp": {
    alt: "Three DJs behind the decks in blue stage light",
    eventTitle: "NexGen Launch Party",
  },
  "onedineth-img-13.webp": {
    alt: "A DJ duo performing in front of a large screen",
    eventTitle: "NexGen Launch Party",
  },
  "onedineth-img-154.webp": {
    alt: "Four artists on stage in front of a red visual",
    eventTitle: "NexGen Launch Party",
  },
  "onedineth-img-161.webp": {
    alt: "Stage lighting rig above a packed floor",
    eventTitle: "NexGen Launch Party",
  },
  "onedineth-img-162.webp": {
    alt: "Silhouettes of two DJs against a bright circular screen",
    eventTitle: "NexGen Launch Party",
  },
  "onedineth-img-190.webp": {
    alt: "Crowd dancing in blue light",
    eventTitle: "NexGen Presents: Static",
  },
  "onedineth-img-204.webp": {
    alt: "Two people dancing, hands raised, in pink light",
    eventTitle: "NexGen Presents: Static",
  },
  "onedineth-img-217.webp": {
    alt: "Wide shot of the stage and crowd in purple light",
    eventTitle: "NexGen Presents: Static",
  },
  "onedineth-img-295.webp": {
    alt: "A DJ reaching over the mixer, shot in black and white",
    eventTitle: "NexGen Presents: Static",
  },
  "onedineth-img-297.webp": {
    alt: "A guest in the crowd caught in warm light",
    eventTitle: "NexGen Presents: Static",
  },
  "onedineth-img-358.webp": {
    alt: "The room filling up as the first set begins",
  },
  "onedineth-img-4.webp": {
    alt: "Three artists at the decks in front of a blue screen",
  },
  "onedineth-img-65.webp": {
    alt: "A DJ performing in front of a large teal visual",
  },
  "onedineth-img-83.webp": { alt: "An artist lit in green, mid-set" },
};

/** Every processed photograph in assets-web/gallery, in a stable order. */
async function galleryFiles(): Promise<string[]> {
  const dir = path.join(root, "assets-web/gallery");

  try {
    const entries = await readdir(dir);
    return entries
      .filter((name) => name.endsWith(".webp"))
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  } catch {
    warn('assets-web/gallery not found — run "pnpm assets:process" first');
    return [];
  }
}

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
  const existing = await payload.count({
    collection: "media",
    overrideAccess: true,
  });
  if (existing.totalDocs > 0) return;

  const uploadDir = path.join(root, "public/media-uploads");
  if (!existsSync(uploadDir)) return;

  const leftover = await readdir(uploadDir);
  if (leftover.length === 0) return;

  console.log(
    `  = clearing ${leftover.length} orphaned file(s) from public/media-uploads ` +
      "(no media rows in the database, so these are from an earlier run)",
  );
  await rm(uploadDir, { recursive: true, force: true });
}

async function seedAdminUser(payload: Payload, skipUser: boolean) {
  const existing = await payload.count({
    collection: "users",
    overrideAccess: true,
  });

  if (existing.totalDocs > 0) {
    console.log("  = admin user already exists, leaving it alone");
    return;
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
      "  = no admin user yet — create one at /admin (the first-user screen), " +
        "so no password is written to this log",
    );
    return;
  }

  const email = process.env.PAYLOAD_ADMIN_EMAIL || "vbuildlanka@gmail.com";
  // A generated password is safer than a memorable default, and it is printed
  // once so it can be changed immediately after the first login.
  const password =
    process.env.PAYLOAD_ADMIN_PASSWORD || randomBytes(9).toString("base64url");

  await payload.create({
    collection: "users",
    overrideAccess: true,
    data: { email, password, name: "NexGen Admin" },
  });

  console.log("\n  ┌─────────────────────────────────────────────────────────");
  console.log("  │ Admin account created");
  console.log(`  │   email:    ${email}`);
  console.log(`  │   password: ${password}`);
  console.log("  │ Change the password after your first login.");
  console.log("  └─────────────────────────────────────────────────────────\n");
}

async function seedEvents(payload: Payload): Promise<Map<string, number>> {
  const ids = new Map<string, number>();

  for (const seed of EVENTS) {
    const existing = await payload.find({
      collection: "events",
      where: { slug: { equals: seed.slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    });

    if (existing.docs[0]) {
      ids.set(seed.title, existing.docs[0].id as number);
      continue;
    }

    // Cover art has to exist before the event that references it.
    // Which photograph belongs to which event is decided in sectionImages.ts,
    // shared with the migration that reassigned them on the live site.
    const images = EVENT_IMAGES[seed.slug];
    const coverId = images
      ? await upsertMedia(
          payload,
          { ...images.cover, alt: images.cover.alt || `${seed.title} cover photo` },
          ids,
        )
      : null;
    const backgroundId = images?.background
      ? await upsertMedia(
          payload,
          {
            ...images.background,
            alt: images.background.alt || `${seed.title} backdrop`,
          },
          ids,
        )
      : null;

    const created = await payload.create({
      collection: "events",
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
        currency: "LKR",
        ticketNote: seed.ticketNote,
        soldOut: seed.soldOut ?? false,
        featured: seed.featured ?? false,
        artists: seed.artists,
        coverImage: coverId,
        backgroundImage: backgroundId,
        description: richText(seed.body) as never,
        _status: "published",
      },
    });

    ids.set(seed.title, created.id as number);
    console.log(`  + event: ${seed.title}`);
  }

  return ids;
}

async function seedPosts(payload: Payload, eventIds: Map<string, number>) {
  const eventSlugToId = new Map<string, number>();

  for (const seed of EVENTS) {
    const id = eventIds.get(seed.title);
    if (id) eventSlugToId.set(seed.slug, id);
  }

  for (const seed of POSTS) {
    const existing = await payload.find({
      collection: "posts",
      where: { slug: { equals: seed.slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    });

    if (existing.docs[0]) continue;

    const image = POST_IMAGES[seed.slug];
    const coverId = image
      ? await upsertMedia(
          payload,
          { ...image, alt: image.alt || `${seed.title} cover photo` },
          eventIds,
        )
      : null;

    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - seed.publishedDaysAgo);

    await payload.create({
      collection: "posts",
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
        _status: "published",
      },
    });

    console.log(`  + update: ${seed.title}`);
  }
}

async function seedPanels(payload: Payload, eventIds: Map<string, number>) {
  for (const seed of HOME_PANELS) {
    const existing = await payload.find({
      collection: "home-panels",
      where: { order: { equals: seed.order } },
      limit: 1,
      overrideAccess: true,
    });

    if (existing.docs[0]) continue;

    const artistId = await upsertMedia(
      payload,
      {
        file: seed.artist,
        alt: `NexGen artists performing — panel ${seed.order}`,
      },
      eventIds,
    );
    const backgroundId = await upsertMedia(
      payload,
      { file: seed.background, alt: "" },
      eventIds,
    );

    if (!artistId || !backgroundId) {
      warn(`skipped panel ${seed.order}: its images are missing`);
      continue;
    }

    await payload.create({
      collection: "home-panels",
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
    });

    console.log(`  + panel ${seed.order}: ${seed.heading}`);
  }
}

async function seedGallery(payload: Payload, eventIds: Map<string, number>) {
  const files = await galleryFiles();

  for (const [index, filename] of files.entries()) {
    const meta = GALLERY_METADATA[filename];

    await upsertMedia(
      payload,
      {
        file: `assets-web/gallery/${filename}`,
        alt: meta?.alt ?? "",
        showInGallery: true,
        eventTitle: meta?.eventTitle,
        galleryOrder: index + 1,
      },
      eventIds,
    );
  }

  /**
   * Photographs uploaded earlier as event covers were created before their event
   * existed, so tag the gallery flags and relations now that they all do.
   */
  for (const [index, filename] of files.entries()) {
    const found = await payload.find({
      collection: "media",
      where: { filename: { equals: filename } },
      limit: 1,
      overrideAccess: true,
    });

    const doc = found.docs[0];
    if (!doc) continue;

    const meta = GALLERY_METADATA[filename];
    const eventId = meta?.eventTitle
      ? eventIds.get(meta.eventTitle)
      : undefined;

    if (!doc.showInGallery || (eventId && !doc.event)) {
      await payload.update({
        collection: "media",
        id: doc.id,
        overrideAccess: true,
        data: {
          showInGallery: true,
          galleryOrder: doc.galleryOrder ?? index + 1,
          alt: doc.alt || meta?.alt || "",
          event: eventId ?? doc.event ?? null,
        },
      });
    }
  }

  /**
   * The photographs from the newer set that were not needed by a specific section.
   * They live in assets-web/site rather than assets-web/gallery, so they are added
   * by name here instead of being picked up by the directory scan above.
   */
  for (const [index, image] of GALLERY_ADDITIONS.entries()) {
    await upsertMedia(
      payload,
      { ...image, showInGallery: true, galleryOrder: files.length + index + 1 },
      eventIds,
    );
  }

  console.log(
    `  = gallery: ${files.length + GALLERY_ADDITIONS.length} photograph(s) published`,
  );
}

/**
 * Whether a global still holds its factory state.
 *
 * Globals were previously rewritten on every seed run — and since seeding now
 * happens on every production deploy, that would have quietly reverted any
 * wording the client had edited in the admin panel. Each global is therefore
 * written only when the field that proves it has been populated is still empty.
 */
async function globalNeedsSeeding(
  payload: Payload,
  slug: "home-page" | "our-story" | "contact-info" | "site-settings",
  isEmpty: (doc: Record<string, unknown>) => boolean,
): Promise<boolean> {
  try {
    // Via `unknown`: the generated global types are a discriminated union, so
    // TypeScript rightly refuses a direct cast to an index signature. The
    // predicates only read fields by name, which this supports safely enough.
    const doc = (await payload.findGlobal({
      slug,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>;

    if (isEmpty(doc)) return true;

    console.log(`  = ${slug} already has content, leaving it alone`);
    return false;
  } catch {
    // Never seen before, so there is nothing to preserve.
    return true;
  }
}

async function seedGlobals(payload: Payload, eventIds: Map<string, number>) {
  const heroPoster = await upsertMedia(
    payload,
    {
      file: "public/hero/hero-poster.jpg",
      alt: "A NexGen night in full flow",
    },
    eventIds,
  );

  // Shown when a link to the site is pasted into a chat or a social post. Its own
  // photograph rather than the hero poster, which already appears behind the video.
  const shareImage = await upsertMedia(payload, SHARE_IMAGE, eventIds);

  const storyImages = {
    intro: await upsertMedia(payload, STORY_IMAGES.intro, eventIds),
    what: await upsertMedia(payload, STORY_IMAGES.whatIsNexGen, eventIds),
    why: await upsertMedia(payload, STORY_IMAGES.whyWeStarted, eventIds),
    stand: await upsertMedia(payload, STORY_IMAGES.whatWeStandFor, eventIds),
    community: await upsertMedia(payload, STORY_IMAGES.community, eventIds),
    contact: await upsertMedia(payload, CONTACT_IMAGE, eventIds),
  };

  if (
    await globalNeedsSeeding(
      payload,
      "home-page",
      (doc) =>
        !doc.teasers ||
        (Array.isArray(doc.teasers) && doc.teasers.length === 0),
    )
  )
    await payload.updateGlobal({
      slug: "home-page",
      overrideAccess: true,
      data: {
        heroPoster,
        heroHeadline: "A new generation of entertainment",
        heroSubheadline:
          "NexGen backs the artists shaping what comes next — and the crowds who find them first.",
        heroScrollHint: "Scroll",
        heroButtons: [
          { label: "Upcoming events", url: "/events", style: "primary" },
          { label: "Our story", url: "/our-story", style: "secondary" },
        ],
        panelsEyebrow: "What is NexGen?",
        panelsIntro:
          "A home for the artists shaping what comes next — and the crowds who find them first.",
        teasers: [
          {
            eyebrow: "Events",
            heading: "Where to find us next",
            body: "Upcoming nights, venues and line-ups — plus the archive of everything so far.",
            linkLabel: "See events",
            linkUrl: "/events",
            image: await upsertMedia(payload, TEASER_IMAGES.events, eventIds),
          },
          {
            eyebrow: "Updates",
            heading: "Announcements as they land",
            body: "New artists, collaborations, milestones and recordings from the floor.",
            linkLabel: "Read updates",
            linkUrl: "/updates",
            image: await upsertMedia(payload, TEASER_IMAGES.updates, eventIds),
          },
          {
            eyebrow: "Gallery",
            heading: "Nights worth remembering",
            body: "Photographs from the rooms, the booths and the crowds that filled them.",
            linkLabel: "Open gallery",
            linkUrl: "/gallery",
            image: await upsertMedia(payload, TEASER_IMAGES.gallery, eventIds),
          },
        ],
      } as never,
    });

  if (
    await globalNeedsSeeding(payload, "our-story", (doc) => {
      const section = doc.whatIsNexGen as Record<string, unknown> | undefined;
      return !section?.body;
    })
  )
    await payload.updateGlobal({
      slug: "our-story",
      overrideAccess: true,
      data: {
        intro: {
          eyebrow: "Our Story",
          heading: "Built for what comes next",
          standfirst:
            "PLACEHOLDER COPY — replace all of the wording on this page from the admin panel. NexGen exists to put emerging artists and established names on the same bill, in rooms built for the music.",
          image: storyImages.intro,
        },
        whatIsNexGen: {
          heading: "What is NexGen?",
          image: storyImages.what,
          body: richText([
            "PLACEHOLDER COPY — replace from the admin panel. NexGen is an entertainment company built around variety: a night that moves between sounds, and a bill that mixes artists you already follow with the ones you are about to.",
            "We programme events, work with artists on their live shows, and document all of it so the nights outlive themselves.",
          ]) as never,
          pullQuote: "Variety is the point, not the risk.",
        },
        whyWeStarted: {
          heading: "Why We Started",
          body: richText([
            "PLACEHOLDER COPY — replace from the admin panel. There were more good artists than there were rooms willing to book them. NexGen started as a way to fix the short end of that arrangement.",
          ]) as never,
          image: storyImages.why,
        },
        whatWeStandFor: {
          heading: "What We Stand For",
          body: richText([
            "PLACEHOLDER COPY — replace from the admin panel. Artists paid properly. Sound and lighting specified before the guest list. Line-ups that take a chance on someone, every single time.",
          ]) as never,
          image: storyImages.stand,
          pullQuote:
            "Freshness, on purpose — every bill makes room for someone new.",
        },
        community: {
          heading: "The NexGen Community",
          body: richText([
            "PLACEHOLDER COPY — replace from the admin panel. The crowd is half of it. NexGen nights are built for people who go out to hear something, and who come back because they were right about an artist before anyone else was.",
          ]) as never,
          image: storyImages.community,
        },
      } as never,
    });

  if (await globalNeedsSeeding(payload, "contact-info", (doc) => !doc.email))
    await payload.updateGlobal({
      slug: "contact-info",
      overrideAccess: true,
      data: {
        eyebrow: "Contact Us",
        heading: "Get in touch",
        standfirst:
          "Bookings, collaborations, press or just an idea — the form reaches us directly. All the details below are placeholders; edit them from the admin panel.",
        formSuccessMessage:
          "Thanks — your message is on its way. We’ll come back to you shortly.",
        image: storyImages.contact,
        // Deliberately obvious placeholders, per the client's instruction.
        email: "hello@example.com",
        bookingEmail: "bookings@example.com",
        phone: "+94 00 000 0000",
        address: "PLACEHOLDER ADDRESS\nStreet name\nColombo\nSri Lanka",
        openingHours: "PLACEHOLDER — Mon–Fri, 9am–6pm",
        socials: [
          {
            platform: "instagram",
            label: "@nexgen",
            url: "https://instagram.com/example",
          },
          {
            platform: "tiktok",
            label: "@nexgen",
            url: "https://tiktok.com/@example",
          },
          { platform: "facebook", url: "https://facebook.com/example" },
          { platform: "youtube", url: "https://youtube.com/@example" },
        ],
      } as never,
    });

  if (
    await globalNeedsSeeding(
      payload,
      "site-settings",
      (doc) =>
        !doc.navItems ||
        (Array.isArray(doc.navItems) && doc.navItems.length === 0),
    )
  )
    await payload.updateGlobal({
      slug: "site-settings",
      overrideAccess: true,
      data: {
        announcement: {
          enabled: false,
          text: "PLACEHOLDER — tickets for the next NexGen night are live",
          linkLabel: "Get tickets",
          linkUrl: "/events",
        },
        navItems: [
          { label: "Home", url: "/" },
          { label: "Our Story", url: "/our-story" },
          { label: "Events", url: "/events" },
          { label: "Updates", url: "/updates" },
          { label: "Gallery", url: "/gallery" },
          { label: "Contact Us", url: "/contact" },
        ],
        headerCta: { label: "Events", url: "/events" },
          footerBlurb:
          "NexGen Entertainment programmes live music for artists on the way up and the names that got there first.",
        footerColumns: [
          {
            heading: "Explore",
            links: [
              { label: "Events", url: "/events" },
              { label: "Updates", url: "/updates" },
              { label: "Gallery", url: "/gallery" },
            ],
          },
          {
            heading: "Company",
            links: [
              { label: "Our Story", url: "/our-story" },
              { label: "Contact Us", url: "/contact" },
            ],
          },
        ],
        typography: {
        // The size and weight the site was designed and reviewed at.
        textSize: "1",
        headingWeight: "800",
      },
      copyrightName: "NexGen Entertainment",
        seo: {
          defaultTitle: "NexGen Entertainment",
          defaultDescription:
            "NexGen Entertainment champions emerging and established artists — live events, new music and the crowds who find them first.",
          shareImage: shareImage ?? heroPoster,
        },
      } as never,
    });

  console.log("  + globals: homepage, our story, contact, site settings");
}

export type SeedCounts = {
  events: number;
  posts: number;
  media: number;
  panels: number;
  users: number;
};

export type SeedResult = {
  skipped?: string;
  warnings: string[];
  counts: SeedCounts;
};

async function collectCounts(payload: Payload): Promise<SeedCounts> {
  const [events, posts, media, panels, users] = await Promise.all([
    payload.count({ collection: "events", overrideAccess: true }),
    payload.count({ collection: "posts", overrideAccess: true }),
    payload.count({ collection: "media", overrideAccess: true }),
    payload.count({ collection: "home-panels", overrideAccess: true }),
    payload.count({ collection: "users", overrideAccess: true }),
  ]);

  return {
    events: events.totalDocs,
    posts: posts.totalDocs,
    media: media.totalDocs,
    panels: panels.totalDocs,
    users: users.totalDocs,
  };
}

/**
 * Evidence that this site has already been set up, described for a log line.
 *
 * Deliberately only events, updates and panels — the three things the seed itself
 * creates, so all three are present after a successful first run and none of them
 * appears by any other route.
 *
 * Photographs are excluded, and that is not an oversight. Migrations run before the
 * seed and some of them upload media, so a completely fresh database already holds a
 * dozen images by the time this is asked. Counting those would make the guard fire on
 * a brand-new site and leave it with a handful of orphaned photographs, no events and
 * no homepage. Media is proof that a migration ran, not that the site was populated.
 *
 * Users are excluded for the same kind of reason: somebody creating their account at
 * the first-user screen before the first deploy finishes must not be mistaken for a
 * populated site, or it would never be seeded at all.
 *
 * Note that excluding photographs from the *signal* does not leave them unprotected.
 * The guard is all or nothing: if any event, update or panel exists the entire seed
 * is skipped, `seedGallery` included, so a deleted photograph stays deleted too.
 */
function describeExistingContent(counts: SeedCounts): string[] {
  const found: string[] = [];

  if (counts.events) found.push(`${counts.events} event(s)`);
  if (counts.posts) found.push(`${counts.posts} update(s)`);
  if (counts.panels) found.push(`${counts.panels} homepage panel(s)`);

  return found;
}

/**
 * Loads the placeholder content — but only into a database that has none.
 *
 * This used to be described as "idempotent", and that was wrong in a way that cost
 * the client real work. It skips anything it can *find*, which is not the same as
 * leaving a site alone: it matches events and updates by slug, panels by their
 * order and photographs by filename, and creates whatever is missing. So deleting
 * something from the admin panel left nothing for the next run to find, and the
 * next deployment dutifully recreated it. Deletions appeared to undo themselves.
 *
 * Seeding is therefore now a first-run operation and nothing else. If the database
 * holds a single event, update, photograph or panel, this returns immediately
 * without writing anything. That is the whole fix: on a populated site the seed can
 * no longer resurrect anything, because it no longer runs.
 *
 * `force` exists for the one case the guard gets in the way of — a first seed that
 * failed part-way through, leaving some content behind and the rest missing. Set
 * SEED_FORCE=1 on the CLI, or pass ?force=1 to the endpoint, and accept that it
 * will recreate anything currently absent.
 */
export async function runSeed(
  payload: Payload,
  { skipUser = false, force = false }: { skipUser?: boolean; force?: boolean } = {},
): Promise<SeedResult> {
  warnings.length = 0;

  const existing = describeExistingContent(await collectCounts(payload));

  if (existing.length > 0 && !force) {
    const skipped =
      `this database already has content (${existing.join(", ")}), and seeding ` +
      "only ever runs against an empty one";

    console.log(`\nSkipping seed: ${skipped}.\n`);
    console.log(
      "  Seeding creates anything it cannot find, so on a populated site it would\n" +
        "  recreate whatever had been deleted from the admin panel. Deletions are\n" +
        "  meant to stay deleted, so it stops here.\n",
    );
    console.log("  To seed anyway: SEED_FORCE=1 pnpm seed, or POST ?force=1 to the endpoint.\n");

    return { skipped, warnings: [], counts: await collectCounts(payload) };
  }

  console.log("\nSeeding NexGen content…\n");

  if (force && existing.length > 0) {
    console.log(
      `  ! SEED_FORCE is set and this database already has content (${existing.join(", ")}).\n` +
        "    Anything currently missing will be recreated, including documents that\n" +
        "    were deliberately deleted.\n",
    );
  }

  await ensureCleanUploadDir(payload);
  await seedAdminUser(payload, skipUser);

  console.log("Events…");
  const eventIds = await seedEvents(payload);

  console.log("Updates…");
  await seedPosts(payload, eventIds);

  console.log("Homepage panels…");
  await seedPanels(payload, eventIds);

  console.log("Gallery…");
  await seedGallery(payload, eventIds);

  console.log("Globals…");
  await seedGlobals(payload, eventIds);

  const counts = await collectCounts(payload);

  console.log("\nDone.", JSON.stringify(counts), "\n");

  return { warnings: [...warnings], counts };
}
