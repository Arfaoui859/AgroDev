import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  AlertTriangle,
  Calendar,
  ExternalLink,
  Loader2,
  Newspaper,
  RefreshCw,
  Search,
} from "lucide-react";

/**
 * Tunisian agricultural news.
 *
 * Articles come from real publisher RSS feeds via `GET /api/news` (each carries
 * its publisher, original link and publication date). When a source is down it
 * is listed in the "sources" panel as unavailable — the page never shows
 * fabricated articles in its place.
 */

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  publishedAt: string | null;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  language: "ar" | "fr" | "en";
  categories: string[];
}

interface NewsSourceStatus {
  id: string;
  name: string;
  language: "ar" | "fr" | "en";
  kind: "direct" | "aggregator";
  available: boolean;
  itemCount: number;
  error?: string;
}

interface NewsResponse {
  articles: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sources: NewsSourceStatus[];
  categories: string[];
  generatedAt: string;
  isRealData: boolean;
  dataSource: string;
}

const COPY = {
  ar: {
    title: "الأخبار الفلاحية التونسية",
    subtitle: "أخبار حقيقية من مصادر صحفية تونسية، مع اسم المصدر والرابط الأصلي وتاريخ النشر.",
    search: "ابحث في العناوين…",
    allCategories: "كل الأصناف",
    allLanguages: "كل اللغات",
    retry: "إعادة المحاولة",
    loading: "جارٍ تحميل الأخبار…",
    empty: "لا توجد أخبار مطابقة حالياً.",
    error: "تعذّر تحميل الأخبار. لم يتم عرض أي خبر غير حقيقي.",
    sources: "حالة المصادر",
    available: "متاح",
    unavailable: "غير متاح",
    readMore: "قراءة الخبر كاملاً",
    previous: "السابق",
    next: "التالي",
    page: "صفحة",
    of: "من",
    updated: "آخر تحديث",
  },
  fr: {
    title: "Actualités agricoles tunisiennes",
    subtitle: "Articles réels issus de sources tunisiennes, avec éditeur, lien d'origine et date de publication.",
    search: "Rechercher dans les titres…",
    allCategories: "Toutes catégories",
    allLanguages: "Toutes langues",
    retry: "Réessayer",
    loading: "Chargement des actualités…",
    empty: "Aucun article correspondant pour le moment.",
    error: "Impossible de charger les actualités. Aucun article fabriqué n'est affiché.",
    sources: "État des sources",
    available: "Disponible",
    unavailable: "Indisponible",
    readMore: "Lire l'article complet",
    previous: "Précédent",
    next: "Suivant",
    page: "Page",
    of: "sur",
    updated: "Mis à jour",
  },
  en: {
    title: "Tunisian agricultural news",
    subtitle: "Real articles from Tunisian outlets, with publisher, original link and publication date.",
    search: "Search headlines…",
    allCategories: "All categories",
    allLanguages: "All languages",
    retry: "Retry",
    loading: "Loading news…",
    empty: "No matching articles right now.",
    error: "Could not load news. No fabricated article is shown.",
    sources: "Source status",
    available: "Available",
    unavailable: "Unavailable",
    readMore: "Read full article",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    updated: "Updated",
  },
} as const;

function formatDate(value: string | null, language: string): string {
  if (!value) return "";
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return "";
  try {
    return new Intl.DateTimeFormat(language === "ar" ? "ar-TN" : language === "fr" ? "fr-TN" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString();
  }
}

const TunisianAgriNews: React.FC = () => {
  const { language, dir } = useLanguage();
  const t = COPY[language] ?? COPY.ar;

  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [langFilter, setLangFilter] = useState<"all" | "ar" | "fr" | "en">("all");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, category, langFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "12" });
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (category !== "all") params.set("category", category);
      if (langFilter !== "all") params.set("language", langFilter);
      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json: NewsResponse = await response.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, category, langFilter, reloadKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableCount = useMemo(
    () => (data?.sources ?? []).filter((s) => s.available).length,
    [data],
  );

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6" dir={dir}>
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-emerald-600" aria-hidden />
          <h1 className="text-2xl font-bold">{t.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      {/* Filters */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
            className="w-full rounded-lg border border-input bg-background py-2 text-sm ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value as typeof langFilter)}
          aria-label={t.allLanguages}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">{t.allLanguages}</option>
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={t.allCategories}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">{t.allCategories}</option>
          {(data?.categories ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t.retry}
        </button>
      </section>

      {/* Source status */}
      {data && data.sources.length > 0 && (
        <section className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              {t.sources}: {availableCount}/{data.sources.length}
            </span>
            <span>
              {t.updated}: {formatDate(data.generatedAt, language)}
            </span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {data.sources.map((s) => (
              <li
                key={s.id}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                  s.available
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-red-300 bg-red-50 text-red-800"
                }`}
                title={s.error ?? undefined}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${s.available ? "bg-emerald-500" : "bg-red-500"}`}
                  aria-hidden
                />
                {s.name} — {s.available ? t.available : t.unavailable}
                {s.available ? ` (${s.itemCount})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Body */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground" role="status">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          {t.loading}
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{t.error}</span>
        </div>
      )}

      {!loading && !error && data && data.articles.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">{t.empty}</p>
      )}

      {!loading && !error && data && data.articles.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.articles.map((article) => (
            <li
              key={article.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-emerald-700">{article.sourceName}</span>
                {article.publishedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {formatDate(article.publishedAt, language)}
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold leading-snug">{article.title}</h2>
              {article.summary && (
                <p className="line-clamp-3 text-sm text-muted-foreground">{article.summary}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {article.categories.slice(0, 3).map((c) => (
                  <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
              >
                {t.readMore}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {!loading && !error && data && data.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-input px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {t.previous}
          </button>
          <span className="text-sm text-muted-foreground">
            {t.page} {data.page} {t.of} {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            className="rounded-lg border border-input px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {t.next}
          </button>
        </nav>
      )}
    </main>
  );
};

export default TunisianAgriNews;
