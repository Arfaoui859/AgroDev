import { safeErrorMessage } from '../lib/errors';
import { RequestHandler } from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { RawSoilData, SoilAnalysisResponse } from "@shared/api";
import { markAdvisory } from "../lib/provenance";
import {
  chatCompleteDetailed,
  isLLMConfigured,
} from "../services/providers/llmProvider";

// Resolve the project root from the current working directory. Using import.meta
// here breaks CommonJS consumers (e.g. Jest) that load this module.
const projectRoot = process.cwd();

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SOIL_ANALYSIS_SERVICE || process.env.OPENAI_API_URL || "";
const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_SERVICE_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4-turbo";

// Load the soil analysis prompt
async function loadSoilAnalysisPrompt(): Promise<string> {
  try {
    const promptPath = path.join(
      projectRoot,
      "prompts/analysis/soil_analysis_detailed_report.txt"
    );
    const prompt = await fs.readFile(promptPath, "utf-8");
    return prompt;
  } catch (error) {
    console.error("Error loading soil analysis prompt:", error);
    throw new Error("Failed to load soil analysis prompt");
  }
}

// Format raw soil data into a readable report for the AI
function formatSoilDataForAI(data: RawSoilData): string {
  const sections = [];

  sections.push("=== RAW SOIL ANALYSIS DATA ===");

  if (data.fieldId) sections.push(`Field ID: ${data.fieldId}`);
  if (data.location) sections.push(`Location: ${data.location}`);
  if (data.samplingDate) sections.push(`Sampling Date: ${data.samplingDate}`);
  if (data.sampleDepth) sections.push(`Sample Depth: ${data.sampleDepth} cm`);

  sections.push("\n--- Primary Parameters ---");
  sections.push(`pH Level: ${data.ph}`);
  sections.push(`Moisture: ${data.moisture}%`);
  sections.push(`Organic Matter: ${data.organicMatter}%`);

  sections.push("\n--- Macronutrients (mg/kg) ---");
  if (data.nitrogen !== undefined) sections.push(`Nitrogen (N): ${data.nitrogen}`);
  if (data.phosphorus !== undefined) sections.push(`Phosphorus (P): ${data.phosphorus}`);
  if (data.potassium !== undefined) sections.push(`Potassium (K): ${data.potassium}`);

  sections.push("\n--- Secondary Nutrients (mg/kg) ---");
  if (data.calcium !== undefined) sections.push(`Calcium (Ca): ${data.calcium}`);
  if (data.magnesium !== undefined) sections.push(`Magnesium (Mg): ${data.magnesium}`);
  if (data.sulfur !== undefined) sections.push(`Sulfur (S): ${data.sulfur}`);

  sections.push("\n--- Micronutrients (mg/kg) ---");
  if (data.iron !== undefined) sections.push(`Iron (Fe): ${data.iron}`);
  if (data.zinc !== undefined) sections.push(`Zinc (Zn): ${data.zinc}`);
  if (data.manganese !== undefined) sections.push(`Manganese (Mn): ${data.manganese}`);
  if (data.copper !== undefined) sections.push(`Copper (Cu): ${data.copper}`);
  if (data.boron !== undefined) sections.push(`Boron (B): ${data.boron}`);

  sections.push("\n--- Soil Properties ---");
  if (data.electricalConductivity !== undefined) {
    sections.push(`Electrical Conductivity (EC): ${data.electricalConductivity} dS/m`);
  }
  if (data.soilTexture) sections.push(`Soil Texture: ${data.soilTexture}`);
  if (data.currentCrop) sections.push(`Current Crop: ${data.currentCrop}`);
  if (data.season) sections.push(`Season: ${data.season}`);
  if (data.notes) sections.push(`Notes: ${data.notes}`);

  return sections.join("\n");
}

class AIProviderUnavailableError extends Error {
  constructor() {
    super("Soil analysis AI provider is not configured");
    this.name = "AIProviderUnavailableError";
  }
}

