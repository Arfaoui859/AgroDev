/**
 * Dashboard routes must be wrapped in `ProtectedRoute`.
 *
 * Regression: `/farmer-dashboard`, `/comprehensive-farm-management` and
 * `/government-dashboard` were mounted as bare elements. An anonymous visitor
 * (or a user whose profile had not loaded) landed on a dashboard that fired
 * authenticated fetches and rendered a broken/empty shell instead of being
 * redirected to sign-in — the reported "wrong dashboard / unexpected error"
 * symptom.
 *
 * This asserts the source wiring so a future edit cannot silently drop a guard.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const routerSource = readFileSync(
  resolve(__dirname, "../../client/components/AppRouter.tsx"),
  "utf8",
);

const GUARDED_ROUTES = [
  "/farmer-dashboard",
  "/comprehensive-farm-management",
  "/government-dashboard",
  "/admin-panel",
  "/agronomist-dashboard",
  "/trader-dashboard",
  "/veterinarian-dashboard",
  "/field-inspector-dashboard",
  "/government-dashboard",
  "/investor-dashboard",
  "/market-dashboard",
  "/livestock-dashboard",
  "/breeding-management",
  "/feed-management",
  "/financial-dashboard",
  "/ai-intelligence-dashboard",
];

/** Extract the JSX block for a `path="…"` route, balancing tags. */
function routeBlock(path: string): string | null {
  const marker = `path="${path}"`;
  const idx = routerSource.indexOf(marker);
  if (idx === -1) return null;
  // Walk backwards to the enclosing `<Route`.
  const start = routerSource.lastIndexOf("<Route", idx);
  if (start === -1) return null;
  // Walk forwards to the matching `/>` or `</Route>`.
  const selfClosing = routerSource.indexOf("/>", idx);
  const closing = routerSource.indexOf("</Route>", idx);
  if (closing !== -1 && (selfClosing === -1 || closing < selfClosing)) {
    return routerSource.slice(start, closing + "</Route>".length);
  }
  if (selfClosing === -1) return null;
  return routerSource.slice(start, selfClosing + 2);
}

describe("dashboard route guard coverage", () => {
  test.each(GUARDED_ROUTES)("%s is wrapped in ProtectedRoute", (route) => {
    const block = routeBlock(route);
    expect(block).not.toBeNull();
    expect(block).toContain("<ProtectedRoute");
  });

  test("role-restricted dashboards declare an allow-list", () => {
    for (const route of [
      "/admin-panel",
      "/agronomist-dashboard",
      "/trader-dashboard",
      "/veterinarian-dashboard",
      "/field-inspector-dashboard",
      "/government-dashboard",
      "/investor-dashboard",
    ]) {
      const block = routeBlock(route);
      expect(block).toContain("allowedRoles");
    }
  });
});
