import { useLanguage } from "../contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Disclosure banner for screens backed by synthesised (simulated) data.
 *
 * Modules such as the government/investor/admin dashboards, segmentation and
 * field inspection generate their figures because AgroGrowth has no licensed
 * feed for that data. The server stamps those responses with
 * `X-Data-Provenance: simulated`; this banner makes that visible so synthetic
 * numbers are never mistaken for real observations or measurements.
 */
export function DataProvenanceBanner({
  className,
  message,
}: {
  className?: string;
  message?: string;
}) {
  const { isArabic } = useLanguage();

  const text =
    message ??
    (isArabic
      ? "البيانات المعروضة في هذه الشاشة محاكاة توضيحية وليست قياسات حقيقية من الميدان. تُستخدم لأغراض العرض والتجربة فقط."
      : "The data on this screen is illustrative simulation, not real field measurements. For demonstration purposes only.");

  return (
    <Alert
      className={cn("border-amber-300 bg-amber-50 text-amber-900", className)}
      role="status"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}

export default DataProvenanceBanner;
