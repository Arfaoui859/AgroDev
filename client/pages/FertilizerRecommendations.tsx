import React from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, ShieldAlert } from "lucide-react";

/**
 * Fertilizer dose advice is not generated from a verified local nutrient
 * reference and validated crop response dataset yet. Direct farmers to the
 * soil report workflow, which must still disclose missing lab methods/units.
 */
export default function FertilizerRecommendations(){
 return <main className="mx-auto max-w-4xl space-y-5 p-6" dir="rtl">
  <header><h1 className="text-2xl font-bold">التوصيات السمادية</h1><p className="text-sm text-muted-foreground">ربط التسميد بنتائج تحليل التربة والمحصول المستهدف.</p></header>
  <Alert variant="destructive"><ShieldAlert className="h-4 w-4"/><AlertTitle>التوصيات السمادية المستقلة غير مفعّلة</AlertTitle><AlertDescription>قاعدة الجرعات والأسعار المرجعية المحلية لم يتم توثيقها والتحقق منها بعد. لذلك لا نعرض جرعات أو تكاليف افتراضية قد تضر بالمحصول.</AlertDescription></Alert>
  <Card><CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5"/>المسار الصحيح حالياً</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-7">
   <p>ابدأ بتحليل التربة وأدخل قيم المختبر مع الوحدة وطريقة القياس وعمق العينة. التقرير يوضح ما يمكن استنتاجه وما لا يمكن حساب جرعته عند نقص البيانات.</p>
   <p>لن يتم اقتراح كمية DAP أو ammonitrate أو urea أو غيرها دون معرفة المحصول والمساحة والتحليل وطريقة القياس والري والهدف الإنتاجي.</p>
   <Button asChild><Link to="/enhanced-analysis">فتح تحليل التربة</Link></Button>
  </CardContent></Card>
 </main>;
}
