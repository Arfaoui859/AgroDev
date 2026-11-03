import { Alert, AlertDescription } from "@/components/ui/alert";
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
export function SimulatedDataNotice({ className }: { className?: string }) {
  return (
    <Alert
      className={cn("border-amber-300 bg-amber-50 text-amber-900", className)}
      role="status"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        الأسعار والتنبؤات المعروضة هنا بيانات محاكاة توضيحية وليست أسعاراً حقيقية
        من السوق. لا تعتمد عليها لاتخاذ قرارات تجارية.
      </AlertDescription>
    </Alert>
  );
}
