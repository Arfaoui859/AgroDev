import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

/**
 * Public datasets and API-key issuance are disabled until real licensed
 * market/production/export feeds and persistent key management are connected.
 */
export default function PublicDataDashboard(){
 return <main className="mx-auto max-w-4xl space-y-5 p-6" dir="rtl">
  <header><h1 className="text-2xl font-bold">البيانات الزراعية المفتوحة</h1><p className="text-sm text-muted-foreground">واجهة الوصول إلى مجموعات البيانات وواجهات AgroGrowth العامة.</p></header>
  <Alert variant="destructive"><ShieldAlert className="h-4 w-4"/><AlertTitle>واجهات البيانات العامة غير مفعّلة</AlertTitle><AlertDescription>لا يوجد حالياً مصدر أسعار سوق مرخّص ومؤرّخ أو قاعدة إنتاج وصادرات موثّقة مرتبطة بهذه الواجهة. تم تعطيل مفاتيح API التجريبية والبيانات الثابتة.</AlertDescription></Alert>
  <Card><CardHeader><CardTitle>ما يلزم قبل التفعيل</CardTitle></CardHeader><CardContent className="space-y-2 text-sm leading-7">
   <p>• ربط مصدر بيانات حقيقي مع شروط الترخيص.</p><p>• حفظ مفاتيح API في قاعدة بيانات مع صلاحيات وحدود استعمال.</p><p>• إظهار المصدر والمنطقة والوحدة وتاريخ آخر تحديث لكل سجل.</p><p>• عدم إنشاء مفتاح أو إرجاع بيانات إلا بعد نجاح الحفظ والتحقق.</p>
  </CardContent></Card>
 </main>;
}
