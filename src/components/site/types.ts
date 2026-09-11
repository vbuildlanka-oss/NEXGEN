/** Shapes passed from the server layout into the interactive site chrome. */

export type NavLink = {
  label: string
  url: string
}

export type SocialLink = {
  platform: string
  label?: string | null
  url: string
}

export type ChromeData = {
  navItems: NavLink[]
  cta: NavLink | null
  /** Optional small header text. Empty means the wordmark shows alone. */
  tagline: string | null
  socials: SocialLink[]
}

export const FALLBACK_NAV: NavLink[] = [
  { label: 'Home', url: '/' },
  { label: 'Our Story', url: '/our-story' },
  { label: 'Events', url: '/events' },
  { label: 'Updates', url: '/updates' },
  { label: 'Gallery', url: '/gallery' },
  { label: 'Contact Us', url: '/contact' },
]

export const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  x: 'X',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  whatsapp: 'WhatsApp',
  other: 'Link',
}
