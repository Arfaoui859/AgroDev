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
    if (!allowedRoles.includes(userRole)) return "redirect-fallback";
  }

  return "allow";
}
