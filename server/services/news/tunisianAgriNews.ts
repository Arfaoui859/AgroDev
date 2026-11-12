/**
 * Tunisian agricultural news.
 *
 * Real sources only. Every article carries its publisher, its original link and
 * its publication date. When a source is unreachable it is reported as such and
 * the remaining sources still return — no article is ever fabricated and no
 * placeholder is shown in place of a failed feed.
 *
 * Two kinds of source are supported:
 *   - "direct": an outlet's own RSS feed (original article links).
 *   - "aggregator": a search feed (Google News RSS) that aggregates coverage of
 *     Tunisian agriculture from many outlets; each item keeps its publisher name
 *     and its publisher URL as attribution.
 *
 * Results are cached in-memory with a TTL so the UI cannot hammer the outlets.
 */
import { fetchText } from "../providers/http";
import { parseFeed, type ParsedFeedItem } from "../../lib/rssParser";

export type NewsLanguage = "ar" | "fr" | "en";

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  language: NewsLanguage;
  kind: "direct" | "aggregator";
  homepage: string;
}

/** Real, verified-working Tunisian sources. Order is the display order. */
export const NEWS_SOURCES: NewsSource[] = [
  {
    id: "la-presse",
    name: "La Presse de Tunisie",
    url: "https://www.lapresse.tn/feed/",
    language: "fr",
    kind: "direct",
    homepage: "https://www.lapresse.tn",
  },
  {
    id: "business-news",
    name: "Business News",
    url: "https://businessnews.com.tn/feed/",
    language: "fr",
    kind: "direct",
    homepage: "https://businessnews.com.tn",
  },
  {
    id: "african-manager",
    name: "African Manager",
    url: "https://africanmanager.com/feed/",
    language: "fr",
    kind: "direct",
    homepage: "https://africanmanager.com",
  },
  {
    id: "mosaique-fm",
    name: "Mosaïque FM",
    url: "https://www.mosaiquefm.net/rss",
    language: "ar",
    kind: "direct",
    homepage: "https://www.mosaiquefm.net",
  },
  {
    id: "gnews-fr",
    name: "Google News — agriculture Tunisie",
    url: "https://news.google.com/rss/search?q=agriculture+Tunisie&hl=fr&gl=TN&ceid=TN:fr",
    language: "fr",
    kind: "aggregator",
    homepage: "https://news.google.com",
  },
  {
    id: "gnews-ar",
    name: "Google News — الفلاحة تونس",
    url: "https://news.google.com/rss/search?q=%D8%A7%D9%84%D9%81%D9%84%D8%A7%D8%AD%D8%A9+%D8%AA%D9%88%D9%86%D8%B3&hl=ar&gl=TN&ceid=TN:ar",
    language: "ar",
    kind: "aggregator",
    homepage: "https://news.google.com",
  },
];

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  publishedAt: string | null;
  summary: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  language: NewsLanguage;
  /** Curated display category (single, derived). Used for the UI facet. */
  categories: string[];
  /** Raw publisher feed categories. Used only for agriculture classification. */
  feedCategories: string[];
  author: string | null;
}

export interface NewsSourceStatus {
  id: string;
  name: string;
  language: NewsLanguage;
  kind: NewsSource["kind"];
  available: boolean;
  itemCount: number;
  error?: string;
  fetchedAt: string;
}

export interface NewsResult {
  articles: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sources: NewsSourceStatus[];
  categories: string[];
  generatedAt: string;
  /** Always true for this feature: articles come from real publisher feeds. */
  isRealData: true;
  dataSource: "rss-feeds";
}

/**
 * Arabic keywords cannot use `\b`: JavaScript treats Arabic letters as
 * non-word characters, so `\b` matches at every Arabic character boundary and
 * a short token like "ري" matches inside unrelated words ("حريقا", "سيرين").
 * These helpers build Unicode-aware boundaries instead. `prefix: true` matches
 * inflected forms ("زراع" → "زراعة", "الزراعية"); otherwise a full token is
 * required.
 */
const AR_LETTER = "[\\u0621-\\u064A\\u0660-\\u0669\\u066E-\\u06FF]";
const ar = (body: string, opts: { prefix?: boolean } = {}): RegExp =>
  new RegExp(`(?<!${AR_LETTER})(?:ال)?${body}${opts.prefix ? "" : `(?!${AR_LETTER})`}`);

