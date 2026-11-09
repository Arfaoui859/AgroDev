import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import ExpenseTracker from "./ExpenseTracker";
import { Plus, RefreshCw, Sprout, Tractor, MapPin, CalendarDays, Leaf, CircleAlert } from "lucide-react";

type Farm={id:string;name:string;size_hectares:number};
type Crop={id:string;farm_id:string;crop_name:string;planting_date:string;area_hectares:number;status:string};

export default function FarmOperationsWorkspace(){
  const { language, dir } = useLanguage();
  const copy = {
    ar: { title:"إدارة عمليات المزرعة", subtitle:"سجّل المزارع والمحاصيل وتابع مصاريفك من مساحة عمل واحدة.", refresh:"تحديث", farm:"تسجيل مزرعة جديدة", crop:"إضافة محصول جديد", crops:"المحاصيل والغراسة", expenses:"المصاريف", farmName:"اسم المزرعة", region:"الولاية / المنطقة", area:"المساحة (هكتار)", soil:"نوع التربة (اختياري)", farmPlaceholder:"اسم المزرعة", regionPlaceholder:"مثال: القصرين", areaPlaceholder:"المساحة الفعلية", soilPlaceholder:"غير معروف إذا لم يتم تحليله", saveFarm:"حفظ المزرعة", chooseFarm:"المزرعة", chooseFarmPlaceholder:"اختر المزرعة", cropName:"اسم المحصول", cropPlaceholder:"مثال: طماطم، قمح، زيتون", planting:"تاريخ الغراسة", saveCrop:"حفظ المحصول في المزرعة", records:"المحاصيل المسجلة", noFarm:"لا توجد مزرعة مسجلة. أضف مزرعة أولاً قبل إضافة محصول.", noCrops:"لا توجد محاصيل مسجلة بعد.", loading:"جاري الحفظ...", login:"يلزم تسجيل الدخول.", saveFarmError:"تعذّر حفظ المزرعة.", saveCropError:"تعذّر حفظ المحصول.", loadError:"تعذّر تحميل البيانات.", farmSaved:"تم حفظ المزرعة في قاعدة البيانات.", cropSaved:"تم حفظ المحصول في قاعدة البيانات.", invalidArea:"مساحة المحصول يجب أن تكون أكبر من صفر وألا تتجاوز مساحة المزرعة." },
    fr: { title:"Gestion des exploitations", subtitle:"Enregistrez vos exploitations et cultures et suivez vos dépenses depuis un seul espace.", refresh:"Actualiser", farm:"Nouvelle exploitation", crop:"Ajouter une culture", crops:"Cultures et plantations", expenses:"Dépenses", farmName:"Nom de l’exploitation", region:"Gouvernorat / région", area:"Surface (hectares)", soil:"Type de sol (facultatif)", farmPlaceholder:"Nom de l’exploitation", regionPlaceholder:"Ex. : Kasserine", areaPlaceholder:"Surface réelle", soilPlaceholder:"Laisser vide si non analysé", saveFarm:"Enregistrer l’exploitation", chooseFarm:"Exploitation", chooseFarmPlaceholder:"Choisir une exploitation", cropName:"Nom de la culture", cropPlaceholder:"Ex. : tomate, blé, olivier", planting:"Date de plantation", saveCrop:"Enregistrer la culture", records:"Cultures enregistrées", noFarm:"Aucune exploitation. Ajoutez-en une avant d’enregistrer une culture.", noCrops:"Aucune culture enregistrée.", loading:"Enregistrement...", login:"Connexion requise.", saveFarmError:"Impossible d’enregistrer l’exploitation.", saveCropError:"Impossible d’enregistrer la culture.", loadError:"Impossible de charger les données.", farmSaved:"Exploitation enregistrée dans la base de données.", cropSaved:"Culture enregistrée dans la base de données.", invalidArea:"La surface cultivée doit être positive et ne pas dépasser celle de l’exploitation." },
    en: { title:"Farm operations", subtitle:"Register farms and crops and track expenses in one workspace.", refresh:"Refresh", farm:"Register a farm", crop:"Add a crop", crops:"Crops and planting", expenses:"Expenses", farmName:"Farm name", region:"Governorate / region", area:"Area (hectares)", soil:"Soil type (optional)", farmPlaceholder:"Farm name", regionPlaceholder:"e.g. Kasserine", areaPlaceholder:"Actual area", soilPlaceholder:"Leave empty if not analysed", saveFarm:"Save farm", chooseFarm:"Farm", chooseFarmPlaceholder:"Choose a farm", cropName:"Crop name", cropPlaceholder:"e.g. tomato, wheat, olive", planting:"Planting date", saveCrop:"Save crop to farm", records:"Registered crops", noFarm:"No farm registered. Add a farm before registering a crop.", noCrops:"No crops have been registered yet.", loading:"Saving...", login:"Sign in is required.", saveFarmError:"Could not save farm.", saveCropError:"Could not save crop.", loadError:"Could not load data.", farmSaved:"Farm saved to the database.", cropSaved:"Crop saved to the database.", invalidArea:"Crop area must be positive and cannot exceed the farm area." }
  }[language] || { title:"Farm operations", subtitle:"Register farms and crops and track expenses in one workspace.", refresh:"Refresh", farm:"Register a farm", crop:"Add a crop", crops:"Crops and planting", expenses:"Expenses", farmName:"Farm name", region:"Governorate / region", area:"Area (hectares)", soil:"Soil type (optional)", farmPlaceholder:"Farm name", regionPlaceholder:"e.g. Kasserine", areaPlaceholder:"Actual area", soilPlaceholder:"Leave empty if not analysed", saveFarm:"Save farm", chooseFarm:"Farm", chooseFarmPlaceholder:"Choose a farm", cropName:"Crop name", cropPlaceholder:"e.g. tomato, wheat, olive", planting:"Planting date", saveCrop:"Save crop to farm", records:"Registered crops", noFarm:"No farm registered. Add a farm before registering a crop.", noCrops:"No crops have been registered yet.", loading:"Saving...", login:"Sign in is required.", saveFarmError:"Could not save farm.", saveCropError:"Could not save crop.", loadError:"Could not load data.", farmSaved:"Farm saved to the database.", cropSaved:"Crop saved to the database.", invalidArea:"Crop area must be positive and cannot exceed the farm area." };
  const [farms,setFarms]=useState<Farm[]>([]);
  const [crops,setCrops]=useState<Crop[]>([]);
  const [farmId,setFarmId]=useState("");
  const [cropName,setCropName]=useState("");
  const [plantingDate,setPlantingDate]=useState(new Date().toISOString().slice(0,10));
  const [area,setArea]=useState("");
  const [farmName,setFarmName]=useState("");
  const [farmRegion,setFarmRegion]=useState("");
  const [farmArea,setFarmArea]=useState("");
  const [farmSoilType,setFarmSoilType]=useState("");
  const [farmSaving,setFarmSaving]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);
  const selectedFarm = useMemo(() => farms.find((farm) => farm.id === farmId), [farms, farmId]);

  const load=async()=>{
    setLoading(true);setError(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.access_token)throw new Error(copy.login);
      const headers={Authorization:"Bearer "+session.access_token};
      const [fr,cr]=await Promise.all([fetch("/api/assistant/farms",{headers}),fetch("/api/assistant/cultivations",{headers})]);
      const fp=await fr.json();const cp=await cr.json();
      if(!fr.ok||fp.success!==true)throw new Error(fp.message||copy.loadError);
      setFarms(fp.data||[]);
      if(cp.success===true)setCrops(cp.data||[]);
      if(!farmId&&fp.data?.length)setFarmId(fp.data[0].id);
    }catch(e){setError(e instanceof Error?e.message:"تعذّر تحميل البيانات.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[]);

  const addFarm=async(e:React.FormEvent)=>{
    e.preventDefault();setFarmSaving(true);setError(null);setNotice(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.access_token)throw new Error(copy.login);
      const response=await fetch("/api/farms",{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
        body:JSON.stringify({name:farmName,region:farmRegion,size_hectares:Number(farmArea),soil_type:farmSoilType||null})
      });
      const payload=await response.json();
      if(!response.ok||payload.success!==true)throw new Error(payload.message||payload.code||copy.saveFarmError);
      setNotice("تم حفظ المزرعة في قاعدة البيانات.");
      setFarmName("");setFarmRegion("");setFarmArea("");setFarmSoilType("");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"تعذّر حفظ المزرعة.");}
    finally{setFarmSaving(false);}
  };

  const addCrop=async(e:React.FormEvent)=>{
    e.preventDefault();setSaving(true);setError(null);setNotice(null);
    if (!selectedFarm || Number(area) <= 0 || Number(area) > Number(selectedFarm.size_hectares)) { setError(copy.invalidArea); setSaving(false); return; }
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.access_token)throw new Error("يلزم تسجيل الدخول.");
      const response=await fetch("/api/assistant/actions/cultivations",{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
        body:JSON.stringify({farm_id:farmId,crop_name:cropName,planting_date:plantingDate,area_hectares:Number(area)})
      });
      const payload=await response.json();
      if(!response.ok||payload.success!==true)throw new Error(payload.message||payload.code||copy.saveCropError);
      setNotice("تم حفظ المحصول في قاعدة البيانات.");
      setCropName("");setArea("");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"تعذّر حفظ المحصول.");}
    finally{setSaving(false);}
  };

  return <section className="space-y-6" dir={dir}>
    <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 p-5 text-white shadow-sm sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="space-y-2"><div className="flex items-center gap-2 text-sm text-emerald-100"><Tractor className="h-4 w-4"/>AgroGrowth · {copy.title}</div><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{copy.title}</h2><p className="max-w-2xl text-sm leading-7 text-emerald-50/85">{copy.subtitle}</p></div><Button variant="secondary" onClick={()=>void load()} disabled={loading}><RefreshCw className={"me-2 h-4 w-4 "+(loading?"animate-spin":"")}/>{copy.refresh}</Button></div></header>
    {error&&<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {notice&&<Alert><AlertDescription>{notice}</AlertDescription></Alert>}
    <Tabs defaultValue="crops" dir={dir} className="space-y-4">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-white p-2 shadow-sm"><TabsTrigger value="crops" className="min-h-11 rounded-lg">{copy.crops}</TabsTrigger><TabsTrigger value="expenses" className="min-h-11 rounded-lg">{copy.expenses}</TabsTrigger></TabsList>
      <TabsContent value="crops" className="space-y-5">
        <Card className="overflow-hidden border-slate-200/80 shadow-sm"><CardHeader className="bg-slate-50/80"><CardTitle className="flex items-center gap-2"><span className="rounded-lg bg-emerald-100 p-2 text-emerald-800"><Tractor className="h-4 w-4"/></span>{copy.farm}</CardTitle></CardHeader><CardContent className="pt-5">
          <form onSubmit={addFarm} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1"><label className="text-sm">{copy.farmName}</label><Input required value={farmName} onChange={e=>setFarmName(e.target.value)} placeholder="اسم المزرعة"/></div>
            <div className="space-y-1"><label className="text-sm">{copy.region}</label><Input required value={farmRegion} onChange={e=>setFarmRegion(e.target.value)} placeholder={copy.regionPlaceholder}/></div>
            <div className="space-y-1"><label className="text-sm">{copy.area}</label><Input required type="number" min="0.01" step="0.01" value={farmArea} onChange={e=>setFarmArea(e.target.value)} placeholder={copy.areaPlaceholder}/></div>
            <div className="space-y-1"><label className="text-sm">{copy.soil}</label><Input value={farmSoilType} onChange={e=>setFarmSoilType(e.target.value)} placeholder={copy.soilPlaceholder}/></div>
            <div className="md:col-span-2"><Button type="submit" disabled={farmSaving||!farmName.trim()||!farmRegion.trim()||!farmArea||Number(farmArea)<=0}>{farmSaving?copy.loading:copy.saveFarm}</Button></div>
          </form>
        </CardContent></Card>
        <Card className="overflow-hidden border-slate-200/80 shadow-sm"><CardHeader className="bg-slate-50/80"><CardTitle className="flex items-center gap-2"><span className="rounded-lg bg-lime-100 p-2 text-lime-800"><Leaf className="h-4 w-4"/></span>{copy.crop}</CardTitle></CardHeader><CardContent className="pt-5">
          {farms.length===0?<p className="text-sm text-muted-foreground">{copy.noFarm}</p>:<form onSubmit={addCrop} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><label className="text-sm font-medium">{copy.chooseFarm}</label><Select value={farmId} onValueChange={setFarmId}><SelectTrigger><SelectValue placeholder={copy.chooseFarmPlaceholder}/></SelectTrigger><SelectContent>{farms.map(f=><SelectItem key={f.id} value={f.id}>{f.name} · {f.size_hectares} ha</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><label className="text-sm font-medium">{copy.cropName}</label><Input required value={cropName} onChange={e=>setCropName(e.target.value)} placeholder={copy.cropPlaceholder}/></div>
            <div className="space-y-1"><label className="text-sm">{copy.area}</label><Input required type="number" min="0.01" max={selectedFarm?.size_hectares} step="0.01" value={area} onChange={e=>setArea(e.target.value)} placeholder={copy.areaPlaceholder}/></div>
            <div className="space-y-1"><label className="text-sm font-medium">{copy.planting}</label><Input required type="date" value={plantingDate} onChange={e=>setPlantingDate(e.target.value)}/></div>
            <div className="md:col-span-2"><Button type="submit" disabled={saving||!farmId||!cropName.trim()||!area||Number(area)<=0}>{saving?copy.loading:copy.saveCrop}</Button></div>
          </form>}
        </CardContent></Card>
        <Card className="border-slate-200/80 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Sprout className="h-5 w-5 text-emerald-700"/>{copy.records}</CardTitle></CardHeader><CardContent className="space-y-2">
          {!loading&&crops.length===0&&<p className="text-sm text-muted-foreground">{copy.noCrops}</p>}
          {crops.map(c=><div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><p className="font-medium">{c.crop_name}</p><p className="text-xs text-muted-foreground">{c.planting_date} · {c.status}</p></div><span className="text-sm tabular-nums">{c.area_hectares} ha</span></div>)}
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="expenses" className="space-y-4"><ExpenseTracker/></TabsContent>
    </Tabs>
  </section>;
}
