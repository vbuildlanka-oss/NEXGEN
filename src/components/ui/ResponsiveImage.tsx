import React from 'react'

import {
  buildSrcSet,
  focalPosition,
  mediaAlt,
  mediaRatio,
  pickSrc,
  type MediaLike,
  asMedia,
} from '@/lib/media'

type Props = {
  media: MediaLike
  /** The CSS `sizes` attribute — tell the browser how wide this image renders. */
  sizes?: string
  className?: string
  /** Set on the one image that is likely to be the largest thing above the fold. */
  priority?: boolean
  alt?: string
  /** Reserve space using the image's own ratio, preventing layout shift. */
  reserveSpace?: boolean
  style?: React.CSSProperties
}

/**
 * Renders a Payload media document as a responsive `<img>`.
 *
 * Deliberately a plain `<img>` rather than `next/image`: Payload already
 * generated 480/960/1600/2400px WebP variants on upload, and serving those
 * straight from R2 costs nothing per request. Routing them through an image
 * optimiser would add a paid quota and a serverless hop for no visual gain.
 */
export const ResponsiveImage: React.FC<Props> = ({
  media,
  sizes = '100vw',
  className,
  priority = false,
  alt,
  reserveSpace = true,
  style,
}) => {
  const doc = asMedia(media)
  const src = pickSrc(doc)

  if (!doc || !src) return null

  const ratio = mediaRatio(doc)
  const objectPosition = focalPosition(doc)

  return (
    <img
      src={src}
      srcSet={buildSrcSet(doc)}
      sizes={sizes}
      alt={alt ?? mediaAlt(doc)}
      width={doc.width ?? undefined}
      height={doc.height ?? undefined}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      // `high` on the hero image, and never block the first paint on the rest.
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      style={{
        ...(reserveSpace && ratio ? { aspectRatio: String(ratio) } : {}),
        // Honour the focal point set in the admin panel. It only has any effect
        // where the image is cropped (`object-fit: cover`), which is exactly the
        // case it exists for; elsewhere it is inert.
        ...(objectPosition ? { objectPosition } : {}),
        ...style,
      }}
    />
  )
}
