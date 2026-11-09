import React from "react";

/**
 * No verified veterinary case store or Tunisia-validated livestock risk model
 * is connected. This screen must not display fabricated accuracy, risk scores,
 * prevention plans or animal assessments.
 */
const LivestockDiseasePredictor: React.FC = () => (
  <main className="mx-auto max-w-4xl space-y-4 p-6" dir="rtl">
    <h1 className="text-2xl font-bold">مراقبة صحة الثروة الحيوانية</h1>
    <section role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
      <h2 className="mb-2 font-semibold">التنبؤ البيطري غير مفعّل</h2>
      لا توجد حالياً قاعدة سجلات بيطرية موثقة ونموذج تنبؤ تم التحقق منه ميدانياً.
      تم تعطيل نسب الدقة، درجات المخاطر، التنبؤات، وخطط الوقاية غير المثبتة.
      لا تعتمد على هذه الصفحة لتشخيص حيوان أو اختيار علاج؛ استشر طبيباً بيطرياً.
    </section>
    <p className="text-sm text-muted-foreground">
      يتطلب التفعيل بيانات حالات موثقة ومجهولة الهوية، بروتوكول تقييم مستقل، وقياس الحساسية والنوعية والمعايرة قبل النشر.
    </p>
  </main>
);

export default LivestockDiseasePredictor;
