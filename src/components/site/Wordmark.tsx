import Link from 'next/link'
import React from 'react'

import { LOGO_PATHS, LOGO_VIEWBOX } from './logoPaths'

type Variant = 'solid' | 'texture' | 'duotone'

type Props = {
  /** Rendered height. Width follows the mark's own 2:1 proportion. */
  className?: string
  asLink?: boolean
  variant?: Variant
  title?: string
}

/**
 * The NexGen wordmark, drawn as inline SVG traced from the client's logo file.
 *
 * Inline rather than an `<img>` for three reasons: it inherits `currentColor`
 * so a single component serves the dark header, the red hover state and the
 * admin panel; it can be filled with the brand's painted texture; and the six
 * letter outlines are individually addressable, which is what lets the hero
 * animate the mark letter by letter.
 *
 * `variant`:
 *   solid   — one flat colour, inherited from CSS. The default.
 *   duotone — NEX in Chrome Silver, GEN in NexGen Red, split on the baseline
 *             between the two rows of the mark.
 *   texture — filled with the orange paint texture lifted from the original
 *             logo artwork, for hero-scale use.
 */
export const Wordmark: React.FC<Props> = ({
  className = '',
  asLink = true,
  variant = 'solid',
  title = 'NexGen',
}) => {
  const { width, height } = LOGO_VIEWBOX
  // Unique per variant so two marks on one page cannot collide on fill ids.
  const patternId = `nexgen-texture-${variant}`
  const clipTopId = `nexgen-clip-top-${variant}`
  const clipBottomId = `nexgen-clip-bottom-${variant}`

  // The mark stacks NEX over GEN; this is the seam between the two rows.
  const seam = height * 0.52

  const mark = (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title}
      className={`h-auto w-full ${className}`}
      style={{ display: 'block' }}
    >
      {variant === 'texture' && (
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" width={width} height={height}>
            <image
              href="/brand/logo-texture.webp"
              width={width}
              height={height}
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        </defs>
      )}

      {variant === 'duotone' && (
        <defs>
          <clipPath id={clipTopId}>
            <rect x="0" y="0" width={width} height={seam} />
          </clipPath>
          <clipPath id={clipBottomId}>
            <rect x="0" y={seam} width={width} height={height - seam} />
          </clipPath>
        </defs>
      )}

      {variant === 'duotone' ? (
        <>
          <g clipPath={`url(#${clipTopId})`} fill="var(--color-chrome-bright)">
            {LOGO_PATHS.map((d, index) => (
              <path key={`top-${index}`} d={d} />
            ))}
          </g>
          <g clipPath={`url(#${clipBottomId})`} fill="var(--color-nexgen)">
            {LOGO_PATHS.map((d, index) => (
              <path key={`bottom-${index}`} d={d} />
            ))}
          </g>
        </>
      ) : (
        <g fill={variant === 'texture' ? `url(#${patternId})` : 'currentColor'}>
          {LOGO_PATHS.map((d, index) => (
            <path key={index} d={d} data-logo-letter={index} />
          ))}
        </g>
      )}
    </svg>
  )

  if (!asLink) return mark

  return (
    <Link
      href="/"
      aria-label="NexGen — home"
      className="inline-flex items-center transition-colors duration-200"
    >
      {mark}
    </Link>
  )
}
