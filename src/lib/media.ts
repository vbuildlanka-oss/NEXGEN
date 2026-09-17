import type { Media } from '@/payload-types'

/** A media field can arrive as an id, a full doc, null or undefined. */
export type MediaLike = number | string | Media | null | undefined

/** Narrows a media field to a populated document, or null. */
export function asMedia(value: MediaLike): Media | null {
  if (!value || typeof value === 'number' || typeof value === 'string') return null
  return value
}

type MediaSize = {
  url?: string | null
  width?: number | null
  height?: number | null
}

/**
 * Makes a stored URL safe to put in a `srcset`.
 *
 * `srcset` is parsed by splitting on commas, then reading each candidate's URL up
 * to the first whitespace and treating the rest as descriptors. So a filename
 * containing a space silently destroys the candidate: the browser reads
 * ".../ONEDINETH" as the URL, fails to parse "IMG" as a descriptor, and throws the
 * whole entry away. A comma is worse — it splits one candidate into two.
 *
 * Uploads are slugified now (see lib/uploadFilenames), so new files cannot hit
 * this. It stays because files uploaded before that guardrail existed are still in
 * the bucket, and because a URL going into markup should not depend on a hook
 * having run months earlier.
 *
 * Deliberately not `encodeURI`, which would turn an already-encoded "%20" into
 * "%2520". Only the two characters that are structurally significant are touched.
 */
function srcSetSafe(url: string): string {
  return url.replace(/ /g, '%20').replace(/,/g, '%2C')
}

/** The same escaping, for any single URL taken off a media document. */
export function mediaUrl(url: string | null | undefined): string | undefined {
  return url ? srcSetSafe(url) : undefined
}

/**
 * Builds a `srcSet` from the variants Payload generated on upload.
 *
 * Using the pre-generated sizes rather than an on-the-fly image optimiser means
 * image delivery is free: R2 egress costs nothing and no serverless invocation
 * is involved. The trade-off is a fixed set of widths, which is fine for a photo
 * site with a small number of layout shapes.
 */
export function buildSrcSet(media: Media | null): string | undefined {
  if (!media?.sizes) return undefined

  const variants = Object.values(media.sizes as Record<string, MediaSize | undefined>).filter(
    (size): size is MediaSize & { url: string; width: number } =>
      Boolean(size?.url && size?.width),
  )

  const entries = variants.map((size) => `${srcSetSafe(size.url)} ${size.width}w`)

  /**
   * The original is offered only when it is genuinely larger than every variant.
   *
   * It used to be appended unconditionally, "so very wide displays are covered" —
   * but the largest variant is already 2400px, which covers a 1200px slot at 2×.
   * All the unconditional version actually achieved was handing the browser the
   * full-size upload as the most attractive candidate on a wide screen: an 838 KB
   * JPEG in the one case we found. Uploads are now capped at 2400px, so this
   * branch is reached only by an image too small to have generated a variant at
   * its own size, which is exactly when the original is worth having.
   */
  const widestVariant = variants.reduce((widest, size) => Math.max(widest, size.width), 0)

  if (media.url && media.width && media.width > widestVariant) {
    entries.push(`${srcSetSafe(media.url)} ${media.width}w`)
  }

  return entries.length > 0 ? entries.join(', ') : undefined
}

/**
 * Picks a sensible default `src`.
 *
 * Prefers the 1600px variant: large enough for a full-width band on a laptop,
 * small enough that a browser ignoring `srcSet` does not download a 2400px file.
 */
export function pickSrc(media: Media | null): string | undefined {
  if (!media) return undefined

  const sizes = (media.sizes ?? {}) as Record<string, MediaSize | undefined>

  return mediaUrl(sizes.wide?.url ?? sizes.hero?.url ?? media.url)
}

export function mediaAlt(media: Media | null, fallback = ''): string {
  return media?.alt || media?.caption || fallback
}

/** Aspect ratio, used to reserve layout space and avoid content shifting. */
export function mediaRatio(media: Media | null): number | undefined {
  if (!media?.width || !media?.height) return undefined
  return media.width / media.height
}

export function isPortrait(media: Media | null): boolean {
  const ratio = mediaRatio(media)
  return typeof ratio === 'number' ? ratio < 1 : false
}

/**
 * The editor's focal point, as a CSS `object-position` value.
 *
 * Payload's focal point is stored on the document but does nothing on its own —
 * it is only ever advice for whatever renders the image. Without this, a portrait
 * photograph placed in a wide frame is cropped from its centre, which on a
 * standing subject means the crop lands on their chest and takes the head off.
 * Passing the focal point through as `object-position` is what makes the control
 * in the admin panel actually change the page.
 *
 * Returns undefined when the point is dead centre, so the CSS default stands and
 * no inline style is emitted for the majority of images.
 */
export function focalPosition(media: Media | null): string | undefined {
  if (!media) return undefined

  const x = typeof media.focalX === 'number' ? media.focalX : 50
  const y = typeof media.focalY === 'number' ? media.focalY : 50

  if (x === 50 && y === 50) return undefined

  const clamp = (value: number) => Math.min(100, Math.max(0, value))

  return `${clamp(x)}% ${clamp(y)}%`
}