function hasSoilAIProvider(): boolean {
  return (
    isLLMConfigured() ||
    (AI_SERVICE_URL.includes("openai") && Boolean(AI_API_KEY)) ||
    Boolean(AI_SERVICE_URL && AI_API_KEY)
  );
}

// Call external AI service (OpenAI or custom service)
async function callAIService(
  systemPrompt: string,
  userMessage: string
): Promise<{ text: string; real: boolean }> {
  // Prefer the shared provider adapter: it already handles Gemini, OpenRouter,
  // Groq, Together, Ollama and any OpenAI-compatible endpoint with timeouts and
  // retries. Without it, only the raw OPENAI_* env vars below would work, so a
  // deployment configured for another provider silently fell back to demo data.
  if (isLLMConfigured()) {
    const result = await chatCompleteDetailed(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      { temperature: 0.3, maxTokens: 4096, json: true },
    );
    return { text: result.text, real: true };
  }

  try {
    // If OpenAI API is configured
    if (AI_SERVICE_URL.includes("openai") && AI_API_KEY) {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        },
        {
          headers: {
            Authorization: `Bearer ${AI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from AI service");
      }
      return { text: content, real: true };
    }

    // If custom AI service is configured
    if (AI_SERVICE_URL && AI_API_KEY) {
      const response = await axios.post(
        `${AI_SERVICE_URL}/analyze-soil`,
        {
          system_prompt: systemPrompt,
          user_message: userMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${AI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );

      return { text: response.data.result || response.data.content, real: true };
    }

    // Never fabricate a soil report when no provider is configured.
    throw new AIProviderUnavailableError();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("AI Service Error:", error.response?.data || error.message);
      throw new Error(
        `AI Service error: ${error.response?.status} ${error.response?.statusText}`
      );
    }
    throw error;
  }
}

// Parse and validate the JSON returned by the AI provider.
// Invalid or non-JSON responses must fail instead of becoming fake successful reports.
function extractJSON(text: string): any {
  const response = text.trim();

  if (!response) {
    throw new Error("AI provider returned an empty soil analysis response");
  }

  const fencedMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [
    ...(fencedMatch ? [fencedMatch[1].trim()] : []),
    response,
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Try the next candidate.
    }
  }

  const firstBrace = response.indexOf("{");
  const lastBrace = response.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(response.slice(firstBrace, lastBrace + 1));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to the explicit parsing error.
    }
  }

  console.error("AI soil report response is not valid JSON");
  throw new Error("AI provider returned an invalid JSON soil analysis report");
}

/**
 * Main handler for soil analysis
 */
export const analyzeSoilDetailed: RequestHandler = async (req, res) => {
  try {
    const soilData: RawSoilData = req.body;

    // Validate required fields
    if (soilData.ph === undefined || soilData.moisture === undefined) {
      return res.status(400).json({
        success: false,
        error: "pH and moisture are required fields",
        message:
          "يجب توفير قيم pH والرطوبة كحد أدنى للتحليل الدقيق",
      });
    }

    // Load the prompt
    const systemPrompt = await loadSoilAnalysisPrompt();

    // Format soil data for AI
    const formattedSoilData = formatSoilDataForAI(soilData);

    // Call AI service
    const aiResponse = await callAIService(systemPrompt, formattedSoilData);
    const { text, real } = aiResponse;

    // Extract JSON from AI response
    const analysisResult = extractJSON(text);

    markAdvisory(res, "ai-advisory");

    return res.status(200).json({
      success: true,
      data: analysisResult,
      dataSource: "ai-advisory",
      isRealData: false,
      provenance: {
        measurements: "user-provided-unverified",
        advisory: "llm-generated",
        mlPrediction: "not-available",
        modelTraining: "not-claimed",
        note_ar:
          "القياسات مصدرها البيانات التي أدخلها المستخدم ولم يتم التثبت منها مخبرياً. التفسير والتوصيات استشارة مولّدة بواسطة مزود AI وليست قياسات مخبرية أو تنبؤاً من نموذج ML مدرّب.",
      },
    });
  } catch (error) {
    if (error instanceof AIProviderUnavailableError) {
      return res.status(503).json({
        success: false,
        error: "AI_PROVIDER_UNAVAILABLE",
        message: "Soil advisory is unavailable because no AI provider is configured.",
      });
    }

    console.error("Soil analysis error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error occurred during soil analysis";

    res.status(500).json({
      success: false,
      error: "Soil analysis failed",
      message: errorMessage,
      details:
        process.env.NODE_ENV === "development"
          ? errorMessage
          : "An error occurred during analysis",
    });
  }
};

/**
 * Handler for batch soil analysis
 */
export const analyzeSoilBatch: RequestHandler = async (req, res) => {
  try {
    const { soils } = req.body;

    if (!Array.isArray(soils)) {
      return res.status(400).json({
        success: false,
        error: "soils must be an array",
      });
    }

    if (soils.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one soil sample is required",
      });
    }

    if (soils.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Maximum 10 soil samples per request",
      });
    }

    if (!hasSoilAIProvider()) {
      return res.status(503).json({
        success: false,
        error: "AI_PROVIDER_UNAVAILABLE",
        message: "Batch soil advisory is unavailable because no AI provider is configured.",
      });
    }

    // Load prompt once
    const systemPrompt = await loadSoilAnalysisPrompt();

    // Analyze each soil sample
    const results = await Promise.allSettled(
      soils.map(async (soil) => {
        const formattedData = formatSoilDataForAI(soil);
        const aiResponse = await callAIService(systemPrompt, formattedData);
        return { analysis: extractJSON(aiResponse.text), real: aiResponse.real };
      })
    );

    const analyses = results.map((result, index) => ({
      fieldId: soils[index].fieldId || `field_${index + 1}`,
      status: result.status,
      data: result.status === "fulfilled" ? result.value.analysis : { error: result.reason },
    }));

    const successfulAnalyses = analyses.filter(
      (analysis) => analysis.status === "fulfilled",
    ).length;

    if (successfulAnalyses === 0) {
      return res.status(502).json({
        success: false,
        error: "SOIL_AI_BATCH_FAILED",
        totalRequested: soils.length,
        successfulAnalyses: 0,
        analyses,
      });
    }

    markAdvisory(res, "ai-advisory");

    return res.status(200).json({
      success: true,
      totalRequested: soils.length,
      successfulAnalyses,
      dataSource: "ai-advisory",
      isRealData: false,
      provenance: {
        measurements: "user-provided-unverified",
        advisory: "llm-generated",
        mlPrediction: "not-available",
        modelTraining: "not-claimed",
      },
      analyses,
    });
  } catch (error) {
    console.error("Batch soil analysis error:", error);

    res.status(500).json({
      success: false,
      error: "Batch soil analysis failed",
      message: safeErrorMessage(error, "Unknown error"),
    });
  }
};

/**
 * Get analysis report as formatted HTML
 *
 * Reports are not persisted yet: the analyse endpoints return their result
 * inline and store nothing, so there is no report to look up afterwards.
 * Returning `success: true` here previously told the client a report existed
 * when it did not. Answer 501 until report storage is implemented.
 */
export const getSoilAnalysisReport: RequestHandler = async (req, res) => {
  const { analysisId } = req.params;

  if (!analysisId) {
    return res.status(400).json({
      success: false,
      error: "Analysis ID is required",
    });
  }

  return res.status(501).json({
    success: false,
    error: "Report storage is not implemented",
    message:
      "لا يتم تخزين تقارير التحليل حالياً. تُعاد نتيجة التحليل مباشرة من نقطة التحليل.",
    analysisId,
  });
};

export default {
  analyzeSoilDetailed,
  analyzeSoilBatch,
  getSoilAnalysisReport,
};
