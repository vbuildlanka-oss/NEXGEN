import React from 'react'

import { LOGO_PATHS, LOGO_VIEWBOX } from '../site/logoPaths'

/**
 * Brands the admin login screen and sidebar with the real NexGen mark, so the
 * CMS reads as NexGen's own tool rather than a generic dashboard.
 *
 * Shares the traced paths with the public site's `<Wordmark>` — one source of
 * truth for the logo, in both halves of the app.
 */
export const AdminLogo: React.FC = () => (
  <svg
    viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
    role="img"
    aria-label="NexGen"
    style={{ width: '200px', height: 'auto', display: 'block' }}
  >
    <g fill="#D93220">
      {LOGO_PATHS.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </g>
  </svg>
)

export const AdminIcon: React.FC = () => (
  <svg
    viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
    role="img"
    aria-label="NexGen"
    style={{ width: '32px', height: 'auto', display: 'block' }}
  >
    <g fill="#D93220">
      {LOGO_PATHS.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </g>
  </svg>
)

export default AdminLogo
