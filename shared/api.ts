/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// ==================== SOIL ANALYSIS TYPES ====================

/**
 * Raw soil data input for analysis
 */
export interface RawSoilData {
  fieldId?: string;
  location?: string;
  samplingDate?: string;
  sampleDepth?: number; // in cm

  // Primary parameters
  ph: number;
  moisture: number; // percentage
  organicMatter: number; // percentage

  // Macronutrients (mg/kg or ppm)
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;

  // Secondary nutrients (mg/kg)
  calcium?: number;
  magnesium?: number;
  sulfur?: number;

  // Micronutrients (mg/kg)
  iron?: number;
  zinc?: number;
  manganese?: number;
  copper?: number;
  boron?: number;

  // Salinity indicator
  electricalConductivity?: number; // dS/m (deciSiemens per meter)

  // Soil texture classification
  soilTexture?: 'sandy' | 'clay' | 'loam' | 'silty' | 'peat' | 'chalky' | 'saline';

  // Optional context
  currentCrop?: string;
  season?: string;
  notes?: string;
}

/**
 * Crop recommendation with suitability details
 */
export interface CropSuitabilityDetails {
  name: string;
  name_ar: string;
  compatibility: string; // e.g., "95-100%"
  reason_ar: string;
  yieldPotential: 'low' | 'medium' | 'high';
  specialCareNeeds_ar: string;
  profitability: string; // e.g., "عالية جداً"
}

/**
 * Soil quality score details
 */
export interface SoilQualityScores {
  structure: number;
  fertility: number;
  phBalance: number;
  nutrientContent: number;
  waterRetention: number;
  micronutrientAvailability: number;
}

/**
 * Amendment recommendation
 */
export interface AmendmentRecommendation {
  type: string;
  quantity: number;
  unit: string;
  purpose_ar: string;
  expectedImprovement_ar: string;
}

/**
 * Fertilizer recommendation
 */
export interface FertilizerRecommendation {
  nutrient: string;
  current: number;
  target: number;
  recommendedFertilizer: string;
  quantity: number;
  unit: string;
  timingAndMethod_ar: string;
}

/**
 * Micronutrient recommendation
 */
export interface MicronutrientRecommendation {
  nutrient: string;
  deficiency: boolean;
  source: string;
  quantity: number;
  method_ar: string;
}

/**
 * Complete soil analysis response
 */
export interface SoilAnalysisResponse {
  soilAnalysis: {
    fieldInfo: {
      location: string;
      analysisDate: string;
      sampleDepth: string;
    };
    soilType: {
      classification: string;
      texture: string;
      structure: string;
      description_ar: string;
    };
    currentStatus: {
      overallGrade: {
        grade: 'ممتاز' | 'جيد' | 'معقول' | 'ضعيف';
        score: string;
        interpretation_ar: string;
      };
      detailedScoring: SoilQualityScores;
      strengths_ar: string[];
      limitations_ar: string[];
    };
    cropSuitability: {
      excellent_crops: CropSuitabilityDetails[];
      good_crops: CropSuitabilityDetails[];
      moderate_crops: CropSuitabilityDetails[];
    };
    detailedRecommendations: {
      amendments: {
        recommended_ar: AmendmentRecommendation[];
        sequence_ar: string;
      };
      fertilization: {
        macronutrients: FertilizerRecommendation[];
        micronutrients: MicronutrientRecommendation[];
      };
      waterManagement: {
        assessment_ar: string;
        recommendations_ar: string[];
        irrigationAdjustments_ar: string;
      };
      cropRotation: {
        current_ar: string;
        recommended_ar: string;
      };
      organicMatterEnhancement: {
        currentLevel: number;
        targetLevel: number;
        methods_ar: string[];
      };
      implementationTimeline: {
        immediate_ar: string;
        shortTerm_ar: string;
        mediumTerm_ar: string;
        longTerm_ar: string;
      };
    };
    professionalSummary: {
      executiveSummary_ar: string;
      keyFindings_ar: string[];
      primaryAction_ar: string;
      nextSteps_ar: string;
    };
  };
}
