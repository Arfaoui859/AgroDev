/**
 * Role → landing dashboard route.
 *
 * Navigation only: `ProtectedRoute` and the server middleware remain the real
 * authorization boundaries. This map exists so a signed-in user is sent to the
 * dashboard that matches their persisted profile role instead of always landing
 * on the generic home page.
 */
export type UserRole =
  | "farmer"
  | "agronomist"
  | "trader"
  | "veterinarian"
  | "admin"
  | "inspector";

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  farmer: "/farmer-dashboard",
  agronomist: "/agronomist-dashboard",
  trader: "/trader-dashboard",
  veterinarian: "/veterinarian-dashboard",
  inspector: "/field-inspector-dashboard",
  admin: "/admin-panel",
};

export function dashboardRouteForRole(role: string | null | undefined): string {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "administrator") return "/admin-panel";
  if (normalized in ROLE_DASHBOARD_ROUTES) {
    return ROLE_DASHBOARD_ROUTES[normalized as UserRole];
  }
  return "/";
}
