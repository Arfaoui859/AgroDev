/**
 * Route access decision — fails closed.
 *
 * Regression: `ProtectedRoute` used `allowedRoles.length > 0 && user &&
 * !allowedRoles.includes(user.role)`. With `user === null` (an authenticated
 * session whose `public.users` row had not loaded, or whose read failed) the
 * `user &&` term short-circuited the check and the guarded content rendered —
 * so `/admin-panel` was reachable by a non-admin during that window.
 */
import { resolveRouteAccess } from "../../client/lib/routeAccess";

const base = {
  isLoading: false,
  requiresAuth: true,
  isAuthenticated: true,
  allowedRoles: ["admin"] as readonly string[],
  userRole: "admin" as string | null,
  roleVerified: true,
};

describe("resolveRouteAccess", () => {
  test("allows an authenticated user whose verified role is in the allow-list", () => {
    expect(resolveRouteAccess(base)).toBe("allow");
  });

  test("fails closed when the trusted role has not loaded", () => {
    expect(resolveRouteAccess({ ...base, userRole: null })).toBe("redirect-fallback");
  });

  test("fails closed when the role read failed even if a role is present", () => {
    expect(resolveRouteAccess({ ...base, roleVerified: false })).toBe("redirect-fallback");
  });

  test("denies a role outside the allow-list", () => {
    expect(resolveRouteAccess({ ...base, userRole: "farmer" })).toBe("redirect-fallback");
  });

  test("sends an anonymous caller to login, not the fallback", () => {
    expect(
      resolveRouteAccess({ ...base, isAuthenticated: false, userRole: null, roleVerified: false }),
    ).toBe("redirect-login");
  });

  test("shows loading before any decision is made", () => {
    expect(resolveRouteAccess({ ...base, isLoading: true })).toBe("loading");
  });

  test("an ungated route allows any authenticated user", () => {
    expect(
      resolveRouteAccess({ ...base, allowedRoles: [], userRole: "farmer" }),
    ).toBe("allow");
  });

  test("an ungated route with requiresAuth=false allows anonymous visitors", () => {
    expect(
      resolveRouteAccess({
        ...base,
        allowedRoles: [],
        requiresAuth: false,
        isAuthenticated: false,
        userRole: null,
        roleVerified: false,
      }),
    ).toBe("allow");
  });
});
