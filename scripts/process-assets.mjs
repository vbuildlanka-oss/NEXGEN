#!/usr/bin/env node
/**
 * Turns the client's raw camera and video masters into web assets.
 *
 * The supplied photographs are ~60-megapixel exports of 26–52 MB each and the
 * hero video is a 40 MB, 10.5 Mbps master — around 1.3 GB in total. None of it
 * can be served as-is, so this script produces:
 *
 *   assets-web/artists/*.webp      → the 7 homepage foreground photos
 *   assets-web/backgrounds/*.webp  → the homepage canvas backgrounds
 *   assets-web/gallery/*.webp      → the Gallery page photographs
 *   public/hero/hero.mp4|.webm     → the hero video, audio stripped
 *   public/hero/hero-poster.jpg    → first frame, painted before the video loads
 *
 * The output in assets-web/ is what scripts/seed.ts uploads into the CMS, which
 * then generates its own responsive variants. Run this once; the raw folders are
 * never deployed (see .vercelignore).
 *
 *   pnpm assets:process
 */
import { execFile } from 'node:child_process'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import sharp from 'sharp'

const execFileAsync = promisify(execFile)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const SOURCES = [
  { from: 'Homepage pic combo/Artist pics', to: 'assets-web/artists' },
  { from: 'Homepage pic combo/Background pics', to: 'assets-web/backgrounds' },
  { from: 'Gallery', to: 'assets-web/gallery' },
]

const VIDEO_SOURCE = 'Starting video/IMG_8459.MOV'
/**
 * The client supplied this as "snippet2.mp3.mpeg" — an mp3 with a double
 * extension. Matched loosely so a corrected filename still works.
 */
const AUDIO_CANDIDATES = ['snippet2.mp3.mpeg', 'snippet2.mp3', 'snippet.mp3', 'snippet.mp3.mpeg']
const HERO_DIR = 'public/hero'

/** Long edge of the web master. The CMS resizes down from here. */
const MAX_EDGE = 2400
const WEBP_QUALITY = 82

/**
 * Git LFS pointer files are ~130 bytes of text where an image should be. Two of
 * the supplied files are in this state, so they are detected and reported rather
 * than crashing the run or producing a broken output file.
 */
async function isLfsPointer(filePath) {
  const { size } = await stat(filePath)
  if (size > 1024) return false

  const head = await readFile(filePath, { encoding: 'utf8' })
  return head.startsWith('version https://git-lfs')
}

/** `image 1.jpg` → `image-1.webp`, so filenames survive URLs and R2 keys. */
function webName(filename) {
  return `${path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}.webp`
}

async function processImages() {
  const skipped = []
  let written = 0

  for (const source of SOURCES) {
    const fromDir = path.join(root, source.from)
    const toDir = path.join(root, source.to)

    let entries
    try {
      entries = (await readdir(fromDir)).filter((name) => /\.(jpe?g|png|tiff?|webp)$/i.test(name))
    } catch {
      console.warn(`! Source folder not found, skipping: ${source.from}`)
      continue
    }

    await mkdir(toDir, { recursive: true })

    for (const entry of entries.sort()) {
      const inputPath = path.join(fromDir, entry)

      if (await isLfsPointer(inputPath)) {
        skipped.push(`${source.from}/${entry}`)
        continue
      }

      const outputPath = path.join(toDir, webName(entry))

      const info = await sharp(inputPath, { limitInputPixels: false })
        // `rotate()` with no argument applies the EXIF orientation, without
        // which portrait phone/camera shots come out sideways.
        .rotate()
        .resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: 5 })
        .toFile(outputPath)

      const before = (await stat(inputPath)).size
      console.log(
        `  ${source.to}/${path.basename(outputPath)}  ` +
          `${info.width}×${info.height}  ` +
          `${(before / 1024 / 1024).toFixed(1)} MB → ${(info.size / 1024).toFixed(0)} KB`,
      )
      written += 1
    }
  }

  return { written, skipped }
}

/** Locates ffmpeg: an explicit override, the PATH, or the pip-installed copy. */
async function resolveFfmpeg() {
  const candidates = [process.env.FFMPEG_PATH, 'ffmpeg'].filter(Boolean)

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ['-version'])
      return candidate
    } catch {
      // try the next one
    }
  }

  return null
}

