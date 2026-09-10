import type { Access, FieldAccess } from 'payload'

/** Public read access. */
export const anyone: Access = () => true

/**
 * Write access: any logged-in admin user.
 *
 * The brief calls for a single admin role, so membership of the `users`
 * collection is itself the permission. If tiered roles are ever needed, this is
 * the one function to change.
 */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Field-level equivalent of {@link authenticated}. */
export const authenticatedFieldAccess: FieldAccess = ({ req: { user } }) => Boolean(user)

/**
 * Read access for collections that use drafts.
 *
 * Logged-in admins see everything, including unpublished drafts, so live
 * preview works. The public gets a query constraint rather than a flat `false`,
 * which is what lets Payload return published documents only.
 */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    _status: {
      equals: 'published',
    },
  }
}

/**
 * Whether the user may reach the admin panel at all.
 *
 * Kept separate from {@link authenticated} because Payload types this one as a
 * strict boolean predicate — it cannot return a query constraint the way a read
 * rule can.
 */
export const isLoggedIn = ({ req: { user } }: { req: { user?: unknown } }): boolean =>
  Boolean(user)
