/**
 * Rule-based crop advisor producing the shape expected by the AgroGrowth UI.
 *
 * Yield / price / cost figures come from a small, documented reference table for
 * Tunisian agriculture. They are *estimates*, not live market data, and every
 * response is flagged with `dataSource: "rule-based"` plus a disclaimer so the
 * UI never presents them as model inference or as real-time prices.
 */

import type { SoilInput } from "./knowledgeEngine";
import { analyzeSoil } from "./knowledgeEngine";

export interface CropReference {
  crop: string;
  nameAr: string;
  category: string;
  phRange: [number, number];
  tempRange: [number, number];
  rainfallRange: [number, number];
  /** Reference yield in tonnes per hectare (estimate). */
  yieldTonsPerHa: number;
  /** Reference farm-gate price in TND per kg (estimate). */
  priceTndPerKg: number;
  /** Reference input cost in TND per hectare (estimate). */
  costTndPerHa: number;
  waterNeed: "منخفض" | "متوسط" | "مرتفع";
  seasons: string[];
  salinityTolerance: number; // dS/m
  riskLevel: "منخفض" | "متوسط" | "عالٍ";
}

/** Reference dataset — estimates for planning only. */
export const CROP_REFERENCE: CropReference[] = [
  { crop: "olive", nameAr: "الزيتون", category: "أشجار مثمرة", phRange: [6, 8.5], tempRange: [10, 40], rainfallRange: [200, 700], yieldTonsPerHa: 6, priceTndPerKg: 3.2, costTndPerHa: 3500, waterNeed: "منخفض", seasons: ["خريف", "ربيع"], salinityTolerance: 6, riskLevel: "منخفض" },
  { crop: "wheat", nameAr: "القمح الصلب", category: "حبوب", phRange: [6, 7.5], tempRange: [8, 25], rainfallRange: [300, 800], yieldTonsPerHa: 3.2, priceTndPerKg: 0.95, costTndPerHa: 1400, waterNeed: "متوسط", seasons: ["خريف", "شتاء"], salinityTolerance: 4, riskLevel: "متوسط" },
  { crop: "barley", nameAr: "الشعير", category: "حبوب", phRange: [6, 8.5], tempRange: [5, 28], rainfallRange: [200, 600], yieldTonsPerHa: 2.4, priceTndPerKg: 0.8, costTndPerHa: 1100, waterNeed: "منخفض", seasons: ["خريف", "شتاء"], salinityTolerance: 8, riskLevel: "منخفض" },
  { crop: "tomato", nameAr: "الطماطم", category: "خضروات", phRange: [6, 7], tempRange: [15, 30], rainfallRange: [400, 900], yieldTonsPerHa: 45, priceTndPerKg: 1.3, costTndPerHa: 12000, waterNeed: "مرتفع", seasons: ["ربيع", "صيف"], salinityTolerance: 2.5, riskLevel: "عالٍ" },
  { crop: "potato", nameAr: "البطاطا", category: "خضروات", phRange: [5.5, 6.5], tempRange: [10, 25], rainfallRange: [400, 800], yieldTonsPerHa: 25, priceTndPerKg: 1.1, costTndPerHa: 9000, waterNeed: "متوسط", seasons: ["شتاء", "ربيع"], salinityTolerance: 2, riskLevel: "متوسط" },
  { crop: "date_palm", nameAr: "النخيل", category: "أشجار مثمرة", phRange: [7, 8.5], tempRange: [18, 45], rainfallRange: [50, 300], yieldTonsPerHa: 8, priceTndPerKg: 4.5, costTndPerHa: 5000, waterNeed: "مرتفع", seasons: ["ربيع"], salinityTolerance: 8, riskLevel: "منخفض" },
  { crop: "citrus", nameAr: "الحوامض", category: "أشجار مثمرة", phRange: [5.5, 7.5], tempRange: [12, 35], rainfallRange: [400, 900], yieldTonsPerHa: 22, priceTndPerKg: 1.8, costTndPerHa: 8000, waterNeed: "مرتفع", seasons: ["ربيع"], salinityTolerance: 3, riskLevel: "متوسط" },
  { crop: "chickpea", nameAr: "الحمص", category: "بقوليات", phRange: [6, 8], tempRange: [10, 28], rainfallRange: [250, 600], yieldTonsPerHa: 1.6, priceTndPerKg: 2.6, costTndPerHa: 1200, waterNeed: "منخفض", seasons: ["شتاء", "ربيع"], salinityTolerance: 3, riskLevel: "منخفض" },
  { crop: "watermelon", nameAr: "البطيخ", category: "خضروات", phRange: [6, 7.5], tempRange: [18, 35], rainfallRange: [300, 700], yieldTonsPerHa: 30, priceTndPerKg: 0.9, costTndPerHa: 6500, waterNeed: "متوسط", seasons: ["ربيع", "صيف"], salinityTolerance: 2, riskLevel: "متوسط" },
  { crop: "alfalfa", nameAr: "الفصة", category: "أعلاف", phRange: [6, 8], tempRange: [10, 32], rainfallRange: [300, 900], yieldTonsPerHa: 14, priceTndPerKg: 0.5, costTndPerHa: 3000, waterNeed: "مرتفع", seasons: ["ربيع", "خريف"], salinityTolerance: 4, riskLevel: "منخفض" },
];

