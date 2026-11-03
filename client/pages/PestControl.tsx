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
  { value: "tomato", ar: "الطماطم", en: "Tomato" },
  { value: "wheat", ar: "القمح", en: "Wheat" },
  { value: "olive", ar: "الزيتون", en: "Olive" },
  { value: "potato", ar: "البطاطس", en: "Potato" },
  { value: "corn", ar: "الذرة", en: "Corn" },
  { value: "citrus", ar: "الحمضيات", en: "Citrus" },
];

const COMMON_SYMPTOMS = [
  { ar: "أوراق مجعدة", en: "Curled leaves" },
  { ar: "إفرازات لزجة", en: "Sticky honeydew" },
  { ar: "نقط صفراء صغيرة", en: "Small yellow spots" },
  { ar: "خيوط عنكبوتية", en: "Webbing" },
  { ar: "طبقة بيضاء", en: "White powdery layer" },
  { ar: "بقع بنية", en: "Brown spots" },
  { ar: "تعفن", en: "Rotting" },
  { ar: "ذبول مفاجئ", en: "Sudden wilting" },
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
  dataSource?: string;
  isRealData?: boolean;
  modelSource?: string;
}

export default function PestControl() {
  const { isArabic } = useLanguage();
  const t = (ar: string, en: string) => (isArabic ? ar : en);

  const [cropType, setCropType] = useState("tomato");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [affectedArea, setAffectedArea] = useState(20);
  const [plantHealth, setPlantHealth] = useState(0.7);
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
      setError(t("الرجاء اختيار عرض واحد على الأقل", "Select at least one symptom"));
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
          affected_area_percentage: affectedArea,
          plant_health_score: plantHealth,
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
        t("تعذّر إجراء التحليل: ", "Analysis failed: ") +
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
    <div className="container mx-auto p-6 space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <Bug className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">
            {t("مستشار مكافحة الآفات", "Pest Control Advisor")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "تحديد الآفات وتوصيات العلاج بناءً على الأعراض وظروف المزرعة",
              "Pest identification and treatment guidance from symptoms and farm conditions",
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("بيانات الإصابة", "Infestation details")}</CardTitle>
            <CardDescription>
              {t("أدخل المحصول والأعراض الملاحظة", "Enter the crop and observed symptoms")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("المحصول", "Crop")}</Label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CROPS.map((crop) => (
                    <SelectItem key={crop.value} value={crop.value}>
                      {isArabic ? crop.ar : crop.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("الأعراض الملاحظة", "Observed symptoms")}</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <Badge
                    key={symptom.ar}
                    variant={symptoms.includes(symptom.ar) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSymptom(symptom.ar)}
                  >
                    {isArabic ? symptom.ar : symptom.en}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {t("نسبة المساحة المصابة", "Affected area")}: {affectedArea}%
              </Label>
              <Input
                type="range"
                min={0}
                max={100}
                value={affectedArea}
                onChange={(e) => setAffectedArea(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t("مؤشر صحة النبات", "Plant health score")}:{" "}
                {plantHealth.toFixed(2)}
              </Label>
              <Input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={plantHealth}
                onChange={(e) => setPlantHealth(Number(e.target.value))}
              />
            </div>

            <Button onClick={analyze} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("جارٍ التحليل...", "Analyzing...")}
                </>
              ) : (
                <>
                  <Bug className="me-2 h-4 w-4" />
                  {t("تحليل مشكلة الآفات", "Analyze pest problem")}
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
                {t(
                  "أدخل الأعراض ثم اضغط تحليل للحصول على التشخيص والتوصيات.",
                  "Enter symptoms and press analyze to get a diagnosis and recommendations.",
                )}
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <AIProvenanceNotice result={result} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    {t("التشخيص", "Diagnosis")}
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
                        <span>{t("درجة الثقة", "Confidence")}</span>
                        <span>{(identification.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={identification.confidence_score * 100} />
                    </div>
                  )}
                  {severity?.severity_level && (
                    <div className="flex items-center justify-between rounded border p-2">
                      <span>{t("شدة الإصابة", "Severity")}</span>
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
                    {t("توصيات العلاج", "Treatment recommendations")}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      `عدد التطبيقات المخططة: ${result.treatment_schedule?.total_applications ?? 0}`,
                      `Planned applications: ${result.treatment_schedule?.total_applications ?? 0}`,
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {treatments.length === 0 ? (
                    <p className="text-muted-foreground">
                      {t("لا توجد توصيات متاحة.", "No recommendations available.")}
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
