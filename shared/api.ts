/**
 * Shared code between client and server.
 */
export interface DemoResponse { message: string; }

/** Soil measurements supplied by the user or a laboratory. Units/methods must be explicit where relevant. */
export interface RawSoilData {
  fieldId?: string;
  location?: string;
  samplingDate?: string;
  sampleDepth?: number;
  ph: number;
  moisture: number;
  organicMatter?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  calcium?: number;
  magnesium?: number;
  sulfur?: number;
  iron?: number;
  zinc?: number;
  manganese?: number;
  copper?: number;
  boron?: number;
  electricalConductivity?: number;
  electricalConductivityUnit?: string;
  soilTexture?: string;
  sandPercent?: number;
  siltPercent?: number;
  clayPercent?: number;
  nutrientUnit?: string;
  nutrientMethod?: string;
  electricalConductivityMethod?: string;
  calciumCarbonateTotal?: number;
  calciumCarbonateActive?: number;
  cec?: number;
  sodium?: number;
  sodiumAdsorptionRatio?: number;
  exchangeableSodiumPercentage?: number;
  waterElectricalConductivity?: number;
  waterElectricalConductivityUnit?: string;
  waterPh?: number;
  slopePercent?: number;
  drainage?: string;
  previousCrop?: string;
  targetCrop?: string;
  targetYield?: number;
  farmAreaHectares?: number;
  irrigationMethod?: string;
  region?: string;
  cropMode?: "plant-now" | "target-crop";
  currentCrop?: string;
  season?: string;
  notes?: string;
}

export interface SoilAnalysisProvenance {
  measurements: "user-provided-unverified";
  advisory: "llm-generated";
  mlPrediction: "not-available";
  modelTraining: "not-claimed";
  note_ar: string;
}
export interface SoilAnalysisEnvelope<T = Record<string, unknown>> {
  success: true;
  data: T;
  dataSource: "ai-advisory";
  isRealData: false;
  provenance: SoilAnalysisProvenance;
  analysisId?: string;
}
