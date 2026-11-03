import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  advisoryModel,
  advisoryText,
  type Advisory,
} from "@/lib/advisory";

export type { Advisory };

/**
 * Renders the natural-language advisory that a configured LLM produces on top
 * of a service's numeric analysis.
 *
 * The advisory is deliberately kept visually separate from the numbers and
 * labelled with the model that wrote it, so a farmer can tell model-written
 * explanation apart from the underlying (possibly synthetic) analysis.
 */
export function AdvisoryPanel({
  advisory,
  className,
  titleAr = "توصية الذكاء الاصطناعي",
  titleEn = "AI advisory",
}: {
  advisory?: Advisory | null;
  className?: string;
  titleAr?: string;
  titleEn?: string;
}) {
  const { isArabic } = useLanguage();
  const t = (ar: string, en: string) => (isArabic ? ar : en);

  const text = advisoryText(advisory);
  if (!text) return null;
  const model = advisoryModel(advisory);

  return (
    <Card className={cn("border-green-200 bg-green-50/50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2 text-green-800">
            <Sparkles className="h-5 w-5" />
            {t(titleAr, titleEn)}
          </span>
          {model ? (
            <Badge variant="outline" className="text-xs" dir="ltr">
              {model}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-green-900">
          {text}
        </p>
      </CardContent>
    </Card>
  );
}
