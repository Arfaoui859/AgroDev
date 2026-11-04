import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { LANGUAGES, nextLang, metaFor } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Shared language switcher.
 *
 * Cycles Arabic → French → English. The label names the *next* language so the
 * control is self-describing, and the title names the current one. Replaces the
 * per-page two-way toggles, which could not reach a third language and, once
 * French existed, labelled the next language incorrectly.
 */
export function LanguageSwitcher({
  className,
  variant = "outline",
  size = "sm",
}: {
  className?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "lg";
}) {
  const { language, setLanguage, t } = useLanguage();
  const next = nextLang(language);

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("text-sm", className)}
      aria-label={t("language.label")}
      title={`${metaFor(language).label} → ${metaFor(next).label}`}
      onClick={() => setLanguage(next)}
    >
      {metaFor(next).label}
    </Button>
  );
}

/** A segmented three-way selector, for settings screens. */
export function LanguageSegmentedControl({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      className={cn("inline-flex rounded-md border overflow-hidden", className)}
      role="group"
      aria-label="Language"
    >
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLanguage(l.code)}
          aria-pressed={language === l.code}
          className={cn(
            "px-3 py-1.5 text-sm transition-colors",
            language === l.code
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
