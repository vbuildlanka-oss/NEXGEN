import Link from 'next/link'
import React from 'react'

type Props = {
  heading: string
  body?: string | null
  linkLabel?: string | null
  linkUrl?: string | null
}

/**
 * The panel a listing page shows when it has nothing to list.
 *
 * All three listing pages had their own copy of this markup, which meant three
 * places to change if the treatment ever moved. More to the point, all three now
 * take their wording from the CMS, and a shared component is what stops the three
 * empty states drifting into looking like three different designs.
 *
 * The link is optional and comes from a label/URL pair, so clearing the label in
 * the admin panel removes the link cleanly rather than leaving a dangling anchor.
 */
export const EmptyState: React.FC<Props> = ({ heading, body, linkLabel, linkUrl }) => (
  <div className="border border-hairline bg-surface p-10 text-center">
    <p className="font-display text-[1.75rem] text-chrome-bright uppercase">{heading}</p>

    {(body || (linkLabel && linkUrl)) && (
      <p className="mt-3 text-chrome">
        {body}
        {body && linkLabel && linkUrl ? ' ' : null}
        {linkLabel && linkUrl && (
          <Link href={linkUrl} className="text-ember underline underline-offset-4">
            {linkLabel}
          </Link>
        )}
      </p>
    )}
  </div>
)
