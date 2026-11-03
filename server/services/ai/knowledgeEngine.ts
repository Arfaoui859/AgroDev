/**
 * Deterministic agronomy knowledge engine.
 *
 * This is the honest fallback used when no LLM provider is configured and when
 * the Python ML microservices are unavailable. Outputs are produced by explicit,
 * auditable rules — they are labelled with `dataSource: "rule-based"` so the UI
 * never presents them as model/LLM inference.
 */

export interface SoilInput {
  ph?: number;
  nitrogen?: number; // mg/kg
  phosphorus?: number; // mg/kg
  potassium?: number; // mg/kg
  organicMatter?: number; // %
  moisture?: number; // %
  salinity?: number; // dS/m
  temperature?: number; // °C
}

export interface SoilFinding {
  parameter: string;
  labelAr: string;
  value: number | null;
  status: "low" | "optimal" | "high" | "missing";
  messageAr: string;
}

export interface SoilAnalysisResult {
  dataSource: "rule-based";
  healthScore: number;
  fertilityLevelAr: string;
  findings: SoilFinding[];
  missingMeasurements: string[];
  problems: string[];
  recommendations: string[];
  disclaimer: string;
}

interface Range {
  key: keyof SoilInput;
  labelAr: string;
  unit: string;
  low: number;
  high: number;
  hardMin?: number;
  hardMax?: number;
}

const SOIL_RANGES: Range[] = [
  { key: "ph", labelAr: "درجة الحموضة (pH)", unit: "", low: 6.0, high: 7.5, hardMin: 3, hardMax: 10 },
  { key: "nitrogen", labelAr: "الآزوت (N)", unit: "mg/kg", low: 40, high: 90 },
  { key: "phosphorus", labelAr: "الفوسفور (P)", unit: "mg/kg", low: 20, high: 50 },
  { key: "potassium", labelAr: "البوتاسيوم (K)", unit: "mg/kg", low: 150, high: 350 },
  { key: "organicMatter", labelAr: "المادة العضوية", unit: "%", low: 2.0, high: 6.0 },
  { key: "moisture", labelAr: "رطوبة التربة", unit: "%", low: 25, high: 60 },
  { key: "salinity", labelAr: "الملوحة (EC)", unit: "dS/m", low: 0, high: 2.0, hardMax: 20 },
];

const SOIL_LABELS: Record<string, string> = {
  ph: "درجة الحموضة",
  nitrogen: "الآزوت",
  phosphorus: "الفوسفور",
  potassium: "البوتاسيوم",
  organicMatter: "المادة العضوية",
  moisture: "الرطوبة",
  salinity: "الملوحة",
  temperature: "درجة الحرارة",
};

/**
 * Analyse soil measurements and produce deficiencies, problems and recommendations.
 * Always reports which measurements are missing rather than guessing their values.
 */
export function analyzeSoil(input: SoilInput): SoilAnalysisResult {
  const findings: SoilFinding[] = [];
  const missing: string[] = [];
  const problems: string[] = [];
  const recommendations: string[] = [];

  let scoreSum = 0;
  let scoreCount = 0;

  for (const range of SOIL_RANGES) {
    const raw = input[range.key];
    if (raw === undefined || raw === null || Number.isNaN(Number(raw))) {
      missing.push(range.labelAr);
      findings.push({
        parameter: range.key,
        labelAr: range.labelAr,
        value: null,
        status: "missing",
        messageAr: `لم يتم توفير قياس ${range.labelAr}. يُنصح بإجراء التحليل للحصول على تقييم دقيق.`,
      });
      continue;
    }

    const value = Number(raw);
    let status: SoilFinding["status"] = "optimal";
    if (value < range.low) status = "low";
    else if (value > range.high) status = "high";

    // Normalised sub-score for the health index.
    const span = Math.max(range.high - range.low, 0.0001);
    const distance =
      value < range.low
        ? (range.low - value) / span
        : value > range.high
          ? (value - range.high) / span
          : 0;
    scoreSum += Math.max(0, 100 - distance * 100);
    scoreCount++;

    findings.push({
      parameter: range.key,
      labelAr: range.labelAr,
      value,
      status,
      messageAr: describeSoilStatus(range, value, status),
    });

    if (status === "low") {
      problems.push(`انخفاض ${range.labelAr} (${value}${range.unit})`);
      recommendations.push(recommendForLow(range, value));
    } else if (status === "high") {
      problems.push(`ارتفاع ${range.labelAr} (${value}${range.unit})`);
      recommendations.push(recommendForHigh(range, value));
    }
  }

  // Cross-cutting agronomic checks.
  if (typeof input.ph === "number") {
    if (input.ph < 5.5) problems.push("التربة حمضية بشدة وقد تحد من امتصاص العناصر");
    if (input.ph > 8.5) problems.push("التربة قلوية بشدة وقد تسبب نقص الحديد والزنك");
  }
  if (typeof input.salinity === "number" && input.salinity > 4) {
    problems.push("ملوحة مرتفعة قد تؤثر على معظم المحاصيل الحساسة");
    recommendations.push(
      "اعتماد الري بالتنقيط مع غسيل الأملاح، واستعمال أصناف متحملة للملوحة مثل الشعير.",
    );
  }

  const healthScore =
    scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;

  const fertilityLevelAr =
    healthScore >= 80
      ? "عالية"
      : healthScore >= 60
        ? "متوسطة"
        : healthScore >= 40
          ? "منخفضة"
          : "ضعيفة";

  if (recommendations.length === 0) {
    recommendations.push(
      "جميع القياسات المتوفرة ضمن المجالات المناسبة. حافظ على دورة تسميد متوازنة ومراقبة دورية.",
    );
  }

  return {
    dataSource: "rule-based",
    healthScore,
    fertilityLevelAr,
    findings,
    missingMeasurements: missing,
    problems,
    recommendations,
    disclaimer:
      "تحليل مبني على قواعد زراعية محددة (وليس نموذج تعلم آلي). للدقة القصوى اربط خدمة تحليل التربة.",
  };
}

