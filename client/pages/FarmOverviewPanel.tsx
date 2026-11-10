import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sprout, Tractor, Wallet, RefreshCw, ArrowUpRight, MapPin, CalendarDays, Plus, Leaf, AlertCircle } from "lucide-react";

type Farm = { id: string; name: string; size_hectares: number; location?: unknown };
type Cultivation = { id: string; farm_id: string; crop_name: string; planting_date: string; area_hectares: number; status: string };
type Finance = { totalExpenses: number; totalRevenue: number; netProfit: number };

export default function FarmOverviewPanel() {
  const { language, dir } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Cultivation[]>([]);
  const [finance, setFinance] = useState<Finance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = {
    ar: {
      title: "نظرة عامة على نشاطك الزراعي", subtitle: "ملخّص مباشر للسجلات المحفوظة في حسابك، دون أرقام تقديرية أو بيانات افتراضية.",
      refresh: "تحديث البيانات", farms: "المزارع المسجلة", area: "المساحة المسجلة", crops: "المحاصيل المسجلة", net: "صافي الحركة المالية",
      farmsTitle: "مزارعي", farmsDesc: "المزارع المرتبطة بحسابك", cropsTitle: "أحدث المحاصيل", cropsDesc: "آخر سجلات الغراسة المحفوظة",
      expenses: "المصاريف المسجلة", revenue: "المداخيل المسجلة", profit: "الصافي المسجل", unavailable: "غير متاح",
      noFarms: "ما فما حتى مزرعة مسجلة في الحساب.", addFarm: "إضافة مزرعة", noCrops: "ما فما حتى محصول مسجل بعد.",
      addCrop: "إضافة محصول", viewAll: "إدارة المحاصيل", noFinance: "لا توجد بيانات مالية متاحة حالياً.", financeDesc: "القيم التالية مأخوذة من القيود المالية المحفوظة فقط.",
      login: "يلزم تسجيل الدخول.", loadError: "تعذّر تحميل المزارع.", unknown: "الموقع غير محدد",
      status: "السجل", loading: "جاري تحميل بياناتك..."
    },
    fr: {
      title: "Vue d’ensemble de votre activité agricole", subtitle: "Résumé des données enregistrées dans votre compte, sans chiffres estimés ni données fictives.",
      refresh: "Actualiser", farms: "Exploitations", area: "Surface enregistrée", crops: "Cultures enregistrées", net: "Solde financier net",
      farmsTitle: "Mes exploitations", farmsDesc: "Exploitations liées à votre compte", cropsTitle: "Cultures récentes", cropsDesc: "Dernières plantations enregistrées",
      expenses: "Dépenses enregistrées", revenue: "Revenus enregistrés", profit: "Solde enregistré", unavailable: "Indisponible",
      noFarms: "Aucune exploitation n’est encore enregistrée.", addFarm: "Ajouter une exploitation", noCrops: "Aucune culture enregistrée.",
      addCrop: "Ajouter une culture", viewAll: "Gérer les cultures", noFinance: "Aucune donnée financière disponible.", financeDesc: "Valeurs issues uniquement des écritures financières enregistrées.",
      login: "Connexion requise.", loadError: "Impossible de charger les exploitations.", unknown: "Emplacement non précisé",
      status: "Statut", loading: "Chargement de vos données..."
    },
    en: {
      title: "Your agricultural overview", subtitle: "A live summary of records saved to your account, with no estimated or fabricated figures.",
      refresh: "Refresh data", farms: "Registered farms", area: "Registered area", crops: "Registered crops", net: "Net financial balance",
      farmsTitle: "My farms", farmsDesc: "Farms linked to your account", cropsTitle: "Recent crops", cropsDesc: "Latest saved planting records",
      expenses: "Recorded expenses", revenue: "Recorded revenue", profit: "Recorded net balance", unavailable: "Unavailable",
      noFarms: "No farm has been registered yet.", addFarm: "Add a farm", noCrops: "No crop has been recorded yet.",
      addCrop: "Add a crop", viewAll: "Manage crops", noFinance: "Financial data is not available yet.", financeDesc: "Figures below come only from saved financial entries.",
      login: "Sign in is required.", loadError: "Could not load farms.", unknown: "Location not specified",
      status: "Status", loading: "Loading your data..."
    }
  }[language] || {
    title: "Your agricultural overview", subtitle: "A live summary of records saved to your account.",
    refresh: "Refresh data", farms: "Registered farms", area: "Registered area", crops: "Registered crops", net: "Net financial balance",
    farmsTitle: "My farms", farmsDesc: "Farms linked to your account", cropsTitle: "Recent crops", cropsDesc: "Latest saved planting records",
    expenses: "Recorded expenses", revenue: "Recorded revenue", profit: "Recorded net balance", unavailable: "Unavailable",
    noFarms: "No farm has been registered yet.", addFarm: "Add a farm", noCrops: "No crop has been recorded yet.",
    addCrop: "Add a crop", viewAll: "Manage crops", noFinance: "Financial data is not available yet.",
    login: "Sign in is required.", loadError: "Could not load farms.", unknown: "Location not specified",
    status: "Status", loading: "Loading your data..."
  };
  const locale = language === "ar" ? "ar-TN" : language === "fr" ? "fr-TN" : "en-US";
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  const money = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "TND", maximumFractionDigits: 2 }).format(value);
  const hectares = useMemo(() => farms.reduce((sum, farm) => sum + Number(farm.size_hectares || 0), 0), [farms]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(t.login);
      const headers = { Authorization: "Bearer " + session.access_token, Accept: "application/json" };
      const [farmsResponse, cropsResponse, financeResponse] = await Promise.all([
        fetch("/api/assistant/farms", { headers }),
        fetch("/api/assistant/cultivations", { headers }),
        fetch("/api/financial-summary", { headers })
      ]);
      const farmsPayload = await farmsResponse.json();
      if (!farmsResponse.ok || farmsPayload.success !== true) throw new Error(farmsPayload.message || t.loadError);
      setFarms(Array.isArray(farmsPayload.data) ? farmsPayload.data : []);
      if (cropsResponse.ok) {
        const payload = await cropsResponse.json();
        if (payload.success === true) setCrops(Array.isArray(payload.data) ? payload.data : []);
      }
      if (financeResponse.ok) {
        const payload = await financeResponse.json();
        if (payload.success === true && payload.data) setFinance(payload.data);
        else setFinance(null);
      } else setFinance(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.login, t.loadError]);

  useEffect(() => { void load(); }, [load]);

  const stats = [
    { label: t.farms, value: String(farms.length), icon: Tractor, accent: "bg-emerald-50 text-emerald-700" },
    { label: t.area, value: number(hectares) + " ha", icon: Sprout, accent: "bg-lime-50 text-lime-700" },
    { label: t.crops, value: String(crops.length), icon: Leaf, accent: "bg-teal-50 text-teal-700" },
    { label: t.net, value: finance ? money(Number(finance.netProfit) || 0) : t.unavailable, icon: Wallet, accent: "bg-sky-50 text-sky-700" }
  ];

  return (
    <section className="space-y-6" dir={dir}>
      <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 p-5 text-white shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <Badge className="border border-white/20 bg-white/10 text-emerald-50 hover:bg-white/10">{t.farmsTitle}</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h2>
            <p className="text-sm leading-7 text-emerald-50/85">{t.subtitle}</p>
          </div>
          <Button variant="secondary" onClick={() => void load()} disabled={loading} className="shrink-0">
            <RefreshCw className={"me-2 h-4 w-4 " + (loading ? "animate-spin" : "")} />{t.refresh}
          </Button>
        </div>
      </header>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="group overflow-hidden border-slate-200/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0 space-y-2">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="break-words text-2xl font-bold tabular-nums tracking-tight">{loading ? "—" : item.value}</p>
                </div>
                <div className={"rounded-xl p-3 " + item.accent}><Icon className="h-5 w-5" /></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3">
            <div className="space-y-1"><CardTitle>{t.farmsTitle}</CardTitle><CardDescription>{t.farmsDesc}</CardDescription></div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Tractor className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && [1, 2].map((key) => <div key={key} className="h-[68px] animate-pulse rounded-xl bg-muted" />)}
            {!loading && farms.length === 0 && (
              <div className="rounded-xl border border-dashed bg-slate-50/70 p-6 text-center">
                <Sprout className="mx-auto mb-2 h-8 w-8 text-emerald-700" />
                <p className="mb-4 text-sm text-muted-foreground">{t.noFarms}</p>
                <Button asChild size="sm"><Link to="/farmer-dashboard?tab=farm"><Plus className="me-2 h-4 w-4" />{t.addFarm}</Link></Button>
              </div>
            )}
            {!loading && farms.map((farm) => (
              <div key={farm.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border bg-white p-3 transition-colors hover:bg-slate-50">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold">{farm.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{typeof farm.location === "string" && farm.location ? farm.location : t.unknown}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 tabular-nums">{number(Number(farm.size_hectares) || 0)} ha</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3">
            <div className="space-y-1"><CardTitle>{t.cropsTitle}</CardTitle><CardDescription>{t.cropsDesc}</CardDescription></div>
            <div className="rounded-lg bg-lime-50 p-2 text-lime-700"><Leaf className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && [1, 2].map((key) => <div key={key} className="h-[68px] animate-pulse rounded-xl bg-muted" />)}
            {!loading && crops.length === 0 && (
              <div className="rounded-xl border border-dashed bg-slate-50/70 p-6 text-center">
                <Leaf className="mx-auto mb-2 h-8 w-8 text-lime-700" />
                <p className="mb-4 text-sm text-muted-foreground">{t.noCrops}</p>
                <Button asChild size="sm" disabled={farms.length === 0}><Link to="/farmer-dashboard?tab=farm"><Plus className="me-2 h-4 w-4" />{t.addCrop}</Link></Button>
              </div>
            )}
            {!loading && crops.slice(0, 6).map((crop) => (
              <div key={crop.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border bg-white p-3 transition-colors hover:bg-slate-50">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold">{crop.crop_name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" />{crop.planting_date || "—"} · {crop.status}</p>
                </div>
                <Badge variant="outline" className="shrink-0 tabular-nums">{number(Number(crop.area_hectares) || 0)} ha</Badge>
              </div>
            ))}
            {!loading && crops.length > 6 && <Button asChild variant="ghost" className="w-full"><Link to="/farmer-dashboard?tab=farm">{t.viewAll}<ArrowUpRight className="ms-2 h-4 w-4" /></Link></Button>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader><CardTitle>{language === "ar" ? "الملخص المالي" : language === "fr" ? "Résumé financier" : "Financial summary"}</CardTitle><CardDescription>{finance ? t.financeDesc : t.noFinance}</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[{ label: t.expenses, value: finance ? money(Number(finance.totalExpenses) || 0) : t.unavailable }, { label: t.revenue, value: finance ? money(Number(finance.totalRevenue) || 0) : t.unavailable }, { label: t.profit, value: finance ? money(Number(finance.netProfit) || 0) : t.unavailable }].map((item) => (
            <div key={item.label} className="rounded-xl border bg-slate-50/70 p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 break-words text-xl font-bold tabular-nums">{loading ? "—" : item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
