import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Bot, Clock3, RefreshCw, ShieldAlert, Sprout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AIService = {
  name:string; nameAr?:string; key:string; url?:string; status:string;
  responseTime?:number; lastChecked?:string; error?:string;
  modelSource?:string|null; modelKind?:"unknown"|"synthetic"|"rule-based"|"model"; isRealModel?:boolean; modelTrainedOnSyntheticData?:boolean;
};
type HealthPayload = {
  overview?:{totalServices:number;availableServices:number;reachableServices?:number;unavailableServices:number;notConfiguredServices?:number;rateLimitedServices?:number;syntheticModelServices:number;lastUpdated:string;checkDuration:number};
  services?:AIService[];
  llm?:{configured:boolean;credentialAvailable:boolean;provider?:string;model?:string;textModel?:string;visionModel?:string};
  fallbackEngine?:{available:boolean;type:string;description:string};
  note?:string;
};

function classify(service:AIService) {
  const error=(service.error||"").toLowerCase();
  if(service.status==="available" && service.modelKind==="rule-based") return {label:"متصل · محرك قواعد",tone:"warning" as const};
  if(service.status==="available" && service.modelTrainedOnSyntheticData===true) return {label:"متصل · نموذج اصطناعي",tone:"warning" as const};
  if(service.status==="available" && service.isRealModel!==true) return {label:"متصل · المصدر غير مثبت",tone:"warning" as const};
  if(service.status==="available") return {label:"متصل",tone:"success" as const};
  if(error.includes("service_url_not_configured")) return {label:"عنوان الخدمة غير مضبوط",tone:"danger" as const};
  if(service.status==="rate_limited"||error.includes("429")||error.includes("too many requests")) return {label:"الخادم مستجيب · فحص محدود (429)",tone:"warning" as const};
  if((service.url||"").includes("localhost")||error.includes("econnrefused")) return {label:"إعداد عنوان خاطئ",tone:"danger" as const};
  return {label:"غير متاح",tone:"danger" as const};
}

