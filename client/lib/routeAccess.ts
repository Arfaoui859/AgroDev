/**
 * Pure access decision for `ProtectedRoute`.
 *
 * Navigation only — the server remains the authorization boundary. But the
 * decision must still fail *closed*: a route that declares `allowedRoles` may
 * only render once the trusted profile has loaded and carries an allowed role.
 *
 * Regression: the guard previously tested `allowedRoles.length > 0 && user &&
 * !allowedRoles.includes(user.role)`. When `user` was null — an authenticated
 * session whose `public.users` row had not loaded or failed to load — the
 * `user &&` term short-circuited the whole check, so `/admin-panel` rendered
 * its content for a non-admin.
 */
export type RouteAccessDecision =
  | "loading"
  | "redirect-login"
  | "redirect-fallback"
  | "allow";

/**
 * Canonicalise a profile role before comparing it against an allow-list.
 *
 * The database and server middleware treat `administrator` as a synonym of
 * `admin` (`ADMIN_ROLES` in `server/middleware/auth.ts`). Without this, an
 * `administrator` profile was denied `/admin-panel` (which lists only `admin`)
 * and bounced to the home page — the reported "admin does not see the admin
 * dashboard" symptom. Normalisation only ever maps an alias onto the canonical
 * role; it never invents a role, so an unknown role still fails closed.
 */
export function normalizeRole(role: string | null | undefined): string | null {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();
  if (!normalized) return null;
  return normalized === "administrator" ? "admin" : normalized;
}

export interface RouteAccessInput {
  isLoading: boolean;
  requiresAuth: boolean;
  isAuthenticated: boolean;
  allowedRoles: readonly string[];
  /** The caller's trusted profile, or null while it is not resolved. */
  userRole: string | null;
  /** False when the profile could not be read from the database. */
  roleVerified?: boolean;
}

export function resolveRouteAccess({
  isLoading,
  requiresAuth,
  isAuthenticated,
  allowedRoles,
  userRole,
  roleVerified = true,
}: RouteAccessInput): RouteAccessDecision {
  if (isLoading) return "loading";

  if (requiresAuth && !isAuthenticated) return "redirect-login";

  if (allowedRoles.length > 0) {
    // No verified identity, or an unverified role, or a role outside the
    // allow-list: deny. Never fall through to rendering privileged content.
    if (!userRole || !roleVerified) return "redirect-fallback";
    const role = normalizeRole(userRole);
    const allowed = allowedRoles.map((r) => normalizeRole(r));
    if (!role || !allowed.includes(role)) return "redirect-fallback";
  }

  return "allow";
}
