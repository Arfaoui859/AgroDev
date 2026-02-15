import { RequestHandler } from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { RawSoilData, SoilAnalysisResponse } from "@shared/api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SOIL_ANALYSIS_SERVICE || process.env.OPENAI_API_URL || "";
const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_SERVICE_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4-turbo";

// Load the soil analysis prompt
async function loadSoilAnalysisPrompt(): Promise<string> {
  try {
    const promptPath = path.join(
      __dirname,
      "../../prompts/analysis/soil_analysis_detailed_report.txt"
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

// Call external AI service (OpenAI or custom service)
async function callAIService(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
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
      return content;
    }

    // If custom AI service is configured
    if (AI_SERVICE_URL && AI_API_KEY) {
      const response = await axios.post(
        `${AI_SERVICE_URL}/analyze`,
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

      return response.data.result || response.data.content;
    }

    // Fallback to demo mode if no external service is configured
    console.warn(
      "No AI service configured. Using demo analysis mode. Please set AI_SERVICE_URL and AI_API_KEY to enable real AI analysis."
    );
    return generateDemoAnalysis(userMessage);
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

// Demo analysis generator for testing without external AI
function generateDemoAnalysis(soilDataStr: string): string {
  // Extract pH from the data string to determine soil type
  const phMatch = soilDataStr.match(/pH Level: ([\d.]+)/);
  const ph = phMatch ? parseFloat(phMatch[1]) : 6.5;

  let soilType = "تربة معتدلة";
  let soilClassification = "Loamy";
  if (ph < 6) {
    soilType = "تربة حمضية";
    soilClassification = "Acidic";
  } else if (ph > 7.5) {
    soilType = "تربة قلوية";
    soilClassification = "Alkaline";
  }

  const demoResponse = {
    soilAnalysis: {
      fieldInfo: {
        location: "تم التحليل",
        analysisDate: new Date().toISOString().split("T")[0],
        sampleDepth: "0-30",
      },
      soilType: {
        classification: soilClassification,
        texture: "Loam",
        structure: "معتدل البنية",
        description_ar:
          "تربة متوسطة التحبب مع نسبة متوازنة من الرمل والطين والسلت",
      },
      currentStatus: {
        overallGrade: {
          grade: "جيد" as const,
          score: "72/100",
          interpretation_ar:
            "التربة ذات جودة جيدة وقابلة للتحسين مع بعض الاهتمام",
        },
        detailedScoring: {
          structure: 75,
          fertility: 70,
          phBalance: 65,
          nutrientContent: 75,
          waterRetention: 70,
          micronutrientAvailability: 65,
        },
        strengths_ar: [
          "بنية تربة معتدلة جيدة",
          "محتوى غني بالعناصر الغذائية الأساسية",
          "قدرة جيدة على احتفاظ الماء",
        ],
        limitations_ar: [
          "توازن pH قد يحتاج تعديل",
          "بعض نقص في العناصر الدقيقة",
          "محتوى المادة العضوية يحتاج تحسين",
        ],
      },
      cropSuitability: {
        excellent_crops: [
          {
            name: "Wheat",
            name_ar: "القمح",
            compatibility: "95-100%",
            reason_ar:
              "التربة المعتدلة والمحتوى الجيد من النيتروجين يجعلها مثالية للقمح",
            yieldPotential: "high",
            specialCareNeeds_ar: "ري منتظم خلال فترة النمو",
            profitability: "عالية جداً",
          },
          {
            name: "Barley",
            name_ar: "الشعير",
            compatibility: "92-98%",
            reason_ar: "تحمل جيد للتربة المعتدلة والجفاف النسبي",
            yieldPotential: "high",
            specialCareNeeds_ar: "حد أدنى من المياه مع تربة معتدلة",
            profitability: "عالية",
          },
          {
            name: "Tomato",
            name_ar: "الطماطم",
            compatibility: "88-95%",
            reason_ar:
              "تربة خصبة جيدة التصريف مناسبة لنمو الطماطم بشكل ممتاز",
            yieldPotential: "high",
            specialCareNeeds_ar: "ري منتظم والحماية من الأمراض الفطرية",
            profitability: "عالية جداً",
          },
        ],
        good_crops: [
          {
            name: "Potato",
            name_ar: "البطاطس",
            compatibility: "82-90%",
            reason_ar: "تربة معتدلة توفر ظروف نمو جيدة للدرنات",
            yieldPotential: "high",
            specialCareNeeds_ar: "صرف جيد ومكافحة الآفات",
            profitability: "عالية",
          },
          {
            name: "Corn",
            name_ar: "الذرة",
            compatibility: "80-88%",
            reason_ar: "محتوى نيتروجين جيد مناسب لنمو الذرة",
            yieldPotential: "medium",
            specialCareNeeds_ar: "إضافة نيتروجين إضافي في منتصف الموسم",
            profitability: "عالية",
          },
        ],
        moderate_crops: [
          {
            name: "Pepper",
            name_ar: "الفلفل",
            compatibility: "70-80%",
            reason_ar:
              "تربة جيدة لكن قد تحتاج تحسين درجة الحموضة والصرف",
            yieldPotential: "medium",
            specialCareNeeds_ar: "تحسين الصرف وإدارة الرطوبة",
            profitability: "معتدلة إلى عالية",
          },
        ],
      },
      detailedRecommendations: {
        amendments: {
          recommended_ar: [
            {
              type: "المادة العضوية",
              quantity: 3,
              unit: "طن/هكتار",
              purpose_ar:
                "تحسين بنية التربة وزيادة قدرتها على احتفاظ الماء والعناصر الغذائية",
              expectedImprovement_ar: "زيادة 15-20% في المادة العضوية",
            },
            {
              type: "الجير",
              quantity: 1,
              unit: "طن/هكتار",
              purpose_ar: "تعديل درجة حموضة التربة إن لزم الأمر",
              expectedImprovement_ar: "استقرار درجة pH",
            },
          ],
          sequence_ar:
            "ابدأ بإضافة المادة العضوية أولاً، ثم تابع بالجير إذا كانت درجة الحموضة منخفضة",
        },
        fertilization: {
          macronutrients: [
            {
              nutrient: "النيتروجين",
              current: 80,
              target: 120,
              recommendedFertilizer: "اليوريا 46%",
              quantity: 150,
              unit: "كيلو/هكتار",
              timingAndMethod_ar:
                "تطبيق النصف الأول قبل الزراعة والنصف الثاني بعد شهر من الزراعة",
            },
            {
              nutrient: "الفوسفور",
              current: 25,
              target: 35,
              recommendedFertilizer: "السوبر فوسفات",
              quantity: 200,
              unit: "كيلو/هكتار",
              timingAndMethod_ar: "تطبيق واحد قبل الزراعة مباشرة",
            },
          ],
          micronutrients: [
            {
              nutrient: "الزنك",
              deficiency: true,
              source: "كبريتات الزنك",
              quantity: 15,
              method_ar: "رش أوراقي أو إضافة للتربة",
            },
          ],
        },
        waterManagement: {
          assessment_ar:
            "التربة لديها قدرة جيدة على احتفاظ الماء لكن تحتاج إلى صرف جيد لتجنب الإفراط في الرطوبة",
          recommendations_ar: [
            "تطبيق نظام ري بالتنقيط للمحاصيل الحساسة",
            "تحسين الصرف السطحي لتجنب جمع المياه",
            "إضافة المهاد لتقليل التبخر",
          ],
          irrigationAdjustments_ar:
            "ري معتدل كل 3-4 أيام حسب الطقس والمحصول",
        },
        cropRotation: {
          current_ar: "اختر محصول رئيسي من القائمة الممتازة",
          recommended_ar:
            "دورة توصى بها: قمح → خضروات → بقوليات → قمح (أو تناوب مشابه)",
        },
        organicMatterEnhancement: {
          currentLevel: 2.5,
          targetLevel: 4,
          methods_ar: [
            "إضافة السماد الحيواني المتحلل",
            "زراعة محاصيل الغطاء الأخضر",
            "تقليل الحرث العميق للحفاظ على المادة العضوية",
          ],
        },
        implementationTimeline: {
          immediate_ar:
            "قبل الزراعة بأسبوعين: إضافة المادة العضوية والسماد الفوسفوري وتعديل pH",
          shortTerm_ar:
            "الأسابيع 1-4: تطبيق النيتروجين الأول ومراقبة رطوبة التربة",
          mediumTerm_ar:
            "الشهر 2-3: تطبيق النيتروجين الثاني والرش الورقي بالعناصر الدقيقة",
          longTerm_ar:
            "الشهر 4-6: مراقبة المحصول وتجهيز التربة للموسم القادم",
        },
      },
      professionalSummary: {
        executiveSummary_ar:
          "تربتك جيدة وقابلة للإنتاج مع بعض التحسينات البسيطة. التركيز على إضافة المادة العضوية وتعديل المغذيات سيحسن الإنتاجية بشكل كبير.",
        keyFindings_ar: [
          "درجة pH معتدلة مناسبة لمعظم المحاصيل",
          "محتوى عناصر غذائية جيد مع بعض الاختلالات البسيطة",
          "بنية تربة جيدة تحتاج تحسين طفيف في المادة العضوية",
          "فرص ممتازة لزراعة القمح والطماطم والذرة",
        ],
        primaryAction_ar:
          "الخطوة الأولى: إضافة 3 طن/هكتار من السماد العضوي قبل الزراعة بأسبوعين",
        nextSteps_ar:
          "بعد التحضير الأولي: مراقبة رطوبة التربة بانتظام، وتطبيق الأسمدة حسب الجدول الموصى به، وملاحظة صحة المحصول طوال الموسم.",
      },
    },
  };

  return JSON.stringify(demoResponse, null, 2);
}

// Parse AI response to extract JSON
function extractJSON(text: string): any {
  try {
    // Try to find JSON block in code fences
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to find raw JSON object
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }

    // If no JSON found, return the text as is for debugging
    return { raw_response: text };
  } catch (error) {
    console.error("Error parsing AI response as JSON:", error);
    return { error: "Failed to parse AI response", raw_response: text };
  }
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

    // Extract JSON from AI response
    const analysisResult = extractJSON(aiResponse);

    // Validate response structure
    if (!analysisResult.soilAnalysis && !analysisResult.error) {
      // If AI returned valid JSON but without expected structure, wrap it
      return res.status(200).json({
        success: true,
        data: analysisResult,
        note: "Response structure may vary - this is demo or partial analysis",
      });
    }

    return res.status(200).json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
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

    // Load prompt once
    const systemPrompt = await loadSoilAnalysisPrompt();

    // Analyze each soil sample
    const results = await Promise.allSettled(
      soils.map(async (soil) => {
        const formattedData = formatSoilDataForAI(soil);
        const aiResponse = await callAIService(systemPrompt, formattedData);
        return extractJSON(aiResponse);
      })
    );

    const analyses = results.map((result, index) => ({
      fieldId: soils[index].fieldId || `field_${index + 1}`,
      status: result.status,
      data: result.status === "fulfilled" ? result.value : { error: result.reason },
    }));

    res.status(200).json({
      success: true,
      totalRequested: soils.length,
      successfulAnalyses: analyses.filter((a) => a.status === "fulfilled").length,
      analyses,
    });
  } catch (error) {
    console.error("Batch soil analysis error:", error);

    res.status(500).json({
      success: false,
      error: "Batch soil analysis failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get analysis report as formatted HTML
 */
export const getSoilAnalysisReport: RequestHandler = async (req, res) => {
  try {
    const { analysisId } = req.params;

    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: "Analysis ID is required",
      });
    }

    // In a real implementation, fetch from database
    // For now, return a placeholder
    res.status(200).json({
      success: true,
      message: "Report generation feature coming soon",
      analysisId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Report generation failed",
    });
  }
};

export default {
  analyzeSoilDetailed,
  analyzeSoilBatch,
  getSoilAnalysisReport,
};
