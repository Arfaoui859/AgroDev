import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Honest feedback for actions on screens whose data source is not connected.
 *
 * The professional dashboards (agronomist, trader, veterinarian, inspector,
 * government, investor) are backed by routers that answer HTTP 503 until a
 * verified tenant-scoped data source exists. Their create/edit/export controls
 * therefore cannot persist anything — but they were rendered with no handler,
 * so clicking them did nothing at all, which reads as a broken button.
 *
 * This hook wires those controls to a clear message instead: no silent no-op
 * and no fabricated success. Pass a localized action name (e.g. "Add product").
 */
export function useUnavailableAction() {
  const { toast } = useToast();
  const { language } = useLanguage();

  return useCallback(
    (action: string) => {
      const copy = {
        ar: {
          title: `${action}: غير متاح بعد`,
          body: "لا يوجد مصدر بيانات موثّق مربوط لهذه اللوحة، لذلك لم يتم حفظ أي شيء. لن نعرض نجاحاً وهمياً.",
        },
        fr: {
          title: `${action} : pas encore disponible`,
          body: "Aucune source de données vérifiée n'est connectée à ce tableau de bord, donc rien n'a été enregistré. Aucun succès fictif n'est affiché.",
        },
        en: {
          title: `${action}: not available yet`,
          body: "No verified data source is connected to this dashboard, so nothing was saved. No fake success is shown.",
        },
      }[language];

      toast({ title: copy.title, description: copy.body });
    },
    [toast, language],
  );
}
