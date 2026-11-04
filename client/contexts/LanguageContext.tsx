import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  Lang,
  Dir,
  detectInitialLang,
  dirFor,
  metaFor,
  nextLang,
  t as translate,
} from "../lib/i18n";

const STORAGE_KEY = "agrogrowth.lang";

interface LanguageContextType {
  /** Selected language code: "ar" | "fr" | "en". */
  language: Lang;
  setLanguage: (value: Lang) => void;
  /**
   * Derived for the many existing screens that branch on a boolean. True only
   * for Arabic, so their Arabic/English copy keeps rendering as before.
   */
  isArabic: boolean;
  /** Kept for backwards compatibility; prefer setLanguage. */
  setIsArabic: (value: boolean) => void;
  /** Cycle ar → fr → en → ar (used by the layout switcher). */
  toggleLanguage: () => void;
  /** Writing direction for the current language. */
  dir: Dir;
  /** Translate a keyed string into the current language. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

function readStoredLang(): string | null {
  try {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;
  } catch {
    return null;
  }
}

interface LanguageProviderProps {
  children: ReactNode;
  /** Override the initial language (tests / SSR); skips storage detection. */
  initialLanguage?: Lang;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLanguage,
}) => {
  const [language, setLanguageState] = useState<Lang>(
    () =>
      initialLanguage ??
      detectInitialLang(
        readStoredLang(),
        typeof navigator !== "undefined" ? navigator.language : null,
      ),
  );

  // Reflect the choice on <html> so RTL/LTR and font shaping apply globally,
  // and persist it so the preference survives a reload.
  useEffect(() => {
    const meta = metaFor(language);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", meta.dir);
      document.documentElement.setAttribute("lang", meta.htmlLang);
    }
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* storage unavailable (private mode) — preference is simply not kept */
    }
  }, [language]);

  const setLanguage = useCallback((value: Lang) => setLanguageState(value), []);

  const setIsArabic = useCallback(
    (value: boolean) => setLanguageState(value ? "ar" : "en"),
    [],
  );

  const toggleLanguage = useCallback(
    () => setLanguageState((prev) => nextLang(prev)),
    [],
  );

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage,
      isArabic: language === "ar",
      setIsArabic,
      toggleLanguage,
      dir: dirFor(language),
      t: (key: string, vars?: Record<string, string | number>) =>
        translate(language, key, vars),
    }),
    [language, setLanguage, setIsArabic, toggleLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};
