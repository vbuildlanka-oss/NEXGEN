/**
 * What an uploaded file ends up being called.
 *
 * Two rules, applied in this order, and both of them exist because of a real
 * failure rather than as a matter of taste:
 *
 *  1. The name is slugified. A photograph uploaded as "ONEDINETH IMG 188.jpg"
 *     produced variants called "ONEDINETH IMG 188-1-1600x2401.webp", and those
 *     URLs are written into a `srcset` attribute — where a space is the delimiter
 *     between the URL and its width descriptor. The browser reads the URL as
 *     ".../ONEDINETH", tries to parse "IMG" as a descriptor, fails, and discards
 *     the candidate. Every variant was unusable; the image only appeared at all
 *     because it fell back to `src`, where browsers tolerate spaces. Responsive
 *     sizing was silently dead.
 *
 *  2. The extension follows the format Payload re-encodes to. Originals are
 *     converted to WebP on upload (see the Media collection), so a `.jpg` goes
 *     into storage as a `.webp`.
 *
 * Both the collection hook and the seed script import from here. They have to
 * agree: the seed decides whether it has already uploaded a file by looking for
 * its filename in the database, so if it guesses the stored name wrongly it will
 * re-upload the same photograph on every single run.
 */

/**
 * Extensions sharp re-encodes to WebP. SVG is absent deliberately — it is not
 * raster and Payload leaves it alone; so are the video types, which sharp never
 * touches.
 */
const RE_ENCODED = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.tif',
  '.tiff',
  '.avif',
  '.heic',
  '.heif',
])

/** Splits a filename without needing `path`, so this is safe in the browser too. */
function splitExtension(name: string): { base: string; extension: string } {
  const dot = name.lastIndexOf('.')

  // No dot, or a leading dot with nothing after it: treat the whole thing as the
  // base rather than inventing an extension.
  if (dot <= 0) return { base: name, extension: '' }

  return { base: name.slice(0, dot), extension: name.slice(dot).toLowerCase() }
}

/**
 * Lowercase, hyphenated, ASCII. Keeps the extension as given — converting it is a
 * separate concern, handled by `storedFilename`.
 */
export function slugifyUploadName(name: string): string {
  const { base, extension } = splitExtension(name)

  const slug = base
    // Decompose accents so they can be stripped rather than replaced wholesale:
    // "Café" becomes "cafe", not "caf-".
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

  // A name made entirely of characters we strip (say, a purely Sinhala filename)
  // would otherwise become an extension with nothing in front of it.
  return `${slug || 'file'}${extension}`
}

/**
 * The name this file will actually be stored under: slugified, and with the
 * extension Payload will have re-encoded it to.
 *
 * Note this cannot account for Payload's collision handling. When the name is
 * already taken it appends a counter — "onedineth-img-188.webp" becomes
 * "onedineth-img-188-1.webp" — which is why the seed also compares what it asked
 * for against what it got back and warns when the two differ.
 */
export function storedFilename(name: string): string {
  const slugified = slugifyUploadName(name)
  const { base, extension } = splitExtension(slugified)

  return RE_ENCODED.has(extension) ? `${base}.webp` : slugified
}
