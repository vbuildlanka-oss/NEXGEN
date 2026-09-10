const CURRENCY_PREFIX: Record<string, string> = {
  LKR: 'Rs.',
  USD: '$',
  GBP: '£',
  EUR: '€',
}

/**
 * Formats a ticket price for display.
 *
 * Display only — there is no checkout in this build (brief §2). A missing or
 * zero price is meaningful, so those cases return their own wording rather than
 * "0".
 */
export function formatPrice(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount === null || amount === undefined) return 'Price TBA'
  if (amount === 0) return 'Free entry'

  const prefix = CURRENCY_PREFIX[currency ?? 'LKR'] ?? ''
  const hasFraction = !Number.isInteger(amount)

  const formatted = amount.toLocaleString('en-GB', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })

  return `${prefix}${formatted}`
}

/**
 * All dates are rendered in a fixed locale and time zone so the server-rendered
 * markup and the client hydration agree. Without a pinned time zone a visitor in
 * another region can see a different date than the one that was prerendered.
 */
const DATE_ZONE = 'Asia/Colombo'

export function formatEventDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: DATE_ZONE,
  })
}

export function formatEventTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DATE_ZONE,
  })
}

/** Compact form for cards, e.g. "12 Oct 2026". */
export function formatShortDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: DATE_ZONE,
  })
}

/** Splits a date into parts for the stacked date block on event cards. */
export function dateParts(value: string | null | undefined): {
  day: string
  month: string
  year: string
} {
  if (!value) return { day: '', month: '', year: '' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { day: '', month: '', year: '' }

  return {
    day: date.toLocaleDateString('en-GB', { day: '2-digit', timeZone: DATE_ZONE }),
    month: date.toLocaleDateString('en-GB', { month: 'short', timeZone: DATE_ZONE }),
    year: date.toLocaleDateString('en-GB', { year: 'numeric', timeZone: DATE_ZONE }),
  }
}

/** Turns a list of artist rows into "A, B & C". */
export function formatArtists(
  artists: { name?: string | null }[] | null | undefined,
): string {
  const names = (artists ?? [])
    .map((artist) => artist?.name)
    .filter((name): name is string => Boolean(name))

  if (names.length === 0) return ''
  if (names.length === 1) return names[0]

  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}
