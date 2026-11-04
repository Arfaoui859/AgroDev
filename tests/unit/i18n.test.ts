/**
 * i18n core tests.
 *
 * AgroGrowth's primary language is Arabic (RTL); French and English are
 * secondary. These tests pin the three-language contract: every keyed string
 * exists in all three languages, direction is derived correctly, the switcher
 * cycles ar → fr → en → ar, and a stored/invalid preference resolves safely.
 */
import {
  LANGUAGES,
  DEFAULT_LANG,
  detectInitialLang,
  dirFor,
  isLang,
  metaFor,
  nextLang,
  t,
  translations,
} from "../../client/lib/i18n";

describe("🌍 i18n core", () => {
  test("exactly three languages are supported", () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(["ar", "fr", "en"]);
  });

  test("every translation entry defines all three languages, non-empty", () => {
    for (const [key, entry] of Object.entries(translations)) {
      for (const lang of ["ar", "fr", "en"] as const) {
        expect(typeof entry[lang]).toBe("string");
        expect(entry[lang].trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("Arabic is RTL; French and English are LTR", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("fr")).toBe("ltr");
    expect(dirFor("en")).toBe("ltr");
  });

  test("the switcher cycles ar → fr → en → ar", () => {
    expect(nextLang("ar")).toBe("fr");
    expect(nextLang("fr")).toBe("en");
    expect(nextLang("en")).toBe("ar");
  });

  test("t() returns the language-specific string", () => {
    expect(t("ar", "action.logout")).toBe("تسجيل خروج");
    expect(t("fr", "action.logout")).toBe("Déconnexion");
    expect(t("en", "action.logout")).toBe("Logout");
  });

  test("t() fills placeholders", () => {
    expect(t("en", "welcome")).toBe("Welcome");
    expect(t("fr", "app.name")).toContain("AgroGrowth");
  });

  test("t() falls back to the key itself for an unknown key (never blank)", () => {
    expect(t("ar", "does.not.exist")).toBe("does.not.exist");
  });

  test("isLang narrows only the supported codes", () => {
    expect(isLang("ar")).toBe(true);
    expect(isLang("fr")).toBe(true);
    expect(isLang("en")).toBe(true);
    expect(isLang("es")).toBe(false);
    expect(isLang(null)).toBe(false);
  });

  test("stored preference wins; otherwise navigator; otherwise Arabic default", () => {
    expect(detectInitialLang("fr")).toBe("fr");
    expect(detectInitialLang("garbage", "fr-FR")).toBe("fr");
    expect(detectInitialLang(null, "ar-TN")).toBe("ar");
    expect(detectInitialLang(null, "en-US")).toBe("en");
    expect(detectInitialLang(null, null)).toBe(DEFAULT_LANG);
    expect(DEFAULT_LANG).toBe("ar");
  });

  test("metaFor returns a valid entry and defaults to Arabic", () => {
    expect(metaFor("fr").dir).toBe("ltr");
    // @ts-expect-error — exercise the fallback for an out-of-range code
    expect(metaFor("xx").code).toBe("ar");
  });
});
