import { Router } from "express";

type NewsSource = {
  id: string;
  name: string;
  url: string;
  feedUrl?: string;
  pageUrl?: string;
  language: "ar" | "fr" | "en";
  kind: "live_feed" | "reference";
};

export type AgriculturalNewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
  source: string;
  sourceId: string;
  language: string;
  category: string;
};

const SOURCES: NewsSource[] = [
  {
    id: "tunisie-agriculture",
    name: "Tunisie Agriculture",
    url: "https://tunisieagriculture.tn/",
    feedUrl: "https://tunisieagriculture.tn/feed/",
    pageUrl: "https://tunisieagriculture.tn/آخر-الأخبار/",
    language: "ar",
    kind: "live_feed",
  },
  {
    id: "apia",
    name: "وكالة النهوض بالاستثمارات الفلاحية (APIA)",
    url: "https://apia.com.tn/ar/",
    language: "ar",
    kind: "reference",
  },
  {
    id: "onagri",
    name: "المرصد الوطني للفلاحة (ONAGRI)",
    url: "https://www.onagri.tn/",
    language: "ar",
    kind: "reference",
  },
  {
    id: "agridata",
    name: "بوابة البيانات المفتوحة للفلاحة (Agridata)",
    url: "https://agridata.tn/",
    language: "ar",
    kind: "reference",
  },
  {
    id: "tap",
    name: "وكالة تونس إفريقيا للأنباء (TAP)",
    url: "https://www.tap.info.tn/ar/",
    language: "ar",
    kind: "reference",
  },
];

