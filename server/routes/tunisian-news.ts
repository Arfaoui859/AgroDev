/**
 * Tunisian agricultural news API.
 *
 * GET /api/news           — paginated, searchable, filterable article list
 * GET /api/news/sources   — per-source availability status
 *
 * Articles come from real publisher RSS feeds (see tunisianAgriNews.ts). The
 * response is stamped with real-data provenance headers and carries
 * `dataSource: "rss-feeds"` / `isRealData: true`. A source that is down is
 * reported in `sources[]` and never replaced with fabricated content.
 */
import express, { Request, Response } from "express";
import { markReal } from "../lib/provenance";
import { safeErrorMessage } from "../lib/errors";
import {
  getTunisianAgriNews,
  getNewsSourceStatuses,
  NEWS_SOURCES,
  type NewsLanguage,
} from "../services/news/tunisianAgriNews";

const router = express.Router();

const LANGS: NewsLanguage[] = ["ar", "fr", "en"];

function parseLanguage(value: unknown): NewsLanguage | undefined {
  const v = String(value ?? "").toLowerCase();
  return (LANGS as string[]).includes(v) ? (v as NewsLanguage) : undefined;
}

router.get("/news", async (req: Request, res: Response) => {
  try {
    const result = await getTunisianAgriNews({
      language: parseLanguage(req.query.language),
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 12,
      agricultureOnly: req.query.agricultureOnly !== "false",
    });
    markReal(res, "rss-feeds");
    res.set("Cache-Control", "public, max-age=180");
    res.json(result);
  } catch (error) {
    // getTunisianAgriNews already isolates per-source failures; a throw here is
    // unexpected. Fail honestly rather than returning an empty success.
    res.status(502).json({
      articles: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 1,
      sources: [],
      categories: [],
      generatedAt: new Date().toISOString(),
      isRealData: false,
      dataSource: "unavailable",
      error: safeErrorMessage(error, "News aggregation failed"),
    });
  }
});

router.get("/news/sources", async (_req: Request, res: Response) => {
  // Report *measured* availability, not just the static catalogue: a source is
  // available only if its feed really returned items. This keeps the public
  // status endpoint consistent with what /api/news actually serves.
  const statuses = await getNewsSourceStatuses();
  const byId = new Map(statuses.map((s) => [s.id, s]));
  markReal(res, "rss-feeds");
  res.json({
    sources: NEWS_SOURCES.map((s) => {
      const status = byId.get(s.id);
      return {
        id: s.id,
        name: s.name,
        language: s.language,
        kind: s.kind,
        homepage: s.homepage,
        available: status?.available ?? false,
        itemCount: status?.itemCount ?? 0,
        error: status?.error,
        fetchedAt: status?.fetchedAt,
      };
    }),
    isRealData: true,
    dataSource: "rss-feeds",
  });
});

export default router;
