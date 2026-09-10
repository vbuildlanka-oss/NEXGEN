import Link from 'next/link'
import React from 'react'

type Props = {
  text?: string | null
  linkLabel?: string | null
  linkUrl?: string | null
}

/**
 * The strip above the header, for a single timely message.
 *
 * Off by default and switched on from Site settings, so it is never a stale
 * banner nobody remembered to remove.
 */
export const AnnouncementBar: React.FC<Props> = ({ text, linkLabel, linkUrl }) => {
  if (!text) return null

  return (
    <div className="relative z-120 bg-nexgen text-ink">
      <div className="container-site flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-small font-semibold">
        <span>{text}</span>
        {linkLabel && linkUrl && (
          <Link
            href={linkUrl}
            className="font-display text-[1rem] uppercase underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            {linkLabel} »
          </Link>
        )}
      </div>
    </div>
  )
}