export interface CropAdvisorInput {
  ph?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
  area_hectares?: number;
  soil_type?: string;
  salinity?: number;
  waterAvailability?: "منخفض" | "متوسط" | "مرتفع";
  season?: string;
}

export interface UICropRecommendation {
  rank: number;
  crop: string;
  name_ar: string;
  category: string;
  suitability_score: number; // 0..1
  predicted_yield_per_hectare: number; // tonnes/ha (estimate)
  estimated_revenue: number;
  profit_analysis: {
    net_profit: number;
    roi_percent: number;
    profit_margin_percent: number;
    isEstimate: true;
  };
  risk_assessment: {
    overall_risk_level: "منخفض" | "متوسط" | "عالٍ";
    overall_risk_score: number;
  };
  reasoning: string[];
  water_need: string;
  season: string;
  growing_season: string;
}

export interface CropAdvisorResult {
  dataSource: "rule-based";
  /** Rule-based output is never model inference; stated explicitly for the client. */
  isRealData: false;
  modelSource: "rule-based-engine";
  recommendations: UICropRecommendation[];
  best_recommendation: UICropRecommendation | null;
  overall_analysis: {
    inputSummary: string[];
    note: string;
  };
  seasonal_advice: {
    recommended_season: string;
    note: string;
  };
  disclaimer: string;
  analysis_timestamp: string;
}

function scoreInRange(value: number | undefined, [lo, hi]: [number, number]): number {
  if (value === undefined || value === null || Number.isNaN(value)) return 0.65;
  if (value >= lo && value <= hi) return 1;
  const span = Math.max(hi - lo, 0.0001);
  const distance = value < lo ? (lo - value) / span : (value - hi) / span;
  return Math.max(0, 1 - distance);
}

export function recommendCropsForUI(input: CropAdvisorInput): CropAdvisorResult {
  const area = input.area_hectares && input.area_hectares > 0 ? input.area_hectares : 1;

  const scored = CROP_REFERENCE.map((crop) => {
    const phScore = scoreInRange(input.ph, crop.phRange);
    const tempScore = scoreInRange(input.temperature, crop.tempRange);
    const rainScore = scoreInRange(input.rainfall, crop.rainfallRange);
    const salinityScore =
      input.salinity === undefined
        ? 1
        : input.salinity <= crop.salinityTolerance
          ? 1
          : Math.max(0, 1 - (input.salinity - crop.salinityTolerance) / 5);
    const seasonScore = input.season
      ? crop.seasons.includes(input.season)
        ? 1
        : 0.5
      : 0.8;
    const waterScore =
      input.waterAvailability === undefined
        ? 1
        : input.waterAvailability === crop.waterNeed
          ? 1
          : input.waterAvailability === "منخفض" && crop.waterNeed === "مرتفع"
            ? 0.3
            : 0.7;

    const suitability =
      phScore * 0.28 +
      tempScore * 0.24 +
      rainScore * 0.18 +
      salinityScore * 0.1 +
      seasonScore * 0.1 +
      waterScore * 0.1;

    // Yield is adjusted by suitability so weak matches don't over-promise.
    const adjustedYield = crop.yieldTonsPerHa * (0.5 + 0.5 * suitability);
    const yieldKgPerHa = adjustedYield * 1000;
    const revenue = yieldKgPerHa * crop.priceTndPerKg * area;
    const cost = crop.costTndPerHa * area;
    const netProfit = revenue - cost;
    const roi = cost > 0 ? (netProfit / cost) * 100 : 0;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const reasoning: string[] = [];
    if (input.ph !== undefined)
      reasoning.push(
        phScore >= 0.9
          ? `الـ pH (${input.ph}) ضمن المجال المناسب (${crop.phRange[0]}–${crop.phRange[1]}).`
          : `الـ pH (${input.ph}) خارج المجال المثالي (${crop.phRange[0]}–${crop.phRange[1]}).`,
      );
    if (input.temperature !== undefined)
      reasoning.push(
        tempScore >= 0.9
          ? `درجة الحرارة (${input.temperature}°م) ملائمة.`
          : `درجة الحرارة (${input.temperature}°م) قريبة من حدود التحمل.`,
      );
    if (input.rainfall !== undefined)
      reasoning.push(`الأمطار المرجعية المطلوبة: ${crop.rainfallRange[0]}–${crop.rainfallRange[1]} مم.`);
    reasoning.push(`الاحتياج المائي: ${crop.waterNeed}.`);
    if (input.salinity !== undefined && input.salinity > crop.salinityTolerance)
      reasoning.push("الملوحة تتجاوز تحمل الصنف.");

    return {
      rank: 0,
      crop: crop.crop,
      name_ar: crop.nameAr,
      category: crop.category,
      suitability_score: Math.round(suitability * 100) / 100,
      predicted_yield_per_hectare: Math.round(adjustedYield * 10) / 10,
      estimated_revenue: Math.round(revenue),
      profit_analysis: {
        net_profit: Math.round(netProfit),
        roi_percent: Math.round(roi * 10) / 10,
        profit_margin_percent: Math.round(margin * 10) / 10,
        isEstimate: true as const,
      },
      risk_assessment: {
        overall_risk_level: crop.riskLevel,
        overall_risk_score:
          crop.riskLevel === "منخفض" ? 25 : crop.riskLevel === "متوسط" ? 50 : 75,
      },
      reasoning,
      water_need: crop.waterNeed,
      season: crop.seasons.join("، "),
      growing_season: crop.seasons[0],
    } as UICropRecommendation;
  });

  scored.sort((a, b) => b.suitability_score - a.suitability_score);
  scored.forEach((c, i) => (c.rank = i + 1));

  const top = scored.slice(0, 6);
  const inputSummary: string[] = [];
  if (input.ph !== undefined) inputSummary.push(`pH=${input.ph}`);
  if (input.temperature !== undefined) inputSummary.push(`temp=${input.temperature}°C`);
  if (input.rainfall !== undefined) inputSummary.push(`rain=${input.rainfall}mm`);
  if (input.soil_type) inputSummary.push(`soil=${input.soil_type}`);
  if (input.area_hectares) inputSummary.push(`area=${input.area_hectares}ha`);

  return {
    dataSource: "rule-based",
    isRealData: false,
    modelSource: "rule-based-engine",
    recommendations: top,
    best_recommendation: top[0] ?? null,
    overall_analysis: {
      inputSummary,
      note:
        "الترتيب مبني على مطابقة معايير التربة والمناخ مع جدول مرجعي للمحاصيل التونسية.",
    },
    seasonal_advice: {
      recommended_season: input.season || top[0]?.growing_season || "حسب الموسم الحالي",
      note: "يُنصح بمطابقة دورة المحصول مع موسم الأمطار وتوفر مياه الري.",
    },
    disclaimer:
      "أرقام المردود والربح تقديرية مبنية على متوسطات مرجعية وليست أسعاراً حية. تحقّق منها قبل القرار الاستثماري.",
    analysis_timestamp: new Date().toISOString(),
  };
}

