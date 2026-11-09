import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

/** Gamification stays unavailable until XP, achievements and leaderboard are persisted per user. */
export default function GamificationDashboard(){
 return <main className="mx-auto max-w-4xl space-y-5 p-6" dir="rtl">
  <header><h1 className="text-2xl font-bold">الإنجازات والتحديات</h1><p className="text-sm text-muted-foreground">نظام متابعة التقدم الزراعي.</p></header>
  <Alert><Trophy className="h-4 w-4"/><AlertTitle>نظام النقاط غير مفعّل حالياً</AlertTitle><AlertDescription>تم إيقاف النقاط والترتيب والإنجازات التجريبية. لن نعرض رصيد XP أو ترتيباً وهمياً قبل ربط سجل دائم وآمن لكل مستخدم.</AlertDescription></Alert>
  <Card><CardHeader><CardTitle>متطلبات التفعيل</CardTitle></CardHeader><CardContent className="text-sm leading-7">يلزم إنشاء سجل نقاط دائم، قواعد واضحة لاكتساب النقاط، سجل تدقيق يمنع التكرار والتلاعب، وصلاحيات منفصلة للترتيب العام.</CardContent></Card>
 </main>;
}
