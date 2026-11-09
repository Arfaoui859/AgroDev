import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Sprout, Tractor, Wallet, TrendingUp, RefreshCw } from "lucide-react";

type Farm = { id:string; name:string; size_hectares:number; location?:unknown };
type Cultivation = { id:string; farm_id:string; crop_name:string; planting_date:string; area_hectares:number; status:string };

export default function FarmOverviewPanel() {
  const [farms,setFarms] = useState<Farm[]>([]);
  const [crops,setCrops] = useState<Cultivation[]>([]);
  const [finance,setFinance] = useState<{totalExpenses:number;totalRevenue:number;netProfit:number}|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const {data:{session}} = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("يلزم تسجيل الدخول.");
      const headers = {Authorization:"Bearer " + session.access_token};
      const [farmsResponse,cropsResponse,financeResponse] = await Promise.all([
        fetch("/api/assistant/farms",{headers}),
        fetch("/api/assistant/cultivations",{headers}),
        fetch("/api/financial-summary",{headers})
      ]);
      const farmsPayload = await farmsResponse.json();
      if (!farmsResponse.ok || farmsPayload.success !== true) throw new Error(farmsPayload.message || "تعذّر تحميل المزارع.");
      setFarms(farmsPayload.data || []);
      if (cropsResponse.ok) {
        const payload = await cropsResponse.json();
        if (payload.success === true) setCrops(payload.data || []);
      }
      if (financeResponse.ok) {
        const payload = await financeResponse.json();
        if (payload.success === true) setFinance(payload.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل بيانات الحساب.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  const hectares = farms.reduce((sum,farm)=>sum + Number(farm.size_hectares || 0),0);
  const stats = [
    {label:"المزارع المسجلة",value:String(farms.length),icon:Tractor},
    {label:"المساحة المسجلة",value:hectares.toLocaleString("fr-TN",{maximumFractionDigits:2}) + " ha",icon:Sprout},
    {label:"المحاصيل المسجلة",value:String(crops.length),icon:Sprout},
    {label:"صافي الحركة المالية",value:finance ? Number(finance.netProfit).toLocaleString("fr-TN",{maximumFractionDigits:2}) + " TND" : "غير متاح",icon:Wallet}
  ];

  return (
    <section className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">نظرة عامة على المزرعة</h2>
          <p className="text-sm text-muted-foreground">أرقام مستخرجة من سجلات حسابك فقط، دون بيانات افتراضية.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")}/> تحديث
        </button>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(item => {
          const Icon=item.icon;
          return <Card key={item.label}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{item.label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? "…" : item.value}</div></CardContent></Card>;
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>مزارعي</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!loading && farms.length===0 && <p className="text-sm text-muted-foreground">ما فما حتى مزرعة مسجلة في الحساب. أضف مزرعتك أولاً قبل تسجيل المحاصيل.</p>}
            {farms.map(farm=><div key={farm.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">{farm.name}</p><p className="text-xs text-muted-foreground">{farm.id}</p></div><span className="text-sm tabular-nums">{farm.size_hectares} ha</span></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>آخر المحاصيل المسجلة</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!loading && crops.length===0 && <p className="text-sm text-muted-foreground">لا توجد محاصيل مسجلة بعد، أو أن جدول المحاصيل يحتاج إلى تطبيق ترحيل قاعدة البيانات.</p>}
            {crops.slice(0,6).map(crop=><div key={crop.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">{crop.crop_name}</p><p className="text-xs text-muted-foreground">{crop.planting_date}</p></div><span className="text-sm tabular-nums">{crop.area_hectares} ha</span></div>)}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center justify-between p-4"><span className="text-sm text-muted-foreground">المصاريف المسجلة</span><strong>{finance ? Number(finance.totalExpenses).toLocaleString("fr-TN") + " TND" : "غير متاح"}</strong></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><span className="text-sm text-muted-foreground">المداخيل المسجلة</span><strong>{finance ? Number(finance.totalRevenue).toLocaleString("fr-TN") + " TND" : "غير متاح"}</strong></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><span className="text-sm text-muted-foreground">المردود الصافي</span><strong>{finance ? Number(finance.netProfit).toLocaleString("fr-TN") + " TND" : "غير متاح"}</strong></CardContent></Card>
      </div>
    </section>
  );
}
