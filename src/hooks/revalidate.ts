import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * Pushes fresh content live the moment it is saved.
 *
 * The public pages are cached (see `export const revalidate` in each page), which
 * keeps them fast and keeps database reads off the critical path. These hooks
 * invalidate the affected paths after a save so the client never has to wonder
 * whether their change "went through" — which is the behaviour a non-technical
 * editor expects.
 *
 * `next/cache` is imported dynamically because Payload's config is also loaded
 * outside Next.js — by the seed script and the migration CLI — where that module
 * is not available. Failure to revalidate is logged but never blocks the save.
 */
async function revalidate(paths: string[]): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache')
    paths.forEach((path) => revalidatePath(path))
  } catch (error) {
    // Expected when Payload is driven by the seed script or the migration CLI,
    // where there is no Next.js request context to invalidate. One quiet line,
    // no stack trace — this is not a fault.
    const reason = error instanceof Error ? error.message : String(error)
    console.warn(`[revalidate] skipped for ${paths.join(', ')} — ${reason}`)
  }
}

/** Revalidates a fixed set of paths, plus the document's own page. */
export const revalidateCollection =
  (
    staticPaths: string[],
    documentPath?: (doc: Record<string, unknown>) => string | null,
  ): CollectionAfterChangeHook =>
  async ({ doc, previousDoc }) => {
    const paths = new Set(staticPaths)

    const current = documentPath?.(doc as Record<string, unknown>)
    if (current) paths.add(current)

    // If the slug changed, the old URL needs clearing too or it will keep
    // serving a stale copy of the page.
    const previous = documentPath?.((previousDoc ?? {}) as Record<string, unknown>)
    if (previous) paths.add(previous)

    await revalidate([...paths])

    return doc
  }

export const revalidateCollectionAfterDelete =
  (
    staticPaths: string[],
    documentPath?: (doc: Record<string, unknown>) => string | null,
  ): CollectionAfterDeleteHook =>
  async ({ doc }) => {
    const paths = new Set(staticPaths)
    const removed = documentPath?.(doc as Record<string, unknown>)
    if (removed) paths.add(removed)

    await revalidate([...paths])

    return doc
  }

export const revalidateGlobal =
  (paths: string[]): GlobalAfterChangeHook =>
  async ({ doc }) => {
    await revalidate(paths)
    return doc
  }
