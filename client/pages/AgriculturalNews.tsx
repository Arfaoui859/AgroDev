import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, Search, Newspaper, Globe2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

type NewsItem = {
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

type NewsSource = {
  id: string;
  name: string;
  url: string;
  language: string;
  kind: "live_feed" | "reference";
};

type NewsResponse = {
  success: boolean;
  data: NewsItem[];
  meta?: {
    fetchedAt: string;
    liveItemCount: number;
    sources: NewsSource[];
    sourceStatuses: Record<string, string>;
    limitations: string;
  };
};

const referenceSources: NewsSource[] = [
  { id: "apia", name: "وكالة النهوض بالاستثمارات الفلاحية (APIA)", url: "https://apia.com.tn/ar/", language: "ar", kind: "reference" },
  { id: "onagri", name: "المرصد الوطني للفلاحة (ONAGRI)", url: "https://www.onagri.tn/", language: "ar", kind: "reference" },
  { id: "agridata", name: "بوابة البيانات المفتوحة للفلاحة (Agridata)", url: "https://agridata.tn/", language: "ar", kind: "reference" },
  { id: "tap", name: "وكالة تونس إفريقيا للأنباء (TAP)", url: "https://www.tap.info.tn/ar/", language: "ar", kind: "reference" },
];

function formatDate(value: string | null) {
  if (!value) return "التاريخ غير متوفر";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "التاريخ غير متوفر";
  return new Intl.DateTimeFormat("ar-TN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function AgriculturalNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<NewsSource[]>(referenceSources);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agri-news?limit=50");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as NewsResponse;
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error("Invalid news response");
      }
      setItems(result.data);
      if (result.meta) {
        setSources(result.meta.sources);
        setStatuses(result.meta.sourceStatuses);
        setLastUpdated(result.meta.fetchedAt);
      }
    } catch {
      setError("تعذّر جلب الأخبار الحيّة حالياً. تنجم تفتح بوابات المصادر الرسمية مباشرة من القائمة.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      `${item.title} ${item.summary} ${item.source}`.toLocaleLowerCase().includes(term),
    );
  }, [items, query]);

  const connectedSources = sources.filter((source) => source.kind === "live_feed");

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6" dir="rtl">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-green-700">
            <Newspaper className="h-6 w-6" />
            <span className="text-sm font-semibold">AgroGrowth • تونس</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">الأخبار الفلاحية التونسية</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            مستجدات القطاع الفلاحي، الإنتاج، المياه، التصدير، الاستثمار والبحث الزراعي من مصادر تونسية.
          </p>
        </div>
        <Button onClick={() => void loadNews()} disabled={loading} variant="outline">
          <RefreshCw className={`ml-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث الأخبار
        </Button>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div><p className="text-sm text-muted-foreground">أخبار مباشرة محمّلة</p><p className="mt-1 text-2xl font-bold">{items.length}</p></div>
            <Newspaper className="h-7 w-7 text-green-700" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div><p className="text-sm text-muted-foreground">مصادر بثّ مباشر</p><p className="mt-1 text-2xl font-bold">{connectedSources.length}</p></div>
            <Globe2 className="h-7 w-7 text-blue-700" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">آخر محاولة تحديث</p>
            <p className="mt-1 text-sm font-semibold">{lastUpdated ? formatDate(lastUpdated) : "—"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="فتّش في أخبار الزيتون، الحبوب، التمور، المياه..." className="pr-9" />
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">آخر الأخبار</h2>
          <Badge variant="secondary">المصدر الأصلي محفوظ</Badge>
        </div>
        {loading && items.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((key) => <div key={key} className="h-36 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card><CardContent className="p-8 text-center">
            <Newspaper className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">{items.length === 0 ? "ما فماش أخبار مباشرة متاحة توا" : "ما لقيناش أخبار تطابق البحث"}</p>
            <p className="mt-1 text-sm text-muted-foreground">استعمل روابط المصادر التونسية الرسمية والمختصة لتثبت آخر المستجدات.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredItems.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.source}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(item.publishedAt)}</span>
                  </div>
                  <CardTitle className="text-base leading-7">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  {item.summary && <CardDescription className="line-clamp-3 leading-6">{item.summary}</CardDescription>}
                  <div className="mt-auto pt-4">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                      اقرأ الخبر في المصدر <ExternalLink className="mr-2 h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {connectedSources.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">حالة مصادر الأخبار المباشرة</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {connectedSources.map((source) => {
              const status = statuses[source.id] ?? "unknown";
              return (
                <Card key={source.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{source.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{source.url}</p>
                    </div>
                    <Badge variant={status === "connected" ? "default" : "secondary"}>
                      {status === "connected" ? "متصل" : status === "reference_only" ? "مرجع" : status === "unknown" ? "غير معروف" : "غير متاح"}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">بوابات ومراجع تونسية</h2>
          <p className="text-sm text-muted-foreground">مصادر إضافية للبلاغات الرسمية، الإحصائيات، الاستثمار والبيانات المفتوحة.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sources.filter((source) => source.kind === "reference").map((source) => (
            <Card key={source.id}>
              <CardContent className="flex h-full flex-col p-4">
                <p className="text-sm font-semibold leading-6">{source.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">بوابة مرجعية • ليست بالضرورة مربوطة ببثّ حي</p>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center text-sm text-primary hover:underline">
                  زيارة الموقع <ExternalLink className="mr-2 h-3.5 w-3.5" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        الأخبار تُعرض بعناوين وملخصات قصيرة مع رابط المصدر الأصلي. حالة المصدر ظاهرة في واجهة الـAPI؛ عدم ظهور خبر لا يعني عدم صدور بلاغ رسمي. القرارات الصحية والدوائية والبلاغات العاجلة يلزم التثبت منها عند الجهة المصدرة.
      </p>
    </main>
  );
}