const AGRICULTURE_KEYWORDS: RegExp[] = [
  // French
  /\bagricultur/i,
  /\bagricol/i,
  /\br[ée]colte/i,
  /\bsemis\b/i,
  /\bc[ée]r[ée]alicult/i,
  /\bbl[ée]\b/i,
  /\boliv/i,
  /\bhuile d'olive/i,
  /\btomate/i,
  /\bpomme de terre/i,
  /\bagrume/i,
  /\birrigation/i,
  /\bs[ée]cheresse/i,
  /\bengrais/i,
  /\bpesticide/i,
  /\b[ée]levage/i,
  /\bb[ée]tail/i,
  /\baviculture/i,
  /\bp[êe]che\b/i,
  /\bfor[êe]t/i,
  /\bparcelle/i,
  /\bmoisson/i,
  /\bONAGRI\b/i,
  /\bAPIA\b/i,
  /\bINGC\b/i,
  /\bCRDA\b/i,
  /\bcampagne agricole/i,
  /\barboriculture/i,
  /\bmara[îi]chage/i,
  /\bsemence/i,
  /\bfertilisant/i,
  /\bterres?\b/i,
  // Arabic (Unicode-aware boundaries; see helper above)
  ar("فلاح", { prefix: true }),
  ar("زراع", { prefix: true }),
  ar("محصول", { prefix: true }),
  ar("محاصيل", { prefix: true }),
  ar("حبوب", { prefix: true }),
  ar("قمح"),
  ar("زيتون", { prefix: true }),
  ar("تربة", { prefix: true }),
  ar("حصاد", { prefix: true }),
  ar("بذور", { prefix: true }),
  ar("بذار", { prefix: true }),
  ar("دواجن", { prefix: true }),
  ar("مبيد", { prefix: true }),
  ar("سماد", { prefix: true }),
  ar("أسمدة", { prefix: true }),
  ar("اسمدة", { prefix: true }),
  ar("مواشي", { prefix: true }),
  ar("ماشية", { prefix: true }),
  ar("غابات", { prefix: true }),
  ar("مناخ", { prefix: true }),
  ar("جفاف"),
  ar("مطر"),
  ar("ري"),
  ar("سقي"),
  ar("مياه"),
  ar("تسميد", { prefix: true }),
  ar("وزارة الفلاحة"),
  ar("ديوان الحبوب"),
  // English (some aggregator items)
  /\bcrops?\b/i,
  /\bharvest/i,
  /\bwheat\b/i,
  /\bolives?\b/i,
  /\blivestock\b/i,
  /\bpoultry\b/i,
  /\bfishery|fisheries\b/i,
  /\bdrought\b/i,
  /\bfertilizer/i,
];

export function isAgricultureRelated(text: string): boolean {
  if (!text) return false;
  return AGRICULTURE_KEYWORDS.some((re) => re.test(text));
}

function normaliseTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+-\s+[^-]+$/, "") // strip trailing " - Publisher" on aggregator titles
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function articleId(sourceId: string, item: ParsedFeedItem): string {
  const key = normaliseTitleKey(item.title).slice(0, 120) || item.link;
  return `${sourceId}:${key}`;
}

/** Derive a coarse category from feed categories and title keywords. */
const CATEGORY_RULES: Array<{ category: string; re: RegExp }> = [
  { category: "céréales", re: /bl[ée]|c[ée]r[ée]al|قمح|حبوب|wheat|barley|orge/i },
  { category: "olive & huile", re: /oliv|زيتون|huile d'olive/i },
  { category: "maraîchage", re: /tomate|pomme de terre|mara[îi]ch|طماطم|بطاطا|خضر/i },
  { category: "arboriculture", re: /agrume|arbre fruitier|arboricult|نخيل|حوامض|فاكه/i },
  { category: "élevage", re: /[ée]levage|b[ée]tail|avicult|lait|مواشي|ماشية|دواجن|أبقار|حليب/i },
  { category: "pêche", re: /p[êe]che|poisson|أسماك/i },
  { category: "irrigation & eau", re: /irrigation|\beau\b|s[ée]cheresse|جفاف|مياه|مطر|سقي/i },
  { category: "marché & export", re: /export|march[ée]|prix|تصدير|سوق|أسعار|مردودية/i },
  { category: "climat", re: /climat|m[ée]t[ée]o|s[ée]cheresse|طقس|مناخ/i },
];

export function deriveCategory(item: { title: string; summary: string; categories: string[] }): string {
  const haystack = `${item.title} ${item.summary} ${item.categories.join(" ")}`;
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(haystack)) return rule.category;
  }
  return "agriculture";
}

/** The stable, curated facet list offered to the UI (the generic bucket last). */
const DERIVED_CATEGORIES: string[] = [
  ...CATEGORY_RULES.map((r) => r.category),
  "agriculture",
];

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const sourceCache = new Map<string, CacheEntry<{ articles: NewsArticle[]; status: NewsSourceStatus }>>();
const aggregateCache = new Map<string, CacheEntry<NewsResult>>();

const SOURCE_TTL_MS = Number(process.env.NEWS_SOURCE_TTL_MS) || 10 * 60 * 1000;
const AGGREGATE_TTL_MS = Number(process.env.NEWS_AGGREGATE_TTL_MS) || 3 * 60 * 1000;

export function clearNewsCache(): void {
  sourceCache.clear();
  aggregateCache.clear();
}

