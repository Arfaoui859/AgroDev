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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Bug,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Leaf,
  ClipboardList,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { AIProvenanceNotice } from "@/components/ai/AIProvenanceNotice";
import { AdvisoryPanel } from "@/components/ai/AdvisoryPanel";
import type { Advisory } from "@/lib/advisory";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Pest control advisor screen.
 *
 * Backed by POST /api/pest-control/analyze-problem, which forwards to the
 * pest_control microservice. The response carries provenance (dataSource /
 * isRealData), rendered by AIProvenanceNotice so a heuristic result is never
 * mistaken for a trained model prediction.
 */

const CROPS = [
  { value: "tomato", key: "crop.tomato" },
  { value: "wheat", key: "crop.wheat" },
  { value: "olive", key: "crop.olive" },
  { value: "potato", key: "crop.potato" },
  { value: "corn", key: "crop.corn" },
  { value: "citrus", key: "crop.citrus" },
];

// `ar` is the canonical value sent to the pest microservice, which matches on
// Arabic symptom keywords; only the display string is localised via t(key).
const COMMON_SYMPTOMS = [
  { key: "symptom.curledLeaves", ar: "أوراق مجعدة" },
  { key: "symptom.honeydew", ar: "إفرازات لزجة" },
  { key: "symptom.yellowSpots", ar: "نقط صفراء صغيرة" },
  { key: "symptom.webbing", ar: "خيوط عنكبوتية" },
  { key: "symptom.powdery", ar: "طبقة بيضاء" },
  { key: "symptom.brownSpots", ar: "بقع بنية" },
  { key: "symptom.rotting", ar: "تعفن" },
  { key: "symptom.wilting", ar: "ذبول مفاجئ" },
];

interface PestAnalysis {
  pest_identification?: {
    identified_pest?: string;
    pest_name_ar?: string;
    confidence_score?: number;
    category?: string;
    top_predictions?: Array<{ pest: string; name_ar: string; probability: number }>;
  };
  severity_assessment?: {
    severity_level?: string;
    severity_score?: number;
    above_threshold?: boolean;
  };
  treatment_recommendations?: Array<{
    treatment_name_ar?: string;
    treatment_name?: string;
    suitability_score?: number;
    method?: string;
    application_instructions?: string;
  }>;
  treatment_schedule?: { total_applications?: number; schedule?: unknown[] };
  advisory?: Advisory;
  dataSource?: string;
  isRealData?: boolean;
  modelSource?: string;
}

