import { safeErrorMessage } from "../lib/errors";
import type { RequestHandler } from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import type { RawSoilData } from "@shared/api";
import { markAdvisory } from "../lib/provenance";
import { chatCompleteDetailed, isLLMConfigured } from "../services/providers/llmProvider";
import { scopedClientFromAuthHeader } from "../lib/supabase";

const projectRoot = process.cwd();
const AI_SERVICE_URL = process.env.AI_SOIL_ANALYSIS_SERVICE || process.env.OPENAI_API_URL || "";
const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_SERVICE_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4-turbo";

async function loadSoilAnalysisPrompt(): Promise<string> {
  const promptPath = path.join(projectRoot, "prompts/analysis/soil_analysis_detailed_report.txt");
  return fs.readFile(promptPath, "utf-8");
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

/** Accept the camelCase detailed API and the snake_case payload used by legacy forms. */
export function normalizeSoilRequest(input: Record<string, unknown>): RawSoilData {
  const nested = input.sensor_data && typeof input.sensor_data === "object"
    ? input.sensor_data as Record<string, unknown> : {};
  const source = { ...nested, ...input };
  const pick = (...keys: string[]) => {
    for (const key of keys) if (source[key] !== undefined) return source[key];
    return undefined;
  };
  const numeric = (key: string, ...aliases: string[]) =>
    numberOrUndefined(pick(key, ...aliases));
  return {
    fieldId: typeof pick("fieldId", "field_id") === "string" ? String(pick("fieldId", "field_id")) : undefined,
    location: typeof pick("location") === "string" ? String(pick("location")) : undefined,
    samplingDate: typeof pick("samplingDate", "sampling_date") === "string" ? String(pick("samplingDate", "sampling_date")) : undefined,
    sampleDepth: numeric("sampleDepth", "sample_depth"),
    ph: numeric("ph", "soil_ph") as number,
    moisture: numeric("moisture", "soil_moisture") as number,
    organicMatter: numeric("organicMatter", "organic_matter"),
    nitrogen: numeric("nitrogen", "n"),
    phosphorus: numeric("phosphorus", "p"),
    potassium: numeric("potassium", "k"),
    calcium: numeric("calcium"), magnesium: numeric("magnesium"), sulfur: numeric("sulfur"),
    iron: numeric("iron"), zinc: numeric("zinc"), manganese: numeric("manganese"),
    copper: numeric("copper"), boron: numeric("boron"),
    electricalConductivity: numeric("electricalConductivity", "electrical_conductivity", "salinity", "conductivity"),
    electricalConductivityUnit: typeof pick("electricalConductivityUnit", "electrical_conductivity_unit", "ec_unit") === "string" ? String(pick("electricalConductivityUnit", "electrical_conductivity_unit", "ec_unit")) : undefined,
    soilTexture: typeof pick("soilTexture", "soil_texture") === "string" ? String(pick("soilTexture", "soil_texture")) : undefined,
    sandPercent: numeric("sandPercent", "sand_percent", "sand"),
    siltPercent: numeric("siltPercent", "silt_percent", "silt"),
    clayPercent: numeric("clayPercent", "clay_percent", "clay"),
    nutrientUnit: typeof pick("nutrientUnit", "nutrient_unit") === "string" ? String(pick("nutrientUnit", "nutrient_unit")) : undefined,
    nutrientMethod: typeof pick("nutrientMethod", "nutrient_method") === "string" ? String(pick("nutrientMethod", "nutrient_method")) : undefined,
    electricalConductivityMethod: typeof pick("electricalConductivityMethod", "electrical_conductivity_method", "ec_method") === "string" ? String(pick("electricalConductivityMethod", "electrical_conductivity_method", "ec_method")) : undefined,
    calciumCarbonateTotal: numeric("calciumCarbonateTotal", "calcium_carbonate_total", "caco3_total"),
    calciumCarbonateActive: numeric("calciumCarbonateActive", "calcium_carbonate_active", "active_lime"),
    cec: numeric("cec", "cation_exchange_capacity"),
    sodium: numeric("sodium", "na"),
    sodiumAdsorptionRatio: numeric("sodiumAdsorptionRatio", "sar"),
    exchangeableSodiumPercentage: numeric("exchangeableSodiumPercentage", "esp"),
    waterElectricalConductivity: numeric("waterElectricalConductivity", "water_ec"),
    waterElectricalConductivityUnit: typeof pick("waterElectricalConductivityUnit", "water_ec_unit") === "string" ? String(pick("waterElectricalConductivityUnit", "water_ec_unit")) : undefined,
    waterPh: numeric("waterPh", "water_ph"),
    slopePercent: numeric("slopePercent", "slope_percent"),
    drainage: typeof pick("drainage") === "string" ? String(pick("drainage")) : undefined,
    previousCrop: typeof pick("previousCrop", "previous_crop") === "string" ? String(pick("previousCrop", "previous_crop")) : undefined,
    targetCrop: typeof pick("targetCrop", "target_crop") === "string" ? String(pick("targetCrop", "target_crop")) : undefined,
    targetYield: numeric("targetYield", "target_yield"),
    farmAreaHectares: numeric("farmAreaHectares", "farm_area_hectares", "area_hectares"),
    irrigationMethod: typeof pick("irrigationMethod", "irrigation_method") === "string" ? String(pick("irrigationMethod", "irrigation_method")) : undefined,
    region: typeof pick("region") === "string" ? String(pick("region")) : undefined,
    cropMode: pick("cropMode", "crop_mode") === "target-crop" ? "target-crop" : pick("cropMode", "crop_mode") === "plant-now" ? "plant-now" : undefined,
    currentCrop: typeof pick("currentCrop", "current_crop", "crop") === "string" ? String(pick("currentCrop", "current_crop", "crop")) : undefined,
    season: typeof pick("season") === "string" ? String(pick("season")) : undefined,
    notes: typeof pick("notes") === "string" ? String(pick("notes")) : undefined,
  };
}

function validateSoilData(data: RawSoilData): string[] {
  const errors: string[] = [];
  if (data.sampleDepth !== undefined && (!Number.isFinite(data.sampleDepth) || !Number.isInteger(data.sampleDepth) || data.sampleDepth <= 0 || data.sampleDepth > 300)) errors.push("sampleDepth must be a whole number of centimeters greater than 0 and no more than 300 cm");
  if (data.electricalConductivity !== undefined && !data.electricalConductivityUnit?.trim()) errors.push("electricalConductivityUnit is required when electrical conductivity is supplied");
  if (data.waterElectricalConductivity !== undefined && !data.waterElectricalConductivityUnit?.trim()) errors.push("waterElectricalConductivityUnit is required when irrigation water EC is supplied");
  if (!Number.isFinite(data.ph) || data.ph < 0 || data.ph > 14) errors.push("pH must be a finite number between 0 and 14");
  if (!Number.isFinite(data.moisture) || data.moisture < 0 || data.moisture > 100) errors.push("moisture must be a finite percentage between 0 and 100");
  const optional: Array<[keyof RawSoilData, number, number]> = [
    ["organicMatter",0,100],["electricalConductivity",0,100],
    ["nitrogen",0,1000000],["phosphorus",0,1000000],["potassium",0,1000000],
    ["calcium",0,1000000],["magnesium",0,1000000],["sulfur",0,1000000],
    ["iron",0,1000000],["zinc",0,1000000],["manganese",0,1000000],
    ["copper",0,1000000],["boron",0,1000000],
    ["sandPercent",0,100],["siltPercent",0,100],["clayPercent",0,100],
    ["calciumCarbonateTotal",0,100],["calciumCarbonateActive",0,100],["cec",0,200],
    ["sodium",0,1000000],["sodiumAdsorptionRatio",0,1000],["exchangeableSodiumPercentage",0,100],
    ["waterElectricalConductivity",0,100],["waterPh",0,14],["slopePercent",0,100],
    ["targetYield",0,1000000],["farmAreaHectares",0,10000000],
  ];
  for (const [key,min,max] of optional) {
    const value = data[key];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)) {
      errors.push(`${String(key)} must be between ${min} and ${max}`);
    }
  }
  const texture = [data.sandPercent,data.siltPercent,data.clayPercent];
  if (texture.some((v)=>v!==undefined)) {
    if (texture.some((v)=>v===undefined)) errors.push("sand, silt and clay percentages must be supplied together");
    else if (Math.abs((texture as number[]).reduce((sum,v)=>sum+v,0)-100)>2) errors.push("sand, silt and clay percentages must total approximately 100");
  }
  return errors;
}

