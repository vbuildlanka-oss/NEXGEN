import Link from 'next/link'
import React from 'react'

import { Wordmark } from './Wordmark'
import { SOCIAL_LABELS, type NavLink, type SocialLink } from './types'

type FooterColumn = {
  heading: string
  links?: { label: string; url: string }[] | null
}

type Props = {
  blurb?: string | null
  columns: FooterColumn[]
  socials: SocialLink[]
  copyrightName?: string | null
  cta?: NavLink | null
}

export const Footer: React.FC<Props> = ({
  blurb,
  columns,
  socials,
  copyrightName = 'NexGen Entertainment',
  cta,
}) => (
  <footer className="border-t border-hairline bg-ink">
    <div className="container-site py-[clamp(3rem,7vw,6rem)]">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Wordmark className="w-[13rem]" variant="duotone" />
          {blurb && <p className="mt-4 max-w-[38ch] text-chrome">{blurb}</p>}
          {cta?.label && cta.url && (
            <Link
              href={cta.url}
              className="mt-6 inline-flex items-center gap-2 font-display text-[1.5rem] uppercase text-chrome-bright transition-colors hover:text-ember"
            >
              {cta.label}
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="mb-4 font-display text-[1.25rem] tracking-[0.06em] text-chrome-bright">
                {column.heading}
              </h2>
              <ul className="flex flex-col gap-2">
                {(column.links ?? []).map((link) => (
                  <li key={`${link.label}-${link.url}`}>
                    <Link
                      href={link.url}
                      className="text-chrome transition-colors hover:text-ember"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {socials.length > 0 && (
            <nav aria-label="Social">
              <h2 className="mb-4 font-display text-[1.25rem] tracking-[0.06em] text-chrome-bright">
                Social
              </h2>
              <ul className="flex flex-col gap-2">
                {socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-chrome transition-colors hover:text-ember"
                    >
                      {social.label || SOCIAL_LABELS[social.platform] || social.platform}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-hairline pt-6 text-small text-chrome-dim sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {copyrightName}. All rights reserved.
        </p>
        <p>
          <Link href="/contact" className="underline underline-offset-4 hover:text-ember">
            Get in touch
          </Link>
        </p>
      </div>
    </div>
  </footer>
)