export default function PestControl() {
  const { language, dir, t } = useLanguage();

  const [cropType, setCropType] = useState("tomato");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [affectedArea, setAffectedArea] = useState("");
  const [affectedPlantCount, setAffectedPlantCount] = useState("");
  const [totalPlantCount, setTotalPlantCount] = useState("");
  const [plantAgeDays, setPlantAgeDays] = useState("");
  const [plantHealth, setPlantHealth] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [recentRainfall, setRecentRainfall] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [plantDensity, setPlantDensity] = useState("");
  const [irrigationFrequency, setIrrigationFrequency] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PestAnalysis | null>(null);

  const toggleSymptom = (ar: string) => {
    setSymptoms((prev) =>
      prev.includes(ar) ? prev.filter((s) => s !== ar) : [...prev, ar],
    );
  };

  const analyze = async () => {
    if (symptoms.length === 0) {
      setError(t("pest.selectSymptom"));
      return;
    }
    const requiredMeasurements = [affectedArea, affectedPlantCount, totalPlantCount, plantAgeDays, plantHealth, farmSize, temperature, humidity, recentRainfall, windSpeed];
    if (requiredMeasurements.some((value) => value.trim() === "") || !plantDensity || !irrigationFrequency) {
      setError(language === "ar" ? "أدخل جميع قياسات النباتات والطقس وحجم المزرعة قبل التحليل." : "Enter all plant, weather and farm measurements before analysis.");
      return;
    }
    if (Number(totalPlantCount) < 1 || Number(affectedPlantCount) > Number(totalPlantCount)) {
      setError(language === "ar" ? "عدد النباتات المصابة يجب ألا يتجاوز العدد الإجمالي." : "Affected plant count cannot exceed total plant count.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiFetch("/api/pest-control/analyze-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_type: cropType,
          symptoms,
          affected_area_percentage: Number(affectedArea),
          affected_plant_count: Number(affectedPlantCount),
          total_plant_count: Number(totalPlantCount),
          plant_age_days: Number(plantAgeDays),
          plant_health_score: Number(plantHealth),
          farm_size: Number(farmSize),
          plant_density: plantDensity,
          irrigation_frequency: irrigationFrequency,
          weather_conditions: {
            temperature: Number(temperature),
            humidity: Number(humidity),
            recent_rainfall: Number(recentRainfall),
            wind_speed: Number(windSpeed),
          },
          language,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        // The server returns an honest error when the microservice is down;
        // never render a fabricated diagnosis in that case.
        throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
      }
      setResult(body);
    } catch (err) {
      setError(
        t("pest.analysisFailed") +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoading(false);
    }
  };

  const identification = result?.pest_identification;
  const severity = result?.severity_assessment;
  const treatments = result?.treatment_recommendations ?? [];

  return (
    <div className="container mx-auto p-6 space-y-6" dir={dir}>
      <div className="flex items-center gap-3">
        <Bug className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">
            {t("pest.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("pest.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("pest.infestationDetails")}</CardTitle>
            <CardDescription>
              {t("pest.infestationHint")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("pest.crop")}</Label>
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
              <Label>{t("pest.symptoms")}</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <Badge
                    key={symptom.ar}
                    variant={symptoms.includes(symptom.ar) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSymptom(symptom.ar)}
                  >
                    {t(symptom.key)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{language === "ar" ? "نسبة المساحة المصابة (%)" : "Affected area (%)"}</Label><Input type="number" min="0" max="100" value={affectedArea} onChange={(e) => setAffectedArea(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "عدد النباتات المصابة" : "Affected plants"}</Label><Input type="number" min="0" value={affectedPlantCount} onChange={(e) => setAffectedPlantCount(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "إجمالي النباتات" : "Total plants"}</Label><Input type="number" min="1" value={totalPlantCount} onChange={(e) => setTotalPlantCount(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "عمر النبات (يوم)" : "Plant age (days)"}</Label><Input type="number" min="0" value={plantAgeDays} onChange={(e) => setPlantAgeDays(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "صحة النبات (0–1)" : "Plant health (0–1)"}</Label><Input type="number" min="0" max="1" step="0.05" value={plantHealth} onChange={(e) => setPlantHealth(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "مساحة المزرعة (هكتار)" : "Farm size (ha)"}</Label><Input type="number" min="0.01" step="0.01" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "الحرارة (°C)" : "Temperature (°C)"}</Label><Input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "الرطوبة (%)" : "Humidity (%)"}</Label><Input type="number" min="0" max="100" value={humidity} onChange={(e) => setHumidity(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "أمطار حديثة (مم)" : "Recent rainfall (mm)"}</Label><Input type="number" min="0" value={recentRainfall} onChange={(e) => setRecentRainfall(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "سرعة الرياح (كم/س)" : "Wind speed (km/h)"}</Label><Input type="number" min="0" value={windSpeed} onChange={(e) => setWindSpeed(e.target.value)} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "كثافة النباتات" : "Plant density"}</Label><Select value={plantDensity} onValueChange={setPlantDensity}><SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر" : "Select"} /></SelectTrigger><SelectContent><SelectItem value="low">{language === "ar" ? "منخفضة" : "Low"}</SelectItem><SelectItem value="normal">{language === "ar" ? "عادية" : "Normal"}</SelectItem><SelectItem value="high">{language === "ar" ? "مرتفعة" : "High"}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{language === "ar" ? "وتيرة الري" : "Irrigation frequency"}</Label><Select value={irrigationFrequency} onValueChange={setIrrigationFrequency}><SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر" : "Select"} /></SelectTrigger><SelectContent><SelectItem value="low">{language === "ar" ? "منخفضة" : "Low"}</SelectItem><SelectItem value="normal">{language === "ar" ? "عادية" : "Normal"}</SelectItem><SelectItem value="excessive">{language === "ar" ? "مفرطة" : "Excessive"}</SelectItem></SelectContent></Select></div>
            </div>

            <Button onClick={analyze} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("pest.analyzing")}
                </>
              ) : (
                <>
                  <Bug className="me-2 h-4 w-4" />
                  {t("pest.analyze")}
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
                <ShieldCheck className="mx-auto mb-3 h-10 w-10 opacity-40" />
                {t("pest.emptyHint")}
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <AIProvenanceNotice result={result} />

              <AdvisoryPanel advisory={result.advisory} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    {t("pest.diagnosis")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {identification?.pest_name_ar || identification?.identified_pest}
                    </span>
                    <Badge variant="secondary">{identification?.category}</Badge>
                  </div>
                  {typeof identification?.confidence_score === "number" && (
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{t("pest.confidence")}</span>
                        <span>{(identification.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={identification.confidence_score * 100} />
                    </div>
                  )}
                  {severity?.severity_level && (
                    <div className="flex items-center justify-between rounded border p-2">
                      <span>{t("pest.severity")}</span>
                      <Badge
                        variant={severity.above_threshold ? "destructive" : "secondary"}
                      >
                        {severity.severity_level}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    {t("pest.treatments")}
                  </CardTitle>
                  <CardDescription>
                    {t("pest.plannedApplications", { count: result.treatment_schedule?.total_applications ?? 0 })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {treatments.length === 0 ? (
                    <p className="text-muted-foreground">
                      {t("pest.noRecommendations")}
                    </p>
                  ) : (
                    treatments.map((treatment, index) => (
                      <div key={index} className="rounded border p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {treatment.treatment_name_ar || treatment.treatment_name}
                          </span>
                          {typeof treatment.suitability_score === "number" && (
                            <Badge>
                              {(treatment.suitability_score * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        {treatment.application_instructions && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {treatment.application_instructions}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
