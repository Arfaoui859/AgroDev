import React from "react";

/**
 * Market intelligence is intentionally unavailable until AgroGrowth is
 * connected to a licensed, timestamped market-price and volume source.
 * Never render illustrative values as live market intelligence.
 */
const MarketIntelligence: React.FC = () => (
  <main className="mx-auto max-w-4xl space-y-4 p-6" dir="rtl">
    <h1 className="text-2xl font-bold">استخبارات السوق الزراعي</h1>
    <section role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
      <h2 className="mb-2 font-semibold">البيانات السوقية غير متاحة حالياً</h2>
      لا يوجد حالياً مصدر أسعار وكميات سوقية مرخّص، مؤرّخ، ومتحقق منه ومربوط بالمنصة.
      لذلك تم حذف الأسعار والاتجاهات والتوقعات والفرص الاستثمارية الافتراضية.
      لن نعرض سعراً أو نسبة تغيّر أو توقعاً قبل توفر المصدر وتاريخ التحديث والمنطقة والوحدة.
    </section>
    <p className="text-sm text-muted-foreground">
      يلزم ربط مصدر بيانات السوق، وتوثيق التغطية الجغرافية، والوحدات، وتواتر التحديث قبل تفعيل التحليلات.
    </p>
  </main>
);

export default MarketIntelligence;