function toArticle(source: NewsSource, item: ParsedFeedItem): NewsArticle {
  const category = deriveCategory(item);
  return {
    id: articleId(source.id, item),
    title: item.title,
    link: item.link,
    publishedAt: item.publishedAt,
    summary: item.summary,
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: source.homepage,
    language: source.language,
    categories: [category],
    feedCategories: item.categories,
    author: item.author,
  };
}

async function fetchSource(source: NewsSource): Promise<{ articles: NewsArticle[]; status: NewsSourceStatus }> {
  const cached = sourceCache.get(source.id);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;

  const fetchedAt = new Date().toISOString();
  try {
    const xml = await fetchText(source.url, {
      provider: source.name,
      timeoutMs: Number(process.env.NEWS_FETCH_TIMEOUT_MS) || 9000,
      retries: Number(process.env.NEWS_FETCH_RETRIES) || 1,
      headers: { "User-Agent": "AgroGrowthNewsBot/1.0 (+https://agrogrowth.tn)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
    });
    const feed = parseFeed(xml);
    const articles = feed.items.map((item) => toArticle(source, item));
    const value = {
      articles,
      status: {
        id: source.id,
        name: source.name,
        language: source.language,
        kind: source.kind,
        available: true,
        itemCount: articles.length,
        fetchedAt,
      },
    };
    sourceCache.set(source.id, { value, expiresAt: now + SOURCE_TTL_MS });
    return value;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 200) : "unknown error";
    const value = {
      articles: [] as NewsArticle[],
      status: {
        id: source.id,
        name: source.name,
        language: source.language,
        kind: source.kind,
        available: false,
        itemCount: 0,
        error: message,
        fetchedAt,
      },
    };
    // Cache the failure briefly so a down source is not retried on every request.
    sourceCache.set(source.id, { value, expiresAt: now + Math.min(SOURCE_TTL_MS, 60_000) });
    return value;
  }
}

export interface NewsQuery {
  language?: NewsLanguage;
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  /** When false, direct general-news feeds are not filtered to agriculture. */
  agricultureOnly?: boolean;
}

function dedupe(articles: NewsArticle[]): NewsArticle[] {
  const seenTitle = new Set<string>();
  const seenLink = new Set<string>();
  const out: NewsArticle[] = [];
  for (const article of articles) {
    const titleKey = normaliseTitleKey(article.title);
    const linkKey = article.link.replace(/[?#].*$/, "");
    if ((titleKey && seenTitle.has(titleKey)) || seenLink.has(linkKey)) continue;
    if (titleKey) seenTitle.add(titleKey);
    seenLink.add(linkKey);
    out.push(article);
  }
  return out;
}

/**
 * Fetch, deduplicate, filter and paginate Tunisian agricultural news.
 * Never throws on a source failure: the failing source is reported in
 * `sources` and the rest still return.
 */
export async function getTunisianAgriNews(query: NewsQuery = {}): Promise<NewsResult> {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(query.pageSize ?? 12)));
  const agricultureOnly = query.agricultureOnly !== false;

  const aggregateKey = JSON.stringify({
    language: query.language ?? null,
    q: (query.q ?? "").trim().toLowerCase(),
    category: query.category ?? null,
    page,
    pageSize,
    agricultureOnly,
  });
  const cached = aggregateCache.get(aggregateKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const settled = await Promise.all(NEWS_SOURCES.map((source) => fetchSource(source)));
  const statuses = settled.map((s) => s.status);
  let articles = settled.flatMap((s) => s.articles);

  if (agricultureOnly) {
    articles = articles.filter((a) => {
      if (a.sourceId.startsWith("gnews-")) return true; // query already agriculture-scoped
      // Classify on the raw headline/summary/publisher categories only — never
      // on the derived category, which would let "irrigation & eau" self-match.
      return isAgricultureRelated(
        `${a.title} ${a.summary} ${a.feedCategories.join(" ")}`,
      );
    });
  }

  if (query.language) {
    articles = articles.filter((a) => a.language === query.language);
  }

  if (query.category && query.category !== "all") {
    const target = query.category.toLowerCase();
    articles = articles.filter((a) =>
      a.categories.some((c) => c.toLowerCase() === target),
    );
  }

  const q = (query.q ?? "").trim().toLowerCase();
  if (q) {
    articles = articles.filter((a) =>
      `${a.title} ${a.summary} ${a.sourceName}`.toLowerCase().includes(q),
    );
  }

  articles = dedupe(articles).sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  const total = articles.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageArticles = articles.slice(start, start + pageSize);

  const categories = DERIVED_CATEGORIES.filter((c) =>
    articles.some((a) => a.categories.includes(c)),
  );

  const result: NewsResult = {
    articles: pageArticles,
    total,
    page,
    pageSize,
    totalPages,
    sources: statuses,
    categories,
    generatedAt: new Date().toISOString(),
    isRealData: true,
    dataSource: "rss-feeds",
  };

  aggregateCache.set(aggregateKey, { value: result, expiresAt: Date.now() + AGGREGATE_TTL_MS });
  return result;
}
