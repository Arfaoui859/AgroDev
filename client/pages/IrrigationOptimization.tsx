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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Droplets, Loader2, AlertTriangle, Gauge, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { AIProvenanceNotice } from "@/components/ai/AIProvenanceNotice";
import { AdvisoryPanel } from "@/components/ai/AdvisoryPanel";
import type { Advisory } from "@/lib/advisory";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Smart irrigation optimizer screen.
 *
 * Backed by POST /api/irrigation-optimization/optimize, which forwards to the
 * irrigation_optimization microservice. The service trains on synthetic samples,
 * so the provenance banner labels the result honestly.
 */

const CROPS = [
  { value: "wheat", key: "crop.wheat" },
  { value: "tomato", key: "crop.tomato" },
  { value: "olive", key: "crop.olive" },
  { value: "potato", key: "crop.potato" },
  { value: "corn", key: "crop.corn" },
];

const GROWTH_STAGES = [
  { value: "germination", key: "growth.germination" },
  { value: "vegetative", key: "growth.vegetative" },
  { value: "flowering", key: "growth.flowering" },
  { value: "maturity", key: "growth.maturity" },
];

interface IrrigationResult {
  water_requirements?: {
    daily_requirement_mm?: number;
    weekly_requirement_mm?: number;
    seasonal_requirement_mm?: number;
  };
  irrigation_schedule?: Array<{
    date?: string;
    amount_mm?: number;
    method?: string;
    notes?: string;
  }>;
  recommendations?: string[];
  advisory?: Advisory;
  dataSource?: string;
  isRealData?: boolean;
  modelSource?: string;
}

