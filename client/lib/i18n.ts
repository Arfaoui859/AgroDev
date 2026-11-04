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
