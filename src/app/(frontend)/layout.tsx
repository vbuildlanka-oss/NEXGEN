import type { Metadata } from 'next'
import { Golos_Text, Oxanium } from 'next/font/google'
import React from 'react'

import { LivePreviewRefresh } from '@/components/LivePreviewRefresh'
import { SmoothScroll } from '@/components/motion/SmoothScroll'
import { AnnouncementBar } from '@/components/site/AnnouncementBar'
import { Footer } from '@/components/site/Footer'
import { Navbar } from '@/components/site/Navbar'
import { FALLBACK_NAV, type NavLink, type SocialLink } from '@/components/site/types'
import { asMedia, pickSrc } from '@/lib/media'
import { getContactInfo, getSiteSettings } from '@/lib/queries'
import { resolveServerURL } from '@/lib/serverUrl'

import './globals.css'

/**
 * Display type is Oxanium, chosen off the back of the client's logo rather than
 * the reference site's Anton.
 *
 * The NexGen mark is a geometric, monoline, wide letterform with 45° chamfered
 * terminals. Anton — heavy, condensed, fully rounded joints — fights it. Oxanium
 * shares the mark's squared skeleton and clipped corners, so headings read as
 * the same family as the logo while still hitting hard at poster scale in its
 * heaviest weights.
 *
 * Golos Text carries body copy: a neutral grotesque that stays out of the way.
 *
 * Both are self-hosted by next/font at build time — no render-blocking request
 * to Google, and no layout shift once they load.
 */
const displayFace = Oxanium({
  weight: ['600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display-face',
})

const bodyFace = Golos_Text({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body-face',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const seo = settings?.seo

  const title = seo?.defaultTitle || 'NexGen Entertainment'
  const description =
    seo?.defaultDescription ||
    'NexGen Entertainment champions the artists shaping what comes next — live events, new music and the crowds who find them first.'

  const shareImage = pickSrc(asMedia(seo?.shareImage))
  const base = resolveServerURL()

  return {
    metadataBase: new URL(base),
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: title,
      ...(shareImage ? { images: [{ url: shareImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
      apple: '/apple-touch-icon.png',
    },
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  // Both reads are needed on every page: the header/menu and the footer are
  // driven from the CMS so the client can rename or remove links themselves.
  const [settings, contact] = await Promise.all([getSiteSettings(), getContactInfo()])

  const navItems: NavLink[] =
    settings?.navItems && settings.navItems.length > 0
      ? settings.navItems.map((item) => ({ label: item.label, url: item.url }))
      : FALLBACK_NAV

  const socials: SocialLink[] = (contact?.socials ?? []).map((social) => ({
    platform: social.platform,
    label: social.label,
    url: social.url,
  }))

  const cta =
    settings?.headerCta?.label && settings.headerCta.url
      ? { label: settings.headerCta.label, url: settings.headerCta.url }
      : { label: 'Events', url: '/events' }

  const announcement = settings?.announcement

  return (
    <html lang="en" className={`${displayFace.variable} ${bodyFace.variable}`}>
      <body>
        <SmoothScroll />

        {announcement?.enabled && (
          <AnnouncementBar
            text={announcement.text}
            linkLabel={announcement.linkLabel}
            linkUrl={announcement.linkUrl}
          />
        )}

        <Navbar
          navItems={navItems}
          cta={cta}
          tagline={settings?.headerTagline ?? null}
          socials={socials}
        />

        {/* Lets keyboard and screen-reader users jump past the header and the
            long scroll-driven hero straight to the content. Visually hidden
            until focused. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-200 focus:bg-nexgen focus:px-4 focus:py-2 focus:font-display focus:text-ink focus:uppercase"
        >
          Skip to content
        </a>

        <main id="main">{children}</main>

        <Footer
          blurb={settings?.footerBlurb}
          columns={(settings?.footerColumns ?? []).map((column) => ({
            heading: column.heading,
            links: column.links ?? [],
          }))}
          socials={socials}
          copyrightName={settings?.copyrightName}
          cta={cta}
        />

        <LivePreviewRefresh serverURL={resolveServerURL()} />
      </body>
    </html>
  )
}
