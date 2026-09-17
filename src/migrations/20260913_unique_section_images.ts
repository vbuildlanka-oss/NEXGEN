import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Payload } from 'payload'

import {
  CONTACT_IMAGE,
  EVENT_IMAGES,
  GALLERY_ADDITIONS,
  POST_IMAGES,
  SHARE_IMAGE,
  STORY_IMAGES,
  TEASER_IMAGES,
  type SectionImage,
} from '../lib/sectionImages'

/**
 * Gives every section of the site its own photograph.
 *
 * Until now the interior pages drew from the same fourteen gallery images as the
 * gallery itself, so the same frame turned up as an event cover, a post cover and
 * a chapter illustration on Our Story. Thirty new photographs were supplied; this
 * distributes them so that no image appears in two places. Which photograph goes
 * where is decided in src/lib/sectionImages.ts, shared with the seed script.
 *
 * Why a migration and not just an edit to the seed script: seeding is deliberately
 * idempotent — it skips any event, post or global that already exists, so the
 * client's own wording survives every deployment. That protection also means the
 * seed can never *change* an existing site, and production already has all of this
 * content. A migration is the only thing that runs against a populated database.
 *
 * The seven homepage panels are untouched, on instruction. They are not read or
 * written anywhere below.
 *
 * Nothing here throws. A migration that fails takes the whole deployment with it,
 * and a photograph in the wrong slot is not worth a site that will not deploy — so
 * every step is attempted independently and problems are logged and stepped over.
 */

/** Repository root, two levels up from src/migrations. */
const root = path.resolve(process.cwd())

const problems: string[] = []

const note = (message: string) => {
  problems.push(message)
  console.warn(`  ! ${message}`)
}

/**
 * Uploads one of the new photographs, or returns the id of the existing document
 * if it has already been uploaded. Matching on filename is what makes this safe to
 * re-run and safe to run after a seed that already introduced the same file.
 */
async function ensureMedia(
  payload: Payload,
  image: SectionImage,
  extra: { showInGallery?: boolean; galleryOrder?: number } = {},
): Promise<number | null> {
  const filename = path.basename(image.file)

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs[0]) return existing.docs[0].id as number

  const filePath = path.join(root, image.file)

  if (!existsSync(filePath)) {
    note(`${image.file} is missing — run "pnpm assets:process" and deploy again`)
    return null
  }

  const created = await payload.create({
    collection: 'media',
    overrideAccess: true,
    filePath,
    data: {
      alt: image.alt,
      credit: 'ONEDINETH',
      showInGallery: extra.showInGallery ?? false,
      galleryOrder: extra.galleryOrder,
      /**
       * The focal point is the whole reason a portrait photograph survives being
       * placed in a wide frame: it tells the crop which part to protect. Left at
       * the default of dead centre, a standing subject loses their head.
       */
      focalX: 50,
      focalY: image.focalY ?? 50,
    },
  })

  if (created.filename && created.filename !== filename) {
    note(
      `"${filename}" was stored as "${created.filename}" — a file of that name already ` +
        'existed in storage, so this photograph may appear in the wrong place',
    )
  }

  console.log(`  + media: ${created.filename ?? filename}`)
  return created.id as number
}