function formatSoilDataForAI(data: RawSoilData): string {
  const values: Array<[string, unknown, string]> = [
    ["Field ID",data.fieldId,""],["Location",data.location,""],["Sampling date",data.samplingDate,""],
    ["Sample depth",data.sampleDepth,"cm"],["pH",data.ph,""],["Moisture",data.moisture,"%"],
    ["Organic matter",data.organicMatter,"%"],["Nitrogen (N)",data.nitrogen,data.nutrientUnit || "unit not supplied"],
    ["Phosphorus (P)",data.phosphorus,data.nutrientUnit || "unit not supplied"],["Potassium (K)",data.potassium,data.nutrientUnit || "unit not supplied"],
    ["Calcium",data.calcium,data.nutrientUnit || "unit not supplied"],["Magnesium",data.magnesium,data.nutrientUnit || "unit not supplied"],
    ["Sulfur",data.sulfur,data.nutrientUnit || "unit not supplied"],["Iron",data.iron,data.nutrientUnit || "unit not supplied"],
    ["Zinc",data.zinc,data.nutrientUnit || "unit not supplied"],["Manganese",data.manganese,data.nutrientUnit || "unit not supplied"],
    ["Copper",data.copper,data.nutrientUnit || "unit not supplied"],["Boron",data.boron,data.nutrientUnit || "unit not supplied"],
    ["Electrical conductivity",data.electricalConductivity,[data.electricalConductivityUnit || "unit not supplied","method: "+(data.electricalConductivityMethod || "not supplied")].join("; ")],
    ["Texture (user reported)",data.soilTexture,""],["Sand",data.sandPercent,"%"],["Silt",data.siltPercent,"%"],["Clay",data.clayPercent,"%"],
    ["Nutrient laboratory method",data.nutrientMethod,""],["Total CaCO3",data.calciumCarbonateTotal,"%"],["Active CaCO3",data.calciumCarbonateActive,"%"],
    ["CEC",data.cec,"unit not supplied"],["Sodium",data.sodium,data.nutrientUnit || "unit not supplied"],["SAR",data.sodiumAdsorptionRatio,""],["ESP",data.exchangeableSodiumPercentage,"%"],
    ["Irrigation water EC",data.waterElectricalConductivity,data.waterElectricalConductivityUnit || "unit not supplied"],["Irrigation water pH",data.waterPh,""],["Slope",data.slopePercent,"%"],["Drainage",data.drainage,""],
    ["Previous crop",data.previousCrop,""],["Target crop",data.targetCrop,""],["Target yield",data.targetYield,"unit not supplied"],["Farm area",data.farmAreaHectares,"ha"],["Irrigation method",data.irrigationMethod,""],["Region",data.region,""],["Crop mode",data.cropMode,""],
    ["Current crop",data.currentCrop,""],["Season",data.season,""],["Notes",data.notes,""],
  ];
  return JSON.stringify({referenceDateTunisia:new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Tunis"}).format(new Date()),notice:"Treat absent fields as unknown. Do not infer units or methods. Use referenceDateTunisia only to reason about the calendar; do not infer live weather or guarantee a sowing window.",measurements:values.filter(([,v])=>v!==undefined&&v!==null&&v!=="").map(([name,value,unit])=>({name,value,unit}))},null,2);
}

/**
 * The LLM may explain the measurements, but it is not the source of truth
 * for what the user actually submitted. Rebuild this section server-side.
 */
function buildProvidedMeasurements(data: RawSoilData): Array<{
  name: string; value: string | number; unit: string; source: string;
}> {
  const values: Array<[string, unknown, string]> = [
    ["pH", data.ph, "unitless"],
    ["رطوبة التربة", data.moisture, "%"],
    ["المادة العضوية", data.organicMatter, "%"],
    ["النيتروجين (N)", data.nitrogen, data.nutrientUnit || "الوحدة غير محددة"],
    ["الفوسفور (P)", data.phosphorus, data.nutrientUnit || "الوحدة غير محددة"],
    ["البوتاسيوم (K)", data.potassium, data.nutrientUnit || "الوحدة غير محددة"],
    ["الكالسيوم", data.calcium, data.nutrientUnit || "الوحدة غير محددة"],
    ["المغنيسيوم", data.magnesium, data.nutrientUnit || "الوحدة غير محددة"],
    ["الكبريت", data.sulfur, data.nutrientUnit || "الوحدة غير محددة"],
    ["الحديد", data.iron, data.nutrientUnit || "الوحدة غير محددة"],
    ["الزنك", data.zinc, data.nutrientUnit || "الوحدة غير محددة"],
    ["المنغنيز", data.manganese, data.nutrientUnit || "الوحدة غير محددة"],
    ["النحاس", data.copper, data.nutrientUnit || "الوحدة غير محددة"],
    ["البورون", data.boron, data.nutrientUnit || "الوحدة غير محددة"],
    ["التوصيل الكهربائي (EC)", data.electricalConductivity, data.electricalConductivityUnit || "الوحدة غير محددة"],
    ["الرمل", data.sandPercent, "%"],
    ["الغرين", data.siltPercent, "%"],
    ["الطين", data.clayPercent, "%"],
    ["عمق العينة", data.sampleDepth, "cm"],
    ["كربونات الكالسيوم الكلية", data.calciumCarbonateTotal, "%"], ["كربونات الكالسيوم النشطة", data.calciumCarbonateActive, "%"],
    ["السعة التبادلية CEC", data.cec, "الوحدة غير محددة"], ["الصوديوم", data.sodium, data.nutrientUnit || "الوحدة غير محددة"],
    ["SAR", data.sodiumAdsorptionRatio, "بدون وحدة"], ["ESP", data.exchangeableSodiumPercentage, "%"],
    ["EC ماء الري", data.waterElectricalConductivity, data.waterElectricalConductivityUnit || "الوحدة غير محددة"], ["pH ماء الري", data.waterPh, "بدون وحدة"],
    ["الانحدار", data.slopePercent, "%"], ["مردودية الهدف", data.targetYield, "الوحدة غير محددة"], ["مساحة المزرعة", data.farmAreaHectares, "ha"],
  ];

  return values
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([name, value, unit]) => ({
      name,
      value: value as string | number,
      unit,
      source: "user-entered-unverified",
    }));
}

class AIProviderUnavailableError extends Error {
  constructor(){ super("Soil analysis AI provider is not configured"); this.name="AIProviderUnavailableError"; }
}
class InvalidAIReportError extends Error {
  constructor(){ super("AI provider returned a report that does not match the required professional report schema"); this.name="InvalidAIReportError"; }
}
function hasSoilAIProvider(): boolean {
  return isLLMConfigured() || Boolean(AI_SERVICE_URL && AI_API_KEY);
}
async function callAIService(systemPrompt:string,userMessage:string):Promise<string> {
  if (isLLMConfigured()) {
    const result = await chatCompleteDetailed(
      [{role:"system",content:systemPrompt},{role:"user",content:userMessage}],
      {temperature:0.2,maxTokens:6000,json:true},
    );
    return result.text;
  }
  if (AI_SERVICE_URL && AI_API_KEY) {
    const url = AI_SERVICE_URL.includes("openai") ? "https://api.openai.com/v1/chat/completions" : `${AI_SERVICE_URL.replace(/\/$/,"")}/analyze-soil`;
    const response = await axios.post(url, AI_SERVICE_URL.includes("openai")
      ? {model:AI_MODEL,messages:[{role:"system",content:systemPrompt},{role:"user",content:userMessage}],temperature:0.2,max_tokens:6000,response_format:{type:"json_object"}}
      : {system_prompt:systemPrompt,user_message:userMessage},
    {headers:{Authorization:`Bearer ${AI_API_KEY}`,"Content-Type":"application/json"},timeout:90000});
    const content = response.data.choices?.[0]?.message?.content || response.data.result || response.data.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("Empty response from soil AI provider");
    return content;
  }
  throw new AIProviderUnavailableError();
}


async function persistSoilReport(req: import("express").Request, soilData: RawSoilData, report: Record<string, any>) {
  if (!soilData.fieldId) return { persisted: false as const, reason: "FIELD_NOT_SELECTED" as const };
  const db = scopedClientFromAuthHeader(req.header("authorization"));
  if (!db) return { persisted: false as const, reason: "DATABASE_OR_SESSION_UNAVAILABLE" as const };

  // Resolve the farm through the caller-scoped RLS client. Never trust a farmId
  // supplied by the browser and never write an orphaned record.
  const { data: section, error: sectionError } = await db
    .from("farm_sections")
    .select("id,farm_id")
    .eq("id", soilData.fieldId)
    .maybeSingle();
  if (sectionError) throw sectionError;
  if (!section?.farm_id) return { persisted: false as const, reason: "FIELD_NOT_FOUND_OR_NOT_OWNED" as const };

  const { data: saved, error } = await db
    .from("soil_analyses")
    .insert({
      farm_id: section.farm_id,
      section_id: section.id,
      analysis_type: "manual", // User-entered, unverified measurements; not a confirmed lab result.
      sensor_data: soilData,
      analysis_result: report,
      recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
      ph_level: soilData.ph,
      moisture_percent: soilData.moisture,
      organic_matter_percent: soilData.organicMatter ?? null,
      nitrogen_level: soilData.nitrogen ?? null,
      phosphorus_level: soilData.phosphorus ?? null,
      potassium_level: soilData.potassium ?? null,
      sample_depth_cm: soilData.sampleDepth ?? null,
      location: soilData.location ? { label: soilData.location } : null,
      analyzed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return { persisted: true as const, analysisId: saved.id };
}

function isObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function isValidProfessionalReport(value: unknown): value is Record<string, any> {
  if (!isObject(value) || value.schemaVersion !== "2.0" || value.reportLanguage !== "ar-TN" || typeof value.executiveSummary !== "string") return false;
  const stringArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === "string");
  const objectArray = (v: unknown, required: string[]) => Array.isArray(v) && v.every((x) => isObject(x) && required.every((key) => Object.prototype.hasOwnProperty.call(x,key)));
  const quality = value.dataQuality, soil = value.soilCharacterization, crop = value.cropSuitability;
  if (!isObject(value.confidence) || !["low","moderate","high","not_assessed"].includes(value.confidence.level) || !stringArray(value.confidence.reasons)) return false;
  if (!isObject(quality) || !objectArray(quality.providedMeasurements,["name","value","unit","source"]) ||
      !quality.providedMeasurements.every((x:any)=>typeof x.name==="string"&&(typeof x.value==="string"||typeof x.value==="number")&&typeof x.unit==="string"&&typeof x.source==="string") ||
      !stringArray(quality.missingMeasurements) || !stringArray(quality.limitations) || !stringArray(quality.consistencyChecks)) return false;
  if (!isObject(soil) || !isObject(soil.texture) || typeof soil.texture.classification!=="string" || typeof soil.texture.basis!=="string" || typeof soil.texture.confidence!=="string" || !stringArray(soil.chemical) || !stringArray(soil.physical)) return false;
  if (!objectArray(value.indicatorTable,["parameter","value","unit","classification","cropEffect","evidence"])) return false;
  if (!objectArray(value.findings,["parameter","observedValue","unit","interpretation","importance","severity","evidence"]) ||
      !value.findings.every((x:any)=>["informational","low","moderate","high","not_assessed"].includes(x.severity))) return false;
  if (!objectArray(value.rankedConstraints,["rank","constraint","severity","evidence","cropImpact","whatToConfirm"])) return false;
  if (!stringArray(value.strengths) || !stringArray(value.constraints)) return false;
  if (!isObject(crop) || !["qualitative","not_assessed"].includes(crop.status) ||
      !objectArray(crop.candidates,["crop","status","why_it_may_fit","risk","sowingWindow","conditions_to_check","limitations"]) ||
      !crop.candidates.every((x:any)=>stringArray(x.conditions_to_check)) ||
      !objectArray(crop.avoid,["crop","reason","evidence"]) || !stringArray(crop.caveats)) return false;
  const target=value.targetCropPlan;
  if (!isObject(target) || !["feasible","feasible_with_correction","not_recommended","not_assessed"].includes(target.feasibility) ||
      !stringArray(target.reasons) || !objectArray(target.gaps,["parameter","current","required","gap","evidence"]) ||
      !objectArray(target.actions,["priority","action","why","when","quantity","cost","verification"]) ||
      !target.actions.every((x:any)=>x.quantity===null&&typeof x.cost==="string") ||
      !["targetCrop","firstAction","retestWhen"].every((k)=>typeof target[k]==="string")) return false;
  const fert=value.fertilizationPlan;
  if (!isObject(fert) || !["guidance_only","not_assessed"].includes(fert.status) ||
      !objectArray(fert.stages,["stage","strategy","productExamples","rate","timing","basis","verification"]) ||
      !fert.stages.every((x:any)=>x.rate===null&&stringArray(x.productExamples)) ||
      !stringArray(fert.organicOptions) || typeof fert.withheldDosesReason!=="string") return false;
  const water=value.waterAndIrrigation;
  if (!isObject(water) || !["guidance_only","not_assessed"].includes(water.status) ||
      !["method","frequency","amount","waterQuality","salinityAndLeaching","drainage"].every((k)=>typeof water[k]==="string") ||
      !stringArray(water.limitations)) return false;
  if (!Array.isArray(value.twelveWeekCalendar) || value.twelveWeekCalendar.length!==12 ||
      !value.twelveWeekCalendar.every((x:any,i:number)=>isObject(x)&&x.week===i+1&&stringArray(x.actions)&&typeof x.check==="string")) return false;
  if (!objectArray(value.riskAlerts,["risk","severity","trigger","symptomsToMonitor","safeResponse"]) ||
      !value.riskAlerts.every((x:any)=>["low","moderate","high","not_assessed"].includes(x.severity)&&stringArray(x.symptomsToMonitor))) return false;
  if (!objectArray(value.recommendations,["priority","action","reason","evidence","howTo","when","verification","quantity"]) ||
      !value.recommendations.every((x:any)=>["now","before_planting","during_season","follow_up"].includes(x.priority)&&x.quantity===null)) return false;
  if (!objectArray(value.followUpPlan,["step","when","whatToDo","whatToMeasure","why"]) ||
      !value.followUpPlan.every((x:any)=>Number.isInteger(x.step)&&x.step>0&&["when","whatToDo","whatToMeasure","why"].every((k)=>typeof x[k]==="string"))) return false;
  const review=value.professionalReview;
  if (!stringArray(value.additionalInformationNeeded) || !isObject(review) || typeof review.required!=="boolean" || typeof review.reason!=="string" || !stringArray(review.bringToAgronomist) || !stringArray(value.disclaimers)) return false;
  return true;
}

function extractAndValidateReport(raw:string):Record<string,any> {
  const trimmed=raw.trim();
  const fenced=trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates=[...(fenced?[fenced[1].trim()]:[]),trimmed];
  for(const candidate of candidates){
    try {
      const value=JSON.parse(candidate);
      if(isValidProfessionalReport(value)) return value;
    } catch { /* Try next candidate. */ }
  }
  throw new InvalidAIReportError();
}

export const analyzeSoilDetailed: RequestHandler = async (req,res) => {
  try {
    const soilData=normalizeSoilRequest((req.body||{}) as Record<string,unknown>);
    const validationErrors=validateSoilData(soilData);
    if(validationErrors.length) return res.status(400).json({success:false,error:"INVALID_SOIL_INPUT",message:"تحقق من قياسات التربة المدخلة.",details:validationErrors});
    if(!hasSoilAIProvider()) throw new AIProviderUnavailableError();
    const prompt=await loadSoilAnalysisPrompt();
    const report=extractAndValidateReport(await callAIService(prompt,formatSoilDataForAI(soilData)));
    report.dataQuality.providedMeasurements = buildProvidedMeasurements(soilData);
    let persistence: { persisted: boolean; reason?: string; analysisId?: string };
    try {
      persistence = await persistSoilReport(req, soilData, report);
    } catch (persistenceError) {
      console.error("Soil report persistence failed:", persistenceError);
      persistence = { persisted: false, reason: "PERSISTENCE_FAILED" };
    }
    markAdvisory(res,"ai-advisory");
    return res.status(200).json({
      success:true,data:report,dataSource:"ai-advisory",isRealData:false,
      ...(persistence.analysisId ? { analysisId: persistence.analysisId } : {}),
      persistence,
      provenance:{
        measurements:"user-provided-unverified",advisory:"llm-generated",
        mlPrediction:"not-available",modelTraining:"not-claimed",
        note_ar:"القياسات مدخلة من المستخدم ولم يتم التثبت منها مخبرياً. التفسير استشارة مولّدة بواسطة LLM، وليس نتيجة نموذج ML مدرّب أو قياساً مخبرياً.",
      },
    });
  } catch(error) {
    if(error instanceof AIProviderUnavailableError) return res.status(503).json({success:false,error:"AI_PROVIDER_UNAVAILABLE",message:"خدمة الاستشارة الذكية غير مهيأة حالياً. لم يتم إنشاء تقرير بديل أو وهمي."});
    console.error("Soil analysis error:",error);
    const message=safeErrorMessage(error,"Unknown soil analysis error");
    const isSchemaError=error instanceof InvalidAIReportError;
    return res.status(isSchemaError?502:500).json({success:false,error:isSchemaError?"INVALID_AI_REPORT":"SOIL_ANALYSIS_FAILED",message:process.env.NODE_ENV==="development"?message:"تعذّر إنشاء التقرير. حاول مجدداً لاحقاً."});
  }
};

export const analyzeSoilBatch: RequestHandler = async(req,res)=>{
  try{
    const soils=req.body?.soils;
    if(!Array.isArray(soils)||soils.length<1||soils.length>10) return res.status(400).json({success:false,error:"INVALID_BATCH",message:"أدخل من عينة واحدة إلى 10 عينات."});
    if(!hasSoilAIProvider()) throw new AIProviderUnavailableError();
    const prompt=await loadSoilAnalysisPrompt();
    const results=await Promise.allSettled(soils.map(async(input:any)=>{
      const soil=normalizeSoilRequest(input||{});
      const errors=validateSoilData(soil);
      if(errors.length) throw new Error(errors.join("; "));
      const report = extractAndValidateReport(await callAIService(prompt,formatSoilDataForAI(soil)));
      // Batch reports must preserve the same measurement evidence guarantees
      // as single-sample reports; never trust LLM-authored measurements.
      report.dataQuality.providedMeasurements = buildProvidedMeasurements(soil);
      return report;
    }));
    const analyses=results.map((result,index)=>({fieldId:(soils[index]?.fieldId||soils[index]?.field_id||`sample_${index+1}`),status:result.status,data:result.status==="fulfilled"?result.value:{error:safeErrorMessage(result.reason,"Analysis failed")}}));
    const successfulAnalyses=analyses.filter(x=>x.status==="fulfilled").length;
    if(!successfulAnalyses) return res.status(502).json({success:false,error:"SOIL_AI_BATCH_FAILED",totalRequested:soils.length,successfulAnalyses,analyses});
    markAdvisory(res,"ai-advisory");
    return res.json({success:true,totalRequested:soils.length,successfulAnalyses,dataSource:"ai-advisory",isRealData:false,provenance:{measurements:"user-provided-unverified",advisory:"llm-generated",mlPrediction:"not-available",modelTraining:"not-claimed"},analyses});
  }catch(error){
    if(error instanceof AIProviderUnavailableError) return res.status(503).json({success:false,error:"AI_PROVIDER_UNAVAILABLE",message:"Soil AI provider is not configured."});
    return res.status(500).json({success:false,error:"SOIL_AI_BATCH_FAILED",message:safeErrorMessage(error,"Batch soil analysis failed")});
  }
};

export const listSoilAnalysisReports: RequestHandler = async(req,res)=>{
  try {
    const db = scopedClientFromAuthHeader(req.header("authorization"));
    if (!db) return res.status(503).json({success:false,error:"DATABASE_OR_SESSION_UNAVAILABLE",message:"يلزم تسجيل الدخول والاتصال بقاعدة البيانات لعرض سجل التقارير."});
    const requestedLimit = Number(req.query.limit ?? 20);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit,1),50) : 20;
    const { data, error } = await db
      .from("soil_analyses")
      .select("id,section_id,farm_id,analysis_type,analyzed_at,created_at,sensor_data,analysis_result")
      .in("analysis_type",["lab","manual"])
      .order("analyzed_at",{ascending:false})
      .limit(limit);
    if (error) throw error;
    const reports = (data ?? []).map((row:any)=>({
      analysisId:row.id,
      fieldId:row.section_id,
      farmId:row.farm_id,
      analysisType:row.analysis_type,
      analyzedAt:row.analyzed_at,
      createdAt:row.created_at,
      input:row.sensor_data,
      executiveSummary:row.analysis_result?.executiveSummary ?? null,
    }));
    return res.json({success:true,data:reports,count:reports.length,persistence:{persisted:true,source:"supabase-rls"}});
  } catch(error) {
    console.error("Soil report history failed:",error);
    return res.status(500).json({success:false,error:"REPORT_HISTORY_FAILED",message:"تعذّر تحميل سجل التقارير حالياً."});
  }
};

