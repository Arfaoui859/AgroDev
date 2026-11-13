/**
 * Tunisian agricultural news API route test.
 *
 * Boots the real Express app and asserts the wire contract: real-data
 * provenance headers, the `rss-feeds` data source, and that a fully-down
 * source set degrades to an honest empty result rather than fabricated news.
 * The outbound fetch is stubbed so the suite does not hit the network.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { clearNewsCache } from "../../server/services/news/tunisianAgriNews";

const realFetch = global.fetch;

function rss(items: Array<{ title: string; link: string; date?: string }>): string {
  const body = items
    .map(
      (i) =>
        `<item><title>${i.title}</title><link>${i.link}</link>${
          i.date ? `<pubDate>${i.date}</pubDate>` : ""
        }</item>`,
    )
    .join("");
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>F</title>${body}</channel></rss>`;
}

describe("GET /api/news", () => {
  let app: express.Application;

  beforeAll(() => {
    app = createServer();
  });

  beforeEach(() => clearNewsCache());
  afterEach(() => {
    global.fetch = realFetch;
  });

  test("returns real-data provenance headers and attributed articles", async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        rss([{ title: "Récolte de blé record en Tunisie", link: "https://lapresse.tn/1", date: "Wed, 11 Nov 2026 10:00:00 +0000" }]),
        { status: 200, headers: { "Content-Type": "application/rss+xml" } },
      ),
    ) as unknown as typeof fetch;

    const res = await request(app).get("/api/news?pageSize=5").expect(200);
    expect(res.headers["x-is-real-data"]).toBe("true");
    expect(res.headers["x-data-provenance"]).toBe("rss-feeds");
    expect(res.body.dataSource).toBe("rss-feeds");
    expect(res.body.isRealData).toBe(true);
    const article = res.body.articles.find((a: any) => a.sourceId === "la-presse");
    expect(article.link).toBe("https://lapresse.tn/1");
    expect(article.sourceName).toBeTruthy();
    expect(article.publishedAt).toBe("2026-11-11T10:00:00.000Z");
  });

  test("degrades to an honest empty list when all sources fail", async () => {
    global.fetch = jest.fn(async () => new Response("", { status: 503 })) as unknown as typeof fetch;
    const res = await request(app).get("/api/news").expect(200);
    expect(res.body.articles).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.sources.every((s: any) => s.available === false)).toBe(true);
  });

  test("keeps the full category facet list when a category filter is applied", async () => {
    // Two articles in different categories from one feed. Filtering by one
    // category must not collapse the dropdown to that single option — the
    // other available categories have to remain selectable.
    global.fetch = jest.fn(async () =>
      new Response(
        rss([
          { title: "Récolte de blé record en Tunisie", link: "https://lapresse.tn/wheat" },
          { title: "Export d'huile d'olive en hausse", link: "https://lapresse.tn/olive" },
        ]),
        { status: 200, headers: { "Content-Type": "application/rss+xml" } },
      ),
    ) as unknown as typeof fetch;

    const res = await request(app).get("/api/news?category=c%C3%A9r%C3%A9ales").expect(200);
    expect(res.body.categories).toContain("céréales");
    expect(res.body.categories).toContain("olive & huile");
  });

  test("exposes the configured sources with their languages", async () => {
    const res = await request(app).get("/api/news/sources").expect(200);
    expect(res.body.isRealData).toBe(true);
    expect(Array.isArray(res.body.sources)).toBe(true);
    expect(res.body.sources.length).toBeGreaterThan(0);
    for (const s of res.body.sources) {
      expect(["ar", "fr", "en"]).toContain(s.language);
    }
  });

  test("reports measured source availability, not an assumed catalogue", async () => {
    // With the feed transport forced to fail, every source must be reported
    // unavailable — the status endpoint may not claim reachability it has not
    // verified. A catalogue entry without a live fetch is not "available".
    global.fetch = jest.fn(async () => new Response("", { status: 503 })) as unknown as typeof fetch;
    const res = await request(app).get("/api/news/sources").expect(200);
    for (const s of res.body.sources) {
      expect(typeof s.available).toBe("boolean");
      expect(s.available).toBe(false);
      expect(s.itemCount).toBe(0);
    }
  });
});
