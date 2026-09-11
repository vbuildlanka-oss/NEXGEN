'use client'

import { useEffect, useLayoutEffect } from 'react'

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * The animation setup has to run before the browser paints, otherwise text is
 * visible for one frame before it is hidden and revealed — a flash on every page
 * load. But calling `useLayoutEffect` during server rendering logs a warning,
 * and client components are server-rendered too. This picks the right one.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect
