'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const list = window.matchMedia(QUERY)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

const getSnapshot = (): boolean => window.matchMedia(QUERY).matches

// The server has no way to know the visitor's preference, so it assumes motion is
// allowed and the client corrects on hydration. Assuming the opposite would ship
// a static page to everyone.
const getServerSnapshot = (): boolean => false

/**
 * Tracks the OS "reduce motion" setting.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: reading a media
 * query into state inside an effect causes a second render pass on every mount,
 * and it silently stops responding if the visitor changes the setting while the
 * page is open. This subscribes properly and gives React a value it can read
 * during render.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