function describeSoilStatus(range: Range, value: number, status: SoilFinding["status"]): string {
  if (status === "optimal") return `${range.labelAr} ضمن المجال المناسب (${value}${range.unit}).`;
  if (status === "low") return `${range.labelAr} منخفض (${value}${range.unit}).`;
  return `${range.labelAr} مرتفع (${value}${range.unit}).`;
}

function recommendForLow(range: Range, value: number): string {
  switch (range.key) {
    case "ph":
      return "أضف الجير الزراعي (كربونات الكالسيوم) تدريجياً لرفع الـ pH نحو 6.5.";
    case "nitrogen":
      return "أضف سماداً آزوتياً (يوريا أو نترات الأمونيوم) على دفعات مع الري.";
    case "phosphorus":
      return "أضف السوبر فوسفات أو سماداً فوسفاتياً عند الزراعة.";
    case "potassium":
      return "أضف كبريتات البوتاسيوم لتعويض نقص البوتاسيوم.";
    case "organicMatter":
      return "أضف سماداً عضوياً متحللاً أو روثاً معالجاً لتحسين بنية التربة.";
    case "moisture":
      return "زد وتيرة الري مع مراقبة الرطوبة عند عمق الجذور.";
    default:
      return `صحّح ${range.labelAr} المنخفض (${value}${range.unit}).`;
  }
}

function recommendForHigh(range: Range, value: number): string {
  switch (range.key) {
    case "ph":
      return "أضف الكبريت الزراعي أو سماداً حمضياً لخفض الـ pH نحو 7.0.";
    case "nitrogen":
      return "قلّل السماد الآزوتي لتجنب النمو الخضري المفرط وتلوث المياه الجوفية.";
    case "phosphorus":
      return "قلّل الفوسفات وأضف مواد عضوية لتحسين التوازن.";
    case "potassium":
      return "قلّل أسمدة البوتاس واعتمد على تحليل دوري.";
    case "salinity":
      return "اعتمد غسيل الأملاح بالري الزائد وتحسين الصرف.";
    case "moisture":
      return "حسّن الصرف وتجنّب الري الزائد لتجنب تعفن الجذور.";
    default:
      return `عالج ارتفاع ${range.labelAr} (${value}${range.unit}).`;
  }
}

// ---------------------------------------------------------------------------
// Crop recommendation (rule-based)
// ---------------------------------------------------------------------------

export interface CropCandidate {
  crop: string;
  nameAr: string;
  suitabilityScore: number;
  reasonsAr: string[];
  waterNeedAr: string;
  seasonAr: string;
}

export interface CropRecommendationResult {
  dataSource: "rule-based";
  recommendations: CropCandidate[];
  disclaimer: string;
}

interface CropProfile {
  crop: string;
  nameAr: string;
  phRange: [number, number];
  tempRange: [number, number];
  rainfallRange: [number, number];
  waterNeed: "منخفض" | "متوسط" | "مرتفع";
  seasons: string[];
  salinityTolerance: number; // dS/m
}

