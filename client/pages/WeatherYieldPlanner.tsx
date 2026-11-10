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
  { value: "wheat", key: "crop.wheat" },
  { value: "barley", key: "crop.barley" },
  { value: "tomato", key: "crop.tomato" },
  { value: "olive", key: "crop.olive" },
  { value: "potato", key: "crop.potato" },
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


async function fetchWeatherContext(latitude: number, longitude: number) {
  const end = new Date(Date.now() - 86400000);
  const start = new Date(end.getTime() - 364 * 86400000);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,shortwave_radiation",
    daily: "precipitation_sum,temperature_2m_max,temperature_2m_min",
    past_days: "30",
    forecast_days: "1",
    timezone: "auto",
  }).toString();
  const archiveUrl = new URL("https://archive-api.open-meteo.com/v1/archive");
  archiveUrl.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: iso(start),
    end_date: iso(end),
    daily: "temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max,shortwave_radiation_sum",
    timezone: "auto",
  }).toString();
  const [forecastResponse, archiveResponse] = await Promise.all([
    fetch(forecastUrl.toString(), { signal: AbortSignal.timeout(15000) }),
    fetch(archiveUrl.toString(), { signal: AbortSignal.timeout(20000) }),
  ]);
  if (!forecastResponse.ok || !archiveResponse.ok) {
    throw new Error(`Open-Meteo weather data unavailable (forecast ${forecastResponse.status}, archive ${archiveResponse.status})`);
  }
  const [forecast, archive] = await Promise.all([forecastResponse.json(), archiveResponse.json()]);
  const numbers = (values: unknown[]) => values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const mean = (values: unknown[]) => {
    const valid = numbers(values);
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
  };
  const sum = (values: unknown[]) => numbers(values).reduce((total, value) => total + value, 0);
  const range = (maxValues: unknown[], minValues: unknown[]) => {
    const max = numbers(maxValues), min = numbers(minValues);
    return max.length && min.length ? Math.max(...max) - Math.min(...min) : null;
  };
  const current = forecast.current || {};
  const forecastDaily = forecast.daily || {};
  const archiveDaily = archive.daily || {};
  const annualRainfall = sum(archiveDaily.precipitation_sum || []);
  const recentRainfall = sum((forecastDaily.precipitation_sum || []).slice(-7));
  const annualTemperature = mean(archiveDaily.temperature_2m_mean || []);
  const annualHumidity = mean(archiveDaily.relative_humidity_2m_mean || []);
  const annualWind = mean(archiveDaily.wind_speed_10m_max || []);
  const annualSolar = mean(archiveDaily.shortwave_radiation_sum || []);
  const annualVariation = range(archiveDaily.temperature_2m_max || [], archiveDaily.temperature_2m_min || []);
  const recentVariation = range(forecastDaily.temperature_2m_max || [], forecastDaily.temperature_2m_min || []);
  const elevation = Number(forecast.elevation);
  const currentWeather = {
    temperature: Number(current.temperature_2m),
    humidity: Number(current.relative_humidity_2m),
    rainfall: Number(current.precipitation ?? 0),
    wind_speed: Number(current.wind_speed_10m),
    solar_radiation: Number(current.shortwave_radiation),
    recent_rainfall: recentRainfall,
    annual_rainfall: annualRainfall,
    temperature_variation: recentVariation ?? annualVariation,
  };
  const historicalWeather = {
    temperature: annualTemperature,
    humidity: annualHumidity,
    rainfall: annualRainfall,
    wind_speed: annualWind,
    solar_radiation: annualSolar,
    recent_rainfall: recentRainfall,
    annual_rainfall: annualRainfall,
    temperature_variation: annualVariation,
  };
  const required = [...Object.values(currentWeather), ...Object.values(historicalWeather), elevation];
  if (required.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    throw new Error("Open-Meteo did not return enough weather history for this location.");
  }
  return {
    location: { latitude, longitude, elevation, region: "Open-Meteo grid cell" },
    current_conditions: currentWeather,
    historical_weather: historicalWeather,
    weather_data: currentWeather,
    source: "Open-Meteo forecast + archive (measured/reanalysis weather)",
  };
}

