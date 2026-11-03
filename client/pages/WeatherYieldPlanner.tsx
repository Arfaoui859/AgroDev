import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CloudSun, Loader2, AlertTriangle, TrendingUp, Sprout } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { AIProvenanceNotice } from "@/components/ai/AIProvenanceNotice";
import { AdvisoryPanel } from "@/components/ai/AdvisoryPanel";
import type { Advisory } from "@/lib/advisory";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Weather & yield planner screen.
 *
 * Combines two microservice-backed endpoints:
 *   POST /api/weather-yield-intelligence/weather-plan  (seasonal plan)
 *   POST /api/weather-yield-intelligence/predict-yield (yield prediction)
 *
 * Both are tagged with provenance and rendered through AIProvenanceNotice.
 */

const CROP_OPTIONS = [
  { value: "wheat", ar: "القمح", en: "Wheat" },
  { value: "barley", ar: "الشعير", en: "Barley" },
  { value: "tomato", ar: "الطماطم", en: "Tomato" },
  { value: "olive", ar: "الزيتون", en: "Olive" },
  { value: "potato", ar: "البطاطس", en: "Potato" },
];

interface CropSuitability {
  crop: string;
  suitability_score: number;
  suitability_level: string;
  adaptation_potential?: number;
}

interface WeatherPlan {
  climate_analysis?: {
    climate_zone?: { zone_name_ar?: string; zone_type?: string };
    seasonal_outlook?: { season_name_ar?: string };
  };
  crop_suitability?: CropSuitability[];
  weather_risks?: { overall_risk_level?: string };
  recommendations_summary?: string[];
  advisory?: Advisory;
  dataSource?: string;
  isRealData?: boolean;
  modelSource?: string;
}

interface YieldPrediction {
  crop_info?: { crop_name_ar?: string; unit?: string };
  yield_prediction?: {
    predicted_yield_kg_ha?: number;
    yield_category?: string;
    yield_range_kg_ha?: { minimum: number; maximum: number };
  };
  economic_analysis?: {
    profitability?: { net_profit?: number; roi_percent?: number };
  };
  confidence_metrics?: { confidence_score?: number; level?: string };
  advisory?: Advisory;
  dataSource?: string;
  isRealData?: boolean;
  modelSource?: string;
}

