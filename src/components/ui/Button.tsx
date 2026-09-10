import Link from 'next/link'
import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

// `chamfer` gives every button the logo's 45° clipped corners.
const base =
  'chamfer inline-flex items-center justify-center gap-2 font-display font-extrabold uppercase leading-none tracking-[0.02em] transition-all duration-200 ease-[var(--ease-out-quint)] will-change-transform hover:-translate-y-0.5 active:translate-y-0'

const variants: Record<Variant, string> = {
  // Solid NexGen Red on the dark base — the single loud call to action.
  primary: 'bg-nexgen text-ink hover:bg-ember',
  // Outlined, for the second-priority action next to a primary one.
  // A chamfered outline needs a filled backdrop behind an inset panel, since
  // clip-path would cut a plain border in half.
  secondary:
    'bg-chrome/25 text-chrome-bright hover:bg-ember/70 hover:text-ink [&>span]:relative',
  ghost: 'text-chrome-bright hover:text-ember px-0',
}

const sizes: Record<Size, string> = {
  md: 'px-5 py-3 text-[1.125rem]',
  lg: 'px-7 py-4 text-[1.5rem]',
}

type Props = {
  href: string
  children: React.ReactNode
  variant?: Variant
  size?: Size
  className?: string
}

/** Site-wide link button. Mirrors the reference's hard-cornered, chunky buttons. */
export const Button: React.FC<Props> = ({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  const isExternal = /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}