/** Reads a global with no relations resolved, so ids can be written straight back. */
async function readGlobal(
  payload: Payload,
  slug: 'home-page' | 'our-story' | 'contact-info' | 'site-settings',
): Promise<Record<string, unknown> | null> {
  try {
    return (await payload.findGlobal({
      slug,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>
  } catch {
    return null
  }
}

const group = (doc: Record<string, unknown>, key: string): Record<string, unknown> =>
  (doc[key] as Record<string, unknown> | undefined) ?? {}

/* ────────────────────────────── events ─────────────────────────────────── */

async function reassignEvents(payload: Payload) {
  for (const [slug, images] of Object.entries(EVENT_IMAGES)) {
    const found = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })

    const event = found.docs[0]
    if (!event) {
      note(`no event with the slug "${slug}" — skipped`)
      continue
    }

    const coverImage = await ensureMedia(payload, images.cover)
    // Not every event gets a backdrop — one is deliberately left on its cover alone.
    const backgroundImage = images.background
      ? await ensureMedia(payload, images.background)
      : null

    if (!coverImage && !backgroundImage) continue

    await payload.update({
      collection: 'events',
      id: event.id,
      overrideAccess: true,
      data: {
        ...(coverImage ? { coverImage } : {}),
        ...(backgroundImage ? { backgroundImage } : {}),
      },
    })

    console.log(`  = event: ${slug}`)
  }
}

/* ────────────────────────────── updates ────────────────────────────────── */

async function reassignPosts(payload: Payload) {
  for (const [slug, image] of Object.entries(POST_IMAGES)) {
    const found = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })

    const post = found.docs[0]
    if (!post) {
      note(`no update with the slug "${slug}" — skipped`)
      continue
    }

    const coverImage = await ensureMedia(payload, image)
    if (!coverImage) continue

    await payload.update({
      collection: 'posts',
      id: post.id,
      overrideAccess: true,
      data: { coverImage },
    })

    console.log(`  = update: ${slug}`)
  }
}

/* ───────────────────────────── our story ───────────────────────────────── */

async function reassignStory(payload: Payload) {
  const doc = await readGlobal(payload, 'our-story')
  if (!doc) {
    note('the Our Story page has no content yet — skipped')
    return
  }

  const ids = {
    intro: await ensureMedia(payload, STORY_IMAGES.intro),
    whatIsNexGen: await ensureMedia(payload, STORY_IMAGES.whatIsNexGen),
    whyWeStarted: await ensureMedia(payload, STORY_IMAGES.whyWeStarted),
    whatWeStandFor: await ensureMedia(payload, STORY_IMAGES.whatWeStandFor),
    community: await ensureMedia(payload, STORY_IMAGES.community),
  }

  /**
   * Each section is spread back in whole. Sending only `{ image }` for a group
   * would drop the heading, standfirst and body alongside it — the wording is the
   * client's, and this migration is only entitled to change the photograph.
   */
  await payload.updateGlobal({
    slug: 'our-story',
    overrideAccess: true,
    data: {
      intro: { ...group(doc, 'intro'), ...(ids.intro ? { image: ids.intro } : {}) },
      whatIsNexGen: {
        ...group(doc, 'whatIsNexGen'),
        ...(ids.whatIsNexGen ? { image: ids.whatIsNexGen } : {}),
      },
      whyWeStarted: {
        ...group(doc, 'whyWeStarted'),
        ...(ids.whyWeStarted ? { image: ids.whyWeStarted } : {}),
      },
      whatWeStandFor: {
        ...group(doc, 'whatWeStandFor'),
        ...(ids.whatWeStandFor ? { image: ids.whatWeStandFor } : {}),
      },
      community: {
        ...group(doc, 'community'),
        ...(ids.community ? { image: ids.community } : {}),
      },
    } as never,
  })

  console.log('  = our story: five chapter photographs')
}

/* ────────────────────────────── contact ────────────────────────────────── */

async function reassignContact(payload: Payload) {
  const doc = await readGlobal(payload, 'contact-info')
  if (!doc) {
    note('the Contact page has no content yet — skipped')
    return
  }

  const image = await ensureMedia(payload, CONTACT_IMAGE)
  if (!image) return

  await payload.updateGlobal({
    slug: 'contact-info',
    overrideAccess: true,
    data: { image } as never,
  })

  console.log('  = contact: portrait replaced')
}

/* ───────────────────────── homepage teasers ────────────────────────────── */

/**
 * The three blocks at the foot of the homepage — Events, Updates, Gallery. Matched
 * on the link they point at rather than on position, so reordering them in the
 * admin panel does not shuffle the photographs.
 */
