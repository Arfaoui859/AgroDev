/**
 * Central, dependency-free i18n core for AgroGrowth.
 *
 * The platform's primary language is Arabic (RTL); French and English are
 * secondary. Historically the UI toggled a single `isArabic` boolean and every
 * screen inlined `isArabic ? "…" : "…"`, which cannot express a third language.
 *
 * This module is the additive replacement: a small keyed dictionary plus
 * direction/lang helpers. It is plain TypeScript (no JSX) so the Node jest
 * environment, which does not transform `.tsx`, can unit test it. Existing
 * `isArabic` call-sites keep working — LanguageContext derives `isArabic` from
 * the selected language, so screens migrate at their own pace.
 */
export type Lang = "ar" | "fr" | "en";

export type Dir = "rtl" | "ltr";

export interface LanguageMeta {
  code: Lang;
  /** Endonym shown in the switcher. */
  label: string;
  dir: Dir;
  /** BCP-47 tag for <html lang>. */
  htmlLang: string;
}

export const LANGUAGES: readonly LanguageMeta[] = [
  { code: "ar", label: "العربية", dir: "rtl", htmlLang: "ar-TN" },
  { code: "fr", label: "Français", dir: "ltr", htmlLang: "fr-TN" },
  { code: "en", label: "English", dir: "ltr", htmlLang: "en" },
] as const;

export const DEFAULT_LANG: Lang = "ar";

export function isLang(value: unknown): value is Lang {
  return value === "ar" || value === "fr" || value === "en";
}

/** Writing direction for a language; Arabic is the only RTL locale here. */
export function dirFor(lang: Lang): Dir {
  return lang === "ar" ? "rtl" : "ltr";
}

export function metaFor(lang: Lang): LanguageMeta {
  return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
}

/**
 * Next language in the switcher cycle (ar → fr → en → ar).
 */
export function nextLang(lang: Lang): Lang {
  const order: Lang[] = ["ar", "fr", "en"];
  const i = order.indexOf(lang);
  return order[(i + 1) % order.length];
}

/** Resolve the language to start in, given a previously stored preference. */
export function detectInitialLang(
  stored?: string | null,
  navigatorLang?: string | null,
): Lang {
  if (isLang(stored)) return stored;
  const nav = (navigatorLang ?? "").toLowerCase();
  if (nav.startsWith("ar")) return "ar";
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("en")) return "en";
  return DEFAULT_LANG;
}

/** A translation entry: every supported language must supply the string. */
type Entry = Record<Lang, string>;

