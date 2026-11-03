import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { classifyProvenance, type ProvenanceKind } from "@/lib/provenance";

export { classifyProvenance };
export type { ProvenanceKind };

/**
 * Provenance banner for AI analysis results.
 *
 * AgroGrowth tags every analysis with where it came from (`dataSource`) and
 * whether a real model produced it (`isRealData`). Screens must render that tag
 * instead of assuming success: a rule-based/estimate fallback is genuinely
 * useful, but showing it as a model prediction would mislead the farmer.
 *
 * Recognised sources:
 *   llm / vision-model / microservice / trained-model -> real model output
 *   heuristic / synthetic-demo                        -> deterministic engine
 *   rule-based                                        -> agronomy rule engine
 *   estimate                                          -> computed on the device
 */

const COPY: Record<
  ProvenanceKind,
  { className: string; Icon: typeof CheckCircle; text: string }
> = {
  real: {
    className: "border-green-300 bg-green-50 text-green-900",
    Icon: CheckCircle,
    text: "نتيجة صادرة عن نموذج ذكاء اصطناعي حقيقي.",
  },
  engine: {
    className: "border-amber-300 bg-amber-50 text-amber-900",
    Icon: FlaskConical,
    text: "نتيجة مبنية على محرّك قواعد زراعية محدّد وليست تنبؤاً من نموذج مدرّب.",
  },
  estimate: {
    className: "border-amber-300 bg-amber-50 text-amber-900",
    Icon: AlertTriangle,
    text: "تقدير محسوب على الجهاز من المدخلات المتوفرة، وليس تحليلاً من نموذج ذكاء اصطناعي.",
  },
  unknown: {
    className: "border-slate-300 bg-slate-50 text-slate-800",
    Icon: Info,
    text: "مصدر هذه النتيجة غير محدّد.",
  },
};

export function AIProvenanceNotice({
  result,
  className,
}: {
  result: { dataSource?: string; isRealData?: boolean; modelSource?: string };
  className?: string;
}) {
  const kind = classifyProvenance(result);
  const { className: tone, Icon, text } = COPY[kind];
  const source = result?.dataSource || result?.modelSource;
  return (
    <Alert className={cn(tone, className)} role="status">
      <Icon className="h-4 w-4" />
      <AlertDescription>
        {text}
        {source ? (
          <span className="mx-1 rounded bg-black/5 px-1 text-xs" dir="ltr">
            {source}
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
