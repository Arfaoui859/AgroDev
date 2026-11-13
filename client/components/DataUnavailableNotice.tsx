import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { cn } from "@/lib/utils";

/**
 * Honest "this data source is not connected yet" notice for role dashboards.
 *
 * Unlike a generic error, it states plainly that the feature is waiting on a
 * verified tenant-scoped data source, so a professional user is never shown a
 * fabricated dashboard or a misleading "failed to load" message.
 */
export function DataUnavailableNotice({
  reason,
  className,
  onRetry,
}: {
  /** Server-supplied reason; falls back to localized copy when empty. */
  reason?: string;
  className?: string;
  /** Optional retry handler; renders a localized retry button when provided. */
  onRetry?: () => void;
}) {
  const { language } = useLanguage();

  const copy = {
    ar: {
      title: "البيانات الحقيقية غير متاحة بعد",
      body: "هذه اللوحة تعتمد على مصدر بيانات موثّق لكل مستخدم. لم يتم ربطه بعد، ولذلك لا نعرض أي أرقام تجريبية.",
      retry: "إعادة المحاولة",
    },
    fr: {
      title: "Données réelles pas encore disponibles",
      body: "Ce tableau de bord dépend d'une source de données vérifiée par utilisateur. Elle n'est pas encore connectée, donc aucune donnée fictive n'est affichée.",
      retry: "Réessayer",
    },
    en: {
      title: "Real data not available yet",
      body: "This dashboard depends on a verified per-user data source. It is not connected yet, so no placeholder figures are shown.",
      retry: "Retry",
    },
  }[language];

  return (
    <Alert
      className={cn("border-amber-300 bg-amber-50 text-amber-900", className)}
      role="status"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-sm font-semibold">{copy.title}</AlertTitle>
      <AlertDescription>
        {copy.body}
        {reason ? <span className="mt-1 block text-xs opacity-80">{reason}</span> : null}
        {onRetry ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100"
            onClick={onRetry}
          >
            <RefreshCw className="me-2 h-4 w-4" />
            {copy.retry}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export default DataUnavailableNotice;
