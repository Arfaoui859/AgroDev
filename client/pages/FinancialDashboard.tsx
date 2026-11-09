import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Wallet, TrendingUp, TrendingDown } from "lucide-react";

type Summary={totalExpenses:number;totalRevenue:number;netProfit:number;categoryBreakdown:Record<string,number>;expenseCount:number;revenueCount:number};

export default function FinancialDashboard(){
 const [summary,setSummary]=useState<Summary|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const load=useCallback(async()=>{
  setLoading(true);setError(null);
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error("يلزم تسجيل الدخول.");
   const response=await fetch("/api/financial-summary",{headers:{Authorization:"Bearer "+session.access_token}});
   const payload=await response.json();
   if(!response.ok||payload.success!==true)throw new Error(payload.message||payload.code||"تعذّر تحميل الملخص المالي.");
   setSummary(payload.data);
  }catch(e){setError(e instanceof Error?e.message:"تعذّر تحميل البيانات المالية.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const money=(v:number)=>new Intl.NumberFormat("ar-TN",{style:"currency",currency:"TND",maximumFractionDigits:2}).format(v);
 return <main className="mx-auto max-w-6xl space-y-5 p-5" dir="rtl">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">اللوحة المالية للمزرعة</h1><p className="text-sm text-muted-foreground">المبالغ محسوبة من المصاريف والمداخيل المسجلة في حسابك فقط.</p></div><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className={"ml-2 h-4 w-4 "+(loading?"animate-spin":"")}/>تحديث</Button></header>
  {error&&<Alert variant="destructive"><AlertDescription>{error} تأكد من تسجيل الدخول وتطبيق ترحيل قاعدة البيانات المالية.</AlertDescription></Alert>}
  <div className="grid gap-3 md:grid-cols-3">
   <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><TrendingDown className="h-4 w-4"/>إجمالي المصاريف</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{loading?"…":money(summary?.totalExpenses||0)}</CardContent></Card>
   <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4"/>إجمالي المداخيل</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{loading?"…":money(summary?.totalRevenue||0)}</CardContent></Card>
   <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Wallet className="h-4 w-4"/>الصافي المسجل</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{loading?"…":money(summary?.netProfit||0)}</CardContent></Card>
  </div>
  <div className="grid gap-4 lg:grid-cols-2">
   <Card><CardHeader><CardTitle>حركة الحساب</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
    <div className="flex justify-between"><span>عدد المصاريف المسجلة</span><strong>{summary?.expenseCount??"—"}</strong></div>
    <div className="flex justify-between"><span>عدد المداخيل المسجلة</span><strong>{summary?.revenueCount??"—"}</strong></div>
    {!loading&&summary?.expenseCount===0&&summary?.revenueCount===0&&<p className="text-muted-foreground">لا توجد معاملات مسجلة بعد.</p>}
   </CardContent></Card>
   <Card><CardHeader><CardTitle>المصاريف حسب الصنف</CardTitle></CardHeader><CardContent className="space-y-2">
    {Object.entries(summary?.categoryBreakdown||{}).map(([category,value])=><div key={category} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{category}</span><strong>{money(Number(value))}</strong></div>)}
    {!loading&&Object.keys(summary?.categoryBreakdown||{}).length===0&&<p className="text-sm text-muted-foreground">لا توجد مصاريف مسجلة لعرض توزيعها.</p>}
   </CardContent></Card>
  </div>
  <p className="text-xs text-muted-foreground">الصافي هنا = المداخيل المسجلة − المصاريف المسجلة. لا يشمل الضرائب أو الديون أو المخزون أو قيمة الأصول ما لم يتم تسجيلها في النظام.</p>
 </main>;
}
