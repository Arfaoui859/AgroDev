import { parseFeed, decodeEntities, toPlainText } from "../../server/lib/rssParser";

describe("rssParser", () => {
  test("decodes named and numeric entities", () => {
    expect(decodeEntities("Bl&eacute; &amp; huile &#233; &#xE9;")).toBe("Blé & huile é é");
  });

  test("strips tags, scripts and CDATA from text", () => {
    const html = "<![CDATA[<p>Bonjour <script>alert(1)</script>le <b>monde</b></p>]]>";
    expect(toPlainText(html)).toBe("Bonjour le monde");
  });

  test("parses an RSS 2.0 feed", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel>
      <title>La Presse</title><language>fr-FR</language>
      <item>
        <title>Récolte record de blé en Tunisie</title>
        <link>https://lapresse.tn/a</link>
        <pubDate>Wed, 11 Nov 2026 21:08:10 +0000</pubDate>
        <category><![CDATA[Agriculture]]></category>
        <description><![CDATA[<p>Une récolte record.</p>]]></description>
      </item>
    </channel></rss>`;
    const feed = parseFeed(xml);
    expect(feed.title).toBe("La Presse");
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].title).toBe("Récolte record de blé en Tunisie");
    expect(feed.items[0].link).toBe("https://lapresse.tn/a");
    expect(feed.items[0].publishedAt).toBe("2026-11-11T21:08:10.000Z");
    expect(feed.items[0].summary).toBe("Une récolte record.");
    expect(feed.items[0].categories).toContain("Agriculture");
  });

  test("parses an Atom feed", () => {
    const xml = `<?xml version="1.0"?><feed xml:lang="ar">
      <title>أخبار</title>
      <entry>
        <title>موسم فلاحي جيد</title>
        <link rel="alternate" href="https://example.tn/x"/>
        <updated>2026-11-10T08:00:00Z</updated>
        <summary>ملخص الخبر</summary>
        <category term="agriculture"/>
      </entry>
    </feed>`;
    const feed = parseFeed(xml);
    expect(feed.language).toBe("ar");
    expect(feed.items[0].link).toBe("https://example.tn/x");
    expect(feed.items[0].categories).toContain("agriculture");
  });

  test("returns no items for an unrecognised document instead of throwing", () => {
    expect(parseFeed("<html><body>not a feed</body></html>").items).toEqual([]);
  });

  test("skips items without a title or link", () => {
    const xml = `<rss><channel><item><title>No link</title></item></channel></rss>`;
    expect(parseFeed(xml).items).toEqual([]);
  });
});