const AGRICULTURE_TERMS =
  /فلاح|فلاح[ية]|زراع|محصول|محاصيل|حبوب|زيتون|زيت الزيتون|تمور|تمور|ريّ|الري|مياه|سدود|بذور|أسمدة|تربة|مبيدات|آفات|مواشي|أبقار|أغنام|صيد بحري|agricultur|agricole|agronom|récolte|olivier|huile d'olive|dattes|irrigation|semence|engrais|sols?|pesticide|élevage|pêche|harvest|olive|dates|irrigation|crops?/i;

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(xml: string, tag: string): string {
  const match = xml.match(
    new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}\\s*>`, "i"),
  );
  return match ? decodeXml(match[1]) : "";
}

function safeArticleUrl(raw: string, sourceUrl: string): string | null {
  try {
    const candidate = new URL(raw, sourceUrl);
    const source = new URL(sourceUrl);
    if (
      !["http:", "https:"].includes(candidate.protocol) ||
      candidate.hostname !== source.hostname ||
      candidate.username ||
      candidate.password
    ) {
      return null;
    }
    return candidate.toString();
  } catch {
    return null;
  }
}

export function parseAgriculturalRss(
  xml: string,
  source: Pick<NewsSource, "id" | "name" | "url" | "language">,
): AgriculturalNewsItem[] {
  const blocks = [
    ...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi),
  ];
  const items: AgriculturalNewsItem[] = [];

  for (const match of blocks) {
    const block = match[2];
    const title = readTag(block, "title");
    const rawLink = readTag(block, "link") ||
      (block.match(/<link\b[^>]*href=["']([^"']+)["']/i)?.[1] ?? "");
    const url = safeArticleUrl(rawLink, source.url);
    if (!title || !url || !AGRICULTURE_TERMS.test(title)) continue;

    const rawDate =
      readTag(block, "pubDate") ||
      readTag(block, "published") ||
      readTag(block, "updated") ||
      readTag(block, "dc:date");
    const parsedDate = rawDate ? new Date(rawDate) : null;
    const publishedAt =
      parsedDate && Number.isFinite(parsedDate.getTime())
        ? parsedDate.toISOString()
        : null;
    const summary = readTag(block, "description") ||
      readTag(block, "summary") ||
      readTag(block, "content");

    items.push({
      id: `${source.id}:${url}`,
      title: title.slice(0, 240),
      summary: summary.slice(0, 360),
      url,
      publishedAt,
      source: source.name,
      sourceId: source.id,
      language: source.language,
      category: "agriculture",
    });
    if (items.length >= 30) break;
  }

  return items;
}

export function parseAgriculturalHtml(
  html: string,
  source: Pick<NewsSource, "id" | "name" | "url" | "language">,
): AgriculturalNewsItem[] {
  const anchors = [...html.matchAll(/<a\\b[^>]*href=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/a\\s*>/gi)];
  const seen = new Set<string>();
  const items: AgriculturalNewsItem[] = [];
  for (const match of anchors) {
    const title = decodeXml(match[2]);
    const url = safeArticleUrl(match[1], source.url);
    if (!title || title.length < 12 || !url || !AGRICULTURE_TERMS.test(title) || seen.has(url)) continue;
    seen.add(url);
    items.push({
      id: `${source.id}:${url}`,
      title: title.slice(0, 240),
      summary: "",
      url,
      publishedAt: null,
      source: source.name,
      sourceId: source.id,
      language: source.language,
      category: "agriculture",
    });
    if (items.length >= 30) break;
  }
  return items;
}

const router = Router();
let cache: { expiresAt: number; items: AgriculturalNewsItem[]; statuses: Record<string, string> } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function fetchSource(source: NewsSource) {
  if (!source.feedUrl && !source.pageUrl) {
    return { items: [] as AgriculturalNewsItem[], status: "reference_only" };
  }

  if (source.feedUrl) {
    try {
      const response = await fetch(source.feedUrl, {
        headers: {
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
          "User-Agent": "AgroGrowthNews/1.0 (+https://agrogrowth.tn)",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const xml = await response.text();
        if (/<(?:rss|feed|rdf:RDF)\\b/i.test(xml)) {
          return { items: parseAgriculturalRss(xml, source), status: "connected_rss" };
        }
      }
    } catch {
      // Fall through to the public news listing; never fabricate fallback items.
    }
  }

  if (source.pageUrl) {
    try {
      const response = await fetch(source.pageUrl, {
        headers: { Accept: "text/html", "User-Agent": "AgroGrowthNews/1.0 (+https://agrogrowth.tn)" },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const html = await response.text();
        const items = parseAgriculturalHtml(html, source);
        return { items, status: items.length ? "connected_html" : "connected_empty" };
      }
      return { items: [] as AgriculturalNewsItem[], status: `http_${response.status}` };
    } catch {
      return { items: [] as AgriculturalNewsItem[], status: "unavailable" };
    }
  }

  return { items: [] as AgriculturalNewsItem[], status: "unavailable" };
}

router.get("/", async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit ?? 30);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(50, Math.max(1, Math.floor(requestedLimit)))
      : 30;

    if (!cache || cache.expiresAt <= Date.now()) {
      const liveSources = SOURCES.filter((source) => source.kind === "live_feed");
      const results = await Promise.all(
        liveSources.map(async (source) => ({
          source,
          result: await fetchSource(source),
        })),
      );
      const statuses: Record<string, string> = {};
      const items = results.flatMap(({ source, result }) => {
        statuses[source.id] = result.status;
        return result.items;
      });
      items.sort((a, b) => {
        if (!a.publishedAt) return 1;
        if (!b.publishedAt) return -1;
        return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
      });
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, items, statuses };
    }

    const category = typeof req.query.category === "string"
      ? req.query.category.trim().toLowerCase()
      : "";
    const search = typeof req.query.q === "string"
      ? req.query.q.trim().toLowerCase().slice(0, 80)
      : "";
    const filtered = cache.items.filter((item) => {
      const matchesCategory =
        !category || category === "all" || item.category === category;
      const matchesSearch =
        !search ||
        `${item.title} ${item.summary} ${item.source}`.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json({
      success: true,
      data: filtered.slice(0, limit),
      meta: {
        region: "Tunisia",
        fetchedAt: new Date().toISOString(),
        cacheExpiresAt: new Date(cache.expiresAt).toISOString(),
        liveItemCount: cache.items.length,
        sources: SOURCES,
        sourceStatuses: cache.statuses,
        limitations:
          "Only headlines and short feed summaries are shown. Reference portals are links, not live-connected feeds. Verify urgent notices with the issuing authority.",
      },
    });
  } catch {
    return res.status(503).json({
      success: false,
      error: "تعذّر جلب الأخبار الفلاحية حالياً",
      data: [],
    });
  }
});

router.get("/sources", (_req, res) => {
  res.json({
    success: true,
    data: SOURCES,
    note: "The listed portals are source references. Only sources marked live_feed are fetched automatically.",
  });
});

export default router;
