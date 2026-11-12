import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
 * Backed by POST /api/pest-control/identify-from-symptoms, which calls the
 * pest_control microservice's deterministic keyword matcher (`/identify-pest`).
 * The service's full analysis/treatment models are disabled (synthetic), so the
 * provenance-guarded proxy refuses them; the keyword matcher, by contrast,
 * declares `model_source: "symptom-keyword-rules"` and is honest to use.
 *
 * The response is labelled `rule-based` / `isRealData: false` and rendered by
 * AIProvenanceNotice, so a keyword match is never mistaken for a trained-model
 * diagnosis. No treatment, active ingredient, dose or pre-harvest interval is
 * ever shown — that requires a verified Tunisian product registry.
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
    identification_method?: string;
    top_predictions?: Array<{ pest: string; name_ar: string; probability: number }>;
  };
  symptoms_used?: string[];
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
  const { dir, t } = useLanguage();

  const [cropType, setCropType] = useState("tomato");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PestAnalysis | null>(null);

  const toggleSymptom = (ar: string) => {
    setSymptoms((prev) =>
      prev.includes(ar) ? prev.filter((s) => s !== ar) : [...prev, ar],
    );
  };

  const identify = async () => {
    if (symptoms.length === 0) {
      setError(t("pest.selectSymptom"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiFetch("/api/pest-control/identify-from-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_type: cropType,
          symptoms,
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

            <Button onClick={identify} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("pest.identifying")}
                </>
              ) : (
                <>
                  <Bug className="me-2 h-4 w-4" />
                  {t("pest.identify")}
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
                  {identification?.identification_method && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{t("pest.method")}</span>
                      <span dir="ltr">{identification.identification_method}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {t("pest.ruleBasedNote")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    {t("pest.treatments")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {treatments.length === 0 ? (
                    <p className="text-muted-foreground">
                      {t("pest.treatmentUnavailable")}
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
