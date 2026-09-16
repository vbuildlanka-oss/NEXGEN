import Link from 'next/link'
import React from 'react'

import { ResponsiveImage } from '@/components/ui/ResponsiveImage'
import { dateParts, formatArtists, formatEventTime, formatPrice } from '@/lib/format'
import type { Event } from '@/payload-types'

type Props = {
  event: Event
  /** Past events drop the price and gain a link into the gallery instead. */
  variant?: 'upcoming' | 'past'
}

export const EventCard: React.FC<Props> = ({ event, variant = 'upcoming' }) => {
  const { day, month, year } = dateParts(event.startsAt)
  const artists = formatArtists(event.artists)
  const time = formatEventTime(event.startsAt)

  return (
    <article className="chamfer group relative flex flex-col bg-surface ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-chrome)_22%,transparent)] transition-all duration-300 hover:ring-nexgen">
      <Link href={`/events/${event.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">{event.title}</span>
      </Link>

      <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        {event.coverImage ? (
          <ResponsiveImage
            media={event.coverImage}
            sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 30vw"
            reserveSpace={false}
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]"
            alt={event.title}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-raised">
            <span className="font-display text-[2rem] text-chrome-dim uppercase">NexGen</span>
          </div>
        )}

        {/* Stacked date block, the way festival listings do it. */}
        <div className="absolute top-0 left-0 flex flex-col items-center bg-nexgen px-3 py-2 text-ink">
          <span className="font-display text-[1.75rem] leading-none">{day}</span>
          <span className="text-[0.7rem] font-bold tracking-[0.14em] uppercase">{month}</span>
          <span className="text-[0.65rem] tracking-[0.1em] opacity-80">{year}</span>
        </div>

        {event.soldOut && variant === 'upcoming' && (
          <div className="absolute top-0 right-0 bg-ink px-3 py-1.5 font-display text-[0.95rem] tracking-[0.1em] text-chrome-bright uppercase">
            Sold out
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="type-6 leading-[1.06]">{event.title}</h3>
          {event.tagline && <p className="mt-1 text-small text-chrome-dim">{event.tagline}</p>}
        </div>

        <dl className="flex flex-col gap-1 text-small text-chrome">
          {artists && (
            <div className="flex gap-2">
              <dt className="sr-only">Line-up</dt>
              <dd>{artists}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="sr-only">Venue</dt>
            <dd>
              {event.venue}
              {event.city ? `, ${event.city}` : ''}
              {time && variant === 'upcoming' ? ` · ${time}` : ''}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          {variant === 'upcoming' ? (
            <div>
              <p className="font-display text-[1.5rem] leading-none text-chrome-bright">
                {formatPrice(event.ticketPrice, event.currency)}
              </p>
              {event.ticketNote && (
                <p className="mt-1 text-[0.78rem] text-chrome-dim">{event.ticketNote}</p>
              )}
            </div>
          ) : (
            <p className="text-small text-chrome-dim">Archive</p>
          )}

          <span className="relative z-20 font-display text-[1.1rem] text-nexgen uppercase transition-colors group-hover:text-ember">
            {variant === 'upcoming' ? 'Details' : 'Look back'} →
          </span>
        </div>
      </div>
    </article>
  )
}
