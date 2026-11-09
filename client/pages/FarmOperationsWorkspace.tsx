import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import ExpenseTracker from "./ExpenseTracker";
import { Plus, RefreshCw, Sprout } from "lucide-react";

type Farm={id:string;name:string;size_hectares:number};
type Crop={id:string;farm_id:string;crop_name:string;planting_date:string;area_hectares:number;status:string};

export default function FarmOperationsWorkspace(){
  const [farms,setFarms]=useState<Farm[]>([]);
  const [crops,setCrops]=useState<Crop[]>([]);
  const [farmId,setFarmId]=useState("");
  const [cropName,setCropName]=useState("");
  const [plantingDate,setPlantingDate]=useState(new Date().toISOString().slice(0,10));
  const [area,setArea]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);

  const load=async()=>{
    setLoading(true);setError(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.access_token)throw new Error("يلزم تسجيل الدخول.");
      const headers={Authorization:"Bearer "+session.access_token};
      const [fr,cr]=await Promise.all([fetch("/api/assistant/farms",{headers}),fetch("/api/assistant/cultivations",{headers})]);
      const fp=await fr.json();const cp=await cr.json();
      if(!fr.ok||fp.success!==true)throw new Error(fp.message||"تعذّر تحميل المزارع.");
      setFarms(fp.data||[]);
      if(cp.success===true)setCrops(cp.data||[]);
      if(!farmId&&fp.data?.length)setFarmId(fp.data[0].id);
    }catch(e){setError(e instanceof Error?e.message:"تعذّر تحميل البيانات.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[]);

  const addCrop=async(e:React.FormEvent)=>{
    e.preventDefault();setSaving(true);setError(null);setNotice(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.access_token)throw new Error("يلزم تسجيل الدخول.");
      const response=await fetch("/api/assistant/actions/cultivations",{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
        body:JSON.stringify({farm_id:farmId,crop_name:cropName,planting_date:plantingDate,area_hectares:Number(area)})
      });
      const payload=await response.json();
      if(!response.ok||payload.success!==true)throw new Error(payload.message||payload.code||"تعذّر حفظ المحصول.");
      setNotice("تم حفظ المحصول في قاعدة البيانات.");
      setCropName("");setArea("");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"تعذّر حفظ المحصول.");}
    finally{setSaving(false);}
  };

  return <section className="space-y-5" dir="rtl">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">إدارة عمليات المزرعة</h2><p className="text-sm text-muted-foreground">إضافة المحاصيل ومتابعتها وتسجيل المصاريف المحفوظة.</p></div><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className={"ml-2 h-4 w-4 "+(loading?"animate-spin":"")}/>تحديث</Button></div>
    {error&&<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {notice&&<Alert><AlertDescription>{notice}</AlertDescription></Alert>}
    <Tabs defaultValue="crops" dir="rtl">
      <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="crops">المحاصيل والغراسة</TabsTrigger><TabsTrigger value="expenses">المصاريف</TabsTrigger></TabsList>
      <TabsContent value="crops" className="space-y-4">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4"/>إضافة محصول جديد</CardTitle></CardHeader><CardContent>
          {farms.length===0?<p className="text-sm text-muted-foreground">لا توجد مزرعة مسجلة. أضف مزرعة أولاً قبل إضافة محصول.</p>:<form onSubmit={addCrop} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><label className="text-sm">المزرعة</label><Select value={farmId} onValueChange={setFarmId}><SelectTrigger><SelectValue placeholder="اختر المزرعة"/></SelectTrigger><SelectContent>{farms.map(f=><SelectItem key={f.id} value={f.id}>{f.name} · {f.size_hectares} ha</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><label className="text-sm">اسم المحصول</label><Input required value={cropName} onChange={e=>setCropName(e.target.value)} placeholder="مثال: طماطم، قمح، زيتون"/></div>
            <div className="space-y-1"><label className="text-sm">المساحة (هكتار)</label><Input required type="number" min="0.01" step="0.01" value={area} onChange={e=>setArea(e.target.value)} placeholder="المساحة الفعلية"/></div>
            <div className="space-y-1"><label className="text-sm">تاريخ الغراسة</label><Input required type="date" value={plantingDate} onChange={e=>setPlantingDate(e.target.value)}/></div>
            <div className="md:col-span-2"><Button type="submit" disabled={saving||!farmId||!cropName.trim()||!area||Number(area)<=0}>{saving?"جاري الحفظ...":"حفظ المحصول في المزرعة"}</Button></div>
          </form>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sprout className="h-4 w-4"/>المحاصيل المسجلة</CardTitle></CardHeader><CardContent className="space-y-2">
          {!loading&&crops.length===0&&<p className="text-sm text-muted-foreground">لا توجد محاصيل مسجلة بعد. عند تطبيق ترحيل قاعدة البيانات، ستظهر السجلات هنا.</p>}
          {crops.map(c=><div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><p className="font-medium">{c.crop_name}</p><p className="text-xs text-muted-foreground">{c.planting_date} · {c.status}</p></div><span className="text-sm tabular-nums">{c.area_hectares} ha</span></div>)}
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="expenses"><ExpenseTracker/></TabsContent>
    </Tabs>
  </section>;
}
