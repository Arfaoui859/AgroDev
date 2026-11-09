import React from "react";

/**
 * Feed calculations require verified animal records, feed composition,
 * current supplier prices and locally validated nutrition requirements.
 */
const SmartFeedManager: React.FC = () => (
  <main className="mx-auto max-w-4xl space-y-4 p-6" dir="rtl">
    <h1 className="text-2xl font-bold">إدارة الأعلاف والتغذية</h1>
    <section role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
      <h2 className="mb-2 font-semibold">حسابات التغذية غير متاحة حالياً</h2>
      لم يتم بعد ربط سجل حيوانات موثّق، قاعدة تركيب الأعلاف، وأسعار موردين محدثة.
      لذلك لا نعرض احتياجات غذائية أو كميات يومية أو ميزانيات أو تحسين تكلفة غير مستندة إلى بيانات حقيقية.
      لا تعتمد على تقديرات هذه الصفحة لإطعام الحيوانات.
    </section>
    <p className="text-sm text-muted-foreground">
      يلزم تحديد النوع والسلالة والعمر والوزن والحالة الإنتاجية وتحليل العلف ومصدر الأسعار قبل حساب أي حصة غذائية.
    </p>
  </main>
);

export default SmartFeedManager;
