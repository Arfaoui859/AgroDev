/**
 * Opt-in LIVE probe for the real Tunisian agricultural news sources.
 *
 * These tests make real network calls to publisher RSS feeds, so they are
 * skipped by default (matching the other tests in this directory). Enable:
 *
 *   NEWS_LIVE_TESTS=1 npx jest tests/live/news-live-probe.test.ts
 *
 * A pass here is the only thing that may be reported as LIVE VERIFIED.
 */
import { getTunisianAgriNews } from "../../server/services/news/tunisianAgriNews";

const liveEnabled = process.env.NEWS_LIVE_TESTS === "1";
const describeLive = liveEnabled ? describe : describe.skip;

jest.setTimeout(60000);

describeLive("🔴 LIVE Tunisian agricultural news sources", () => {
  test("fetches real articles with publisher attribution and original links", async () => {
    const r = await getTunisianAgriNews({ page: 1, pageSize: 10 });
    console.log("total:", r.total, "sources:", r.sources.length);
    for (const s of r.sources) {
      console.log(`  [${s.available ? "OK " : "ERR"}] ${s.name} items=${s.itemCount} ${s.error ?? ""}`);
    }
    for (const a of r.articles.slice(0, 6)) {
      console.log(`  • ${a.sourceName} | ${a.publishedAt} | ${a.title.slice(0, 60)} | ${a.link.slice(0, 60)}`);
    }
    expect(r.articles.length).toBeGreaterThan(0);
    for (const a of r.articles) {
      expect(a.link).toMatch(/^https?:\/\//);
      expect(a.sourceName.length).toBeGreaterThan(0);
    }
  });
});
