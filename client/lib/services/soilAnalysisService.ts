import { RawSoilData } from "@shared/api";
import { supabase } from "@/lib/supabase";

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
  persistence?: { persisted: boolean; reason?: string };
}

class SoilAnalysisService {
  private readonly baseURL = "/api/soil-analysis";
  private async authHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async listFields(): Promise<Array<Record<string, unknown>>> {
    const response = await fetch("/api/fields", { headers: await this.authHeaders() });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(result.data)) {
      throw new Error(result.message || "تعذّر تحميل قائمة الحقول");
    }
    return result.data;
  }

  async listReports(limit = 20): Promise<Array<Record<string, unknown>>> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const response = await fetch(this.baseURL + "/reports?limit=" + safeLimit, { headers: await this.authHeaders() });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true || !Array.isArray(result.data)) {
      throw new Error(result.message || result.error || "تعذّر تحميل سجل التقارير");
    }
    return result.data;
  }
  async getReport(analysisId: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseURL}/report/${encodeURIComponent(analysisId)}`, {
      headers: await this.authHeaders(),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true) {
      throw new Error(result.message || result.error || `تعذّر استرجاع التقرير (HTTP ${response.status})`);
    }
    return result;
  }

  async analyzeSoil(soilData: RawSoilData): Promise<SoilAnalysisEnvelope> {
    const validation = this.validateSoilData(soilData);
    if (!validation.valid) {
      throw new Error(validation.errors.join("؛ "));
    }

    const response = await fetch(`${this.baseURL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await this.authHeaders()) },
      body: JSON.stringify(soilData),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true || !result.data) {
      throw new Error(
        result.message || result.error || `تعذّر تحليل العينة (HTTP ${response.status})`,
      );
    }
    return result as SoilAnalysisEnvelope;
  }

  async analyzeSoilBatch(soils: RawSoilData[]): Promise<Record<string, unknown>> {
    if (!Array.isArray(soils) || soils.length < 1 || soils.length > 10) {
      throw new Error("يجب إدخال عينة واحدة إلى 10 عينات.");
    }
    const response = await fetch(`${this.baseURL}/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await this.authHeaders()) },
      body: JSON.stringify({ soils }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.error || "فشل تحليل العينات");
    return result;
  }

  validateSoilData(data: Partial<RawSoilData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
    if (!finite(data.ph) || data.ph < 0 || data.ph > 14) errors.push("pH مطلوب ويجب أن يكون بين 0 و14");
    if (!finite(data.moisture) || data.moisture < 0 || data.moisture > 100) errors.push("الرطوبة مطلوبة ويجب أن تكون بين 0 و100%");
    const ranges: Array<[keyof RawSoilData, number, number, string]> = [
      ["organicMatter", 0, 100, "المادة العضوية"],
      ["electricalConductivity", 0, 100, "التوصيل الكهربائي"],
      ["nitrogen", 0, 1000000, "النيتروجين"],
      ["phosphorus", 0, 1000000, "الفوسفور"],
      ["potassium", 0, 1000000, "البوتاسيوم"],
      ["calcium", 0, 1000000, "الكالسيوم"],
      ["magnesium", 0, 1000000, "المغنيسيوم"],
      ["sulfur", 0, 1000000, "الكبريت"],
      ["iron", 0, 1000000, "الحديد"],
      ["zinc", 0, 1000000, "الزنك"],
      ["manganese", 0, 1000000, "المنغنيز"],
      ["copper", 0, 1000000, "النحاس"],
      ["boron", 0, 1000000, "البورون"],
    ];
    for (const [key, min, max, label] of ranges) {
      const value = data[key];
      if (value !== undefined && (!finite(value) || value < min || value > max)) {
        errors.push(`${label}: قيمة غير صالحة`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  createEmptySoilData(): RawSoilData {
    return { ph: 0, moisture: 0 };
  }
}

export const soilAnalysisService = new SoilAnalysisService();
export default soilAnalysisService;
