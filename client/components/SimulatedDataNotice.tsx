import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Disclosure shown on screens that render simulated market data.
 *
 * AgroGrowth has no licensed live market-price feed, so the market endpoints
 * return synthetic prices, volumes and forecasts. They are tagged
 * `dataSource: "simulated"` / `X-Data-Provenance: simulated` on the wire; this
 * banner makes that visible to the farmer so the numbers are never mistaken for
 * real market observations.
 */
export function SimulatedDataNotice({
  className,
  title,
  description,
}: {
  className?: string;
  /** Overrides the default heading; omit for the market-price wording. */
  title?: string;
  /** Overrides the default body text for non-market fixture screens. */
  description?: string;
}) {
  return (
    <Alert
      className={cn("border-amber-300 bg-amber-50 text-amber-900", className)}
      role="status"
    >
      <AlertTriangle className="h-4 w-4" />
      {title ? <AlertTitle className="text-sm font-semibold">{title}</AlertTitle> : null}
      <AlertDescription>
        {description ??
          "الأسعار والتنبؤات المعروضة هنا بيانات محاكاة توضيحية وليست أسعاراً حقيقية من السوق. لا تعتمد عليها لاتخاذ قرارات تجارية."}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Wording for screens backed by fixed in-memory records (SaaS, subscriptions,
 * logistics, supply chain, marketplace listings) rather than market prices.
 */
export const SIMULATED_RECORDS_TITLE_AR =
  "بيانات توضيحية غير مرتبطة بقاعدة البيانات";
export const SIMULATED_RECORDS_DESCRIPTION_AR =
  "السجلات والأرقام المعروضة هنا نماذج توضيحية ثابتة في الذاكرة، وليست بيانات تشغيل حقيقية، ولا تُحفظ عند تعديلها.";