export default function AIIntelligenceDashboard(){
  const [health,setHealth]=useState<HealthPayload|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);

  const refresh=useCallback(async()=>{
    setLoading(true);setError(null);
    try{
      const response=await fetch("/api/ai/health?force=true",{headers:{Accept:"application/json"}});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.message||"تعذّر فحص خدمات الذكاء الاصطناعي.");
      setHealth(payload);
    }catch(e){setError(e instanceof Error?e.message:"تعذّر الاتصال بخادم AgroGrowth.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);

  const services=health?.services||[];
  const total=health?.overview?.totalServices??services.length;
  const available=health?.overview?.availableServices??services.filter(s=>s.status==="available").length;
  const reachable=health?.overview?.reachableServices??services.filter(s=>s.status==="available"||s.status==="rate_limited").length;
  const limited=services.filter(s=>classify(s).label.includes("429")).length;
  const misconfigured=services.filter(s=>classify(s).label==="عنوان الخدمة غير مضبوط"||classify(s).label==="إعداد عنوان خاطئ").length;
  const validatedModels=services.filter(s=>s.status==="available"&&s.isRealModel===true&&s.modelTrainedOnSyntheticData!==true).length;

  return <main className="space-y-6" dir="rtl">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-bold">مركز الذكاء الاصطناعي</h2><p className="text-sm text-muted-foreground">حالة الخدمات الفعلية ومصادر النماذج، دون أرقام أداء أو توصيات تجريبية.</p></div>
      <Button onClick={()=>void refresh()} disabled={loading}><RefreshCw className={"ml-2 h-4 w-4 "+(loading?"animate-spin":"")}/>فحص الخدمات الآن</Button>
    </header>
    {error&&<Alert variant="destructive"><AlertTitle>تعذّر فحص الخدمات</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    {health?.note&&<Alert><AlertTriangle className="h-4 w-4"/><AlertDescription>{health.note}</AlertDescription></Alert>}\n    {health?.overview?.rateLimitedServices ? <p className="text-xs text-muted-foreground">ملاحظة: استجابة HTTP 429 تثبت أن الخادم ردّ على الطلب، لكنها لا تثبت أن الاستدلال بالذكاء الاصطناعي متاح أو أن النموذج يعمل.</p> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">الخدمات المتاحة</CardTitle></CardHeader><CardContent className="text-2xl font-bold tabular-nums">{loading?"…":available+" / "+total}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">الخوادم المستجيبة</CardTitle></CardHeader><CardContent className="text-2xl font-bold tabular-nums">{loading?"…":reachable+" / "+total}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">طلبات محدودة (429)</CardTitle></CardHeader><CardContent className="text-2xl font-bold tabular-nums">{loading?"…":limited}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">خدمات بلا عنوان مضبوط</CardTitle></CardHeader><CardContent className="text-2xl font-bold tabular-nums">{loading?"…":misconfigured}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">نماذج بمصدر موثّق</CardTitle></CardHeader><CardContent className="text-2xl font-bold tabular-nums">{loading?"…":validatedModels}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">مزود النموذج اللغوي</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{health?.llm?.configured?health.llm.provider||"مهيأ":"غير مهيأ"}</CardContent></Card>
    </div>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5"/>حالة خدمات الذكاء الاصطناعي</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {!loading&&services.length===0&&<p className="text-sm text-muted-foreground">لم يرجع الخادم قائمة خدمات قابلة للفحص.</p>}
        {services.map(service=>{
          const state=classify(service);
          return <div key={service.key} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1"><p className="font-semibold">{service.nameAr||service.name}</p><p className="text-xs text-muted-foreground" dir="ltr">{service.url||service.key}</p></div>
              <Badge variant={state.tone==="success"?"default":state.tone==="warning"?"secondary":"destructive"}>{state.label}</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <span>الاستجابة: {typeof service.responseTime==="number"?service.responseTime+" ms":"غير متاح"}</span>
              <span>مصدر النموذج: {service.modelSource||"غير معلن"}</span>
              <span>{service.modelKind==="rule-based"?"محرك قواعد حتمي، وليس نموذج ML مدرّب":service.isRealModel===true?"مصدر نموذج فعلي معلن":service.modelTrainedOnSyntheticData===true?"مصدر اصطناعي/تجريبي":"لم يتم إثبات نموذج مدرّب"}</span>
            </div>
            {service.error&&<p className="mt-2 break-words text-xs text-destructive">{service.error}</p>}
          </div>;
        })}
      </CardContent>
    </Card>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5"/>المزود اللغوي</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        <p>المزود: <strong>{health?.llm?.provider||"غير معروف"}</strong></p>
        <p>النموذج النصي: <strong>{health?.llm?.textModel||health?.llm?.model||"غير معلن"}</strong></p>
        <p>نموذج الرؤية: <strong>{health?.llm?.visionModel||"غير معلن"}</strong></p>
        <p>وجود مفتاح اعتماد لا يعني أن كل خدمة AI متاحة أو أن نتائجها تحققت ميدانياً.</p>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5"/>المحرك الاحتياطي</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        <p>الحالة: <strong>{health?.fallbackEngine?.available?"متاح":"غير متاح"}</strong></p>
        <p>النوع: <strong>{health?.fallbackEngine?.type||"غير معلن"}</strong></p>
        <p>{health?.fallbackEngine?.description||"لا توجد تفاصيل."}</p>
        <p className="text-muted-foreground">نتائج القواعد الزراعية تُعرض كمخرجات قواعد، لا كنموذج تعلم آلي مدرّب.</p>
      </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sprout className="h-5 w-5"/>الخدمات الزراعية</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Button asChild variant="outline"><Link to="/enhanced-analysis">تحليل التربة</Link></Button>
      <Button asChild variant="outline"><Link to="/smart-crop-suggestions">توصيات المحاصيل</Link></Button>
      <Button asChild variant="outline"><Link to="/disease-upload">تشخيص الصور</Link></Button>
      <Button asChild variant="outline"><Link to="/ai-assistant">المساعد الذكي</Link></Button>
    </CardContent></Card>
    <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-3 w-3"/>آخر فحص: {health?.overview?.lastUpdated?new Date(health.overview.lastUpdated).toLocaleString():"لم يتم الفحص بعد"}</p>
  </main>;
}
