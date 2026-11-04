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
  const [temperature, setTemperature] = useState(25);
  const [humidity, setHumidity] = useState(60);
  const [soilMoisture, setSoilMoisture] = useState(50);
  const [farmSize, setFarmSize] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IrrigationResult | null>(null);

  const optimize = async () => {
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
          farm_size: farmSize,
          days_ahead: 7,
          weather_data: { temperature, humidity },
          soil_data: { moisture_percentage: soilMoisture },
          language,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
      }
      setResult(body);
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
              <div className="space-y-2">
                <Label>{t("irrigation.temperature")}</Label>
                <Input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("irrigation.humidity")}</Label>
                <Input
                  type="number"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {t("irrigation.soilMoisture")}: {soilMoisture}
              </Label>
              <Input
                type="range"
                min={0}
                max={100}
                value={soilMoisture}
                onChange={(e) => setSoilMoisture(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("irrigation.farmSize")}</Label>
              <Input
                type="number"
                step={0.1}
                value={farmSize}
                onChange={(e) => setFarmSize(Number(e.target.value))}
              />
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