export const translations: Record<string, Entry> = {
  "app.name": {
    ar: "منصة أجرو جروث",
    fr: "Plateforme AgroGrowth",
    en: "AgroGrowth Platform",
  },
  "nav.dashboard": { ar: "لوحة التحكم", fr: "Tableau de bord", en: "Dashboard" },
  "nav.farms": { ar: "المزارع", fr: "Fermes", en: "Farms" },
  "nav.fields": { ar: "الحقول", fr: "Champs", en: "Fields" },
  "nav.soil": { ar: "تحليل التربة", fr: "Analyse du sol", en: "Soil Analysis" },
  "nav.crops": {
    ar: "توصيات المحاصيل",
    fr: "Recommandations de cultures",
    en: "Crop Recommendations",
  },
  "nav.disease": {
    ar: "تشخيص أمراض النبات",
    fr: "Diagnostic des maladies",
    en: "Plant Disease Detection",
  },
  "nav.market": { ar: "بيانات السوق", fr: "Marché", en: "Market Intelligence" },
  "nav.community": { ar: "المجتمع", fr: "Communauté", en: "Community" },
  "nav.experts": { ar: "الخبراء", fr: "Experts", en: "Experts" },
  "nav.notifications": { ar: "الإشعارات", fr: "Notifications", en: "Notifications" },
  "nav.weather": { ar: "الطقس", fr: "Météo", en: "Weather" },
  "nav.settings": { ar: "الإعدادات", fr: "Paramètres", en: "Settings" },
  "action.login": { ar: "تسجيل الدخول", fr: "Connexion", en: "Login" },
  "action.logout": { ar: "تسجيل خروج", fr: "Déconnexion", en: "Logout" },
  "action.register": { ar: "إنشاء حساب", fr: "S'inscrire", en: "Register" },
  "action.save": { ar: "حفظ", fr: "Enregistrer", en: "Save" },
  "action.cancel": { ar: "إلغاء", fr: "Annuler", en: "Cancel" },
  "action.retry": { ar: "إعادة المحاولة", fr: "Réessayer", en: "Retry" },
  "action.close": { ar: "إغلاق", fr: "Fermer", en: "Close" },
  "action.search": { ar: "بحث", fr: "Rechercher", en: "Search" },
  "welcome": { ar: "أهلاً بك", fr: "Bienvenue", en: "Welcome" },
  "state.loading": { ar: "جارٍ التحميل…", fr: "Chargement…", en: "Loading…" },
  "state.error": { ar: "حدث خطأ", fr: "Une erreur est survenue", en: "An error occurred" },
  "state.noData": { ar: "لا توجد بيانات", fr: "Aucune donnée", en: "No data" },
  "state.offline": { ar: "غير متصل", fr: "Hors ligne", en: "Offline" },
  "language.label": { ar: "اللغة", fr: "Langue", en: "Language" },
  "provenance.simulated": {
    ar: "بيانات محاكاة توضيحية وليست قياسات حقيقية من الميدان.",
    fr: "Données de simulation à titre indicatif, non des mesures réelles du terrain.",
    en: "Illustrative simulation data, not real field measurements.",
  },
  "provenance.live": {
    ar: "بيانات حقيقية من مصدر مباشر.",
    fr: "Données réelles provenant d'une source en direct.",
    en: "Real data from a live source.",
  },

  // ── Crops (shared by the farmer workflow screens) ─────────────────────────
  "crop.wheat": { ar: "القمح", fr: "Blé", en: "Wheat" },
  "crop.barley": { ar: "الشعير", fr: "Orge", en: "Barley" },
  "crop.tomato": { ar: "الطماطم", fr: "Tomate", en: "Tomato" },
  "crop.olive": { ar: "الزيتون", fr: "Olivier", en: "Olive" },
  "crop.potato": { ar: "البطاطس", fr: "Pomme de terre", en: "Potato" },
  "crop.corn": { ar: "الذرة", fr: "Maïs", en: "Corn" },
  "crop.citrus": { ar: "الحمضيات", fr: "Agrumes", en: "Citrus" },

  // ── Growth stages (irrigation) ────────────────────────────────────────────
  "growth.germination": { ar: "الإنبات", fr: "Germination", en: "Germination" },
  "growth.vegetative": { ar: "النمو الخضري", fr: "Croissance végétative", en: "Vegetative" },
  "growth.flowering": { ar: "الإزهار", fr: "Floraison", en: "Flowering" },
  "growth.maturity": { ar: "النضج", fr: "Maturité", en: "Maturity" },

  // ── Pest control advisor ──────────────────────────────────────────────────
  "pest.title": {
    ar: "مستشار مكافحة الآفات",
    fr: "Conseiller de lutte antiparasitaire",
    en: "Pest Control Advisor",
  },
  "pest.subtitle": {
    ar: "تحديد الآفات وتوصيات العلاج بناءً على الأعراض وظروف المزرعة",
    fr: "Identification des ravageurs et conseils de traitement à partir des symptômes et des conditions de la ferme",
    en: "Pest identification and treatment guidance from symptoms and farm conditions",
  },
  "pest.infestationDetails": {
    ar: "بيانات الإصابة",
    fr: "Détails de l'infestation",
    en: "Infestation details",
  },
  "pest.infestationHint": {
    ar: "أدخل المحصول والأعراض الملاحظة",
    fr: "Saisissez la culture et les symptômes observés",
    en: "Enter the crop and observed symptoms",
  },
  "pest.crop": { ar: "المحصول", fr: "Culture", en: "Crop" },
  "pest.symptoms": {
    ar: "الأعراض الملاحظة",
    fr: "Symptômes observés",
    en: "Observed symptoms",
  },
  "pest.affectedArea": {
    ar: "نسبة المساحة المصابة",
    fr: "Surface affectée",
    en: "Affected area",
  },
  "pest.plantHealth": {
    ar: "مؤشر صحة النبات",
    fr: "Indice de santé de la plante",
    en: "Plant health score",
  },
  "pest.analyze": {
    ar: "تحليل مشكلة الآفات",
    fr: "Analyser le problème",
    en: "Analyze pest problem",
  },
  "pest.analyzing": { ar: "جارٍ التحليل...", fr: "Analyse en cours…", en: "Analyzing..." },
  "pest.selectSymptom": {
    ar: "الرجاء اختيار عرض واحد على الأقل",
    fr: "Sélectionnez au moins un symptôme",
    en: "Select at least one symptom",
  },
  "pest.analysisFailed": {
    ar: "تعذّر إجراء التحليل: ",
    fr: "Échec de l'analyse : ",
    en: "Analysis failed: ",
  },
  "pest.emptyHint": {
    ar: "أدخل الأعراض ثم اضغط تحليل للحصول على التشخيص والتوصيات.",
    fr: "Saisissez les symptômes puis lancez l'analyse pour obtenir le diagnostic et les recommandations.",
    en: "Enter symptoms and press analyze to get a diagnosis and recommendations.",
  },
  "pest.diagnosis": { ar: "التشخيص", fr: "Diagnostic", en: "Diagnosis" },
  "pest.confidence": { ar: "درجة الثقة", fr: "Confiance", en: "Confidence" },
  "pest.severity": { ar: "شدة الإصابة", fr: "Gravité", en: "Severity" },
  "pest.treatments": {
    ar: "توصيات العلاج",
    fr: "Recommandations de traitement",
    en: "Treatment recommendations",
  },
  "pest.plannedApplications": {
    ar: "عدد التطبيقات المخططة: {count}",
    fr: "Applications prévues : {count}",
    en: "Planned applications: {count}",
  },
  "pest.noRecommendations": {
    ar: "لا توجد توصيات متاحة.",
    fr: "Aucune recommandation disponible.",
    en: "No recommendations available.",
  },
  "pest.identify": {
    ar: "تحديد الآفة من الأعراض",
    fr: "Identifier le ravageur à partir des symptômes",
    en: "Identify pest from symptoms",
  },
  "pest.identifying": {
    ar: "جارٍ التحديد...",
    fr: "Identification en cours…",
    en: "Identifying...",
  },
  "pest.ruleBasedNote": {
    ar: "هذا التحديد مبني على مطابقة الكلمات المفتاحية للأعراض التي وصفتها، وليس على نموذج تعلّم آلي مدرّب، ولا يشكّل تشخيصاً مؤكداً في الميدان.",
    fr: "Cette identification repose sur la correspondance de mots-clés avec les symptômes décrits, et non sur un modèle ML entraîné ; ce n'est pas un diagnostic confirmé sur le terrain.",
    en: "This identification matches keywords against the symptoms you described. It is not a trained ML model and not a confirmed field diagnosis.",
  },
  "pest.method": {
    ar: "طريقة التحديد",
    fr: "Méthode d'identification",
    en: "Identification method",
  },
  "pest.treatmentUnavailable": {
    ar: "لا تتوفر توصيات علاج موثوقة: تتطلّب معرفة المنتج المسجّل في تونس، والمادة الفعّالة، والجرعة، وفترة ما قبل الحصاد. لم يتم اختراع أي منتج أو جرعة.",
    fr: "Aucune recommandation de traitement fiable n'est disponible : elle exige le produit homologué en Tunisie, la matière active, la dose et le délai avant récolte. Aucun produit ni dose n'a été inventé.",
    en: "No reliable treatment recommendation is available: it requires the Tunisian-registered product, active ingredient, dose and pre-harvest interval. No product or dose has been invented.",
  },
  "symptom.curledLeaves": { ar: "أوراق مجعدة", fr: "Feuilles frisées", en: "Curled leaves" },
  "symptom.honeydew": { ar: "إفرازات لزجة", fr: "Miellat collant", en: "Sticky honeydew" },
  "symptom.yellowSpots": {
    ar: "نقط صفراء صغيرة",
    fr: "Petites taches jaunes",
    en: "Small yellow spots",
  },
  "symptom.webbing": { ar: "خيوط عنكبوتية", fr: "Toiles d'araignée", en: "Webbing" },
  "symptom.powdery": { ar: "طبقة بيضاء", fr: "Couche blanche poudreuse", en: "White powdery layer" },
  "symptom.brownSpots": { ar: "بقع بنية", fr: "Taches brunes", en: "Brown spots" },
  "symptom.rotting": { ar: "تعفن", fr: "Pourriture", en: "Rotting" },
  "symptom.wilting": { ar: "ذبول مفاجئ", fr: "Flétrissement soudain", en: "Sudden wilting" },

  // ── Smart irrigation optimizer ────────────────────────────────────────────
  "irrigation.title": {
    ar: "محسّن الري الذكي",
    fr: "Optimiseur d'irrigation intelligent",
    en: "Smart Irrigation Optimizer",
  },
  "irrigation.subtitle": {
    ar: "جدولة الري بناءً على الطقس والتربة ومرحلة نمو المحصول",
    fr: "Planification de l'irrigation selon la météo, le sol et le stade de croissance",
    en: "Irrigation scheduling from weather, soil and crop growth stage",
  },
  "irrigation.farmParams": {
    ar: "معطيات المزرعة",
    fr: "Paramètres de la ferme",
    en: "Farm parameters",
  },
  "irrigation.farmParamsHint": {
    ar: "أدخل ظروف الحقل لحساب احتياجات الري",
    fr: "Saisissez les conditions du champ pour calculer les besoins en eau",
    en: "Enter field conditions to compute water needs",
  },
  "irrigation.crop": { ar: "المحصول", fr: "Culture", en: "Crop" },
  "irrigation.growthStage": {
    ar: "مرحلة النمو",
    fr: "Stade de croissance",
    en: "Growth stage",
  },
  "irrigation.temperature": {
    ar: "درجة الحرارة (°م)",
    fr: "Température (°C)",
    en: "Temperature (°C)",
  },
  "irrigation.humidity": { ar: "الرطوبة (%)", fr: "Humidité (%)", en: "Humidity (%)" },
  "irrigation.soilMoisture": {
    ar: "رطوبة التربة (%)",
    fr: "Humidité du sol (%)",
    en: "Soil moisture (%)",
  },
  "irrigation.farmSize": {
    ar: "مساحة المزرعة (هكتار)",
    fr: "Surface de la ferme (ha)",
    en: "Farm size (ha)",
  },
  "irrigation.computing": { ar: "جارٍ الحساب...", fr: "Calcul en cours…", en: "Computing..." },
  "irrigation.optimize": {
    ar: "تحسين جدولة الري",
    fr: "Optimiser l'irrigation",
    en: "Optimize irrigation",
  },
  "irrigation.failed": {
    ar: "تعذّر تحسين جدولة الري: ",
    fr: "Échec de l'optimisation de l'irrigation : ",
    en: "Irrigation optimization failed: ",
  },
  "irrigation.emptyHint": {
    ar: "أدخل معطيات الحقل ثم اضغط تحسين للحصول على جدول الري.",
    fr: "Saisissez les paramètres du champ puis lancez l'optimisation pour obtenir le calendrier d'irrigation.",
    en: "Enter field parameters and press optimize to get an irrigation schedule.",
  },
  "irrigation.waterRequirements": {
    ar: "الاحتياجات المائية",
    fr: "Besoins en eau",
    en: "Water requirements",
  },
  "irrigation.mmPerDay": { ar: "مم/يوم", fr: "mm/jour", en: "mm/day" },
  "irrigation.mmPerWeek": { ar: "مم/أسبوع", fr: "mm/semaine", en: "mm/week" },
  "irrigation.mmPerSeason": { ar: "مم/موسم", fr: "mm/saison", en: "mm/season" },
  "irrigation.schedule": {
    ar: "جدول الري",
    fr: "Calendrier d'irrigation",
    en: "Irrigation schedule",
  },
  "irrigation.recommendations": {
    ar: "توصيات",
    fr: "Recommandations",
    en: "Recommendations",
  },

  // ── Weather & yield planner ───────────────────────────────────────────────
  "weather.title": {
    ar: "مخطط الطقس والمردودية",
    fr: "Planificateur météo et rendement",
    en: "Weather & Yield Planner",
  },
  "weather.subtitle": {
    ar: "تخطيط زراعي حسب المناخ وتوقّع مردودية المحاصيل",
    fr: "Planification agricole selon le climat et prévision des rendements",
    en: "Climate-based crop planning and yield prediction",
  },
  "weather.inputs": { ar: "المعطيات", fr: "Données", en: "Inputs" },
  "weather.inputsHint": {
    ar: "حدّد الموقع والمحاصيل",
    fr: "Définissez le lieu et les cultures",
    en: "Set location and crops",
  },
  "weather.latitude": { ar: "خط العرض", fr: "Latitude", en: "Latitude" },
  "weather.longitude": { ar: "خط الطول", fr: "Longitude", en: "Longitude" },
  "weather.farmSize": {
    ar: "مساحة المزرعة (هكتار)",
    fr: "Surface de la ferme (ha)",
    en: "Farm size (ha)",
  },
  "weather.crops": { ar: "المحاصيل", fr: "Cultures", en: "Crops" },
  "weather.climatePlan": { ar: "خطة المناخ", fr: "Plan climatique", en: "Climate plan" },
  "weather.predictYield": {
    ar: "توقّع المردودية",
    fr: "Prévoir le rendement",
    en: "Predict yield",
  },
  "weather.selectCrop": {
    ar: "اختر محصولاً واحداً على الأقل",
    fr: "Sélectionnez au moins une culture",
    en: "Select at least one crop",
  },
  "weather.planFailed": {
    ar: "تعذّر إنشاء الخطة: ",
    fr: "Échec de la génération du plan : ",
    en: "Plan generation failed: ",
  },
  "weather.yieldFailed": {
    ar: "تعذّر توقّع المردودية: ",
    fr: "Échec de la prévision du rendement : ",
    en: "Yield prediction failed: ",
  },
  "weather.climateTab": { ar: "الخطة المناخية", fr: "Plan climatique", en: "Climate plan" },
  "weather.yieldTab": { ar: "المردودية", fr: "Rendement", en: "Yield" },
  "weather.climateZone": { ar: "المنطقة المناخية", fr: "Zone climatique", en: "Climate zone" },
  "weather.season": { ar: "الموسم", fr: "Saison", en: "Season" },
  "weather.riskLevel": { ar: "مستوى المخاطر", fr: "Niveau de risque", en: "Risk level" },
  "weather.cropSuitability": {
    ar: "ملاءمة المحاصيل",
    fr: "Adéquation des cultures",
    en: "Crop suitability",
  },
  "weather.recommendationsSummary": {
    ar: "ملخص التوصيات",
    fr: "Résumé des recommandations",
    en: "Recommendations",
  },
  "weather.emptyPlanHint": {
    ar: "شغّل خطة المناخ لعرض ملاءمة المحاصيل.",
    fr: "Lancez le plan climatique pour voir l'adéquation des cultures.",
    en: "Run the climate plan to see crop suitability.",
  },
  "weather.predictedYield": {
    ar: "المردودية المتوقعة",
    fr: "Rendement prévu",
    en: "Predicted yield",
  },
  "weather.range": { ar: "المجال: ", fr: "Plage : ", en: "Range: " },
  "weather.confidence": { ar: "الثقة", fr: "Confiance", en: "Confidence" },
  "weather.economicAnalysis": {
    ar: "الجدوى الاقتصادية",
    fr: "Analyse économique",
    en: "Economic analysis",
  },
  "weather.netProfit": { ar: "صافي الربح", fr: "Bénéfice net", en: "Net profit" },
  "weather.roi": {
    ar: "معدل العائد",
    fr: "Retour sur investissement",
    en: "ROI",
  },
  "weather.tnd": { ar: "د.ت", fr: "DT", en: "TND" },
  "weather.emptyYieldHint": {
    ar: "شغّل توقّع المردودية لعرض النتائج.",
    fr: "Lancez la prévision du rendement pour voir les résultats.",
    en: "Run the yield prediction to see results.",
  },
};

/**
 * Translate `key` into `lang`. Falls back to the English entry, then to the key
 * itself, so a missing string is visible rather than silently blank.
 * `{name}`-style placeholders are filled from `vars`.
 */
export function t(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const entry = translations[key];
  let out = entry ? (entry[lang] ?? entry.en ?? key) : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return out;
}
