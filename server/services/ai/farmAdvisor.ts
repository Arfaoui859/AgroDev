/**
 * AgroGrowth Farm Advisor — central agricultural AI orchestrator.
 *
 * Responsibilities:
 *  - Understand the farmer's question, language and (optional) farm context.
 *  - Coordinate specialised knowledge: soil, crops, weather, disease, market.
 *  - Answer via the configured LLM when available; otherwise answer using the
 *    deterministic rule-based engine.
 *  - Never present rule-based or heuristic output as LLM/model inference.
 */

import { chatComplete, getLLMInfo, isLLMConfigured, type ChatMessage } from "../providers/llmProvider";
import { ProviderError } from "../providers/http";
import {
  analyzeSoil,
  recommendCrops,
  type SoilInput,
} from "./knowledgeEngine";

export type Language = "ar" | "fr" | "en";

export interface FarmContext {
  governorate?: string;
  crop?: string;
  farmSizeHectares?: number;
  soil?: SoilInput;
  season?: string;
  waterAvailability?: "منخفض" | "متوسط" | "مرتفع";
  temperature?: number;
  rainfall?: number;
}

export interface AdvisorRequest {
  question: string;
  language?: Language;
  context?: FarmContext;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AdvisorResponse {
  answer: string;
  language: Language;
  /** "llm" only when a real LLM produced the answer; otherwise "rule-based". */
  dataSource: "llm" | "rule-based";
  /** True only when a real language model generated the answer. */
  isRealData: boolean;
  /** Provider:model for LLM answers, or the deterministic engine's name. */
  modelSource: string;
  usedAgents: string[];
  contextSummary: string[];
  modelInfo?: { provider: string; model: string };
  disclaimer: string;
  note?: string;
}

const ARABIC_RE = /[\u0600-\u06FF]/;

/** Detect the response language. Tunisian Arabic is written in Arabic script, so it maps to "ar". */
export function detectLanguage(text: string, fallback: Language = "ar"): Language {
  if (!text) return fallback;
  if (ARABIC_RE.test(text)) return "ar";
  const frenchMarkers = /\b(le|la|les|des|du|une|un|est|pour|avec|comment|quel|quelle|mon|ma|mes|je|nous)\b/i;
  if (frenchMarkers.test(text)) return "fr";
  return "en";
}

const SYSTEM_PROMPTS: Record<Language, string> = {
  ar: `أنت "المستشار الفلاحي" لمنصة AgroGrowth، خبير زراعي متخصص في تونس وشمال إفريقيا.
- أجب بالعربية الفصحى المبسّطة، ويمكنك فهم اللهجة التونسية.
- استعمل السياق الفلاحي المقدم (المحافظة، المحصول، التربة، الطقس) في إجابتك.
- كن دقيقاً وعملياً: خطوات قابلة للتنفيذ.
- إذا كانت البيانات ناقصة، اذكر ما ينقص بدل تخمينه.
- لا تخترع أرقاماً أو أسعاراً أو قياسات غير موجودة في السياق.`,
  fr: `Vous êtes le "Conseiller Agricole" d'AgroGrowth, expert agricole pour la Tunisie et l'Afrique du Nord.
- Répondez en français clair et concis.
- Utilisez le contexte agricole fourni (gouvernorat, culture, sol, météo).
- Donnez des étapes pratiques et actionnables.
- Si des données manquent, indiquez-le au lieu d'inventer des chiffres.`,
  en: `You are the AgroGrowth "Farm Advisor", an agricultural expert for Tunisia and North Africa.
- Answer in clear, concise English.
- Use the provided farm context (governorate, crop, soil, weather).
- Give practical, actionable steps.
- If data is missing, say so instead of inventing numbers.`,
};

function summariseContext(context?: FarmContext): string[] {
  if (!context) return [];
  const parts: string[] = [];
  if (context.governorate) parts.push(`المحافظة: ${context.governorate}`);
  if (context.crop) parts.push(`المحصول: ${context.crop}`);
  if (context.farmSizeHectares) parts.push(`المساحة: ${context.farmSizeHectares} هكتار`);
  if (context.season) parts.push(`الموسم: ${context.season}`);
  if (context.waterAvailability) parts.push(`توفر المياه: ${context.waterAvailability}`);
  if (context.temperature !== undefined) parts.push(`الحرارة: ${context.temperature}°م`);
  if (context.rainfall !== undefined) parts.push(`الأمطار: ${context.rainfall} مم`);
  if (context.soil) {
    const soilBits = Object.entries(context.soil)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${v}`);
    if (soilBits.length) parts.push(`التربة: ${soilBits.join(", ")}`);
  }
  return parts;
}

/** Detect which specialised "agents" are relevant to a question (keyword based). */
function detectRelevantAgents(question: string): string[] {
  const q = question.toLowerCase();
  const agents: string[] = [];
  const has = (re: RegExp) => re.test(q) || ARABIC_RE.test(question) && re.test(question);
  if (/(تربة|ph|آزوت|فوسفور|بوتاس|ملوحة|soil|sol)/i.test(question) || /soil|sol\b/.test(q))
    agents.push("soil");
  if (/(محصول|بذور|زراعة|crop|semis|culture)/i.test(question) || /crop|culture/.test(q))
    agents.push("crop");
  if (/(طقس|مطر|حرارة|ري|weather|météo|irrigation|arrosage)/i.test(question) || /weather|irrigation/.test(q))
    agents.push("weather");
  if (/(مرض|حشرة|آفة|disease|maladie|pest|ravageur)/i.test(question) || /disease|pest/.test(q))
    agents.push("disease");
  if (/(سعر|سوق|تصدير|price|marché|market)/i.test(question) || /price|market/.test(q))
    agents.push("market");
  void has;
  return agents.length ? agents : ["general"];
}

function buildRuleBasedAnswer(
  request: AdvisorRequest,
  agents: string[],
): string {
  const { question, context } = request;
  const lang = request.language ?? detectLanguage(question);
  const sections: string[] = [];

  if (agents.includes("soil") && context?.soil) {
    const soil = analyzeSoil(context.soil);
    const lines = soil.findings
      .filter((f) => f.status !== "missing")
      .map((f) => `• ${f.labelAr}: ${f.value} — ${f.status === "optimal" ? "مناسب" : f.status === "low" ? "منخفض" : "مرتفع"}`);
    sections.push(
      `تحليل التربة (مؤشر الصحة: ${soil.healthScore}/100، الخصوبة: ${soil.fertilityLevelAr}):\n${lines.join("\n")}`,
    );
    if (soil.missingMeasurements.length) {
      sections.push(`قياسات ناقصة: ${soil.missingMeasurements.join("، ")}.`);
    }
    if (soil.recommendations.length) {
      sections.push(`التوصيات:\n${soil.recommendations.map((r) => `• ${r}`).join("\n")}`);
    }
  } else if (agents.includes("soil")) {
    sections.push(
      "لتقييم التربة أحتاج قياسات مثل pH والآزوت والفوسفور والبوتاسيوم والمادة العضوية. يرجى إدخالها في قسم تحليل التربة.",
    );
  }

  if (agents.includes("crop")) {
    const crops = recommendCrops({
      ph: context?.soil?.ph,
      temperature: context?.temperature,
      rainfall: context?.rainfall,
      salinity: context?.soil?.salinity,
      waterAvailability: context?.waterAvailability,
      season: context?.season,
    });
    const top = crops.recommendations
      .slice(0, 3)
      .map((c, i) => `${i + 1}. ${c.nameAr} (ملاءمة ${c.suitabilityScore}%، احتياج مائي: ${c.waterNeedAr})`)
      .join("\n");
    sections.push(`المحاصيل الأنسب لظروفك:\n${top}`);
  }

  if (agents.includes("weather")) {
    if (context?.temperature !== undefined || context?.rainfall !== undefined) {
      sections.push(
        `الطقس المتوفر: ${context?.temperature ?? "—"}°م، أمطار ${context?.rainfall ?? "—"} مم. يمكنك جلب توقعات دقيقة من صفحة الطقس.`,
      );
    } else {
      sections.push(
        "للحصول على توصيات دقيقة حول الطقس والري، استعمل صفحة الطقس التي تجلب بيانات حقيقية من مزود Open-Meteo.",
      );
    }
  }

  if (agents.includes("disease")) {
    sections.push(
      "لتشخيص الأمراض بدقة، ارفع صورة واضحة للنبات في صفحة تشخيص الأمراض. ستعرض لك المنصة النتائج ومستوى الثقة عند توفر خدمة التشخيص.",
    );
  }

  if (agents.includes("market")) {
    sections.push(
      "بيانات الأسعار تُجلب من مصادر السوق المتاحة. لا نقدّم أسعاراً مباشرة هنا لتجنب تقديم أرقام غير موثوقة؛ راجع صفحة السوق.",
    );
  }

  if (sections.length === 0) {
    sections.push(
      lang === "ar"
        ? "يمكنني مساعدتك في تحليل التربة، توصيات المحاصيل، الطقس، الري، الأمراض، والسوق. حدّد سؤالك مع بعض معطيات المزرعة للحصول على إجابة أدق."
        : lang === "fr"
          ? "Je peux vous aider sur le sol, les cultures, la météo, l'irrigation, les maladies et le marché. Précisez votre question avec le contexte de la ferme."
          : "I can help with soil, crops, weather, irrigation, disease and market topics. Add some farm context for a more precise answer.",
    );
  }

  const header =
    lang === "ar"
      ? "بناءً على القواعد الزراعية المتوفرة"
      : lang === "fr"
        ? "D'après les règles agronomiques disponibles"
        : "Based on the available agronomic rules";
  return `${header}:\n\n${sections.join("\n\n")}`;
}

/**
 * Answer an agricultural question. Uses the LLM when configured, otherwise the
 * deterministic engine. Returns metadata describing the true data source.
 */
export async function answerAgriculturalQuestion(
  request: AdvisorRequest,
): Promise<AdvisorResponse> {
  const language = request.language ?? detectLanguage(request.question);
  const agents = detectRelevantAgents(request.question);
  const contextSummary = summariseContext(request.context);

  if (isLLMConfigured()) {
    try {
      const messages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPTS[language] },
      ];
      if (contextSummary.length) {
        messages.push({
          role: "system",
          content: `Farm context:\n${contextSummary.join("\n")}`,
        });
      }
      // Include deterministic soil/crop analysis as grounded facts for the LLM.
      if (request.context?.soil) {
        const soil = analyzeSoil(request.context.soil);
        messages.push({
          role: "system",
          content: `Soil analysis (rule-based, use as grounded facts): score=${soil.healthScore}, fertility=${soil.fertilityLevelAr}, problems=${soil.problems.join("; ") || "none"}`,
        });
      }
      for (const turn of request.history ?? []) {
        messages.push({ role: turn.role, content: turn.content });
      }
      messages.push({ role: "user", content: request.question });

      const answer = await chatComplete(messages, {
        temperature: 0.3,
        maxTokens: 900,
        timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30_000,
        retries: Number(process.env.AI_MAX_RETRIES) || 1,
      });

      const info = getLLMInfo();
      return {
        answer,
        language,
        dataSource: "llm",
        isRealData: true,
        modelSource: `${info.provider}:${info.model}`,
        usedAgents: agents,
        contextSummary,
        modelInfo: { provider: info.provider, model: info.model },
        disclaimer:
          "تم توليد هذه الإجابة بواسطة نموذج لغوي. تحقّق من التوصيات الحساسة مع مهندس زراعي.",
      };
    } catch (error) {
      // Fall through to the deterministic engine but surface why.
      const reason =
        error instanceof ProviderError ? error.message : (error as Error).message;
      const fallback = buildRuleBasedAnswer(request, agents);
      return {
        answer: fallback,
        language,
        dataSource: "rule-based",
        isRealData: false,
        modelSource: "rule-based-engine",
        usedAgents: agents,
        contextSummary,
        disclaimer:
          "تعذّر الاتصال بمزود الذكاء الاصطناعي، لذا هذه إجابة مبنية على قواعد زراعية محددة.",
        note: `LLM unavailable: ${reason}`,
      };
    }
  }

  return {
    answer: buildRuleBasedAnswer(request, agents),
    language,
    dataSource: "rule-based",
    isRealData: false,
    modelSource: "rule-based-engine",
    usedAgents: agents,
    contextSummary,
    disclaimer:
      "لم يتم إعداد مزود ذكاء اصطناعي (AI_BASE_URL/AI_API_KEY). هذه إجابة مبنية على قواعد زراعية محددة وليست ناتجة عن نموذج.",
    note: "Configure AI_BASE_URL and AI_API_KEY to enable LLM-backed answers.",
  };
}
