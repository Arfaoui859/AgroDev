import { classifyAgriculturalNews, parseAgriculturalHtml, parseAgriculturalRss } from "../../server/routes/agri-news";

describe("Tunisian agriculture news RSS parser", () => {
  const source = {
    id: "tunisie-agriculture",
    name: "Tunisie Agriculture",
    url: "https://tunisieagriculture.tn/",
    language: "ar" as const,
  };

  it("extracts agriculture headlines and publication dates from RSS", () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item>
        <title><![CDATA[تطور صادرات زيت الزيتون التونسي]]></title>
        <link>https://tunisieagriculture.tn/olive-export/</link>
        <pubDate>Tue, 10 Nov 2026 08:00:00 +0000</pubDate>
        <description><![CDATA[معلومات حول صادرات زيت الزيتون.]]></description>
      </item>
      <item>
        <title>نتائج مباراة كرة القدم</title>
        <link>https://tunisieagriculture.tn/sport/</link>
      </item>
    </channel></rss>`;

    const items = parseAgriculturalRss(xml, source);
    expect(items).toHaveLength(1);
    expect(items[0].title).toContain("زيت الزيتون");
    expect(items[0].url).toBe("https://tunisieagriculture.tn/olive-export/");
    expect(items[0].publishedAt).toBe("2026-11-10T08:00:00.000Z");
    expect(items[0].summary).toContain("صادرات");
    expect(items[0].category).toBe("olive");
  });

  it("classifies major Tunisian agricultural topics", () => {
    expect(classifyAgriculturalNews("صادرات زيت الزيتون التونسي")).toBe("olive");
    expect(classifyAgriculturalNews("تطور صادرات التمور")).toBe("dates");
    expect(classifyAgriculturalNews("مستجدات السدود والري")).toBe("water");
    expect(classifyAgriculturalNews("بلاغ حول مرض الميلديو")).toBe("plant_health");
  });

  it("extracts article links from the Tunisian publisher listing when RSS is unavailable", () => {
    const html = `<html><body>
      <h2><a href="/olive-exports/">تطور صادرات زيت الزيتون التونسي</a></h2>
      <h2><a href="/sports/">نتائج مباراة كرة القدم</a></h2>
      <h2><a href="https://external.example/fake">أخبار زراعية عن الزيتون</a></h2>
    </body></html>`;
    const items = parseAgriculturalHtml(html, source);
    expect(items).toHaveLength(1);
    expect(items[0].title).toContain("زيت الزيتون");
    expect(items[0].url).toBe("https://tunisieagriculture.tn/olive-exports/");
    expect(items[0].publishedAt).toBeNull();
  });

  it("rejects article links outside the configured source domain", () => {
    const xml = `<rss><channel><item>
      <title>أخبار زراعية عن الزيتون</title>
      <link>https://attacker.example/fake</link>
    </item></channel></rss>`;
    expect(parseAgriculturalRss(xml, source)).toHaveLength(0);
  });

  it("returns an empty list for malformed or irrelevant feeds", () => {
    expect(parseAgriculturalRss("<rss><channel></channel></rss>", source)).toEqual([]);
    expect(parseAgriculturalRss("<html>not an RSS feed</html>", source)).toEqual([]);
  });
});
