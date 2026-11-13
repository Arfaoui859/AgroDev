import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Droplets,
  Thermometer,
  Activity,
  Leaf,
  DollarSign,
  Target,
  AlertTriangle,
  Users,
  BarChart3,
  MapPin,
  Database,
  Wheat,
  TreePine,
  Sun,
  CloudRain,
  Wind,
  Eye,
  Heart,
  RefreshCw,
} from "lucide-react";

/**
 * Farmer overview cards.
 *
 * Every figure rendered here is read from an authorised, tenant-scoped endpoint
 * and shown as the endpoint returned it. When a domain has no connected source
 * (no livestock records yet, no licensed market feed, no saved soil analysis,
 * no weather observation) the card says so explicitly instead of substituting
 * an illustrative number — a fabricated farm overview reads as measured data
 * and is exactly the dishonesty this platform forbids.
 */

type Load<T> =
  | { status: "loading" }
  | { status: "ready"; value: T }
  | { status: "unavailable"; reason: string };

// ---- Backend response shapes (only the fields we render) ------------------

interface FarmOverview {
  summary: {
    totalFarms: number;
    totalArea: number;
    totalFields: number;
    activeCrops: number;
    pendingTasks: number;
    criticalAlerts: number;
    operationalEquipment: number;
    workersPresent: number | null;
    todayRevenue: number;
    currency: string;
  };
  crops: Array<{
    id: string;
    name: string;
    nameArabic: string;
    variety: string;
    area: number;
    stage: string;
    plantedDate: string | null;
    expectedHarvest: string | null;
    soilMoisture: number | null;
    healthScore: number | null;
    healthStatus: string | null;
  }>;
  market: Array<{
    cropName: string;
    currentPrice: number;
    currency: string;
    market: string | null;
    date: string | null;
    source: string | null;
  }>;
}

interface WeatherSnapshot {
  location: { name: string; lat: number; lon: number };
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
    visibility: number;
    description: string;
  };
  forecast: {
    weekly: { averageTemp: number; totalRainfall: number; averageHumidity: number };
  };
  source: { provider: string; observationTime: string | null; isRealData: boolean };
}

interface LivestockSummary {
  totalAnimals: number;
  bySpecies: Record<string, number>;
  byHealthStatus: Record<string, number>;
  totalValue: number;
  currency: string;
  feedItemsLowStock: number;
}

interface FinancialSummary {
  totalExpenses: number;
  grossRevenue: number;
  salesCosts: number;
  totalRevenue: number;
  netProfit: number;
  expenseCount: number;
  revenueCount: number;
}

interface SoilReportRow {
  analysisId: string;
  fieldId: string | null;
  analyzedAt: string | null;
  input: Record<string, unknown> | null;
}

interface ComprehensiveOverviewCardsProps {
  isArabic?: boolean;
  onCardClick?: (cardType: string, action?: string) => void;
}

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmt = (v: number | null, digits = 0, dash = "—"): string =>
  v === null ? dash : v.toLocaleString("ar-TN", { maximumFractionDigits: digits });