export default function IrrigationOptimization() {
  const { language, dir, t } = useLanguage();

  const [cropType, setCropType] = useState("wheat");
  const [growthStage, setGrowthStage] = useState("vegetative");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [solarRadiation, setSolarRadiation] = useState("");
  const [recentRainfall, setRecentRainfall] = useState("");
  const [soilMoisture, setSoilMoisture] = useState("");
  const [fieldCapacity, setFieldCapacity] = useState("");
  const [wiltingPoint, setWiltingPoint] = useState("");
  const [soilType, setSoilType] = useState("");
  const [soilTypeFactor, setSoilTypeFactor] = useState("");
  const [irrigationStrategy, setIrrigationStrategy] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IrrigationResult | null>(null);

  const optimize = async () => {
    const required = [temperature, humidity, windSpeed, solarRadiation, recentRainfall, soilMoisture, fieldCapacity, wiltingPoint, soilType, soilTypeFactor, irrigationStrategy, farmSize];
    if (required.some((value) => value.trim() === "")) {
      setError(language === "ar" ? "أدخل قياسات الطقس والتربة ومساحة المزرعة قبل التحسين." : "Enter measured weather, soil and farm-size values before optimization.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiFetch("/api/irrigation-optimization/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_type: cropType,
          growth_stage: growthStage,
          farm_size: Number(farmSize),
          days_ahead: 7,
          weather_data: {
            temperature: Number(temperature), humidity: Number(humidity),
            wind_speed: Number(windSpeed), solar_radiation: Number(solarRadiation),
            recent_rainfall: Number(recentRainfall),
          },
          soil_data: {
            moisture_percentage: Number(soilMoisture),
            field_capacity: Number(fieldCapacity),
            wilting_point: Number(wiltingPoint),
            soil_type: soilType,
            soil_type_factor: Number(soilTypeFactor),
            irrigation_strategy: irrigationStrategy,
          },
          language,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
      }
      setResult({ ...(body.data || {}), dataSource: body.dataSource, isRealData: body.isRealData, modelSource: body.modelSource });
    } catch (err) {
      setError(
        t("irrigation.failed") +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoading(false);
    }
  };

  const requirements = result?.water_requirements;
  const schedule = result?.irrigation_schedule ?? [];

  return (
    <div className="container mx-auto p-6 space-y-6" dir={dir}>
      <div className="flex items-center gap-3">
        <Droplets className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">
            {t("irrigation.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("irrigation.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("irrigation.farmParams")}</CardTitle>
            <CardDescription>
              {t("irrigation.farmParamsHint")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("irrigation.crop")}</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CROPS.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        {t(crop.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("irrigation.growthStage")}</Label>
                <Select value={growthStage} onValueChange={setGrowthStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROWTH_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {t(stage.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("irrigation.temperature")} (°C)</Label><Input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} /></div>
              <div className="space-y-2"><Label>{t("irrigation.humidity")} (%)</Label><Input type="number" min="0" max="100" value={humidity} onChange={(e) => setHumidity(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "سرعة الرياح (كم/س)" : "Wind speed (km/h)"}</Label><Input type="number" min="0" value={windSpeed} onChange={(e) => setWindSpeed(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "الإشعاع الشمسي" : "Solar radiation"}</Label><Input type="number" min="0" value={solarRadiation} onChange={(e) => setSolarRadiation(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "الأمطار الحديثة (مم)" : "Recent rainfall (mm)"}</Label><Input type="number" min="0" value={recentRainfall} onChange={(e) => setRecentRainfall(e.target.value)} /></div>
              <div className="space-y-2"><Label>{t("irrigation.farmSize")} (ha)</Label><Input type="number" min="0.01" step="0.01" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} /></div>
              <div className="space-y-2"><Label>{t("irrigation.soilMoisture")} (%)</Label><Input type="number" min="0" max="100" value={soilMoisture} onChange={(e) => setSoilMoisture(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "السعة الحقلية (%)" : "Field capacity (%)"}</Label><Input type="number" min="0" max="100" value={fieldCapacity} onChange={(e) => setFieldCapacity(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "نقطة الذبول (%)" : "Wilting point (%)"}</Label><Input type="number" min="0" max="100" value={wiltingPoint} onChange={(e) => setWiltingPoint(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "نوع التربة" : "Soil type"}</Label><Input value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder={language === "ar" ? "مثال: loam" : "e.g. loam"} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "معامل نوع التربة" : "Soil type factor"}</Label><Input type="number" min="0.01" step="0.01" value={soilTypeFactor} onChange={(e) => setSoilTypeFactor(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "استراتيجية الري" : "Irrigation strategy"}</Label><Select value={irrigationStrategy} onValueChange={setIrrigationStrategy}><SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر" : "Select"} /></SelectTrigger><SelectContent><SelectItem value="conservative">{language === "ar" ? "اقتصادية" : "Conservative"}</SelectItem><SelectItem value="balanced">{language === "ar" ? "متوازنة" : "Balanced"}</SelectItem><SelectItem value="intensive">{language === "ar" ? "مكثفة" : "Intensive"}</SelectItem></SelectContent></Select></div>
            </div>

            <Button onClick={optimize} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("irrigation.computing")}
                </>
              ) : (
                <>
                  <Gauge className="me-2 h-4 w-4" />
                  {t("irrigation.optimize")}
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!result && !loading && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Droplets className="mx-auto mb-3 h-10 w-10 opacity-40" />
                {t("irrigation.emptyHint")}
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <AIProvenanceNotice result={result} />

              <AdvisoryPanel advisory={result.advisory} />

              {requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("irrigation.waterRequirements")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {requirements.daily_requirement_mm?.toFixed(1) ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("irrigation.mmPerDay")}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {requirements.weekly_requirement_mm?.toFixed(1) ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("irrigation.mmPerWeek")}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {requirements.seasonal_requirement_mm?.toFixed(0) ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("irrigation.mmPerSeason")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {schedule.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      {t("irrigation.schedule")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {schedule.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded border p-2"
                      >
                        <span>{entry.date}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {entry.amount_mm?.toFixed(1)} mm
                          </Badge>
                          {entry.method && <Badge>{entry.method}</Badge>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {result.recommendations && result.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("irrigation.recommendations")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {result.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