export default function WeatherYieldPlanner() {
  const { language, dir, t } = useLanguage();

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [crops, setCrops] = useState<string[]>(["wheat", "tomato"]);
  const [farmSize, setFarmSize] = useState("");
  const [soilPh, setSoilPh] = useState("");
  const [soilFertility, setSoilFertility] = useState("");
  const [soilOrganicMatter, setSoilOrganicMatter] = useState("");
  const [soilMoisture, setSoilMoisture] = useState("");
  const [irrigationEfficiency, setIrrigationEfficiency] = useState("");
  const [fertilizerRate, setFertilizerRate] = useState("");
  const [pestManagement, setPestManagement] = useState("");
  const [diseaseControl, setDiseaseControl] = useState("");
  const [organicFarming, setOrganicFarming] = useState(false);
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
    if (!latitude.trim() || !longitude.trim() || !farmSize.trim() || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Number(latitude) < -90 || Number(latitude) > 90 || Number(longitude) < -180 || Number(longitude) > 180 || Number(farmSize) <= 0) {
      setError(language === "ar" ? "أدخل إحداثيات الحقل ومساحته." : "Enter the field coordinates and farm size.");
      return;
    }
    if (crops.length === 0) {
      setError(t("weather.selectCrop"));
      return;
    }
    setLoadingPlan(true);
    setError(null);
    setPlan(null);
    try {
      const weatherContext = await fetchWeatherContext(Number(latitude), Number(longitude));
      const response = await apiFetch(
        "/api/weather-yield-intelligence/weather-plan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: weatherContext.location,
            historical_weather: weatherContext.historical_weather,
            current_conditions: weatherContext.current_conditions,
            crop_options: crops,
            farm_profile: { farm_size: Number(farmSize) },
            planning_horizon_months: 12,
            language,
          }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
      }
      setPlan({ ...(body.data || {}), dataSource: body.dataSource, isRealData: body.isRealData, modelSource: body.modelSource });
    } catch (err) {
      setError(
        t("weather.planFailed") +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoadingPlan(false);
    }
  };

  const runYield = async () => {
    const soilInputs = [soilPh, soilFertility, soilOrganicMatter, soilMoisture, irrigationEfficiency, fertilizerRate, pestManagement, diseaseControl];
    if (!latitude.trim() || !longitude.trim() || !farmSize.trim() || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Number(latitude) < -90 || Number(latitude) > 90 || Number(longitude) < -180 || Number(longitude) > 180 || Number(farmSize) <= 0 || soilInputs.some((value) => value.trim() === "")) {
      setError(language === "ar" ? "أدخل إحداثيات الحقل ومساحته وقياسات التربة وممارسات الإدارة." : "Enter field coordinates, farm size, measured soil values and management practices.");
      return;
    }
    setLoadingYield(true);
    setError(null);
    setYieldResult(null);
    try {
      const weatherContext = await fetchWeatherContext(Number(latitude), Number(longitude));
      const response = await apiFetch(
        "/api/weather-yield-intelligence/predict-yield",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop_type: crops[0] ?? "wheat",
            location: weatherContext.location,
            farm_size: Number(farmSize),
            weather_data: weatherContext.weather_data,
            soil_data: { ph: Number(soilPh), fertility_score: Number(soilFertility), organic_matter: Number(soilOrganicMatter), moisture_percentage: Number(soilMoisture) },
            management_practices: { irrigation_efficiency: Number(irrigationEfficiency), fertilizer_application_rate: Number(fertilizerRate), pest_management_score: Number(pestManagement), disease_control_score: Number(diseaseControl), organic_farming: organicFarming },
            language,
          }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
      }
      setYieldResult({ ...(body.data || {}), dataSource: body.dataSource, isRealData: body.isRealData, modelSource: body.modelSource });
    } catch (err) {
      setError(
        t("weather.yieldFailed") +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoadingYield(false);
    }
  };

  const suitability = plan?.crop_suitability ?? [];
  const prediction = yieldResult?.yield_prediction;

  return (
    <div className="container mx-auto p-6 space-y-6" dir={dir}>
      <div className="flex items-center gap-3">
        <CloudSun className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">
            {t("weather.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("weather.subtitle")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("weather.inputs")}</CardTitle>
          <CardDescription>
            {t("weather.inputsHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("weather.latitude")}</Label>
              <Input
                type="number"
                step={0.1}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("weather.longitude")}</Label>
              <Input
                type="number"
                step={0.1}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("weather.farmSize")}</Label>
              <Input
                type="number"
                step={0.1}
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold">{language === "ar" ? "قياسات التربة وممارسات الإدارة لتوقع المردودية" : "Soil measurements and management inputs for yield estimation"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1"><Label>pH</Label><Input type="number" min="0" max="14" step="0.1" value={soilPh} onChange={(e) => setSoilPh(e.target.value)} /></div>
              <div className="space-y-1"><Label>{language === "ar" ? "خصوبة التربة (0–1)" : "Soil fertility (0–1)"}</Label><Input type="number" min="0" max="1" step="0.01" value={soilFertility} onChange={(e) => setSoilFertility(e.target.value)} /></div>
              <div className="space-y-1"><Label>{language === "ar" ? "المادة العضوية (%)" : "Organic matter (%)"}</Label><Input type="number" min="0" step="0.1" value={soilOrganicMatter} onChange={(e) => setSoilOrganicMatter(e.target.value)} /></div>
              <div className="space-y-1"><Label>{language === "ar" ? "رطوبة التربة (%)" : "Soil moisture (%)"}</Label><Input type="number" min="0" max="100" step="0.1" value={soilMoisture} onChange={(e) => setSoilMoisture(e.target.value)} /></div>
              <div className="space-y-1"><Label>{language === "ar" ? "كفاءة الري (0–1)" : "Irrigation efficiency (0–1)"}</Label><Input type="number" min="0" max="1" step="0.01" value={irrigationEfficiency} onChange={(e) => setIrrigationEfficiency(e.target.value)} /></div>
              <div className="space-y-1"><Label>{language === "ar" ? "معدل التسميد" : "Fertilizer application rate"}</Label><Input type="number" min="0" step="0.1" value={fertilizerRate} onChange={(e) => setFertilizerRate(e.target.value)} /></div>
              <div className="space-y-1"><Label>{language === "ar" ? "إدارة الآفات (0–1)" : "Pest management (0–1)"}</Label><Input type="number" min="0" max="1" step="0.01" value={pestManagement} onChange={(e) => setPestManagement(e.target.value)} /></div>
              <div className="space-y-1"><Label>{language === "ar" ? "مكافحة الأمراض (0–1)" : "Disease control (0–1)"}</Label><Input type="number" min="0" max="1" step="0.01" value={diseaseControl} onChange={(e) => setDiseaseControl(e.target.value)} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={organicFarming} onChange={(e) => setOrganicFarming(e.target.checked)} />{language === "ar" ? "زراعة عضوية" : "Organic farming"}</label>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "بيانات الطقس تُجلب مباشرة من Open-Meteo. التربة والممارسات يجب أن تكون من قياسات المزرعة." : "Weather is fetched from Open-Meteo. Soil and management values must come from this farm's measurements."}</p>
          </div>

          <div className="space-y-2">
            <Label>{t("weather.crops")}</Label>
            <div className="flex flex-wrap gap-2">
              {CROP_OPTIONS.map((crop) => (
                <Badge
                  key={crop.value}
                  variant={crops.includes(crop.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCrop(crop.value)}
                >
                  {t(crop.key)}
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
              {t("weather.climatePlan")}
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
              {t("weather.predictYield")}
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
          <TabsTrigger value="plan">{t("weather.climateTab")}</TabsTrigger>
          <TabsTrigger value="yield">{t("weather.yieldTab")}</TabsTrigger>
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
                    <CardDescription>{t("weather.climateZone")}</CardDescription>
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
                    <CardDescription>{t("weather.season")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">
                      {plan.climate_analysis?.seasonal_outlook?.season_name_ar ?? "—"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{t("weather.riskLevel")}</CardDescription>
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
                    {t("weather.cropSuitability")}
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
                    <CardTitle>{t("weather.recommendationsSummary")}</CardTitle>
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
                {t("weather.emptyPlanHint")}
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
                  <CardTitle>{t("weather.predictedYield")}</CardTitle>
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
                      {t("weather.range")}
                      {prediction.yield_range_kg_ha.minimum.toFixed(0)} –{" "}
                      {prediction.yield_range_kg_ha.maximum.toFixed(0)}
                    </div>
                  )}
                  {yieldResult.confidence_metrics && (
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{t("weather.confidence")}</span>
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
                  <CardTitle>{t("weather.economicAnalysis")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t("weather.netProfit")}</span>
                    <span className="font-semibold">
                      {yieldResult.economic_analysis?.profitability?.net_profit?.toFixed(0)}{" "}
                      {t("weather.tnd")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("weather.roi")}</span>
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
                {t("weather.emptyYieldHint")}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
