/**
 * Role → dashboard routing tests.
 *
 * The SPA must send a signed-in user to the dashboard matching their persisted
 * profile role, not always to the generic home page. These cases pin the map,
 * including the legacy "administrator" spelling and the safe fallback for an
 * unknown or missing role.
 */
import {
  ROLE_DASHBOARD_ROUTES,
  dashboardRouteForRole,
} from "../../client/lib/roleDashboard";

describe("role → dashboard routing", () => {
  test("every declared role maps to a distinct dashboard route", () => {
    const routes = Object.values(ROLE_DASHBOARD_ROUTES);
    expect(new Set(routes).size).toBe(routes.length);
    for (const route of routes) {
      expect(route.startsWith("/")).toBe(true);
    }
  });

  test("admin maps to the admin panel, not the home page", () => {
    expect(dashboardRouteForRole("admin")).toBe("/admin-panel");
  });

  test("farmer maps to the farmer dashboard", () => {
    expect(dashboardRouteForRole("farmer")).toBe("/farmer-dashboard");
  });

  test("the legacy 'administrator' spelling is accepted", () => {
    expect(dashboardRouteForRole("administrator")).toBe("/admin-panel");
  });

  test("role matching is case-insensitive", () => {
    expect(dashboardRouteForRole("Agronomist")).toBe("/agronomist-dashboard");
  });

  test("an unknown or missing role falls back to the home page", () => {
    expect(dashboardRouteForRole("wizard")).toBe("/");
    expect(dashboardRouteForRole(null)).toBe("/");
    expect(dashboardRouteForRole(undefined)).toBe("/");
    expect(dashboardRouteForRole("")).toBe("/");
  });
});
