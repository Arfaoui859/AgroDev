import { RawSoilData, SoilAnalysisResponse } from "@shared/api";

/**
 * Service for interacting with the AI-powered soil analysis API
 */
class SoilAnalysisService {
  private baseURL = "/api/soil-analysis";

  /**
   * Analyze a single soil sample
   * @param soilData Raw soil data to analyze
   * @returns Promise with the analysis response
   */
  async analyzeSoil(soilData: RawSoilData): Promise<SoilAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseURL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(soilData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error("Soil analysis error:", error);
      throw error;
    }
  }

  /**
   * Analyze multiple soil samples in batch
   * @param soils Array of soil data to analyze
   * @returns Promise with batch analysis results
   */
  async analyzeSoilBatch(
    soils: RawSoilData[]
  ): Promise<{
    success: boolean;
    totalRequested: number;
    successfulAnalyses: number;
    analyses: Array<{
      fieldId: string;
      status: "fulfilled" | "rejected";
      data: SoilAnalysisResponse | { error: string };
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ soils }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP Error: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Batch soil analysis error:", error);
      throw error;
    }
  }

  /**
   * Get a formatted soil analysis report
   * @param analysisId ID of the analysis to retrieve
   * @returns Promise with report data
   */
  async getSoilReport(analysisId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseURL}/report/${encodeURIComponent(analysisId)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP Error: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Soil report retrieval error:", error);
      throw error;
    }
  }

  /**
   * Create sample soil data for testing
   */
  createSampleSoilData(): RawSoilData {
    return {
      fieldId: `field_${Date.now()}`,
      location: "حقل تجريبي",
      samplingDate: new Date().toISOString().split("T")[0],
      sampleDepth: 30,
      ph: 6.8,
      moisture: 22,
      organicMatter: 2.5,
      nitrogen: 85,
      phosphorus: 28,
      potassium: 250,
      calcium: 2500,
      magnesium: 180,
      sulfur: 25,
      iron: 4.5,
      zinc: 1.8,
      manganese: 8.5,
      copper: 0.8,
      boron: 0.5,
      electricalConductivity: 1.2,
      soilTexture: "loam",
      currentCrop: "قمح",
      season: "winter",
    };
  }

  /**
   * Validate soil data before sending to API
   */
  validateSoilData(soilData: RawSoilData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (soilData.ph === undefined) {
      errors.push("pH is required");
    } else if (soilData.ph < 0 || soilData.ph > 14) {
      errors.push("pH must be between 0 and 14");
    }

    if (soilData.moisture === undefined) {
      errors.push("Moisture is required");
    } else if (soilData.moisture < 0 || soilData.moisture > 100) {
      errors.push("Moisture must be between 0 and 100 percent");
    }

    if (soilData.organicMatter === undefined) {
      errors.push("Organic matter is required");
    } else if (soilData.organicMatter < 0 || soilData.organicMatter > 50) {
      errors.push("Organic matter must be between 0 and 50 percent");
    }

    // Validate macronutrients if provided
    if (soilData.nitrogen !== undefined && soilData.nitrogen < 0) {
      errors.push("Nitrogen cannot be negative");
    }
    if (soilData.phosphorus !== undefined && soilData.phosphorus < 0) {
      errors.push("Phosphorus cannot be negative");
    }
    if (soilData.potassium !== undefined && soilData.potassium < 0) {
      errors.push("Potassium cannot be negative");
    }

    // Validate electrical conductivity if provided
    if (
      soilData.electricalConductivity !== undefined &&
      soilData.electricalConductivity < 0
    ) {
      errors.push("Electrical conductivity cannot be negative");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format soil data for display
   */
  formatSoilData(soilData: RawSoilData): Record<string, string> {
    return {
      "معرف الحقل": soilData.fieldId || "N/A",
      "الموقع": soilData.location || "N/A",
      "تاريخ العينة": soilData.samplingDate || "N/A",
      "عمق العينة (سم)": soilData.sampleDepth?.toString() || "N/A",
      "pH": soilData.ph?.toString() || "N/A",
      "الرطوبة (%)": soilData.moisture?.toString() || "N/A",
      "المادة العضوية (%)": soilData.organicMatter?.toString() || "N/A",
      "النيتروجين": soilData.nitrogen?.toString() || "N/A",
      "الفوسفور": soilData.phosphorus?.toString() || "N/A",
      "البوتاسيوم": soilData.potassium?.toString() || "N/A",
      "الكالسيوم": soilData.calcium?.toString() || "N/A",
      "الماغنيسيوم": soilData.magnesium?.toString() || "N/A",
      "التوصيل الكهربائي": soilData.electricalConductivity?.toString() || "N/A",
      "نسيج التربة": soilData.soilTexture || "N/A",
      "المحصول الحالي": soilData.currentCrop || "N/A",
      "الموسم": soilData.season || "N/A",
    };
  }

  /**
   * Get optimal nutrient ranges for different crops
   */
  getOptimalNutrientRanges(crop: string): Record<string, { min: number; max: number }> {
    const ranges: Record<
      string,
      Record<string, { min: number; max: number }>
    > = {
      wheat: {
        nitrogen: { min: 40, max: 80 },
        phosphorus: { min: 15, max: 30 },
        potassium: { min: 150, max: 300 },
        ph: { min: 6.0, max: 7.5 },
      },
      tomato: {
        nitrogen: { min: 60, max: 120 },
        phosphorus: { min: 25, max: 50 },
        potassium: { min: 250, max: 500 },
        ph: { min: 6.0, max: 7.0 },
      },
      corn: {
        nitrogen: { min: 50, max: 90 },
        phosphorus: { min: 20, max: 35 },
        potassium: { min: 180, max: 350 },
        ph: { min: 6.0, max: 7.0 },
      },
      olive: {
        nitrogen: { min: 30, max: 60 },
        phosphorus: { min: 10, max: 25 },
        potassium: { min: 200, max: 400 },
        ph: { min: 6.5, max: 8.0 },
      },
      potato: {
        nitrogen: { min: 50, max: 100 },
        phosphorus: { min: 20, max: 35 },
        potassium: { min: 250, max: 350 },
        ph: { min: 5.5, max: 6.5 },
      },
    };

    return (
      ranges[crop.toLowerCase()] || {
        nitrogen: { min: 40, max: 100 },
        phosphorus: { min: 15, max: 40 },
        potassium: { min: 150, max: 400 },
        ph: { min: 6.0, max: 7.5 },
      }
    );
  }

  /**
   * Compare soil data against optimal ranges
   */
  compareSoilToOptimal(
    soilData: RawSoilData,
    crop: string = "wheat"
  ): Record<
    string,
    {
      value: number;
      optimal: { min: number; max: number };
      status: "optimal" | "low" | "high";
    }
  > {
    const optimal = this.getOptimalNutrientRanges(crop);
    const comparison: Record<
      string,
      {
        value: number;
        optimal: { min: number; max: number };
        status: "optimal" | "low" | "high";
      }
    > = {};

    if (soilData.ph !== undefined && optimal.ph) {
      const phStatus =
        soilData.ph < optimal.ph.min
          ? "low"
          : soilData.ph > optimal.ph.max
            ? "high"
            : "optimal";
      comparison.ph = {
        value: soilData.ph,
        optimal: optimal.ph,
        status: phStatus,
      };
    }

    if (soilData.nitrogen !== undefined && optimal.nitrogen) {
      const nitrogenStatus =
        soilData.nitrogen < optimal.nitrogen.min
          ? "low"
          : soilData.nitrogen > optimal.nitrogen.max
            ? "high"
            : "optimal";
      comparison.nitrogen = {
        value: soilData.nitrogen,
        optimal: optimal.nitrogen,
        status: nitrogenStatus,
      };
    }

    if (soilData.phosphorus !== undefined && optimal.phosphorus) {
      const phosphorusStatus =
        soilData.phosphorus < optimal.phosphorus.min
          ? "low"
          : soilData.phosphorus > optimal.phosphorus.max
            ? "high"
            : "optimal";
      comparison.phosphorus = {
        value: soilData.phosphorus,
        optimal: optimal.phosphorus,
        status: phosphorusStatus,
      };
    }

    if (soilData.potassium !== undefined && optimal.potassium) {
      const potassiumStatus =
        soilData.potassium < optimal.potassium.min
          ? "low"
          : soilData.potassium > optimal.potassium.max
            ? "high"
            : "optimal";
      comparison.potassium = {
        value: soilData.potassium,
        optimal: optimal.potassium,
        status: potassiumStatus,
      };
    }

    return comparison;
  }
}

// Export singleton instance
export const soilAnalysisService = new SoilAnalysisService();

// Also export the class for testing purposes
export { SoilAnalysisService };
