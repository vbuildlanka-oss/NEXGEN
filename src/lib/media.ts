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
 * Builds a `srcSet` from the variants Payload generated on upload.
 *
 * Using the pre-generated sizes rather than an on-the-fly image optimiser means
 * image delivery is free: R2 egress costs nothing and no serverless invocation
 * is involved. The trade-off is a fixed set of widths, which is fine for a photo
 * site with a small number of layout shapes.
 */
export function buildSrcSet(media: Media | null): string | undefined {
  if (!media?.sizes) return undefined

  const entries = Object.values(media.sizes as Record<string, MediaSize | undefined>)
    .filter((size): size is MediaSize => Boolean(size?.url && size?.width))
    .map((size) => `${size.url} ${size.width}w`)

  // Include the original as the largest candidate so very wide displays are covered.
  if (media.url && media.width) {
    entries.push(`${media.url} ${media.width}w`)
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

  return sizes.wide?.url ?? sizes.hero?.url ?? media.url ?? undefined
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
