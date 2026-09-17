import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { STORY_IMAGES } from '../lib/sectionImages'
import { storedFilename } from '../lib/uploadFilenames'

/**
 * Repairs the Our Story community photograph.
 *
 * The previous migration uploaded it correctly as "onedineth-img-188.webp", and
 * then the file on that document was replaced by hand with the unprocessed master:
 * "ONEDINETH IMG 188-1.jpg", 838 KB, 2730×4096. Two things were wrong with it.
 *
 * The spaces are the visible half. Every generated variant inherited them, and
 * those URLs go into a `srcset` attribute where a space terminates the URL — so
 * the browser discarded all four candidates and fell back to `src`. Escaping in
 * lib/media now covers that, and the upload hook stops it recurring.
 *
 * The size is the half escaping cannot fix. At 2730px the original is wider than
 * the largest generated variant, so it is still legitimately offered as the top
 * `srcset` candidate — an 838 KB JPEG handed to any wide or high-DPR display. The
 * only real fix is to put the processed file back, which is what this does.
 *
 * Found via the global rather than by document id, because ids differ between a
 * fresh install and production, and by comparing filenames rather than assuming —
 * so this is a no-op anywhere the image is already correct.
 */
/**
 * Whether a stored file is one of the bad ones.
 *
 * Deliberately describes the *defect* rather than comparing against an expected
 * name. Payload settles the final filename itself — if the name it wants is taken
 * in the bucket it increments the trailing number, so a repair may legitimately
 * land on "onedineth-img-189.webp" depending on what was left behind. Asserting an
 * exact name would make this migration re-run forever in that case; asserting the
 * two properties that actually matter makes it idempotent.
 */
function needsRepair(filename: string | null | undefined): boolean {
  if (!filename) return false

  return !filename.toLowerCase().endsWith('.webp') || /[ ,]/.test(filename)
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const expected = storedFilename(path.basename(STORY_IMAGES.community.file))

  let imageId: number | null = null

  try {
    const story = (await payload.findGlobal({
      slug: 'our-story',
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>

    const community = story.community as Record<string, unknown> | undefined
    const value = community?.image

    if (typeof value === 'number') imageId = value
  } catch {
    console.log('  = Our Story has no content yet — nothing to repair')
    return
  }

  if (!imageId) {
    console.log('  = the Our Story community slot is empty — nothing to repair')
    return
  }

  const doc = await payload.findByID({
    collection: 'media',
    id: imageId,
    overrideAccess: true,
    disableErrors: true,
  })

  if (!doc) {
    console.log(`  = media ${imageId} is missing — nothing to repair`)
    return
  }

  if (!needsRepair(doc.filename)) {
    console.log(`  = community photograph is fine: ${doc.filename}`)
    return
  }

  const filePath = path.resolve(process.cwd(), STORY_IMAGES.community.file)

  if (!existsSync(filePath)) {
    console.warn(
      `  ! ${STORY_IMAGES.community.file} is missing — run "pnpm assets:process". ` +
        `Leaving "${doc.filename}" in place.`,
    )
    return
  }

  const repaired = await payload.update({
    collection: 'media',
    id: imageId,
    overrideAccess: true,
    // Replacing the file regenerates all four variants from the processed source.
    filePath,
    data: {
      alt: STORY_IMAGES.community.alt,
      // Restated rather than trusted to survive a file replacement: the focal point
      // is what keeps the raised arms and faces in frame when this portrait is
      // cropped into the page's fixed-ratio chapter frame.
      focalX: 50,
      focalY: STORY_IMAGES.community.focalY ?? 50,
    },
  })

  // The actual name, not the one asked for — see `needsRepair` above.
  console.log(`  = community photograph: "${doc.filename}" replaced with ${repaired.filename}`)

  if (repaired.filename !== expected) {
    console.log(
      `    (wanted ${expected}; the earlier upload of that name is still in storage, ` +
        'so Payload picked the next free one — same photograph, different label)',
    )
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  /**
   * Nothing to undo. Restoring the state this corrects would mean re-uploading an
   * unprocessed master, and the point of the migration is that it should not be
   * there. The image can be changed from the admin panel at any time.
   */
  console.log('Nothing to undo: the photograph can be replaced from the admin panel.')
}