async function reassignTeasers(payload: Payload) {
  const doc = await readGlobal(payload, 'home-page')
  const teasers = doc?.teasers

  if (!Array.isArray(teasers) || teasers.length === 0) {
    note('the homepage has no teaser blocks yet — skipped')
    return
  }

  const byUrl: Record<string, SectionImage> = {
    '/events': TEASER_IMAGES.events,
    '/updates': TEASER_IMAGES.updates,
    '/gallery': TEASER_IMAGES.gallery,
  }
  const inOrder = [TEASER_IMAGES.events, TEASER_IMAGES.updates, TEASER_IMAGES.gallery]

  const next = []

  for (const [index, raw] of teasers.entries()) {
    const teaser = raw as Record<string, unknown>
    const url = typeof teaser.linkUrl === 'string' ? teaser.linkUrl : ''
    const choice = byUrl[url] ?? inOrder[index]

    if (!choice) {
      next.push(teaser)
      continue
    }

    const image = await ensureMedia(payload, choice)
    next.push(image ? { ...teaser, image } : teaser)
  }

  await payload.updateGlobal({
    slug: 'home-page',
    overrideAccess: true,
    data: { teasers: next } as never,
  })

  console.log(`  = homepage: ${next.length} teaser photograph(s)`)
}

/* ───────────────────────────── share image ─────────────────────────────── */

async function reassignShareImage(payload: Payload) {
  const doc = await readGlobal(payload, 'site-settings')
  if (!doc) {
    note('Site settings has no content yet — skipped')
    return
  }

  const shareImage = await ensureMedia(payload, SHARE_IMAGE)
  if (!shareImage) return

  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: { seo: { ...group(doc, 'seo'), shareImage } } as never,
  })

  console.log('  = site settings: social share image')
}

/* ────────────────────────────── gallery ────────────────────────────────── */

/** The remainder join the gallery, appended after whatever is already published. */
async function addToGallery(payload: Payload) {
  const published = await payload.find({
    collection: 'media',
    where: { showInGallery: { equals: true } },
    sort: '-galleryOrder',
    limit: 1,
    overrideAccess: true,
  })

  let order = ((published.docs[0]?.galleryOrder as number | undefined) ?? 0) + 1

  for (const image of GALLERY_ADDITIONS) {
    const id = await ensureMedia(payload, image, { showInGallery: true, galleryOrder: order })
    if (!id) continue

    // Already uploaded by an earlier run or by the seed: make sure it is actually
    // flagged for the gallery, which `ensureMedia` only sets on creation.
    await payload.update({
      collection: 'media',
      id,
      overrideAccess: true,
      data: { showInGallery: true, galleryOrder: order },
    })

    order += 1
  }

  console.log(`  = gallery: ${GALLERY_ADDITIONS.length} photograph(s) added`)
}

/* ──────────────────────────────── run ──────────────────────────────────── */

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  problems.length = 0

  console.log('\nGiving each section its own photograph…\n')

  const steps: [string, (payload: Payload) => Promise<void>][] = [
    ['events', reassignEvents],
    ['updates', reassignPosts],
    ['our story', reassignStory],
    ['contact', reassignContact],
    ['homepage teasers', reassignTeasers],
    ['share image', reassignShareImage],
    ['gallery', addToGallery],
  ]

  for (const [label, step] of steps) {
    try {
      await step(payload)
    } catch (error) {
      note(`${label} could not be updated: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (problems.length > 0) {
    console.warn(`\nFinished with ${problems.length} problem(s):`)
    problems.forEach((problem) => console.warn(`  • ${problem}`))
    console.warn('The deployment continues — re-run this from the admin panel if needed.\n')
  } else {
    console.log('\nDone — every section now has its own photograph.\n')
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  /**
   * Deliberately does nothing.
   *
   * Reversing this would mean putting the duplicated photographs back, and the
   * previous assignment is not recoverable from the database — the old ids are not
   * recorded anywhere. Both sets of images remain in the media library, so the
   * earlier framing can be restored from the admin panel if it is ever wanted.
   */
  console.log('Nothing to undo: photographs can be reassigned from the admin panel.')
}