export const getSoilAnalysisReport: RequestHandler = async(req,res)=>{
  try {
    const db = scopedClientFromAuthHeader(req.header("authorization"));
    if (!db) return res.status(503).json({success:false,error:"DATABASE_OR_SESSION_UNAVAILABLE",message:"يلزم تسجيل الدخول والاتصال بقاعدة البيانات لاسترجاع التقرير."});
    const { data, error } = await db
      .from("soil_analyses")
      .select("id,sensor_data,analysis_result,recommendations,analyzed_at,created_at")
      .in("analysis_type",["lab","manual"])
      .eq("id", req.params.analysisId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({success:false,error:"REPORT_NOT_FOUND",message:"التقرير غير موجود أو لا تملك صلاحية الوصول إليه."});
    return res.json({success:true,data:{analysisId:data.id,input:data.sensor_data,report:data.analysis_result,recommendations:data.recommendations,analyzedAt:data.analyzed_at,createdAt:data.created_at},persistence:{persisted:true}});
  } catch(error) {
    console.error("Soil report retrieval failed:",error);
    return res.status(500).json({success:false,error:"REPORT_RETRIEVAL_FAILED",message:"تعذّر استرجاع التقرير حالياً."});
  }
};

export default {analyzeSoilDetailed,analyzeSoilBatch,listSoilAnalysisReports,getSoilAnalysisReport};
