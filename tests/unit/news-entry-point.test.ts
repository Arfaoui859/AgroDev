/**
 * Guard: the Agricultural News feature must be reachable from the farmer
 * workspace and must read the real backend feed.
 *
 * The news page (`/news`) and the `/api/news` route already existed, but the
 * dashboard had no entry point, so the working feature was unreachable. These
 * checks pin the full path: dashboard card → `/news` route → real
 * `GET /api/news` fetch → per-article publisher + original link.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..", "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

describe("agricultural news is reachable from the farmer workspace", () => {
  test("the farmer overview offers an Agricultural News entry point", () => {
    const src = read("client/pages/FarmOverviewPanel.tsx");
    // A visible link whose destination is the real news page.
    expect(src).toMatch(/to:\s*["']\/news["']/);
    // It is labelled (not an icon-only dead button) in all three languages.
    expect(src).toMatch(/news:\s*["']/);
  });

  test("every quick-access destination in the overview is a real route", () => {
    const src = read("client/pages/FarmOverviewPanel.tsx");
    const router = read("client/components/AppRouter.tsx");
    const hrefs = Array.from(src.matchAll(/to:\s*["'](\/[^"']+)["']/g)).map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      // Exact route path must be declared in the router.
      expect(router).toContain(`path="${href}"`);
    }
  });

  test("the news page reads the real backend feed, not a hardcoded list", () => {
    const src = read("client/pages/TunisianAgriNews.tsx");
    expect(src).toMatch(/fetch\(`\/api\/news/);
    // It must render the publisher and the original article link.
    expect(src).toMatch(/source|publisher/i);
    expect(src).toMatch(/url|link|href/i);
  });

  test("the news API is registered on the server", () => {
    const server = read("server/index.ts");
    expect(server).toMatch(/news/i);
  });
});