const TUNISIAN_CROPS: CropProfile[] = [
  { crop: "olive", nameAr: "الزيتون", phRange: [6, 8.5], tempRange: [10, 40], rainfallRange: [200, 700], waterNeed: "منخفض", seasons: ["خريف", "ربيع"], salinityTolerance: 6 },
  { crop: "wheat", nameAr: "القمح الصلب", phRange: [6, 7.5], tempRange: [8, 25], rainfallRange: [300, 800], waterNeed: "متوسط", seasons: ["خريف", "شتاء"], salinityTolerance: 4 },
  { crop: "barley", nameAr: "الشعير", phRange: [6, 8.5], tempRange: [5, 28], rainfallRange: [200, 600], waterNeed: "منخفض", seasons: ["خريف", "شتاء"], salinityTolerance: 8 },
  { crop: "tomato", nameAr: "الطماطم", phRange: [6, 7], tempRange: [15, 30], rainfallRange: [400, 900], waterNeed: "مرتفع", seasons: ["ربيع", "صيف"], salinityTolerance: 2.5 },
  { crop: "potato", nameAr: "البطاطا", phRange: [5.5, 6.5], tempRange: [10, 25], rainfallRange: [400, 800], waterNeed: "متوسط", seasons: ["شتاء", "ربيع"], salinityTolerance: 2 },
  { crop: "date_palm", nameAr: "النخيل", phRange: [7, 8.5], tempRange: [18, 45], rainfallRange: [50, 300], waterNeed: "مرتفع", seasons: ["ربيع"], salinityTolerance: 8 },
  { crop: "citrus", nameAr: "الحوامض", phRange: [5.5, 7.5], tempRange: [12, 35], rainfallRange: [400, 900], waterNeed: "مرتفع", seasons: ["ربيع"], salinityTolerance: 3 },
  { crop: "chickpea", nameAr: "الحمص", phRange: [6, 8], tempRange: [10, 28], rainfallRange: [250, 600], waterNeed: "منخفض", seasons: ["شتاء", "ربيع"], salinityTolerance: 3 },
  { crop: "watermelon", nameAr: "البطيخ", phRange: [6, 7.5], tempRange: [18, 35], rainfallRange: [300, 700], waterNeed: "متوسط", seasons: ["ربيع", "صيف"], salinityTolerance: 2 },
  { crop: "alfalfa", nameAr: "الفصة", phRange: [6, 8], tempRange: [10, 32], rainfallRange: [300, 900], waterNeed: "مرتفع", seasons: ["ربيع", "خريف"], salinityTolerance: 4 },
];

export interface CropContext {
  ph?: number;
  temperature?: number;
  rainfall?: number;
  salinity?: number;
  waterAvailability?: "منخفض" | "متوسط" | "مرتفع";
  season?: string;
}

function scoreInRange(value: number | undefined, [lo, hi]: [number, number]): number {
  if (value === undefined || value === null || Number.isNaN(value)) return 0.6; // neutral when unknown
  if (value >= lo && value <= hi) return 1;
  const span = Math.max(hi - lo, 0.0001);
  const distance = value < lo ? (lo - value) / span : (value - hi) / span;
  return Math.max(0, 1 - distance);
}

export function recommendCrops(context: CropContext): CropRecommendationResult {
  const scored = TUNISIAN_CROPS.map((crop) => {
    const phScore = scoreInRange(context.ph, crop.phRange);
    const tempScore = scoreInRange(context.temperature, crop.tempRange);
    const rainScore = scoreInRange(context.rainfall, crop.rainfallRange);
    const salinityScore =
      context.salinity === undefined
        ? 1
        : context.salinity <= crop.salinityTolerance
          ? 1
          : Math.max(0, 1 - (context.salinity - crop.salinityTolerance) / 5);
    const seasonScore = context.season
      ? crop.seasons.includes(context.season)
        ? 1
        : 0.5
      : 0.8;
    const waterScore =
      context.waterAvailability === undefined
        ? 1
        : context.waterAvailability === crop.waterNeed
          ? 1
          : context.waterAvailability === "منخفض" && crop.waterNeed === "مرتفع"
            ? 0.3
            : 0.7;

    const suitability =
      phScore * 0.25 +
      tempScore * 0.25 +
      rainScore * 0.2 +
      salinityScore * 0.1 +
      seasonScore * 0.1 +
      waterScore * 0.1;

    const reasons: string[] = [];
    if (context.ph !== undefined)
      reasons.push(
        phScore >= 0.9
          ? `الـ pH (${context.ph}) مناسب (${crop.phRange[0]}–${crop.phRange[1]}).`
          : `الـ pH (${context.ph}) خارج المجال المثالي (${crop.phRange[0]}–${crop.phRange[1]}).`,
      );
    if (context.temperature !== undefined)
      reasons.push(
        tempScore >= 0.9
          ? `الحرارة (${context.temperature}°م) ملائمة.`
          : `الحرارة (${context.temperature}°م) قريبة من حدود التحمل.`,
      );
    if (context.salinity !== undefined && context.salinity > crop.salinityTolerance)
      reasons.push("الملوحة أعلى من تحمل الصنف.");
    reasons.push(`الاحتياج المائي: ${crop.waterNeed}.`);

    return {
      crop: crop.crop,
      nameAr: crop.nameAr,
      suitabilityScore: Math.round(suitability * 100),
      reasonsAr: reasons,
      waterNeedAr: crop.waterNeed,
      seasonAr: crop.seasons.join("، "),
    } as CropCandidate;
  });

  scored.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return {
    dataSource: "rule-based",
    recommendations: scored.slice(0, 5),
    disclaimer:
      "توصيات مبنية على قواعد مناخية وتربوية للسياق التونسي (وليس نموذجاً إحصائياً). اربط خدمة توصيات المحاصيل لدقة أعلى.",
  };
}

export { SOIL_LABELS };
