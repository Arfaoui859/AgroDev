/**
 * Tunisian agricultural news service tests.
 *
 * The network is mocked (no real feed is contacted) but the real service logic
 * runs: parsing, agriculture filtering, dedup, search, category filter,
 * pagination and honest per-source failure reporting.
 */
import {
  getTunisianAgriNews,
  isAgricultureRelated,
  deriveCategory,
  clearNewsCache,
  NEWS_SOURCES,
} from "../../server/services/news/tunisianAgriNews";

const realFetch = global.fetch;

function rss(items: Array<{ title: string; link: string; date?: string; desc?: string }>): string {
  const body = items
    .map(
      (i) => `<item><title>${i.title}</title><link>${i.link}</link>${
        i.date ? `<pubDate>${i.date}</pubDate>` : ""
      }<description><![CDATA[${i.desc ?? ""}]]></description></item>`,
    )
    .join("");
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Feed</title>${body}</channel></rss>`;
}

function mockByUrl(map: Record<string, string | number>): void {
  global.fetch = jest.fn(async (input: any) => {
    const url = String(typeof input === "string" ? input : input.url);
    const match = Object.keys(map).find((key) => url.includes(key));
    if (!match) return new Response("", { status: 404 });
    const value = map[match];
    if (typeof value === "number") return new Response("", { status: value });
    return new Response(value, { status: 200, headers: { "Content-Type": "application/rss+xml" } });
  }) as unknown as typeof fetch;
}

describe("tunisianAgriNews", () => {
  beforeEach(() => clearNewsCache());
  afterEach(() => {
    global.fetch = realFetch;
  });

  test("keeps real publisher provenance on every article", async () => {
    mockByUrl({
      "lapresse.tn/feed": rss([
        { title: "Récolte de blé record", link: "https://lapresse.tn/1", date: "Wed, 11 Nov 2026 21:08:10 +0000" },
      ]),
    });
    const result = await getTunisianAgriNews({ agricultureOnly: false });
    const article = result.articles.find((a) => a.sourceId === "la-presse")!;
    expect(article).toBeTruthy();
    expect(article.link).toBe("https://lapresse.tn/1");
    expect(article.sourceName).toBe("La Presse de Tunisie");
    expect(article.sourceUrl).toBe("https://lapresse.tn");
    expect(article.publishedAt).toBe("2026-11-11T21:08:10.000Z");
    expect(result.isRealData).toBe(true);
    expect(result.dataSource).toBe("rss-feeds");
  });

  test("reports a failing source as unavailable and still returns the others", async () => {
    mockByUrl({
      "lapresse.tn/feed": rss([{ title: "Blé: bonne récolte", link: "https://lapresse.tn/1" }]),
      "businessnews.com.tn": 500,
    });
    const result = await getTunisianAgriNews();
    const down = result.sources.find((s) => s.id === "business-news")!;
    expect(down.available).toBe(false);
    expect(down.error).toBeTruthy();
    const up = result.sources.find((s) => s.id === "la-presse")!;
    expect(up.available).toBe(true);
    expect(result.articles.length).toBeGreaterThan(0);
  });

  test("never fabricates articles when every source fails", async () => {
    mockByUrl({});
    const result = await getTunisianAgriNews();
    expect(result.articles).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.sources.every((s) => s.available === false)).toBe(true);
    expect(result.isRealData).toBe(true); // the *source class* is real; there is simply no data
  });

  test("filters general feeds to agriculture but keeps the scoped aggregator", async () => {
    mockByUrl({
      "lapresse.tn/feed": rss([
        { title: "Récolte de blé record", link: "https://lapresse.tn/agri" },
        { title: "Match de football hier soir", link: "https://lapresse.tn/sport" },
      ]),
      "news.google.com/rss/search": rss([
        { title: "Irrigation: nouveau programme - Mosaïque FM", link: "https://news.google.com/x1" },
      ]),
    });
    const result = await getTunisianAgriNews();
    const titles = result.articles.map((a) => a.title);
    expect(titles).toContain("Récolte de blé record");
    expect(titles).not.toContain("Match de football hier soir");
    expect(titles.some((t) => t.includes("Irrigation"))).toBe(true);
  });

  test("deduplicates near-identical titles across sources", async () => {
    const dup = "La Tunisie augmente ses exportations d'huile d'olive";
    mockByUrl({
      "lapresse.tn/feed": rss([{ title: dup, link: "https://lapresse.tn/a" }]),
      "news.google.com/rss/search": rss([{ title: `${dup} - Business News`, link: "https://news.google.com/b" }]),
    });
    const result = await getTunisianAgriNews();
    const matches = result.articles.filter((a) => a.title.includes("huile d'olive"));
    expect(matches).toHaveLength(1);
  });

  test("supports search, category filter and pagination", async () => {
    mockByUrl({
      "lapresse.tn/feed": rss(
        Array.from({ length: 25 }, (_, i) => ({
          title: i % 2 === 0 ? `Blé récolte ${i}` : `Tomate marché ${i}`,
          link: `https://lapresse.tn/${i}`,
          date: `Wed, 0${(i % 9) + 1} Nov 2026 10:00:00 +0000`,
        })),
      ),
    });
    const page1 = await getTunisianAgriNews({ pageSize: 10, page: 1 });
    expect(page1.articles).toHaveLength(10);
    expect(page1.totalPages).toBeGreaterThan(1);

    const page2 = await getTunisianAgriNews({ pageSize: 10, page: 2 });
    expect(page2.articles).not.toEqual(page1.articles);

    const search = await getTunisianAgriNews({ q: "tomate", pageSize: 50 });
    expect(search.articles.every((a) => `${a.title} ${a.summary}`.toLowerCase().includes("tomate"))).toBe(true);

    const cat = await getTunisianAgriNews({ category: "céréales", pageSize: 50 });
    expect(cat.articles.length).toBeGreaterThan(0);
    expect(cat.articles.every((a) => a.categories.includes("céréales"))).toBe(true);
  });

  test("caches identical aggregate queries", async () => {
    mockByUrl({ "lapresse.tn/feed": rss([{ title: "Blé récolte", link: "https://lapresse.tn/1" }]) });
    await getTunisianAgriNews({ page: 1 });
    const callsAfterFirst = (global.fetch as jest.Mock).mock.calls.length;
    await getTunisianAgriNews({ page: 1 });
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(callsAfterFirst);
  });

  test("classifies agriculture keywords and categories", () => {
    expect(isAgricultureRelated("Récolte de blé")).toBe(true);
    expect(isAgricultureRelated("Météo des plages")).toBe(false);
    expect(isAgricultureRelated("وزارة الفلاحة تعلن")).toBe(true);
    expect(deriveCategory({ title: "Production d'huile d'olive", summary: "", categories: [] })).toBe("olive & huile");
  });

  test("Arabic word boundaries do not match inside unrelated words", () => {
    // Regression: JS `\b` treats Arabic letters as non-word chars, so a naive
    // /ري\b/ matched inside "حريقا" and /صيد/ inside "سيرين", leaking
    // non-agricultural articles into the agriculture filter.
    expect(isAgricultureRelated("هجوم يشعل حريقا بميناء روسي")).toBe(false);
    expect(isAgricultureRelated("سيرين مرابط تثير ملف التدقيق")).toBe(false);
    expect(isAgricultureRelated("المحكمة الإدارية تتسلم ملفا")).toBe(false);
    // ...but real Arabic agriculture still matches, including inflections.
    expect(isAgricultureRelated("وزارة الفلاحة تعلن عن موسم الحبوب")).toBe(true);
    expect(isAgricultureRelated("تطورات قطاع الزراعة في تونس")).toBe(true);
    expect(isAgricultureRelated("مياه الري وأسعار الزيتون")).toBe(true);
  });

  test("drops non-agricultural Arabic articles from general feeds", async () => {
    mockByUrl({
      "mosaiquefm.net/rss": rss([
        { title: "هجوم يشعل حريقا بميناء روسي", link: "https://mosaiquefm.net/world" },
        { title: "وزارة الفلاحة تعلن عن موسم الحبوب", link: "https://mosaiquefm.net/agri" },
      ]),
    });
    const result = await getTunisianAgriNews({ language: "ar" });
    const titles = result.articles.map((a) => a.title);
    expect(titles).toContain("وزارة الفلاحة تعلن عن موسم الحبوب");
    expect(titles).not.toContain("هجوم يشعل حريقا بميناء روسي");
  });

  test("exposes only real, https sources", () => {
    for (const s of NEWS_SOURCES) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.homepage).toMatch(/^https:\/\//);
      expect(s.name.length).toBeGreaterThan(0);
    }
  });
});