export default function WeatherYieldPlanner() {
  const { isArabic } = useLanguage();
  const t = (ar: string, en: string) => (isArabic ? ar : en);

  const [latitude, setLatitude] = useState(35.0);
  const [longitude, setLongitude] = useState(10.0);
  const [crops, setCrops] = useState<string[]>(["wheat", "tomato"]);
  const [farmSize, setFarmSize] = useState(1);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingYield, setLoadingYield] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<WeatherPlan | null>(null);
  const [yieldResult, setYieldResult] = useState<YieldPrediction | null>(null);

  const toggleCrop = (value: string) => {
    setCrops((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    );
  };

  const runPlan = async () => {
    if (crops.length === 0) {
      setError(t("اختر محصولاً واحداً على الأقل", "Select at least one crop"));
      return;
    }
    setLoadingPlan(true);
    setError(null);
    setPlan(null);
    try {
      const response = await apiFetch(
        "/api/weather-yield-intelligence/weather-plan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: { latitude, longitude, region: "تونس" },
            crop_options: crops,
            planning_horizon_months: 12,
            language: isArabic ? "ar" : "en",
          }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
      }
      setPlan(body);
    } catch (err) {
      setError(
        t("تعذّر إنشاء الخطة: ", "Plan generation failed: ") +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoadingPlan(false);
    }
  };

  const runYield = async () => {
    setLoadingYield(true);
    setError(null);
    setYieldResult(null);
    try {
      const response = await apiFetch(
        "/api/weather-yield-intelligence/predict-yield",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop_type: crops[0] ?? "wheat",
            farm_size: farmSize,
            weather_data: { temperature: 22, humidity: 60, annual_rainfall: 450 },
            soil_data: { ph: 6.8, fertility_score: 0.75, moisture_percentage: 45 },
            language: isArabic ? "ar" : "en",
          }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
      }
      setYieldResult(body);
    } catch (err) {
      setError(
        t("تعذّر توقّع المردودية: ", "Yield prediction failed: ") +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoadingYield(false);
    }
  };

  const suitability = plan?.crop_suitability ?? [];
  const prediction = yieldResult?.yield_prediction;

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <CloudSun className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">
            {t("مخطط الطقس والمردودية", "Weather & Yield Planner")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "تخطيط زراعي حسب المناخ وتوقّع مردودية المحاصيل",
              "Climate-based crop planning and yield prediction",
            )}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("المعطيات", "Inputs")}</CardTitle>
          <CardDescription>
            {t("حدّد الموقع والمحاصيل", "Set location and crops")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("خط العرض", "Latitude")}</Label>
              <Input
                type="number"
                step={0.1}
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("خط الطول", "Longitude")}</Label>
              <Input
                type="number"
                step={0.1}
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("مساحة المزرعة (هكتار)", "Farm size (ha)")}</Label>
              <Input
                type="number"
                step={0.1}
                value={farmSize}
                onChange={(e) => setFarmSize(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("المحاصيل", "Crops")}</Label>
            <div className="flex flex-wrap gap-2">
              {CROP_OPTIONS.map((crop) => (
                <Badge
                  key={crop.value}
                  variant={crops.includes(crop.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCrop(crop.value)}
                >
                  {isArabic ? crop.ar : crop.en}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={runPlan} disabled={loadingPlan} className="flex-1">
              {loadingPlan ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <CloudSun className="me-2 h-4 w-4" />
              )}
              {t("خطة المناخ", "Climate plan")}
            </Button>
            <Button
              onClick={runYield}
              disabled={loadingYield}
              variant="secondary"
              className="flex-1"
            >
              {loadingYield ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="me-2 h-4 w-4" />
              )}
              {t("توقّع المردودية", "Predict yield")}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="plan">
        <TabsList>
          <TabsTrigger value="plan">{t("الخطة المناخية", "Climate plan")}</TabsTrigger>
          <TabsTrigger value="yield">{t("المردودية", "Yield")}</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4">
          {plan && (
            <>
              <AIProvenanceNotice result={plan} />
              <AdvisoryPanel advisory={plan.advisory} />
            </>
          )}
          {plan ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{t("المنطقة المناخية", "Climate zone")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">
                      {plan.climate_analysis?.climate_zone?.zone_name_ar ??
                        plan.climate_analysis?.climate_zone?.zone_type ??
                        "—"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{t("الموسم", "Season")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">
                      {plan.climate_analysis?.seasonal_outlook?.season_name_ar ?? "—"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{t("مستوى المخاطر", "Risk level")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant={
                        plan.weather_risks?.overall_risk_level === "عالي"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {plan.weather_risks?.overall_risk_level ?? "—"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-green-600" />
                    {t("ملاءمة المحاصيل", "Crop suitability")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suitability.map((item) => (
                    <div key={item.crop} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.crop}</span>
                        <Badge variant="outline">{item.suitability_level}</Badge>
                      </div>
                      <Progress value={item.suitability_score * 100} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {plan.recommendations_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("ملخص التوصيات", "Recommendations")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {plan.recommendations_summary.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t(
                  "شغّل خطة المناخ لعرض ملاءمة المحاصيل.",
                  "Run the climate plan to see crop suitability.",
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="yield" className="space-y-4">
          {yieldResult && (
            <>
              <AIProvenanceNotice result={yieldResult} />
              <AdvisoryPanel advisory={yieldResult.advisory} />
            </>
          )}
          {yieldResult && prediction ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("المردودية المتوقعة", "Predicted yield")}</CardTitle>
                  <CardDescription>
                    {yieldResult.crop_info?.crop_name_ar} ·{" "}
                    {yieldResult.crop_info?.unit}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold">
                    {prediction.predicted_yield_kg_ha?.toFixed(0)}
                  </div>
                  <Badge>{prediction.yield_category}</Badge>
                  {prediction.yield_range_kg_ha && (
                    <div className="text-sm text-muted-foreground">
                      {t("المجال: ", "Range: ")}
                      {prediction.yield_range_kg_ha.minimum.toFixed(0)} –{" "}
                      {prediction.yield_range_kg_ha.maximum.toFixed(0)}
                    </div>
                  )}
                  {yieldResult.confidence_metrics && (
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{t("الثقة", "Confidence")}</span>
                        <span>{yieldResult.confidence_metrics.level}</span>
                      </div>
                      <Progress
                        value={
                          (yieldResult.confidence_metrics.confidence_score ?? 0) * 100
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("الجدوى الاقتصادية", "Economic analysis")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t("صافي الربح", "Net profit")}</span>
                    <span className="font-semibold">
                      {yieldResult.economic_analysis?.profitability?.net_profit?.toFixed(0)}{" "}
                      {t("د.ت", "TND")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("معدل العائد", "ROI")}</span>
                    <span className="font-semibold">
                      {yieldResult.economic_analysis?.profitability?.roi_percent?.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t(
                  "شغّل توقّع المردودية لعرض النتائج.",
                  "Run the yield prediction to see results.",
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