async function processVideo() {
  const input = path.join(root, VIDEO_SOURCE)

  try {
    await stat(input)
  } catch {
    console.warn(`! Video not found, skipping: ${VIDEO_SOURCE}`)
    return
  }

  const ffmpeg = await resolveFfmpeg()

  if (!ffmpeg) {
    console.warn(
      '! ffmpeg was not found, so the hero video was not encoded.\n' +
        '  Install ffmpeg, or set FFMPEG_PATH to its location, then re-run.',
    )
    return
  }

  const outDir = path.join(root, HERO_DIR)
  await mkdir(outDir, { recursive: true })

  const mp4 = path.join(outDir, 'hero.mp4')
  const webm = path.join(outDir, 'hero.webm')
  const poster = path.join(outDir, 'hero-poster.jpg')

  // The source is 1080×1920 portrait at 10.5 Mbps. The hero plays muted and
  // looping, so the audio track is dropped outright — a third of the file size
  // for something nobody can hear.
  console.log('  encoding hero.mp4 …')
  await execFileAsync(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    input,
    '-an',
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-crf',
    '30',
    '-preset',
    'slow',
    '-pix_fmt',
    'yuv420p',
    // Lets the browser start playing before the whole file has arrived, which is
    // how the page avoids needing a loading screen.
    '-movflags',
    '+faststart',
    mp4,
  ])

  console.log('  encoding hero.webm …')
  await execFileAsync(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    input,
    '-an',
    '-c:v',
    'libvpx-vp9',
    '-crf',
    '38',
    '-b:v',
    '0',
    '-row-mt',
    '1',
    '-cpu-used',
    '4',
    '-deadline',
    'good',
    webm,
  ])

  console.log('  extracting hero-poster.jpg …')
  await execFileAsync(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    // A fraction of a second in: frame zero of this clip is nearly black.
    '-ss',
    '0.8',
    '-i',
    input,
    '-frames:v',
    '1',
    '-q:v',
    '4',
    poster,
  ])

  for (const file of [mp4, webm, poster]) {
    const { size } = await stat(file)
    console.log(`  ${path.relative(root, file)}  ${(size / 1024 / 1024).toFixed(2)} MB`)
  }

  const source = (await stat(input)).size
  const encoded = (await stat(mp4)).size
  console.log(
    `  hero video: ${(source / 1024 / 1024).toFixed(1)} MB → ${(encoded / 1024 / 1024).toFixed(
      1,
    )} MB mp4`,
  )
}

/**
 * Encodes the hero soundtrack.
 *
 * 192 kbps stereo is more than a looping background bed needs; 128 kbps is
 * transparent at this use and roughly a third smaller. A short fade-in is baked
 * into the file so the track never starts on a hard transient, however it is
 * triggered — the scroll-linked fade-out is handled in the browser, where it has
 * to follow scroll position.
 */
async function processAudio() {
  const ffmpeg = await resolveFfmpeg()

  if (!ffmpeg) {
    console.warn('! ffmpeg not found, skipping the hero audio')
    return
  }

  let input

  for (const candidate of AUDIO_CANDIDATES) {
    const attempt = path.join(root, candidate)
    try {
      await stat(attempt)
      input = attempt
      break
    } catch {
      // try the next spelling
    }
  }

  if (!input) {
    console.warn(`! no hero audio found (looked for ${AUDIO_CANDIDATES.join(', ')})`)
    return
  }

  const outDir = path.join(root, HERO_DIR)
  await mkdir(outDir, { recursive: true })
  const output = path.join(outDir, 'hero-audio.mp3')

  console.log(`  encoding hero-audio.mp3 from ${path.basename(input)} …`)
  await execFileAsync(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    input,
    '-c:a',
    'libmp3lame',
    '-b:a',
    '128k',
    '-ar',
    '44100',
    '-ac',
    '2',
    // Two-second fade in from the top of the track.
    '-af',
    'afade=t=in:st=0:d=2',
    output,
  ])

  const before = (await stat(input)).size
  const after = (await stat(output)).size
  console.log(
    `  ${path.relative(root, output)}  ${(before / 1024 / 1024).toFixed(2)} MB → ` +
      `${(after / 1024 / 1024).toFixed(2)} MB`,
  )
}

async function main() {
  console.log('\nProcessing photographs…')
  const { written, skipped } = await processImages()

  console.log('\nProcessing hero video…')
  await processVideo()

  console.log('\nProcessing hero audio…')
  await processAudio()

  const manifest = {
    generatedAt: new Date().toISOString(),
    maxEdge: MAX_EDGE,
    webpQuality: WEBP_QUALITY,
    imagesWritten: written,
    skippedLfsPointers: skipped,
  }

  await writeFile(
    path.join(root, 'assets-web/manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )

  console.log(`\nDone. ${written} images written.`)

  if (skipped.length > 0) {
    console.warn(
      `\n! ${skipped.length} file(s) could not be processed because they are Git LFS ` +
        'pointers rather than real images. Ask the client to re-supply them:',
    )
    skipped.forEach((file) => console.warn(`    ${file}`))
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