/**
 * Analyse soil sensor data and return the shape the UI expects.
 */
export interface UISoilAnalysis {
  dataSource: "rule-based";
  /** Rule-based output is never model inference; stated explicitly for the client. */
  isRealData: false;
  modelSource: "rule-based-engine";
  soil_type: { classification: string; confidence: number };
  properties: Record<string, { value: number | null; unit: string; status: string }>;
  health_score: number;
  fertility_level: string;
  overall_recommendations: string[];
  missing_measurements: string[];
  problems: string[];
  findings: Array<{ parameter: string; labelAr: string; value: number | null; status: string; messageAr: string }>;
  disclaimer: string;
  analysis_timestamp: string;
}


function classifySoilType(input: CropAdvisorInput): { classification: string; confidence: number } {
  const clay = input.soil_type?.toLowerCase();
  if (clay) return { classification: input.soil_type as string, confidence: 0.7 };
  // Heuristic from texture-related proxies when no explicit type is given.
  if (input.salinity !== undefined && input.salinity > 4)
    return { classification: "تربة ملحية", confidence: 0.6 };
  return { classification: "تربة مختلطة", confidence: 0.5 };
}

export function analyzeSoilForUI(input: CropAdvisorInput): UISoilAnalysis {
  const soilInput: SoilInput = {
    ph: input.ph,
    nitrogen: input.nitrogen,
    phosphorus: input.phosphorus,
    potassium: input.potassium,
    moisture: (input as any).moisture,
    salinity: input.salinity,
    organicMatter: (input as any).organic_matter ?? (input as any).organicMatter,
    temperature: input.temperature,
  };
  const result = analyzeSoil(soilInput);
  const soilType = classifySoilType(input);

  const properties: UISoilAnalysis["properties"] = {};
  for (const finding of result.findings) {
    properties[finding.parameter] = {
      value: finding.value,
      unit: "",
      status: finding.status,
    };
  }

  return {
    dataSource: "rule-based",
    isRealData: false,
    modelSource: "rule-based-engine",
    soil_type: soilType,
    properties,
    health_score: result.healthScore,
    fertility_level: result.fertilityLevelAr,
    overall_recommendations: result.recommendations,
    missing_measurements: result.missingMeasurements,
    problems: result.problems,
    findings: result.findings,
    disclaimer: result.disclaimer,
    analysis_timestamp: new Date().toISOString(),
  };
}
