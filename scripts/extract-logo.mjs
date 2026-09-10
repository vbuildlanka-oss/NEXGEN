#!/usr/bin/env node
/**
 * Rebuilds the brand assets from the client's supplied logo.jpeg.
 *
 * The logo is a custom angular lettermark — monoline strokes, 45° chamfered
 * terminals, a mirrored N and E, and an arrow point on the E of NEX. It only
 * exists as a flat JPEG, so this script recovers it as vector art:
 *
 *   1. isolate the near-white mark from the painted orange field in HSV,
 *   2. trace the outlines and simplify them to straight segments (the mark has
 *      no curves at all, so polygons reproduce it exactly),
 *   3. emit an SVG whose paths use `currentColor`, plus a favicon,
 *   4. crop the painted texture from behind the mark for use as a brand fill.
 *
 * Outputs:
 *   public/brand/nexgen-logo.svg      — the wordmark, recolourable
 *   public/brand/logo-texture.webp    — the painted orange texture
 *   public/brand/nexgen-logo.webp     — raster fallback / social sharing
 *   public/favicon.svg
 *   src/components/site/logoPaths.ts  — the same paths, for inline rendering
 *
 * Requires Python with opencv-python-headless and numpy:
 *   pip install opencv-python-headless numpy
 *
 *   node scripts/extract-logo.mjs
 */
import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import sharp from 'sharp'

const execFileAsync = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const SOURCE = path.join(root, 'logo.jpeg')

const TRACE_SCRIPT = `
import cv2, numpy as np, json, sys

img = cv2.imread(sys.argv[1])
if img is None:
    raise SystemExit('could not read ' + sys.argv[1])

# The mark is near-white on an orange field: high value, low saturation.
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
mask = ((hsv[:, :, 2] > 190) & (hsv[:, :, 1] < 70)).astype(np.uint8) * 255

# Discard the thin white frame around the artwork.
border = max(4, img.shape[0] // 60)
mask[:border, :] = 0; mask[-border:, :] = 0
mask[:, :border] = 0; mask[:, -border:] = 0

# Drop specks so only the letterforms remain.
count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
clean = np.zeros_like(mask)
for i in range(1, count):
    if stats[i, cv2.CC_STAT_AREA] > 400:
        clean[labels == i] = 255

# Trace at 4x: JPEG edges are soft, and simplifying an upscaled outline gives
# cleaner 45-degree lines than tracing at original resolution.
big = cv2.resize(clean, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
big = cv2.threshold(big, 127, 255, cv2.THRESH_BINARY)[1]

contours, _ = cv2.findContours(big, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

ys, xs = np.where(big > 0)
x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
w, h = x1 - x0 + 1, y1 - y0 + 1

paths = []
for contour in contours:
    if cv2.contourArea(contour) < 400:
        continue
    # 0.35% of the perimeter removes compression jitter while keeping every
    # chamfer and the arrow point intact.
    eps = 0.0035 * cv2.arcLength(contour, True)
    pts = cv2.approxPolyDP(contour, eps, True).reshape(-1, 2).astype(float)
    scale = 1000.0 / w
    pts[:, 0] = (pts[:, 0] - x0) * scale
    pts[:, 1] = (pts[:, 1] - y0) * scale
    paths.append('M' + ' L'.join('%.1f %.1f' % (x, y) for x, y in pts) + ' Z')

print(json.dumps({
    'viewBoxWidth': 1000,
    'viewBoxHeight': round(1000.0 * h / w, 1),
    'paths': paths,
    'markBox': [x0 // 4, y0 // 4, w // 4, h // 4],
}))
`

async function trace() {
  const { stdout } = await execFileAsync('python3', ['-c', TRACE_SCRIPT, SOURCE], {
    maxBuffer: 8 * 1024 * 1024,
  })
  return JSON.parse(stdout)
}

async function main() {
  const { viewBoxWidth, viewBoxHeight, paths, markBox } = await trace()

  console.log(`traced ${paths.length} outlines · viewBox ${viewBoxWidth}×${viewBoxHeight}`)

  await mkdir(path.join(root, 'public/brand'), { recursive: true })

  /* ── the wordmark, inheriting its colour from CSS ───────────────────────── */
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" fill="currentColor" role="img" aria-label="NexGen">`,
    ...paths.map((d) => `  <path d="${d}"/>`),
    '</svg>',
    '',
  ].join('\n')

  await writeFile(path.join(root, 'public/brand/nexgen-logo.svg'), svg)

  /* ── favicon: the mark, cropped to "NEX", on the brand black ───────────── */
  const favicon = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
    '  <rect width="512" height="512" rx="8" fill="#080808"/>',
    `  <g transform="translate(26 130) scale(0.46)" fill="#D93220">`,
    ...paths.map((d) => `    <path d="${d}"/>`),
    '  </g>',
    '</svg>',
    '',
  ].join('\n')

  await writeFile(path.join(root, 'public/favicon.svg'), favicon)

  /* ── the painted texture from behind the mark ──────────────────────────── */
  // Taken from the top-left quadrant, which is the cleanest run of paint with
  // no letterforms crossing it.
  const meta = await sharp(SOURCE).metadata()
  const size = Math.floor(Math.min(meta.width ?? 1290, meta.height ?? 1290) * 0.34)

  await sharp(SOURCE)
    .extract({ left: 40, top: 40, width: size, height: size })
    .resize(1200, 1200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(path.join(root, 'public/brand/logo-texture.webp'))

  /* ── raster wordmark for social sharing ────────────────────────────────── */
  await sharp(SOURCE)
    .extract({
      left: Math.max(0, markBox[0] - 30),
      top: Math.max(0, markBox[1] - 30),
      width: markBox[2] + 60,
      height: markBox[3] + 60,
    })
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(path.join(root, 'public/brand/nexgen-logo.webp'))

  /* ── the paths again, as a module, so React can inline the mark ────────── */
  const module = `/**
 * The NexGen wordmark, traced from the client's logo.jpeg by
 * scripts/extract-logo.mjs. Do not hand-edit — re-run that script instead.
 *
 * Inlined rather than loaded as an <img> so the mark can inherit \`currentColor\`,
 * be masked with the brand texture, and animate per-letter.
 */
export const LOGO_VIEWBOX = { width: ${viewBoxWidth}, height: ${viewBoxHeight} } as const

export const LOGO_PATHS: readonly string[] = [
${paths.map((d) => `  '${d}',`).join('\n')}
]
`

  await writeFile(path.join(root, 'src/components/site/logoPaths.ts'), module)

  console.log('wrote public/brand/nexgen-logo.svg')
  console.log('wrote public/brand/logo-texture.webp')
  console.log('wrote public/brand/nexgen-logo.webp')
  console.log('wrote public/favicon.svg')
  console.log('wrote src/components/site/logoPaths.ts')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