const ComprehensiveOverviewCards: React.FC<ComprehensiveOverviewCardsProps> = ({
  isArabic = false,
  onCardClick,
}) => {
  const [overview, setOverview] = useState<Load<FarmOverview>>({ status: "loading" });
  const [weather, setWeather] = useState<Load<WeatherSnapshot>>({ status: "loading" });
  const [livestock, setLivestock] = useState<Load<LivestockSummary>>({ status: "loading" });
  const [finance, setFinance] = useState<Load<FinancialSummary>>({ status: "loading" });
  const [soil, setSoil] = useState<Load<SoilReportRow>>({ status: "loading" });

  const noSource = isArabic ? "لا يوجد مصدر بيانات مرتبط" : "No data source connected";

  const load = () => {
    setOverview({ status: "loading" });
    setWeather({ status: "loading" });
    setLivestock({ status: "loading" });
    setFinance({ status: "loading" });
    setSoil({ status: "loading" });

    const readJson = async (path: string): Promise<any | null> => {
      try {
        const res = await apiFetch(path);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    // Each domain loads independently so one unavailable source never blanks
    // the others.
    void (async () => {
      const body = await readJson("/api/farm-management/overview");
      setOverview(
        body?.success && body.data
          ? { status: "ready", value: body.data }
          : { status: "unavailable", reason: body?.message || noSource },
      );
    })();

    void (async () => {
      const body = await readJson("/api/weather/coordinates?lat=36.8065&lon=10.1815");
      setWeather(
        body?.current && body?.source?.isRealData
          ? { status: "ready", value: body }
          : { status: "unavailable", reason: noSource },
      );
    })();

    void (async () => {
      const body = await readJson("/api/livestock-dashboard");
      setLivestock(
        body?.success && body.data
          ? { status: "ready", value: body.data }
          : { status: "unavailable", reason: body?.message || noSource },
      );
    })();

    void (async () => {
      const body = await readJson("/api/financial-summary");
      setFinance(
        body?.success && body.data
          ? { status: "ready", value: body.data }
          : { status: "unavailable", reason: body?.message || noSource },
      );
    })();

    void (async () => {
      const body = await readJson("/api/soil-analysis/reports?limit=1");
      const row = Array.isArray(body?.data) ? body.data[0] : null;
      setSoil(
        row
          ? { status: "ready", value: row }
          : { status: "unavailable", reason: noSource },
      );
    })();
  };

  useEffect(() => {
    load();
    // Load once on mount; the retry button calls load() directly.
  }, []);

  const anyLoading =
    overview.status === "loading" ||
    weather.status === "loading" ||
    livestock.status === "loading" ||
    finance.status === "loading" ||
    soil.status === "loading";

  if (anyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{isArabic ? "جاري التحميل..." : "Loading..."}</span>
      </div>
    );
  }

  const ov = overview.status === "ready" ? overview.value : null;
  const wx = weather.status === "ready" ? weather.value : null;
  const lv = livestock.status === "ready" ? livestock.value : null;
  const fin = finance.status === "ready" ? finance.value : null;
  const soilRow = soil.status === "ready" ? soil.value : null;

  const soilInput = (soilRow?.input ?? {}) as Record<string, unknown>;
  const ph = numOrNull(soilInput.ph);
  const moisture = numOrNull(soilInput.moisture);
  const nitrogen = numOrNull(soilInput.nitrogen);
  const phosphorus = numOrNull(soilInput.phosphorus);
  const potassium = numOrNull(soilInput.potassium);

  const unavailableBadge = (
    <Badge variant="outline" className="bg-transparent text-muted-foreground">
      {isArabic ? "غير متاح" : "Not available"}
    </Badge>
  );

  const emptyLine = (load: Load<unknown>) => (
    <p className="text-xs text-muted-foreground">
      {load.status === "unavailable" ? load.reason : noSource}
    </p>
  );

  return (
    <div className={`space-y-6 ${isArabic ? "rtl" : "ltr"}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Land / Farms */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onCardClick?.("land")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-sm">
                  {isArabic ? "الأراضي" : "Land"}
                </h3>
              </div>
              {ov ? (
                <Badge className="bg-transparent text-green-700">
                  {ov.summary.totalFarms}
                </Badge>
              ) : (
                unavailableBadge
              )}
            </div>
            {ov ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "المساحة" : "Area"}
                  </span>
                  <span className="font-medium">
                    {fmt(ov.summary.totalArea, 1)} {isArabic ? "هكتار" : "ha"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "القطع" : "Fields"}
                  </span>
                  <span className="font-medium">{ov.summary.totalFields}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "إيرادات اليوم" : "Today revenue"}
                  </span>
                  <span className="font-medium">
                    {fmt(ov.summary.todayRevenue, 0)} {ov.summary.currency}
                  </span>
                </div>
              </div>
            ) : (
              emptyLine(overview)
            )}
          </CardContent>
        </Card>

        {/* Crops */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onCardClick?.("crops")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Leaf className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-sm">
                  {isArabic ? "المحاصيل" : "Crops"}
                </h3>
              </div>
              {ov ? (
                <Badge className="bg-transparent text-green-700">
                  {ov.summary.activeCrops}
                </Badge>
              ) : (
                unavailableBadge
              )}
            </div>
            {ov ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "مهام معلّقة" : "Pending tasks"}
                  </span>
                  <span className="font-medium">{ov.summary.pendingTasks}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "تنبيهات حرجة" : "Critical alerts"}
                  </span>
                  <span className="font-medium">{ov.summary.criticalAlerts}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "معدات عاملة" : "Operational equipment"}
                  </span>
                  <span className="font-medium">
                    {ov.summary.operationalEquipment}
                  </span>
                </div>
              </div>
            ) : (
              emptyLine(overview)
            )}
          </CardContent>
        </Card>

        {/* Livestock */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onCardClick?.("livestock")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-sm">
                  {isArabic ? "الماشية" : "Livestock"}
                </h3>
              </div>
              {lv ? (
                <Badge className="bg-transparent text-blue-700">
                  {lv.totalAnimals}
                </Badge>
              ) : (
                unavailableBadge
              )}
            </div>
            {lv ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "القيمة الإجمالية" : "Total value"}
                  </span>
                  <span className="font-medium">
                    {fmt(lv.totalValue, 0)} {lv.currency}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "أعلاف منخفضة" : "Low feed stock"}
                  </span>
                  <span className="font-medium">{lv.feedItemsLowStock}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {Object.entries(lv.bySpecies)
                    .slice(0, 3)
                    .map(([species, count]) => `${species}: ${count}`)
                    .join(" · ") || noSource}
                </div>
              </div>
            ) : (
              emptyLine(livestock)
            )}
          </CardContent>
        </Card>

        {/* Financial */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onCardClick?.("financial")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-sm">
                  {isArabic ? "المالية" : "Financial"}
                </h3>
              </div>
              {fin ? (
                <Badge
                  className={`bg-transparent ${fin.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  {fmt(fin.netProfit, 0)}
                </Badge>
              ) : (
                unavailableBadge
              )}
            </div>
            {fin ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "الإيرادات" : "Revenue"}
                  </span>
                  <span className="font-medium">{fmt(fin.totalRevenue, 0)} TND</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "المصروفات" : "Expenses"}
                  </span>
                  <span className="font-medium">{fmt(fin.totalExpenses, 0)} TND</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {isArabic ? "العمليات" : "Entries"}
                  </span>
                  <span className="font-medium">
                    {fin.revenueCount} / {fin.expenseCount}
                  </span>
                </div>
              </div>
            ) : (
              emptyLine(finance)
            )}
          </CardContent>
        </Card>
      </div>

      {overview.status === "unavailable" && (
        <Alert className="border-amber-400 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{overview.reason}</span>
            <Button size="sm" variant="outline" onClick={() => load()}>
              {isArabic ? "إعادة المحاولة" : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Overview Tabs */}
      <Tabs defaultValue="land" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="land">{isArabic ? "الأراضي" : "Land"}</TabsTrigger>
          <TabsTrigger value="crops">{isArabic ? "المحاصيل" : "Crops"}</TabsTrigger>
          <TabsTrigger value="livestock">
            {isArabic ? "الماشية" : "Livestock"}
          </TabsTrigger>
          <TabsTrigger value="financial">
            {isArabic ? "المالية" : "Financial"}
          </TabsTrigger>
        </TabsList>

        {/* Land Details Tab */}
        <TabsContent value="land" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weather Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <span>{isArabic ? "الظروف الجوية" : "Weather Conditions"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {wx ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-600">
                            {isArabic ? "الحرارة" : "Temperature"}
                          </p>
                          <p className="font-semibold">{wx.current.temperature}°C</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-600">
                            {isArabic ? "الرطوبة" : "Humidity"}
                          </p>
                          <p className="font-semibold">{wx.current.humidity}%</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CloudRain className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">
                            {isArabic ? "أمطار الأسبوع" : "Weekly rainfall"}
                          </p>
                          <p className="font-semibold">
                            {wx.forecast.weekly.totalRainfall}mm
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Wind className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-600">
                            {isArabic ? "الرياح" : "Wind"}
                          </p>
                          <p className="font-semibold">{wx.current.windSpeed} km/h</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {wx.source.provider} · {wx.location.name}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {weather.status === "unavailable" ? weather.reason : noSource}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Soil Health (latest persisted analysis) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>{isArabic ? "صحة التربة" : "Soil Health"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {soilRow ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          {isArabic ? "الحموضة" : "pH"}
                        </span>
                        <span className="font-semibold">{fmt(ph, 1)}</span>
                      </div>
                      {ph !== null && <Progress value={(ph / 14) * 100} className="h-2" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          {isArabic ? "الرطوبة" : "Moisture"}
                        </span>
                        <span className="font-semibold">
                          {moisture === null ? "—" : `${fmt(moisture, 1)}%`}
                        </span>
                      </div>
                      {moisture !== null && <Progress value={moisture} className="h-2" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? "آخر تحليل" : "Last analysis"}:{" "}
                      {soilRow.analyzedAt
                        ? new Date(soilRow.analyzedAt).toLocaleDateString("ar-TN")
                        : "—"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isArabic
                      ? "لا يوجد تحليل تربة محفوظ بعد."
                      : "No saved soil analysis yet."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Soil Nutrients (latest persisted analysis) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Wheat className="h-4 w-4" />
                  <span>{isArabic ? "العناصر الغذائية" : "Soil Nutrients"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {soilRow &&
                (nitrogen !== null || phosphorus !== null || potassium !== null) ? (
                  <>
                    {[
                      { label: isArabic ? "نيتروجين" : "Nitrogen (N)", v: nitrogen, max: 150 },
                      { label: isArabic ? "فوسفور" : "Phosphorus (P)", v: phosphorus, max: 100 },
                      { label: isArabic ? "بوتاسيوم" : "Potassium (K)", v: potassium, max: 200 },
                    ].map((row) => (
                      <div key={row.label} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">{row.label}</span>
                          <span className="font-semibold">
                            {row.v === null ? "—" : `${fmt(row.v, 1)} mg/kg`}
                          </span>
                        </div>
                        {row.v !== null && (
                          <Progress value={(row.v / row.max) * 100} className="h-2" />
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isArabic
                      ? "لا توجد قياسات عناصر محفوظة."
                      : "No saved nutrient measurements."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Crops Details Tab */}
        <TabsContent value="crops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Leaf className="h-4 w-4" />
                <span>{isArabic ? "المحاصيل النشطة" : "Active Crops"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ov && ov.crops.length > 0 ? (
                <div className="space-y-3">
                  {ov.crops.slice(0, 12).map((crop) => (
                    <div
                      key={crop.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {isArabic ? crop.nameArabic : crop.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {crop.variety || "—"} · {fmt(crop.area, 2)}{" "}
                          {isArabic ? "هكتار" : "ha"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{crop.stage || "—"}</Badge>
                        {crop.expectedHarvest && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(crop.expectedHarvest).toLocaleDateString("ar-TN")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isArabic
                    ? "لا توجد محاصيل نشطة مسجّلة بعد."
                    : "No active crops recorded yet."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>
                  {isArabic ? "أسعار السوق المرجعية" : "Reference market prices"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ov && ov.market.length > 0 ? (
                <div className="space-y-2">
                  {ov.market.slice(0, 10).map((m, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{m.cropName}</span>
                      <span className="font-medium">
                        {fmt(m.currentPrice, 2)} {m.currency}
                        {m.date ? ` · ${m.date}` : ""}
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-2">
                    {isArabic
                      ? "تغيّر السعر اليومي غير متاح من الأسعار المخزّنة."
                      : "Live price movement is not available from stored quotes."}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isArabic
                    ? "لا توجد أسعار سوق مرجعية مخزّنة."
                    : "No reference market prices stored."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Livestock Details Tab */}
        <TabsContent value="livestock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>{isArabic ? "الماشية" : "Livestock"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lv ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {lv.totalAnimals}
                      </p>
                      <p className="text-xs text-gray-600">
                        {isArabic ? "إجمالي الحيوانات" : "Total animals"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {fmt(lv.totalValue, 0)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {isArabic ? "القيمة" : "Value"} ({lv.currency})
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(lv.bySpecies).map(([species, count]) => (
                      <div key={species} className="flex justify-between text-sm">
                        <span>{species}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                    {Object.entries(lv.byHealthStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between text-sm">
                        <span className="text-gray-600">{status}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {livestock.status === "unavailable"
                    ? livestock.reason
                    : noSource}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Details Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>{isArabic ? "نظرة مالية" : "Financial overview"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fin ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-lg font-bold text-green-600">
                      {fmt(fin.totalRevenue, 0)}
                    </p>
                    <p className="text-xs text-green-700">
                      {isArabic ? "صافي الإيرادات" : "Net revenue"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <p className="text-lg font-bold text-red-600">
                      {fmt(fin.totalExpenses, 0)}
                    </p>
                    <p className="text-xs text-red-700">
                      {isArabic ? "المصروفات" : "Expenses"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-lg font-bold text-blue-600">
                      {fmt(fin.netProfit, 0)}
                    </p>
                    <p className="text-xs text-blue-700">
                      {isArabic ? "صافي الربح" : "Net profit"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded">
                    <p className="text-lg font-bold text-amber-600">
                      {fmt(fin.salesCosts, 0)}
                    </p>
                    <p className="text-xs text-amber-700">
                      {isArabic ? "تكاليف البيع" : "Sales costs"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {finance.status === "unavailable" ? finance.reason : noSource}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("land", "view_details")}
        >
          <Eye className="h-5 w-5" />
          <span className="text-xs">{isArabic ? "تفاصيل الأرض" : "Land Details"}</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("crops", "manage")}
        >
          <Leaf className="h-5 w-5" />
          <span className="text-xs">
            {isArabic ? "إدارة المحاصيل" : "Manage Crops"}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("livestock", "health_check")}
        >
          <Heart className="h-5 w-5" />
          <span className="text-xs">{isArabic ? "فحص الماشية" : "Health Check"}</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("financial", "reports")}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs">
            {isArabic ? "تقارير مالية" : "Financial Reports"}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("offline", "manage")}
        >
          <Database className="h-5 w-5" />
          <span className="text-xs">
            {isArabic ? "الوضع بدون إنترنت" : "Offline Mode"}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default ComprehensiveOverviewCards;
